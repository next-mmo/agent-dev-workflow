import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnoseProject } from "./doctor.mjs";
import { initializeProject } from "./init.mjs";
import { runEngine } from "./run-engine.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineCommands = new Set(["context", "scope", "verify", "check", "docs", "report"]);

const help = `Agent Workflow Scrum

Usage:
  agent-workflow init [path] [--existing] [--package-manager npm|pnpm|yarn|bun] [--dry-run] [--json]
  agent-workflow context [scope] [--level 0|1|2] [--budget tokens] [--provider mode]
  agent-workflow scope --base <verified-ref> [--head <ref>]
  agent-workflow verify --base <verified-ref> [--head <ref>] [--json]
  agent-workflow check [--strict-budget] [--base <verified-ref>] [--head <ref>] [--json]
  agent-workflow docs [--budget-file <path>] [--json]
  agent-workflow report [--output <directory>]
  agent-workflow doctor [path] [--json]

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
