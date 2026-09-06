import path from "node:path";
import { buildNdContext, CONTEXT_BUDGET_DEFAULT, detectNdPlugin, ND_PROTOCOL, readNdSnapshot } from "./nd-plugin-core.mjs";

const help = `Agent Workflow Scrum — ND workflow plugin (protocol ${ND_PROTOCOL})

Read-only reporting surface for ND host integration. The plugin never writes to
the target repository and never executes project commands.

Usage:
  agent-workflow nd detect [--root <path>] [--json]
  agent-workflow nd snapshot [--root <path>] [--json]
  agent-workflow nd context [--root <path>] [--task <key>] [--budget <tokens>] [--json]

Methods map to ND protocol contributions: detect -> detect,
snapshot -> readSnapshot, context -> buildContext. JSON output is the stable
contract; plain output is a human summary.
`;

function parseArgs(argv) {
  const options = { method: "", json: false, root: process.cwd(), task: "", budget: CONTEXT_BUDGET_DEFAULT };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--task") options.task = argv[++index] || "";
    else if (arg === "--budget") {
      const value = Number.parseInt(argv[++index] || "", 10);
      if (!Number.isSafeInteger(value) || value <= 0) throw new Error("--budget requires a positive integer");
      options.budget = value;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (!options.method && !arg.startsWith("-")) options.method = arg;
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

function summarizeDetect(result) {
  const lines = [
    `plugin: ${result.plugin.id} ${result.plugin.version ?? "(unknown version)"}`,
    `protocol: ${result.protocol}`,
    `root: ${result.root}`,
    `supported: ${result.supported}`,
    `config: schema ${result.config.schemaVersion ?? "n/a"}, mode ${result.config.mode ?? "n/a"}, package manager ${result.config.packageManager ?? "n/a"}`,
  ];
  for (const diagnostic of result.diagnostics) lines.push(`[${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`);
  return lines.join("\n");
}

function summarizeSnapshot(result) {
  const snapshot = result.snapshot;
  const counts = {};
  for (const task of snapshot.tasks) counts[task.displayStatus] = (counts[task.displayStatus] || 0) + 1;
  const lines = [
    `root: ${result.root} (branch ${snapshot.git.branch ?? "unknown"}, ${snapshot.git.dirty ? "dirty" : "clean"})`,
    `board: ${Object.entries(counts).map(([status, count]) => `${count} ${status}`).join(", ") || "empty"}`,
  ];
  for (const task of snapshot.tasks) {
    lines.push(`- [${task.displayStatus}] ${task.key ?? "(unnumbered)"} ${task.title} (${task.sourcePath})`);
  }
  for (const diagnostic of snapshot.diagnostics) lines.push(`[${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`);
  return lines.join("\n");
}

function summarizeContext(result) {
  if (!result.context) return summarizeDetect(result);
  const lines = [
    `context: ~${result.context.estimatedTokens} tokens of ${result.context.budgetTokens} budget${result.context.truncated ? " (truncated)" : ""}`,
    `active tasks: ${result.context.activeTaskKeys.join(", ") || "none"}`,
    "",
    result.context.envelope,
  ];
  return lines.join("\n");
}

try {
  const options = parseArgs(process.argv.slice(2));
  const emit = (result, summary) => process.stdout.write(
    options.json ? `${JSON.stringify(result, null, 2)}\n` : `${summary}\n`,
  );
  if (options.help || !options.method) {
    process.stdout.write(help);
  } else if (options.method === "detect") {
    const result = await detectNdPlugin(options.root);
    emit(result, summarizeDetect(result));
  } else if (options.method === "snapshot" || options.method === "read-snapshot") {
    const result = await readNdSnapshot(options.root);
    emit(result, summarizeSnapshot(result));
  } else if (options.method === "context" || options.method === "build-context") {
    const result = await buildNdContext(options.root, { task: options.task || undefined, budget: options.budget });
    emit(result, summarizeContext(result));
  } else {
    throw new Error(`unknown nd method: ${options.method} (expected detect, snapshot, or context)`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
