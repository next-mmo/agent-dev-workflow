import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const contextScript = path.join(scriptDirectory, "context.mjs");
const MIN_BUDGET = 500;

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function parseArgs(argv) {
  const options = {
    root: repositoryRoot,
    scope: [],
    level: 0,
    budget: 1500,
    provider: "local",
    base: "",
    head: "HEAD",
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--level") {
      const value = Number(argv[++index]);
      if (![0, 1, 2].includes(value)) throw new Error("--level must be 0, 1, or 2");
      options.level = value;
    } else if (arg === "--budget") {
      const value = Number(argv[++index]);
      if (!Number.isInteger(value) || value < MIN_BUDGET) throw new Error(`--budget must be an integer >= ${MIN_BUDGET}`);
      options.budget = value;
    } else if (arg === "--provider") {
      options.provider = String(argv[++index] || "").toLowerCase();
    } else if (arg === "--base") options.base = String(argv[++index] || "");
    else if (arg === "--head") options.head = String(argv[++index] || "");
    else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else options.scope.push(arg);
  }
  if (!["auto", "local", "graphify", "openviking", "all"].includes(options.provider)) {
    throw new Error("--provider must be auto, local, graphify, openviking, or all");
  }
  if (options.head !== "HEAD" && !options.base) throw new Error("--head requires --base <verified-ref>");
  if (!options.scope.length) options.scope = ["benchmark context routing"];
  return options;
}

function gitFiles(root) {
  const result = spawnSync("git", ["-C", root, "ls-files", "-z"], {
    encoding: "buffer",
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LANG: "C", LC_ALL: "C" },
    windowsHide: true,
  });
  if (result.status !== 0) {
    const detail = result.error?.message || String(result.stderr || "").trim() || `git exited with status ${result.status}`;
    throw new Error(`cannot enumerate tracked files for raw baseline: ${detail}`);
  }
  return String(result.stdout || "").split("\0").filter(Boolean);
}

function isText(buffer) {
  return !buffer.includes(0);
}

function collectRawBaseline(root) {
  let files = 0;
  let characters = 0;
  for (const file of gitFiles(root)) {
    const content = readFileSync(path.join(root, file));
    if (!isText(content)) continue;
    files += 1;
    characters += content.toString("utf8").length;
  }
  return { files, characters, tokens: Math.max(1, Math.ceil(characters / 4)) };
}

function runContext(options) {
  const args = [contextScript, ...options.scope, "--provider", options.provider, "--level", String(options.level), "--budget", String(options.budget), "--json", "--root", options.root];
  if (options.base) args.push("--base", options.base);
  if (options.head !== "HEAD") args.push("--head", options.head);
  const result = spawnSync(process.execPath, args, {
    cwd: options.root,
    encoding: "utf8",
    env: process.env,
    windowsHide: true,
  });
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || "").trim();
    throw new Error(`bounded context command failed${detail ? `: ${detail}` : ""}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`bounded context returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function round(value) {
  return Math.round(value * 100) / 100;
}

export function runBenchmark(input = {}) {
  const options = { ...parseArgs([]), ...input };
  if (!options.scope?.length) options.scope = ["benchmark context routing"];
  const rawStarted = performance.now();
  const raw = collectRawBaseline(options.root);
  raw.durationMs = round(performance.now() - rawStarted);

  const contextStarted = performance.now();
  const context = runContext(options);
  const bounded = {
    tokens: context.estimatedTokens,
    budgetTokens: context.budgetTokens,
    budgetExceeded: context.budgetExceeded,
    selectedDocuments: context.selected.length,
    loadedDocuments: context.documents.length,
    durationMs: round(performance.now() - contextStarted),
  };
  const savedTokens = raw.tokens - bounded.tokens;
  return {
    schemaVersion: 1,
    root: normalizePath(options.root),
    scope: options.scope.join(" "),
    level: options.level,
    provider: options.provider,
    raw,
    bounded,
    savings: {
      tokens: savedTokens,
      percent: round((savedTokens / raw.tokens) * 100),
      ratio: round(bounded.tokens / raw.tokens),
    },
  };
}

function render(result) {
  return [
    "# Context Benchmark",
    "",
    `- Scope: ${result.scope}`,
    `- Provider/level: ${result.provider}/L${result.level}`,
    `- Raw baseline: ~${result.raw.tokens} tokens from ${result.raw.files} tracked text files (${result.raw.durationMs}ms)`,
    `- Bounded context: ~${result.bounded.tokens}/${result.bounded.budgetTokens} tokens (${result.bounded.durationMs}ms)`,
    `- Savings: ~${result.savings.tokens} tokens (${result.savings.percent}%; ratio ${result.savings.ratio})`,
    `- Selected/loaded documents: ${result.bounded.selectedDocuments}/${result.bounded.loadedDocuments}`,
    `- Budget exceeded: ${result.bounded.budgetExceeded}`,
    "",
    "Raw baseline means all tracked UTF-8 text; bounded context uses the real context router and does not print its full pack.",
    "",
  ].join("\n");
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  try {
    const result = runBenchmark(parseArgs(process.argv.slice(2)));
    process.stdout.write(process.argv.includes("--json") ? `${JSON.stringify(result, null, 2)}\n` : render(result));
  } catch (error) {
    console.error(`context-benchmark: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
