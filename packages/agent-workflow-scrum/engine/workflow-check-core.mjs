import { spawnSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangeScope } from "./change-scope.mjs";
import { loadWorkflowConfig, matchesPathGroup } from "./workflow-config.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "..");
const DOCS_ROOT = ".agents/docs";

function parseArgs(argv) {
  const options = { root: defaultRoot, json: false, strictBudget: false, base: "", head: "HEAD" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--strict-budget") options.strictBudget = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--base") options.base = argv[++index] || "";
    else if (arg === "--head") options.head = argv[++index] || "";
    else throw new Error(`unknown option: ${arg}`);
  }
  if (options.head !== "HEAD" && !options.base) throw new Error("--head requires --base <verified-ref>");
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

function gitStatusPaths(root) {
  const result = spawnSync("git", ["-C", root, "-c", "core.fsmonitor=false", "status", "--porcelain=v1", "--untracked-files=all", "--"], {
    encoding: "utf8",
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LANG: "C", LC_ALL: "C" },
    windowsHide: true,
  });
  if (result.status !== 0) {
    const detail = result.error?.message || String(result.stderr || "").trim() || `git exited with status ${result.status}`;
    throw new Error(`cannot inspect Git worktree: ${detail}`);
  }
  const paths = [];
  for (const line of String(result.stdout || "").split(/\r?\n/).filter(Boolean)) {
    let file = line.slice(3);
    const renameSeparator = file.lastIndexOf(" -> ");
    if (renameSeparator >= 0) file = file.slice(renameSeparator + 4);
    if (file) paths.push(file.replaceAll("\\", "/"));
  }
  return [...new Set(paths)].sort();
}

function isProductPath(file, config) {
  return matchesPathGroup(file, config, "product");
}

