import { spawnSync } from "node:child_process";
import { accessSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entries = {
  context: "context-core.mjs",
  scope: "change-scope.mjs",
  verify: "verify-plan.mjs",
  check: "workflow-check-core.mjs",
  docs: "doc-check-core.mjs",
  report: "report.mjs",
  mode: "mode.mjs",
  archive: "archive.mjs",
  plan: "plan.mjs",
  index: "index.mjs",
};

function hasRoot(args) {
  return args.some((arg) => arg === "--root");
}

export function runEngine(command, args, cwd = process.cwd()) {
  const entry = path.join(packageRoot, "engine", entries[command]);
  try {
    accessSync(entry);
  } catch {
    throw new Error("runtime bundle is missing; rebuild or reinstall @next-mmo/agent-workflow-scrum");
  }
  const forwarded = hasRoot(args) ? args : ["--root", cwd, ...args];
  const result = spawnSync(process.execPath, [entry, ...forwarded], {
    cwd,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
