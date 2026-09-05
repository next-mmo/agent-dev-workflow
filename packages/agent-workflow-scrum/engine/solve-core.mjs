import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readTemplate } from "./template-core.mjs";

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

export async function createSolution({
  root = process.cwd(),
  title,
  module = "src/",
  tags = ["bugfix", "learnings"],
} = {}) {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) {
    throw new Error("solution title cannot be empty");
  }

  const solutionsDir = path.join(root, ".agents", "docs", "solutions");
  const templatePath = path.join(solutionsDir, "0000-template.md");

  const template = await readTemplate(templatePath, "solution.md");
  await mkdir(solutionsDir, { recursive: true });
  const entries = await readdir(solutionsDir, { withFileTypes: true });
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
  const targetPath = path.join(solutionsDir, filename);

  const tagsArray = Array.isArray(tags) ? tags : String(tags).split(",").map((t) => t.trim());
  const formattedTags = `[${tagsArray.join(", ")}]`;

  const content = template
    .replace(/title:\s*<Clear Problem and Solution Title>/i, `title: ${cleanTitle}`)
    .replace(/module:\s*<affected\/path\.js>/i, `module: ${module}`)
    .replace(/tags:\s*\[[^\]]+\]/i, `tags: ${formattedTags}`)
    .replace(/#\s*<Problem Title>/i, `# ${cleanTitle}`)
    .replace(/>\s*\*\*Module:\*\*\s*`[^`]+`/i, `> **Module:** \`${module}\``)
    .replace(/>\s*\*\*Tags:\*\*\s*`[^`]+`/i, `> **Tags:** \`${tagsArray.join("`, `")}\``);

  await writeFile(targetPath, content, { encoding: "utf8", flag: "wx" });

  return {
    ok: true,
    id: nextId,
    title: cleanTitle,
    filename,
    relativePath: path.relative(root, targetPath).replaceAll("\\", "/"),
  };
}
