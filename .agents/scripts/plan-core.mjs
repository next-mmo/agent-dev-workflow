import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function kebabCase(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function padNumber(num, length = 4) {
  return String(num).padStart(length, "0");
}

export async function createPlan({
  root = process.cwd(),
  title,
  now = new Date(),
} = {}) {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) {
    throw new Error("plan title cannot be empty");
  }

  const plansDir = path.join(root, ".agents/docs/plans");
  const templatePath = path.join(plansDir, "0000-template.md");

  let template = "";
  try {
    template = await readFile(templatePath, "utf8");
  } catch {
    throw new Error(`plan template not found at ${path.relative(root, templatePath)}`);
  }

  const entries = await readdir(plansDir, { withFileTypes: true });
  let maxId = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "0000-template.md" || entry.name === "README.md") {
      continue;
    }
    const match = entry.name.match(/^(\d{4})-/);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (num > maxId) maxId = num;
    }
  }

  const nextId = padNumber(maxId + 1);
  const slug = kebabCase(cleanTitle);
  const filename = `${nextId}-${slug}.md`;
  const targetPath = path.join(plansDir, filename);

  const dateStr = now.toISOString().slice(0, 10);
  let content = template
    .replace(/# Plan:\s*<Feature \/ Architecture Name>/i, `# Plan ${nextId}: ${cleanTitle}`)
    .replace(/> \*\*Status:\*\* [^\n]+/i, `> **Status:** draft`)
    .replace(/> \*\*Created:\*\* [^\n]+/i, `> **Created:** ${dateStr}`)
    .replace(/> \*\*Updated:\*\* [^\n]+/i, `> **Updated:** ${dateStr}`);

  await writeFile(targetPath, content, "utf8");

  return {
    ok: true,
    id: nextId,
    title: cleanTitle,
    filename,
    relativePath: path.relative(root, targetPath).replaceAll("\\", "/"),
  };
}
