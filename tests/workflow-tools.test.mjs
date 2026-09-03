import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const contextScript = path.join(repositoryRoot, ".agents/scripts/context.mjs");
const checkScript = path.join(repositoryRoot, ".agents/scripts/workflow-check.mjs");
const modeScript = path.join(repositoryRoot, ".agents/scripts/mode.mjs");
const archiveScript = path.join(repositoryRoot, ".agents/scripts/archive.mjs");
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

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
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

test("workflow checker requires synchronized task metadata for product changes", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
    await rm(path.join(root, docsRoot, "tasks/wip-0001-0001-auth.md"));
    const result = spawnSync(process.execPath, [checkScript, "--root", root, "--json"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.errors.some((error) => error.includes("product changes require one active")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker accepts a product change with task, PRD index, and evidence", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(
      path.join(root, docsRoot, "tasks/wip-0001-0001-auth.md"),
      "# Task Auth\n> **Status:** wip\n> **PRD:** `.agents/docs/prd/0001-auth.md`\n\n## Acceptance Criteria\n\n- [ ] Session timeout and authorization denial paths are verified.\n\n## Evidence Ledger\n\n| Claim | Evidence | Result |\n| :--- | :--- | :--- |\n| Session behavior | Focused tests | Pending |\n",
      "utf8",
    );
    await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
    const result = runJson(checkScript, ["--root", root, "--strict-budget"]);
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.ok(result.info.some((item) => item.includes("product synchronization")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker rejects product changes with incomplete task synchronization", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
    const result = spawnSync(process.execPath, [checkScript, "--root", root, "--json"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.errors.some((error) => error.includes("canonical PRD")));
    assert.ok(parsed.errors.some((error) => error.includes("Evidence Ledger")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker evaluates committed product paths with an explicit base", async () => {
  const root = await fixture();
  try {
    await writeFile(
      path.join(root, docsRoot, "tasks/wip-0001-0001-auth.md"),
      "# Task Auth\n> **Status:** wip\n> **PRD:** `.agents/docs/prd/0001-auth.md`\n\n## Acceptance Criteria\n\n- [ ] Session timeout is verified.\n\n## Evidence Ledger\n\n| Claim | Evidence | Result |\n| :--- | :--- | :--- |\n| Session behavior | Focused tests | Pending |\n",
      "utf8",
    );
    git(root, "add", ".");
    git(root, "commit", "-qm", "task metadata");
    const base = git(root, "rev-parse", "HEAD");
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
    git(root, "add", ".");
    git(root, "commit", "-qm", "product increment");

    const result = runJson(checkScript, ["--root", root, "--base", base]);
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.ok(result.info.some((item) => item.includes("outgoing scope")));
    assert.ok(result.info.some((item) => item.includes("product synchronization")));
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

test("workflow checker accepts product changes without task in vibe mode", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
    const standardResult = spawnSync(process.execPath, [checkScript, "--root", root, "--json"], { encoding: "utf8" });
    assert.notEqual(standardResult.status, 0);

    const vibeResult = runJson(checkScript, ["--root", root, "--mode", "vibe"]);
    assert.equal(vibeResult.ok, true, JSON.stringify(vibeResult.errors));
    assert.ok(vibeResult.info.some((item) => item.includes("vibe mode active")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker in guided mode provides remediation tip", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
    const result = spawnSync(process.execPath, [checkScript, "--root", root, "--mode", "guided", "--json"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.errors.some((error) => error.includes("Guided Tip:")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("mode CLI script inspects and switches workflow ceremony mode", async () => {
  const root = await fixture();
  try {
    const inspectResult = runJson(modeScript, ["--root", root]);
    assert.equal(inspectResult.ok, true);
    assert.equal(inspectResult.mode, "standard");

    const setResult = runJson(modeScript, ["vibe", "--root", root]);
    assert.equal(setResult.ok, true);
    assert.equal(setResult.mode, "vibe");

    const recheckResult = runJson(modeScript, ["--root", root]);
    assert.equal(recheckResult.mode, "vibe");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow checker allows style-only changes under fast path without task", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/styles.css"), "body { color: red; }\n", "utf8");
    const result = runJson(checkScript, ["--root", root]);
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.ok(result.info.some((item) => item.includes("style path(s) changed; fast path active")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("task archiver moves completed tasks older than retention days and keeps recent ones", async () => {
  const root = await fixture();
  try {
    const oldTask = path.join(root, docsRoot, "tasks/done/done-0001-old.md");
    const newTask = path.join(root, docsRoot, "tasks/done/done-0002-new.md");
    await writeFile(oldTask, "# Old Task\n> **Status:** done\n> **Completed:** 2026-08-01\n", "utf8");
    await writeFile(newTask, "# New Task\n> **Status:** done\n> **Completed:** 2026-09-03\n", "utf8");

    // Run dry-run first
    const dryRunResult = runJson(archiveScript, ["--dry-run", "--days", "14", "--root", root]);
    assert.equal(dryRunResult.ok, true);
    assert.equal(dryRunResult.dryRun, true);
    assert.equal(dryRunResult.archived.length, 1);
    assert.equal(dryRunResult.archived[0].file, "done-0001-old.md");

    // Run real archive
    const realResult = runJson(archiveScript, ["--days", "14", "--root", root]);
    assert.equal(realResult.ok, true);
    assert.equal(realResult.archived.length, 1);
    assert.equal(realResult.archived[0].destPath, ".agents/docs/tasks/archived/2026/done-0001-old.md");
    assert.equal(realResult.retained.length, 1);
    assert.equal(realResult.retained[0].file, "done-0002-new.md");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});



