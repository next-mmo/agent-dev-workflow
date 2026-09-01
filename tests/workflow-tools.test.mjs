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
const checkScript = path.join(repositoryRoot, "scripts/workflow-check.mjs");
const docsRoot = ".agents/docs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-"));
  await Promise.all([
    mkdir(path.join(root, docsRoot, "tasks/done"), { recursive: true }),
    mkdir(path.join(root, docsRoot, "prd"), { recursive: true }),
    mkdir(path.join(root, docsRoot, "suggestions"), { recursive: true }),
    mkdir(path.join(root, ".agents/skills/agent-workflow-scrum/references"), { recursive: true }),
  ]);
  const files = {
    "AGENTS.md": "# Agent Instructions\nRead [CONTEXT.md](CONTEXT.md).\n",
    "CONTEXT.md": "# Context\nAuthentication work is high risk. Use the active task and relevant PRD.\n",
    [`${docsRoot}/agent-workflow.md`]: "# Workflow\n",
    [`${docsRoot}/tasks/README.md`]: "# Tasks\n",
    [`${docsRoot}/prd/0000-prd-index.md`]: "# PRD Index\n- [Auth](0001-auth.md)\n",
    [`${docsRoot}/prd/0001-auth.md`]: "# Authentication\nSessions expire safely. Authorization denial paths must be tested.\n",
    [`${docsRoot}/tasks/wip-0001-0001-auth.md`]: "# Task Auth\n> **Status:** wip\nImplement session timeout and verify authorization.\n",
    [`${docsRoot}/suggestions/README.md`]: "# Suggestions\n",
    ".agents/skills/agent-workflow-scrum/SKILL.md": "---\nname: agent-workflow-scrum\ndescription: test\n---\n# Skill\nSee [context](references/context-routing.md).\n",
    ".agents/skills/agent-workflow-scrum/references/context-routing.md": "# Context Routing\n",
  };
  await Promise.all(Object.entries(files).map(async ([file, content]) => {
    const absolute = path.join(root, file);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content, "utf8");
  }));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  return root;
}

function runJson(script, args) {
  return JSON.parse(execFileSync(process.execPath, [script, ...args, "--json"], { encoding: "utf8" }));
}

test("context router prioritizes active task and security rules", async () => {
  const root = await fixture();
  try {
    const result = runJson(contextScript, ["session timeout", "--root", root]);
    assert.equal(result.docsRoot, docsRoot);
    assert.equal(result.activeTasks.length, 1);
    assert.equal(result.selected[0].kind, "active-task");
    assert.ok(result.ruleHints.includes("security"));
    assert.ok(result.estimatedTokens <= result.budgetTokens);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("L1 context respects a small token budget", async () => {
  const root = await fixture();
  try {
    const result = runJson(contextScript, ["authorization", "--level", "1", "--budget", "500", "--root", root]);
    assert.equal(result.level, 1);
    assert.ok(result.documents.length > 0);
    assert.ok(result.estimatedTokens <= 550, `estimated ${result.estimatedTokens} tokens`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker accepts a consistent fixture", async () => {
  const root = await fixture();
  try {
    const result = runJson(checkScript, ["--root", root, "--strict-budget"]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker rejects multiple active tasks", async () => {
  const root = await fixture();
  try {
    await writeFile(
      path.join(root, docsRoot, "tasks/blocked-0002-0001-other.md"),
      "# Other\n> **Status:** blocked\nWaiting for a decision.\n",
      "utf8",
    );
    const result = spawnSync(process.execPath, [checkScript, "--root", root, "--json"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.errors.some((error) => error.includes("at most one active")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker rejects broken tracked markdown links", async () => {
  const root = await fixture();
  try {
    await writeFile(path.join(root, "AGENTS.md"), "# Agent Instructions\nRead [missing](missing.md).\n", "utf8");
    const result = spawnSync(process.execPath, [checkScript, "--root", root, "--json"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.errors.some((error) => error.includes("broken markdown link")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker rejects applied suggestions without a human decision", async () => {
  const root = await fixture();
  try {
    await writeFile(
      path.join(root, docsRoot, "suggestions/0001-policy.md"),
      "# Suggestion\n> **Status:** applied\n\n## Human Decision\n- **Decision:** pending\n",
      "utf8",
    );
    const result = spawnSync(process.execPath, [checkScript, "--root", root, "--json"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.errors.some((error) => error.includes("non-pending human decision")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
