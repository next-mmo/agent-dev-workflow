import { listWorktrees, createWorktree, removeWorktree } from "./worktree-core.mjs";
import path from "node:path";

function parseArgs(argv) {
  const options = { repoRoot: process.cwd(), base: "HEAD", json: false, force: false };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.repoRoot = path.resolve(argv[++index] || "");
    else if (arg === "--base") options.base = argv[++index] || "";
    else if (arg === "--json") options.json = true;
    else if (arg === "--force") options.force = true;
    else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else positional.push(arg);
  }
  if (positional.length > 2) throw new Error("worktree accepts an action and at most one branch");
  const [action = "list", branch] = positional;
  return { ...options, action, branch };
}

try {
  const options = parseArgs(process.argv.slice(2));
  const { action, branch: target, json } = options;
  if (action === "list") {
    const list = listWorktrees(options.repoRoot);
    if (json) {
      console.log(JSON.stringify(list, null, 2));
    } else {
      console.log(`Active Worktrees (${list.length}):`);
      for (const w of list) {
        console.log(`- ${w.branch || "<detached>"} ${w.isMain ? "(main)" : `[${w.relativePath}]`}`);
      }
    }
  } else if (action === "start") {
    if (!target) {
      console.error("Usage: agent-workflow worktree start <branch-name> [--base <ref>]");
      process.exitCode = 1;
    } else {
      const result = createWorktree(options);
      console.log(json ? JSON.stringify(result, null, 2) : `Created isolated worktree at ${result.relativePath} (branch: ${result.branch})`);
    }
  } else if (action === "finish" || action === "remove") {
    if (!target) {
      console.error("Usage: agent-workflow worktree finish <branch-name> [--force]");
      process.exitCode = 1;
    } else {
      const result = removeWorktree({ ...options, deleteBranch: false });
      console.log(json ? JSON.stringify(result, null, 2) : `Cleaned up worktree for ${target}`);
    }
  } else {
    console.error(`Unknown worktree action: ${action}. Use list, start, or finish.`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
