import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function taskRecords(root) {
  const records = [];
  async function visit(relative) {
    let entries;
    try {
      entries = await readdir(path.join(root, relative), { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const file = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && /^(?:todo|wip|blocked|done)-.*\.md$/.test(entry.name)) {
        records.push({ file, content: await readFile(path.join(root, file), "utf8") });
      }
    }
  }
  await visit(".agents/docs/tasks");
  return records.sort((a, b) => a.file.localeCompare(b.file));
}

/** List unchecked requirements and related task evidence; never modify or accept a PRD. */
export async function syncLivingPRDs({ root = process.cwd(), dryRun = false } = {}) {
  const prdDir = path.join(root, ".agents/docs/prd");
  const entries = await readdir(prdDir, { withFileTypes: true });
  const tasks = await taskRecords(root);
  const reviews = [];
  for (const filename of entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "0000-prd-index.md").map((entry) => entry.name).sort()) {
    const file = `.agents/docs/prd/${filename}`;
    const content = await readFile(path.join(prdDir, filename), "utf8");
    const criteria = content.split(/\r?\n/).flatMap((line, index) => {
      const match = line.match(/^\s*-\s*\[\s*\]\s*(.+)$/);
      return match ? [{ line: index + 1, criterion: match[1].trim(), status: "unverified" }] : [];
    });
    reviews.push({ file, criteria, evidenceCandidates: tasks.filter((task) => task.content.includes(filename)).map((task) => task.file) });
  }
  return { schemaVersion: 2, ok: true, advisory: true, dryRun, changedFiles: [], reviews };
}
