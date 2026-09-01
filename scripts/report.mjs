import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const docsRoot = ".agents/docs";
const reportDir = path.join(root, "report");

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

async function readText(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function markdownFiles(directory, recursive = false) {
  try {
    const entries = await readdir(path.join(root, directory), { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const relative = path.posix.join(directory.replaceAll("\\", "/"), entry.name);
      if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative);
      else if (recursive && entry.isDirectory()) files.push(...await markdownFiles(relative, true));
    }
    return files.sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function titleOf(markdown, fallback) {
  return markdown?.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback;
}

function statusOf(markdown) {
  return markdown?.match(/^>\s+\*\*Status:\*\*\s*(.+?)\s*$/im)?.[1]?.replaceAll("*", "").trim() || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function documentEntry(relativePath, group) {
  const content = await readText(relativePath);
  return {
    path: relativePath,
    group,
    exists: content !== null,
    title: titleOf(content, path.basename(relativePath)),
    status: statusOf(content),
  };
}

const definitions = [
  ["AGENTS.md", "Standing context"],
  ["CONTEXT.md", "Standing context"],
  [`${docsRoot}/architecture.md`, "Workflow docs"],
  [`${docsRoot}/agent-workflow.md`, "Workflow docs"],
  [`${docsRoot}/development.md`, "Workflow docs"],
  [`${docsRoot}/testing.md`, "Workflow docs"],
  [`${docsRoot}/defensive-patterns.md`, "Workflow docs"],
  [`${docsRoot}/prd/0000-prd-index.md`, "PRDs"],
  [`${docsRoot}/tasks/README.md`, "Tasks"],
  [`${docsRoot}/suggestions/README.md`, "Suggestions"],
  [".agents/skills/agent-workflow-scrum/SKILL.md", "Skills"],
  [".agents/skills/agent-workflow-prose/SKILL.md", "Skills"],
];

const documents = await Promise.all(definitions.map(([file, group]) => documentEntry(file, group)));
for (const file of await markdownFiles(`${docsRoot}/prd`)) {
  if (!documents.some((item) => item.path === file)) documents.push(await documentEntry(file, "PRDs"));
}
for (const file of await markdownFiles(`${docsRoot}/tasks`, true)) {
  if (!documents.some((item) => item.path === file)) documents.push(await documentEntry(file, file.includes("/done/") ? "Completed tasks" : "Tasks"));
}
for (const file of await markdownFiles(`${docsRoot}/suggestions`)) {
  if (!documents.some((item) => item.path === file)) documents.push(await documentEntry(file, "Suggestions"));
}

documents.sort((a, b) => a.group.localeCompare(b.group) || a.path.localeCompare(b.path));

const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  docsRoot,
  git: {
    branch: git(["branch", "--show-current"]) || "unavailable",
    head: git(["rev-parse", "HEAD"]) || "unavailable",
    status: git(["status", "--short"]),
  },
  summary: {
    prds: documents.filter((item) => item.group === "PRDs" && !item.path.endsWith("0000-prd-index.md")).length,
    activeTasks: documents.filter((item) => item.group === "Tasks" && /\/(?:todo|wip|blocked)-/.test(item.path)).length,
    completedTasks: documents.filter((item) => item.group === "Completed tasks").length,
    suggestions: documents.filter((item) => item.group === "Suggestions" && /\/\d{4}-/.test(item.path) && !item.path.endsWith("0000-template.md")).length,
  },
  documents,
};

const rows = documents.map((item) => `<tr><td>${escapeHtml(item.group)}</td><td><code>${escapeHtml(item.path)}</code></td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.status || "—")}</td></tr>`).join("\n");
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agent Workflow Report</title>
<style>body{font:14px system-ui,sans-serif;max-width:1200px;margin:40px auto;padding:0 20px;line-height:1.45}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}code{font-size:.92em}.muted{opacity:.7}</style>
</head>
<body>
<h1>Agent Workflow Report</h1>
<p class="muted">Generated from <code>${escapeHtml(docsRoot)}</code>. This report is derivative; tracked repository files remain authoritative.</p>
<p>Branch: <code>${escapeHtml(report.git.branch)}</code> · PRDs: ${report.summary.prds} · Active tasks: ${report.summary.activeTasks} · Completed tasks: ${report.summary.completedTasks} · Suggestions: ${report.summary.suggestions}</p>
<table><thead><tr><th>Group</th><th>Path</th><th>Title</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
</body>
</html>\n`;

await mkdir(reportDir, { recursive: true });
await writeFile(path.join(reportDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(path.join(reportDir, "index.html"), html, "utf8");
console.log(`report: wrote ${path.relative(root, path.join(reportDir, "index.html"))} and report.json`);
