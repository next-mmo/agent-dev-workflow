import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const contextScript = path.join(repositoryRoot, "scripts/context.mjs");

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-context-budget-"));
  await Promise.all([
    mkdir(path.join(root, "docs/prd"), { recursive: true }),
    mkdir(path.join(root, "docs/tasks"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(root, "AGENTS.md"), "# Instructions\nUse repository evidence.\n", "utf8"),
    writeFile(path.join(root, "CONTEXT.md"), "# Context\nKeep context bounded.\n", "utf8"),
    writeFile(path.join(root, "docs/prd/0000-prd-index.md"), "# PRD Index\n", "utf8"),
  ]);
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
}

test("context router rejects budgets below its viable minimum", () => {
  const result = spawnSync(
    process.execPath,
    [contextScript, "budget contract", "--provider", "local", "--budget", "499", "--json"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--budget must be an integer >= 500/);
});

test("minimum context budget remains a hard total cap", async () => {
  const root = await fixture();
  try {
    const result = spawnSync(
      process.execPath,
      [contextScript, "budget contract", "--root", root, "--provider", "local", "--budget", "500", "--json"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.budgetTokens, 500);
    assert.ok(parsed.estimatedTokens <= 500, `estimated ${parsed.estimatedTokens} tokens`);
    assert.equal(parsed.budgetExceeded, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
