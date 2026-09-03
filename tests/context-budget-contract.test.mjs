import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const contextScript = path.join(repositoryRoot, "packages/agent-workflow-scrum/bin/agent-workflow.mjs");
const docsRoot = ".agents/docs";

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

async function fixture({ commit = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-context-budget-"));
  await Promise.all([
    mkdir(path.join(root, docsRoot, "prd"), { recursive: true }),
    mkdir(path.join(root, docsRoot, "tasks"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(root, "AGENTS.md"), "# Instructions\nUse repository evidence.\n", "utf8"),
    writeFile(path.join(root, "CONTEXT.md"), "# Context\nKeep context bounded.\n", "utf8"),
    writeFile(path.join(root, docsRoot, "prd/0000-prd-index.md"), "# PRD Index\n", "utf8"),
  ]);
  git(root, "init", "-q");
  if (commit) {
    git(root, "config", "user.email", "test@example.com");
    git(root, "config", "user.name", "Test");
    git(root, "add", ".");
    git(root, "commit", "-qm", "fixture");
  }
  return root;
}

test("context router rejects budgets below its viable minimum", () => {
  const result = spawnSync(
    process.execPath,
    [contextScript, "context", "budget contract", "--provider", "local", "--budget", "499", "--json"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--budget must be an integer >= 500/);
});

test("minimum context budget remains a hard total cap without a root docs tree", async () => {
  const root = await fixture();
  try {
    const result = spawnSync(
      process.execPath,
      [contextScript, "context", "budget contract", "--root", root, "--provider", "local", "--budget", "500", "--json"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.docsRoot, docsRoot);
    assert.equal(parsed.budgetTokens, 500);
    assert.ok(parsed.estimatedTokens <= 500, `estimated ${parsed.estimatedTokens} tokens`);
    assert.equal(parsed.budgetExceeded, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("minimum context budget remains hard with many dirty paths", async () => {
  const root = await fixture({ commit: true });
  try {
    await Promise.all(Array.from({ length: 12 }, (_, index) => (
      writeFile(path.join(root, `changed-${index}.md`), `Changed file ${index}.\n`, "utf8")
    )));
    const result = spawnSync(
      process.execPath,
      [contextScript, "context", "budget contract", "--root", root, "--provider", "local", "--level", "1", "--budget", "500", "--json"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.estimatedTokens <= 500, `estimated ${parsed.estimatedTokens} tokens`);
    assert.equal(parsed.budgetExceeded, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("context router fails closed when the requested scope cannot fit", () => {
  const result = spawnSync(
    process.execPath,
    [contextScript, "context", "scope", "x".repeat(2600), "--provider", "local", "--budget", "500"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot fit the requested 500-token budget/);
});

test("tracked git-status paths preserve the first path character", async () => {
  const root = await fixture({ commit: true });
  try {
    await writeFile(path.join(root, "AGENTS.md"), "# Instructions\nUpdated repository evidence.\n", "utf8");
    await writeFile(path.join(root, "CONTEXT.md"), "# Context\nUpdated bounded context.\n", "utf8");

    const result = spawnSync(
      process.execPath,
      [contextScript, "context", "changed path contract", "--root", root, "--provider", "local", "--json"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.git.changedPaths.includes("AGENTS.md"), JSON.stringify(parsed.git.changedPaths));
    assert.ok(parsed.git.changedPaths.includes("CONTEXT.md"), JSON.stringify(parsed.git.changedPaths));
    assert.ok(!parsed.git.changedPaths.includes("GENTS.md"));
    assert.ok(!parsed.git.changedPaths.includes("ONTEXT.md"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
