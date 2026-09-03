import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const agentBinary = path.join(repositoryRoot, "packages/agent-workflow-scrum/bin/agent-workflow.mjs");

function run(args) {
  return execFileSync(process.execPath, [agentBinary, ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

test("package bin honors an explicit root for dry-run, plan, PRD sync, and worktree commands", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "agent-package-root-"));
  const root = path.join(parent, "consumer");
  try {
    const dryRun = JSON.parse(run(["init", "--root", root, "--dry-run", "--json"]));
    assert.equal(dryRun.root, root.replaceAll("\\", "/"));
    assert.equal(await exists(root), false, "init --dry-run must not create the target");

    await mkdir(path.join(root, ".agents/docs/prd"), { recursive: true });
    await mkdir(path.join(root, ".agents/docs/plans"), { recursive: true });
    await mkdir(path.join(root, ".agents/docs/solutions"), { recursive: true });
    await writeFile(path.join(root, ".agents/docs/plans/0000-template.md"), "# Plan: <Feature / Architecture Name>\n> **Status:** template\n> **Created:** <date>\n> **Updated:** <date>\n", "utf8");
    await writeFile(path.join(root, ".agents/docs/solutions/0000-template.md"), "---\ntitle: <Clear Problem and Solution Title>\nmodule: <affected/path.js>\ntags: [bugfix, pattern]\n---\n# <Problem Title>\n> **Module:** `src/`\n> **Tags:** `bugfix`, `pattern`\n", "utf8");
    execFileSync("git", ["init", "-q"], { cwd: root });

    const prdSync = JSON.parse(run(["prdsync", "--root", root, "--dry-run", "--json"]));
    assert.deepEqual(prdSync.syncedPRDs, [], "PRD sync must inspect the explicit root");

    const plan = JSON.parse(run(["plan", "package root routing", "--root", root, "--json"]));
    assert.equal(plan.relativePath, ".agents/docs/plans/0001-package-root-routing.md");
    assert.equal(await exists(path.join(root, plan.relativePath)), true);

    const solution = JSON.parse(run(["solve", "package root solution", "--root", root, "--json"]));
    assert.equal(solution.relativePath, ".agents/docs/solutions/0001-package-root-solution.md");
    assert.equal(await exists(path.join(root, solution.relativePath)), true);

    const worktrees = JSON.parse(run(["worktree", "list", "--root", root, "--json"]));
    assert.equal(worktrees[0].path.replaceAll("\\", "/"), root.replaceAll("\\", "/"));
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
