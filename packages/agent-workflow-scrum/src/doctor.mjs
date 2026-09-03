import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { loadWorkflowConfigSync } from "../engine/workflow-config.mjs";

const requiredPaths = [
  "AGENTS.md",
  "CONTEXT.md",
  ".agents/config.json",
  ".agents/docs/prd/0000-prd-index.md",
  ".agents/docs/tasks/README.md",
  ".agents/docs/suggestions/README.md",
];
const vendoredPaths = [".agents/scripts", ".agents/skills", ".agents/benchmark"];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv, cwd) {
  const options = { root: cwd, json: false, positional: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else options.positional.push(arg);
  }
  if (options.positional.length > 1) throw new Error("doctor accepts at most one target path");
  if (options.positional.length) options.root = path.resolve(cwd, options.positional[0]);
  return options;
}

function executable(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

export async function diagnoseProject(argv, cwd = process.cwd()) {
  const options = parseArgs(argv, cwd);
  const errors = [];
  const warnings = [];
  const info = [];
  for (const relativePath of requiredPaths) {
    if (!await exists(path.join(options.root, relativePath))) errors.push(`missing ${relativePath}`);
  }

  let config = null;
  try {
    config = loadWorkflowConfigSync(options.root);
  } catch (error) {
    errors.push(error.message);
  }

  const git = spawnSync("git", ["-C", options.root, "rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true });
  if (git.status === 0) info.push("Git worktree detected");
  else errors.push("target is not a Git worktree; scope and verification commands require Git");

  const packageManager = config?.packageManager;
  if (typeof packageManager === "string") {
    const probe = process.platform === "win32"
      ? spawnSync("where.exe", [packageManager], { encoding: "utf8", windowsHide: true })
      : spawnSync(executable(packageManager), ["--version"], { encoding: "utf8", windowsHide: true });
    if (probe.status === 0) info.push(`${packageManager} detected`);
    else errors.push(`${packageManager} is configured but not available on PATH`);
  }

  if (config?.mode) {
    info.push(`ceremony mode: ${config.mode}`);
  }

  for (const relativePath of vendoredPaths) {
    if (await exists(path.join(options.root, relativePath))) {
      warnings.push(`${relativePath} is vendored; package/plugin mode does not require it`);
    }
  }
  const result = {
    schemaVersion: 1,
    ok: errors.length === 0,
    root: options.root.replaceAll("\\", "/"),
    node: process.version,
    packageManager: packageManager || null,
    mode: config?.mode || null,
    errors,
    warnings,
    info,
  };
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return { ...result, json: true, output: "" };
  }
  const lines = [
    `Agent Workflow Scrum doctor: ${result.ok ? "ready" : "not ready"}`,
    ...info.map((item) => `- OK: ${item}`),
    ...warnings.map((item) => `- WARN: ${item}`),
    ...errors.map((item) => `- FAIL: ${item}`),
  ];
  return { ...result, json: false, output: `${lines.join("\n")}\n` };
}