function taskPrdReferences(markdown) {
  const references = [];
  const field = /^\s*>\s*\*{0,2}(?:Related\s+)?PRD\*{0,2}:\s*(.+)$/gim;
  for (const match of String(markdown || "").matchAll(field)) {
    for (const reference of match[1].matchAll(/`([^`]+\.md)`/g)) references.push(reference[1].replaceAll("\\", "/"));
  }
  return [...new Set(references)];
}

function prdId(file) {
  return path.posix.basename(file).match(/^(\d{4})-/)?.[1] || "";
}

async function validateProductSynchronization({ root, changedPaths, active, errors, info, config }) {
  const productPaths = changedPaths.filter((file) => isProductPath(file, config));
  if (!productPaths.length) return;
  info.push(`product synchronization: ${productPaths.length} product path(s) require task/PRD/evidence metadata`);

  const changedDone = changedPaths
    .filter((file) => /^\.agents\/docs\/tasks\/done\/done-[^/]+\.md$/.test(file))
    .sort();
  let taskFile = "";
  if (active.length === 1) taskFile = active[0];
  else if (active.length === 0 && changedDone.length === 1) taskFile = changedDone[0];
  else if (active.length === 0) errors.push("product changes require one active wip/blocked task or one changed completed task with evidence");

  if (!taskFile) {
    if (changedDone.length > 1) errors.push(`product changes have multiple changed completed tasks; select one increment: ${changedDone.join(", ")}`);
    return;
  }

  const task = await readText(root, taskFile);
  if (task === null) {
    errors.push(`${taskFile}: synchronized product task is missing`);
    return;
  }

  const prdReferences = taskPrdReferences(task).filter((file) => file.startsWith(`${DOCS_ROOT}/prd/`));
  if (!prdReferences.length) {
    errors.push(`${taskFile}: product changes must declare a canonical PRD field such as \`${DOCS_ROOT}/prd/0001-example.md\``);
  }

  const index = await readText(root, `${DOCS_ROOT}/prd/0000-prd-index.md`);
  for (const reference of prdReferences) {
    if (!await exists(path.join(root, reference))) errors.push(`${taskFile}: referenced PRD does not exist: ${reference}`);
    const id = prdId(reference);
    if (id && index && !new RegExp(`(?:^|[^0-9])${id}(?:[^0-9]|$)`).test(index)) {
      errors.push(`${taskFile}: referenced PRD ${id} is missing from ${DOCS_ROOT}/prd/0000-prd-index.md`);
    }
  }
  if (index === null) errors.push(`missing ${DOCS_ROOT}/prd/0000-prd-index.md for product synchronization`);
  if (!/^##\s+[^\n]*Acceptance Criteria/im.test(task)) errors.push(`${taskFile}: product task must include an Acceptance Criteria section`);
  const evidenceHeading = task.match(/^##\s+Evidence Ledger\s*$/im);
  const evidence = evidenceHeading
    ? task.slice((evidenceHeading.index || 0) + evidenceHeading[0].length).replace(/^\s+/, "").split(/^##\s+/m, 1)[0].trim()
    : "";
  if (!evidence) errors.push(`${taskFile}: product task must include a non-empty Evidence Ledger section`);
  else if (/\/tasks\/done\//.test(taskFile) && /\bpending\b/i.test(evidence)) errors.push(`${taskFile}: completed product task evidence cannot remain pending`);
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
  const config = await loadWorkflowConfig(root);
  const tasksRoot = `${DOCS_ROOT}/tasks`;
  const suggestionsRoot = `${DOCS_ROOT}/suggestions`;

  const rootTasks = await markdownFiles(root, tasksRoot);
  const lifecycleTasks = rootTasks.filter((file) => /\/(todo|wip|blocked)-[^/]+\.md$/.test(`/${file}`));
  const active = lifecycleTasks.filter((file) => /\/(wip|blocked)-/.test(`/${file}`));
  if (active.length > 1) errors.push(`expected at most one active wip/blocked task, found ${active.length}: ${active.join(", ")}`);

  let changedPaths = [];
  if (options.base) {
    try {
      changedPaths = collectChangeScope({ root, base: options.base, head: options.head }).paths.all;
      info.push(`outgoing scope: ${changedPaths.length} path(s) from ${options.base} to ${options.head}`);
    } catch (error) {
      errors.push(`cannot evaluate outgoing product synchronization: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    try {
      changedPaths = gitStatusPaths(root);
      info.push(`working-tree scope: ${changedPaths.length} changed path(s)`);
    } catch (error) {
      errors.push(`cannot evaluate working-tree product synchronization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  await validateProductSynchronization({ root, changedPaths, active, errors, info, config });

  for (const file of lifecycleTasks) {
    const content = await readText(root, file);
    const filenameStatus = path.basename(file).split("-")[0];
    const declared = statusOf(content);
    if (declared && !declared.includes(filenameStatus)) {
      errors.push(`${file}: declared status '${declared}' does not match lifecycle '${filenameStatus}'`);
    }
  }

  for (const file of await markdownFiles(root, `${tasksRoot}/done`)) {
    if (!/\/done-[^/]+\.md$/.test(`/${file}`)) warnings.push(`${file}: completed task filename should start with done-`);
    const content = await readText(root, file);
    const declared = statusOf(content);
    if (declared && !declared.includes("done")) errors.push(`${file}: completed task must declare done status, found '${declared}'`);
  }

  const suggestionFiles = (await markdownFiles(root, suggestionsRoot)).filter((file) => !file.endsWith("README.md") && !file.endsWith("0000-template.md"));
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
    "README.md",
    "AGENTS.md",
    "CONTEXT.md",
    `${DOCS_ROOT}/AGENTS.md`,
    `${DOCS_ROOT}/development.md`,
    `${DOCS_ROOT}/agent-workflow.md`,
    `${DOCS_ROOT}/architecture.md`,
    `${tasksRoot}/README.md`,
    `${suggestionsRoot}/README.md`,
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

  for (const [file, budget] of Object.entries(config.contextBudgets)) {
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

  return { schemaVersion: 2, ok: errors.length === 0, errors, warnings, info };
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
