import { listWorktrees, createWorktree, removeWorktree } from "./worktree-core.mjs";

const [action = "list", target, ...rest] = process.argv.slice(2);

try {
  if (action === "list") {
    const list = listWorktrees();
    console.log(`Active Worktrees (${list.length}):`);
    for (const w of list) {
      console.log(`- ${w.branch || "<detached>"} ${w.isMain ? "(main)" : `[${w.relativePath}]`}`);
    }
  } else if (action === "start") {
    if (!target) {
      console.error("Usage: agent-workflow worktree start <branch-name> [--base <ref>]");
      process.exitCode = 1;
    } else {
      const baseIdx = rest.indexOf("--base");
      const base = baseIdx >= 0 ? rest[baseIdx + 1] : "HEAD";
      const result = createWorktree({ branch: target, base });
      console.log(`Created isolated worktree at ${result.relativePath} (branch: ${result.branch})`);
    }
  } else if (action === "finish" || action === "remove") {
    if (!target) {
      console.error("Usage: agent-workflow worktree finish <branch-name> [--force]");
      process.exitCode = 1;
    } else {
      const force = rest.includes("--force");
      removeWorktree({ branch: target, force, deleteBranch: false });
      console.log(`Cleaned up worktree for ${target}`);
    }
  } else {
    console.error(`Unknown worktree action: ${action}. Use list, start, or finish.`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
