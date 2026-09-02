import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const benchmarkScript = path.join(repositoryRoot, ".agents/scripts/context-benchmark.mjs");

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-context-benchmark-"));
  await Promise.all([
    mkdir(path.join(root, ".agents/docs/prd"), { recursive: true }),
    mkdir(path.join(root, ".agents/docs/tasks"), { recursive: true }),
    mkdir(path.join(root, "notes"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(root, "AGENTS.md"), "# Instructions\nUse the active task and current repository evidence.\n", "utf8"),
    writeFile(path.join(root, "CONTEXT.md"), "# Context\nLocal repository retrieval is authoritative for current state.\n", "utf8"),
    writeFile(path.join(root, ".agents/docs/prd/0000-prd-index.md"), "# PRD Index\n- **0001** Auth\n", "utf8"),
    writeFile(path.join(root, ".agents/docs/prd/0001-auth.md"), "# Authentication\nAuthorization denial paths must be tested.\n", "utf8"),
    writeFile(path.join(root, ".agents/docs/tasks/wip-0001-0001-auth.md"), "# Auth task\n> **Status:** wip\nUse the PRD and verify denial paths.\n", "utf8"),
    ...Array.from({ length: 10 }, (_, index) => (
      writeFile(path.join(root, "notes", `note-${index}.md`), `Unrelated repository note ${index}. ${"context detail ".repeat(80)}\n`, "utf8")
    )),
  ]);
  git(root, "init", "-q");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test");
  git(root, "add", ".");
  git(root, "commit", "-qm", "benchmark fixture");
  return root;
}

test("context benchmark reports raw versus bounded token savings", async () => {
  const root = await fixture();
  try {
    const output = execFileSync(
      process.execPath,
      [benchmarkScript, "authorization", "--root", root, "--provider", "local", "--level", "1", "--budget", "500", "--json"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    const result = JSON.parse(output);
    assert.equal(result.schemaVersion, 1);
    assert.equal(result.provider, "local");
    assert.equal(result.bounded.budgetExceeded, false);
    assert.ok(result.bounded.tokens <= result.bounded.budgetTokens);
    assert.ok(result.raw.files >= 10);
    assert.ok(result.raw.tokens > result.bounded.tokens);
    assert.ok(result.savings.tokens > 0);
    assert.ok(result.savings.percent > 0);
    assert.ok(result.raw.durationMs >= 0);
    assert.ok(result.bounded.durationMs >= 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("context benchmark has concise human-readable output", async () => {
  const root = await fixture();
  try {
    const output = execFileSync(
      process.execPath,
      [benchmarkScript, "authorization", "--root", root, "--provider", "local", "--budget", "500"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    assert.match(output, /# Context Benchmark/);
    assert.match(output, /Raw baseline:/);
    assert.match(output, /Bounded context:/);
    assert.match(output, /Savings:/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
