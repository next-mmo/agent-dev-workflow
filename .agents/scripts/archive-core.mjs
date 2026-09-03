import { mkdir, readdir, readFile, rename } from "node:fs/promises";
import path from "node:path";
import { loadWorkflowConfig } from "./workflow-config.mjs";

function parseCompletedDate(content) {
  const match = content.match(/>\s*\*{0,2}Completed:\*{0,2}\s*(\d{4}-\d{2}-\d{2})/i)
    || content.match(/>\s*\*{0,2}Created:\*{0,2}\s*(\d{4}-\d{2}-\d{2})/i);
  if (!match) return null;
  const date = new Date(match[1]);
  return Number.isNaN(date.getTime()) ? null : { date, dateString: match[1] };
}

export async function archiveCompletedTasks({
  root = process.cwd(),
  retentionDays,
  dryRun = false,
  now = new Date(),
} = {}) {
  const config = await loadWorkflowConfig(root);
  const effectiveDays = Number.isInteger(retentionDays) && retentionDays > 0
    ? retentionDays
    : (config.archive?.retentionDays ?? 14);

  const doneDir = path.join(root, ".agents/docs/tasks/done");
  const archivedBaseDir = path.join(root, ".agents/docs/tasks/archived");

  let entries = [];
  try {
    entries = await readdir(doneDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { ok: true, retentionDays: effectiveDays, archived: [], retained: [], dryRun };
    }
    throw error;
  }

  const taskFiles = entries
    .filter((e) => e.isFile() && e.name.startsWith("done-") && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();

  const archived = [];
  const retained = [];

  for (const filename of taskFiles) {
    const srcPath = path.join(doneDir, filename);
    const content = await readFile(srcPath, "utf8");
    const parsed = parseCompletedDate(content);

    if (!parsed) {
      retained.push({ file: filename, ageDays: 0, reason: "no completion date found" });
      continue;
    }

    const ageDays = (now.getTime() - parsed.date.getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays >= effectiveDays) {
      const year = String(parsed.date.getFullYear());
      const destDir = path.join(archivedBaseDir, year);
      const destPath = path.join(destDir, filename);

      if (!dryRun) {
        await mkdir(destDir, { recursive: true });
        await rename(srcPath, destPath);
      }

      archived.push({
        file: filename,
        completedDate: parsed.dateString,
        ageDays: Math.floor(ageDays),
        destPath: path.relative(root, destPath).replaceAll("\\", "/"),
      });
    } else {
      retained.push({
        file: filename,
        completedDate: parsed.dateString,
        ageDays: Math.floor(ageDays),
      });
    }
  }

  return {
    ok: true,
    retentionDays: effectiveDays,
    archived,
    retained,
    dryRun,
  };
}
