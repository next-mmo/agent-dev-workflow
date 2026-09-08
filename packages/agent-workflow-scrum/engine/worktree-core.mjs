import { spawnSync } from "node:child_process";
import path from "node:path";
import { existsSync, realpathSync } from "node:fs";

function runGit(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    const errorMsg = String(result.stderr || result.stdout || "").trim();
    throw new Error(`git ${args.join(" ")} failed: ${errorMsg}`);
  }
  return String(result.stdout || "").trim();
}

function normalizeBranch(repoRoot, branch) {
  const cleanBranch = String(branch || "").trim().replace(/^refs\/heads\//, "");
  if (!cleanBranch) throw new Error("branch name is required");
  if (path.isAbsolute(cleanBranch) || cleanBranch.includes("\\")) {
    throw new Error(`invalid branch name for a managed worktree: ${cleanBranch}`);
  }
  try {
    runGit(repoRoot, ["check-ref-format", "--branch", cleanBranch]);
  } catch {
    throw new Error(`invalid branch name for a managed worktree: ${cleanBranch}`);
  }
  return cleanBranch;
}

function assertContained(parent, candidate, label) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} must remain inside ${path.resolve(parent)}`);
  }
}

function managedWorktreePath(repoRoot, branch) {
  const worktreeRoot = path.resolve(repoRoot, ".worktrees");
  assertContained(repoRoot, worktreeRoot, "managed worktree directory");
  if (existsSync(worktreeRoot)) {
    assertContained(repoRoot, realpathSync(worktreeRoot), "managed worktree directory");
  }

  const worktreeDir = path.resolve(worktreeRoot, branch);
  assertContained(worktreeRoot, worktreeDir, "worktree path");
  if (existsSync(worktreeDir)) {
    assertContained(worktreeRoot, realpathSync(worktreeDir), "worktree path");
  }
  return worktreeDir;
}

function samePath(left, right) {
  return path.relative(path.resolve(left), path.resolve(right)) === "";
}

export function listWorktrees(repoRoot = process.cwd()) {
  const output = runGit(repoRoot, ["worktree", "list", "--porcelain"]);
  const worktrees = [];
  const entries = output.split(/\r?\n\r?\n/).filter(Boolean);

  for (const entry of entries) {
    const lines = entry.split(/\r?\n/);
    const item = { path: "", head: "", branch: "" };
    for (const line of lines) {
      if (line.startsWith("worktree ")) item.path = line.slice(9).trim();
      else if (line.startsWith("HEAD ")) item.head = line.slice(5).trim();
      else if (line.startsWith("branch ")) item.branch = line.slice(7).replace("refs/heads/", "").trim();
      else if (line === "bare") item.bare = true;
      else if (line === "detached") item.detached = true;
    }
    if (item.path) {
      item.relativePath = path.relative(repoRoot, item.path).replaceAll("\\", "/");
      item.isMain = item.relativePath === "" || item.relativePath === ".";
      worktrees.push(item);
    }
  }

  return worktrees;
}

export function createWorktree({
  repoRoot = process.cwd(),
  branch,
  base = "HEAD",
} = {}) {
  const cleanBranch = normalizeBranch(repoRoot, branch);
  const worktreeDir = managedWorktreePath(repoRoot, cleanBranch);
  const relativePath = path.relative(repoRoot, worktreeDir).replaceAll("\\", "/");

  // Check if branch already exists
  let branchExists = false;
  try {
    runGit(repoRoot, ["rev-parse", "--verify", `refs/heads/${cleanBranch}`]);
    branchExists = true;
  } catch {
    branchExists = false;
  }

  if (branchExists) {
    runGit(repoRoot, ["worktree", "add", worktreeDir, cleanBranch]);
  } else {
    runGit(repoRoot, ["worktree", "add", "-b", cleanBranch, worktreeDir, base]);
  }

  const registered = listWorktrees(repoRoot).find((item) => samePath(item.path, worktreeDir) && item.branch === cleanBranch);
  if (!registered) {
    throw new Error(`git did not register the managed worktree for branch ${cleanBranch}`);
  }

  return {
    ok: true,
    branch: cleanBranch,
    path: worktreeDir,
    relativePath,
  };
}

export function removeWorktree({
  repoRoot = process.cwd(),
  branch,
  deleteBranch = false,
  force = false,
} = {}) {
  const cleanBranch = normalizeBranch(repoRoot, branch);
  const worktreeDir = managedWorktreePath(repoRoot, cleanBranch);
  const registered = listWorktrees(repoRoot).find((item) => samePath(item.path, worktreeDir));
  if (!registered || registered.isMain || registered.branch !== cleanBranch) {
    throw new Error(`refusing to remove an unregistered or mismatched managed worktree: ${cleanBranch}`);
  }

  const args = ["worktree", "remove"];
  if (force) args.push("--force");
  args.push(worktreeDir);

  runGit(repoRoot, args);

  if (deleteBranch) {
    try {
      runGit(repoRoot, ["branch", force ? "-D" : "-d", cleanBranch]);
    } catch {
      // Ignored if branch cannot be deleted
    }
  }

  return { ok: true, branch: cleanBranch };
}
