import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "..");
const DEFAULT_BUDGETS = {
  "AGENTS.md": 800,
  "CONTEXT.md": 1400,
  ".agents/skills/agent-workflow-scrum/SKILL.md": 900,
};

function parseArgs(argv) {
  const options = { root: defaultRoot, json: false, strictBudget: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--strict-budget") options.strictBudget = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function estimateTokens(value) {
  return Math.max(1, Math.ceil(String(value || "").length / 4));
}

async function readText(root, relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function markdownFiles(root, directory, recursive = false) {
  try {
    const entries = await readdir(path.join(root, directory), { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const relative = normalizePath(path.join(directory, entry.name));
      if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative);
      else if (recursive && entry.isDirectory()) files.push(...await markdownFiles(root, relative, true));
    }
    return files.sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function statusOf(markdown) {
  return markdown?.match(/^>\s+\*\*Status:\*\*\s*(.+?)\s*$/im)?.[1]?.replaceAll("*", "").trim().toLowerCase()
    || markdown?.match(/^>\s+Status:\s*(.+?)\s*$/im)?.[1]?.trim().toLowerCase()
    || "";
}

function relativeMarkdownLinks(markdown) {
  const links = [];
  const regex = /\[[^\]]*\]\(([^)]+\.md)(?:#[^)]+)?\)/g;
  for (const match of markdown.matchAll(regex)) {
    const href = match[1].trim().replace(/^<|>$/g, "");
    if (!/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith("#")) links.push(href);
  }
  return links;
}

async function exists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function run(options) {
  const errors = [];
  const warnings = [];
  const info = [];
  const root = options.root;

  const rootTasks = await markdownFiles(root, "docs/tasks");
  const lifecycleTasks = rootTasks.filter((file) => /\/(todo|wip|blocked)-[^/]+\.md$/.test(`/${file}`));
  const active = lifecycleTasks.filter((file) => /\/(wip|blocked)-/.test(`/${file}`));
  if (active.length > 1) errors.push(`expected at most one active wip/blocked task, found ${active.length}: ${active.join(", ")}`);

  for (const file of lifecycleTasks) {
    const content = await readText(root, file);
    const filenameStatus = path.basename(file).split("-")[0];
    const declared = statusOf(content);
    if (declared && !declared.includes(filenameStatus)) {
      errors.push(`${file}: declared status '${declared}' does not match lifecycle '${filenameStatus}'`);
    }
  }

  for (const file of await markdownFiles(root, "docs/tasks/done")) {
    if (!/\/done-[^/]+\.md$/.test(`/${file}`)) warnings.push(`${file}: completed task filename should start with done-`);
    const content = await readText(root, file);
    const declared = statusOf(content);
    if (declared && !declared.includes("done")) errors.push(`${file}: completed task must declare done status, found '${declared}'`);
  }

  const suggestionFiles = (await markdownFiles(root, "docs/suggestions")).filter((file) => !file.endsWith("README.md") && !file.endsWith("0000-template.md"));
  const validSuggestionStatuses = new Set(["proposed", "accepted", "applied", "rejected", "superseded"]);
  for (const file of suggestionFiles) {
    const content = await readText(root, file);
    const status = statusOf(content);
    if (!status) errors.push(`${file}: suggestion is missing a status`);
    else if (!validSuggestionStatuses.has(status)) errors.push(`${file}: unknown suggestion status '${status}'`);
    const decision = content?.match(/- \*\*Decision:\*\*\s*(.+?)\s*$/im)?.[1]?.trim().toLowerCase() || "";
    if (["accepted", "applied", "rejected", "superseded"].includes(status) && (!decision || decision === "pending")) {
      errors.push(`${file}: ${status} suggestion must record a non-pending human decision`);
    }
    if (status === "proposed" && decision && decision !== "pending") {
      warnings.push(`${file}: proposal records decision '${decision}' but status is still proposed`);
    }
  }

  const linkSources = [
    "AGENTS.md",
    "CONTEXT.md",
    "docs/agent-workflow.md",
    "docs/tasks/README.md",
    "docs/suggestions/README.md",
    ".agents/skills/agent-workflow-scrum/SKILL.md",
    ...suggestionFiles,
    ...lifecycleTasks,
  ];
  for (const source of linkSources) {
    const content = await readText(root, source);
    if (content === null) continue;
    for (const href of relativeMarkdownLinks(content)) {
      const target = normalizePath(path.normalize(path.join(path.dirname(source), href)));
      if (!await exists(path.join(root, target))) errors.push(`${source}: broken markdown link '${href}' -> ${target}`);
    }
  }

  for (const [file, budget] of Object.entries(DEFAULT_BUDGETS)) {
    const content = await readText(root, file);
    if (content === null) {
      warnings.push(`${file}: context budget target is missing`);
      continue;
    }
    const tokens = estimateTokens(content);
    info.push(`${file}: ~${tokens}/${budget} tokens`);
    if (tokens > budget) {
      const message = `${file}: estimated ${tokens} tokens exceeds budget ${budget}`;
      if (options.strictBudget) errors.push(message);
      else warnings.push(message);
    }
  }

  const skill = await readText(root, ".agents/skills/agent-workflow-scrum/SKILL.md");
  if (skill !== null) {
    for (const href of relativeMarkdownLinks(skill)) {
      if (href.startsWith("references/") && !await exists(path.join(root, ".agents/skills/agent-workflow-scrum", href))) {
        errors.push(`SKILL.md references missing file: ${href}`);
      }
    }
  }

  return { schemaVersion: 1, ok: errors.length === 0, errors, warnings, info };
}

function render(result) {
  const lines = [];
  for (const item of result.info) lines.push(`check: info: ${item}`);
  for (const item of result.warnings) lines.push(`check: WARN: ${item}`);
  for (const item of result.errors) lines.push(`check: FAIL: ${item}`);
  lines.push(result.ok ? "check: workflow consistency passed" : `check: workflow consistency failed (${result.errors.length} error(s))`);
  return `${lines.join("\n")}\n`;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = await run(options);
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : render(result));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
