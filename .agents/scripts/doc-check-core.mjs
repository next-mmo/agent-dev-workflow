import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "..");
const DOCS_ROOT = ".agents/docs";
const DEFAULT_BUDGET_FILE = `${DOCS_ROOT}/doc-budgets.json`;
const LEGACY_WORKFLOW_PATHS = [
  "docs/AGENTS.md",
  "docs/agent-workflow.md",
  "docs/architecture.md",
  "docs/defensive-patterns.md",
  "docs/development.md",
  "docs/doc-budgets.json",
  "docs/model-recommend.md",
  "docs/testing.md",
  "docs/prd",
  "docs/tasks",
  "docs/suggestions",
];

function parseArgs(argv) {
  const options = { root: defaultRoot, json: false, budgetFile: DEFAULT_BUDGET_FILE };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--budget-file") options.budgetFile = argv[++index] || "";
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

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(root, relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function markdownFiles(root, directory) {
  const absolute = path.join(root, directory);
  try {
    const entries = await readdir(absolute, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const relative = normalizePath(path.join(directory, entry.name));
      if (entry.isDirectory()) files.push(...await markdownFiles(root, relative));
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative);
    }
    return files.sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function relativeMarkdownLinks(markdown) {
  const links = [];
  const regex = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of String(markdown || "").matchAll(regex)) {
    let href = match[1].trim().replace(/^<|>$/g, "");
    if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    href = href.split("#", 1)[0].split("?", 1)[0];
    if (!href || href.includes("${")) continue;
    links.push(href);
  }
  return links;
}

function legacyInlineWorkflowPaths(markdown) {
  const paths = [];
  const regex = /`((?:\.\/)?docs\/(?:AGENTS\.md|agent-workflow\.md|architecture\.md|defensive-patterns\.md|development\.md|doc-budgets\.json|model-recommend\.md|testing\.md|prd(?:\/[^`\s]+)?|tasks(?:\/[^`\s]+)?|suggestions(?:\/[^`\s]+)?))`/g;
  for (const match of String(markdown || "").matchAll(regex)) {
    const line = String(markdown).slice(0, match.index).split(/\r?\n/).pop() || "";
    if (/\blegacy\b|\bhistorical\b|\brejected\b/i.test(line)) continue;
    paths.push(match[1].replace(/^\.\//, ""));
  }
  return [...new Set(paths)];
}

async function loadBudgets(root, relativePath) {
  const content = await readText(root, relativePath);
  if (content === null) throw new Error(`documentation budget file not found: ${relativePath}`);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`invalid documentation budget JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("documentation budget file must be an object");
  for (const [file, budget] of Object.entries(parsed)) {
    if (!file || !Number.isInteger(budget) || budget < 100) throw new Error(`invalid documentation budget entry: ${file}`);
  }
  return parsed;
}

async function run(options) {
  const errors = [];
  const warnings = [];
  const info = [];
  const budgets = await loadBudgets(options.root, options.budgetFile);

  const legacyWorkflowPaths = [];
  for (const relativePath of LEGACY_WORKFLOW_PATHS) {
    if (await exists(path.join(options.root, relativePath))) legacyWorkflowPaths.push(relativePath);
  }
  if (legacyWorkflowPaths.length) {
    errors.push(`legacy Agent Workflow Scrum docs found outside ${DOCS_ROOT}/: ${legacyWorkflowPaths.join(", ")}`);
  }

  for (const [file, budget] of Object.entries(budgets)) {
    const content = await readText(options.root, file);
    if (content === null) {
      errors.push(`${file}: budgeted document is missing`);
      continue;
    }
    const tokens = estimateTokens(content);
    info.push(`${file}: ~${tokens}/${budget} tokens`);
    if (tokens > budget) errors.push(`${file}: estimated ${tokens} tokens exceeds documentation budget ${budget}`);
    else if (tokens > Math.floor(budget * 0.95)) warnings.push(`${file}: documentation budget has less than 5% headroom (${tokens}/${budget})`);
  }

  const sources = new Set(["README.md", "AGENTS.md", "CONTEXT.md"]);
  for (const directory of [DOCS_ROOT, ".agents/skills", "scripts", "tests"]) {
    for (const file of await markdownFiles(options.root, directory)) sources.add(file);
  }

  for (const source of [...sources].sort()) {
    const content = await readText(options.root, source);
    if (content === null) continue;
    for (const href of relativeMarkdownLinks(content)) {
      const target = normalizePath(path.normalize(path.join(path.dirname(source), href)));
      if (!await exists(path.join(options.root, target))) errors.push(`${source}: broken relative link '${href}' -> ${target}`);
    }
    for (const href of legacyInlineWorkflowPaths(content)) {
      const canonical = normalizePath(path.join(".agents", href));
      if (await exists(path.join(options.root, canonical))) {
        errors.push(`${source}: stale inline workflow path '${href}'; use '${canonical}'`);
      }
    }
  }

  return { schemaVersion: 2, ok: errors.length === 0, errors, warnings, info };
}

function render(result) {
  const lines = [];
  for (const item of result.info) lines.push(`docs: info: ${item}`);
  for (const item of result.warnings) lines.push(`docs: WARN: ${item}`);
  for (const item of result.errors) lines.push(`docs: FAIL: ${item}`);
  lines.push(result.ok ? "docs: documentation checks passed" : `docs: documentation checks failed (${result.errors.length} error(s))`);
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
