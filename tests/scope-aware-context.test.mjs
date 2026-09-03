import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-scope-context-"));
  await mkdir(path.join(root, docsRoot, "prd"), { recursive: true });
  await writeFile(path.join(root, "AGENTS.md"), "# Instructions\nUse repository evidence.\n", "utf8");
  await writeFile(path.join(root, "CONTEXT.md"), "# Context\nAuthentication is security sensitive.\n", "utf8");
  await writeFile(path.join(root, docsRoot, "prd/0000-prd-index.md"), "# PRD Index\n", "utf8");
  git(root, "init", "-q");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test");
  git(root, "add", ".");
  git(root, "commit", "-qm", "base");
  const baseSha = git(root, "rev-parse", "HEAD");
  git(root, "switch", "-qc", "feature");
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "src/auth-session.js"), "export const timeout = 30;\n", "utf8");
  git(root, "add", ".");
  git(root, "commit", "-qm", "auth feature");
  return { root, baseSha };
}

test("context with explicit base sees committed branch changes, .agents docs, and separate authority axes", async () => {
  const { root, baseSha } = await fixture();
  try {
    const output = execFileSync(
      process.execPath,
      [contextScript, "context", "review", "--root", root, "--provider", "local", "--base", baseSha, "--json"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    const result = JSON.parse(output);
    assert.equal(result.schemaVersion, 5);
    assert.equal(result.docsRoot, docsRoot);
    assert.deepEqual(result.git.changedPaths, ["src/auth-session.js"]);
    assert.deepEqual(result.git.outgoing.committedPaths, ["src/auth-session.js"]);
    assert.equal(result.git.outgoing.base, baseSha);
    assert.ok(result.ruleHints.includes("security"));
    assert.match(result.decisionAuthority[0], /human decision/);
    assert.match(result.observationEvidence[0], /current source/);
    assert.equal(result.authorityOrder, undefined);
    assert.ok(result.estimatedTokens <= result.budgetTokens);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
