import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangeScope as collectCoreChangeScope } from "./change-scope-core.mjs";

const DOCS_ROOT = ".agents/docs";

function pathLayers(file) {
  const value = file.replaceAll("\\", "/");
  const docsPrefix = `${DOCS_ROOT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`;
  const layers = new Set();
  if (/^(src\/|index\.html$|public\/)/.test(value)) layers.add("product");
  if (/^tests\/|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(value)) layers.add("tests");
  if (value === "README.md" || value.startsWith(`${DOCS_ROOT}/`)) layers.add("docs");
  if (new RegExp(`^${docsPrefix}prd/`).test(value)) layers.add("prd");
  if (new RegExp(`^${docsPrefix}tasks/`).test(value)) layers.add("tasks");
  if (new RegExp(`^${docsPrefix}suggestions/`).test(value)) layers.add("governance");
  if (/^(AGENTS\.md$|CONTEXT\.md$|\.agents\/|scripts\/(?:context|workflow-check|change-scope|verify-plan|doc-check))/.test(value)) layers.add("workflow");
  if (/^(?:\.agents\/scripts|scripts)\/context\/providers\//.test(value)) layers.add("providers");
  if (/^\.github\//.test(value)) layers.add("ci");
  if (/^(package(?:-lock)?\.json$|pnpm-lock\.yaml$|yarn\.lock$|Cargo\.(?:toml|lock)$|go\.(?:mod|sum)$|pyproject\.toml$)/.test(value)) layers.add("dependencies");
  if (/^(vite\.config\.|tsconfig|eslint|biome|Dockerfile|docker-compose)/.test(value)) layers.add("build");
  if (layers.size === 0) layers.add("other");
  return [...layers];
}

export function classifyChangedPaths(paths) {
  const output = {};
  for (const file of paths) {
    for (const layer of pathLayers(file)) {
      if (!output[layer]) output[layer] = [];
      output[layer].push(file);
    }
  }
  return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
}

export function collectChangeScope(options = {}) {
  const report = collectCoreChangeScope(options);
  return { ...report, layers: classifyChangedPaths(report.paths.all) };
}

function parseArgs(argv) {
  const options = { root: process.cwd(), base: "", head: "HEAD" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") options.base = argv[++index] || "";
    else if (arg === "--head") options.head = argv[++index] || "";
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

export function renderChangeScope(argv, cwd = process.cwd()) {
  const options = parseArgs(argv);
  const report = collectChangeScope({ ...options, root: options.root || cwd });
  return `${JSON.stringify(report, null, 2)}\n`;
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(renderChangeScope(process.argv.slice(2), process.cwd()));
  } catch (error) {
    console.error(`change-scope: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
