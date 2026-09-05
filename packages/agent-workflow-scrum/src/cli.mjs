import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnoseProject } from "./doctor.mjs";
import { initializeProject } from "./init.mjs";
import { runEngine } from "./run-engine.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineCommands = new Set(["context", "scope", "verify", "check", "docs", "report", "mode", "archive", "plan", "index", "review", "solve", "worktree", "prdsync"]);

const help = `Agent Workflow Scrum

Usage:
  agent-workflow init [path] [--existing] [--package-manager npm|pnpm|yarn|bun] [--mode vibe|standard|strict|guided] [--dry-run] [--json]
  agent-workflow mode [vibe|standard|strict|guided] [--json]
  agent-workflow archive [--days <N>] [--dry-run] [--json]
  agent-workflow plan <title> [--json]
  agent-workflow index [--json]
  agent-workflow review [--base <ref>] [--json]
  agent-workflow solve <title> [--module <path>] [--tags <t1,t2>] [--json]
  agent-workflow worktree [list|start|finish] [branch] [--json]
  agent-workflow prdsync [--dry-run] [--json]  (read-only evidence review)
  agent-workflow context [scope] [--level 0|1|2] [--budget tokens] [--provider mode]
  agent-workflow scope --base <verified-ref> [--head <ref>]
  agent-workflow verify --base <verified-ref> [--head <ref>] [--json]
  agent-workflow check [--strict-budget] [--mode vibe|standard|strict|guided] [--base <verified-ref>] [--head <ref>] [--json]
  agent-workflow docs [--budget-file <path>] [--json]  (config docBudgets is the default)
  agent-workflow report [--output <directory>]
  agent-workflow doctor [path] [--json]

All repository commands accept --root <path> when targeting a repository other
than the current working directory. The package owns the runtime; the target
repository owns .agents/ configuration, docs, tasks, and evidence.

The engine reads .agents/config.json from the target repository. Keep this package
project-local and pin its version; no global installation is required.
`;

async function version() {
  const parsed = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  return parsed.version;
}

export async function main(argv, options = {}) {
  const [command = "help", ...args] = argv;
  const cwd = options.cwd || process.cwd();
  if (["help", "--help", "-h"].includes(command)) {
    process.stdout.write(help);
    return;
  }
  if (["version", "--version", "-v"].includes(command)) {
    process.stdout.write(`${await version()}\n`);
    return;
  }
  if (command === "init") {
    const result = await initializeProject(args, cwd);
    if (!result.json) process.stdout.write(result.output);
    return;
  }
  if (command === "doctor") {
    const result = await diagnoseProject(args, cwd);
    if (!result.json) process.stdout.write(result.output);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (engineCommands.has(command)) {
    process.exitCode = runEngine(command, args, cwd);
    return;
  }
  throw new Error(`unknown command: ${command}. Run agent-workflow help.`);
}
