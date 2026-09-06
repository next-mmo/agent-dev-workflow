import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ND_PROTOCOL, parseTaskFileName, renderNdContextEnvelope } from "../packages/agent-workflow-scrum/engine/nd-plugin-core.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const agentBinary = path.join(repositoryRoot, "packages/agent-workflow-scrum/bin/agent-workflow.mjs");
const docsRoot = ".agents/docs";

async function writeFiles(root, files) {
  await Promise.all(Object.entries(files).map(async ([file, content]) => {
    const absolute = path.join(root, file);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content, "utf8");
  }));
}

async function gitFixture(root) {
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
}

const config = `${JSON.stringify({
  schemaVersion: 1,
  mode: "standard",
  packageManager: "npm",
}, null, 2)}\n`;

const prdIndex = [
  "# Product Requirements Index",
  "",
  "| PRD | Title | Status | Summary |",
  "| :--- | :--- | :--- | :--- |",
  "| [0001](0001-starter.md) | Starter | approved | First increment |",
  "",
].join("\n");

const wipTask = [
  "# Task 0003: Dark Mode",
  "",
  "> State: wip",
  "> Created: 2026-09-06",
  "> **PRD:** `.agents/docs/prd/0003-dark-mode.md`",
  "",
  "## Outcome",
  "",
  "Add a dark/light theme toggle.",
  "",
  "## Scope",
  "",
  "- Add CSS custom properties",
  "- Persist preference",
  "",
  "## Acceptance Criteria",
  "",
  "- [x] Toggle button in sidebar",
  "- [x] Theme switches on click",
  "- [ ] System preference respected",
  "",
].join("\n");

/** A realistic fixture mirroring the awesome-dev checkout, including its quirks. */
async function fixture(overrides = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "nd-plugin-"));
  const files = {
    ".agents/config.json": config,
    [`${docsRoot}/prd/0000-prd-index.md`]: prdIndex,
    [`${docsRoot}/prd/0001-starter.md`]: "# PRD 0001: Starter\n> Status: approved\nStarter requirements.\n",
    [`${docsRoot}/prd/0002-extra.md`]: "# PRD 0002: Extra\n> Status: draft\nExtra requirements.\n",
    [`${docsRoot}/tasks/README.md`]: "# Tasks\n",
    [`${docsRoot}/tasks/wip-0003-dark-mode.md`]: wipTask,
    [`${docsRoot}/tasks/todo-0004-next-thing.md`]: "# Task 0004: Next Thing\n> State: todo\n## Scope\n- later\n",
    [`${docsRoot}/tasks/blocked-0005-stuck.md`]: "# Task 0005: Stuck\n> State: blocked\nWaiting on a decision.\n",
    [`${docsRoot}/tasks/done/done-0001-starter.md`]: [
      "# Task 0001: Starter",
      "",
      "> State: done",
      "> **PRD:** `.agents/docs/prd/0001-starter.md`",
      "",
      "## Acceptance Criteria",
      "",
      "- [x] Bootstrap exists",
      "",
      "## Evidence Ledger",
      "",
      "- `npm test` passed.",
      "- Human reviewed and accepted 2026-09-06.",
      "",
    ].join("\n"),
    // Legacy archived record: keeps its wip- prefix inside done/.
    [`${docsRoot}/tasks/done/wip-0002-express.md`]: "# Task 0002: Express\n> State: done\n## Acceptance Criteria\n- [x] Server scaffolded\n",
    ...overrides,
  };
  await writeFiles(root, files);
  await gitFixture(root);
  return root;
}

async function runNd(args, options = {}) {
  return spawnSync(process.execPath, [agentBinary, ...args], {
    encoding: "utf8",
    ...options,
  });
}

test("parseTaskFileName supports ordinal and number-only shapes", () => {
  assert.deepEqual(parseTaskFileName("wip-0003-dark-mode.md"), { lifecycle: "wip", ordinal: null, number: "3" });
  assert.deepEqual(parseTaskFileName("wip-0031-0005-full-stack-developer-trial.md"), { lifecycle: "wip", ordinal: "0031", number: "5" });
  // Digits inside the slug are not part of the task number.
  assert.deepEqual(parseTaskFileName("done-0002-0001-migrate-to-vite-8.md"), { lifecycle: "done", ordinal: "0002", number: "1" });
  assert.deepEqual(parseTaskFileName("blocked-0007-stuck-again.md"), { lifecycle: "blocked", ordinal: null, number: "7" });
  assert.deepEqual(parseTaskFileName("notes.md"), { lifecycle: null, ordinal: null, number: null });
});

test("detect reports supported repositories and failures", async () => {
  const root = await fixture();
  try {
    const result = JSON.parse((await runNd(["nd", "detect", "--root", root, "--json"])).stdout);
    assert.equal(result.protocol, ND_PROTOCOL);
    assert.equal(result.supported, true);
    assert.equal(result.config.schemaVersion, 1);
    assert.equal(result.config.packageManager, "npm");
    assert.deepEqual(result.diagnostics, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("detect rejects missing, malformed, and unsupported configs", async () => {
  const missing = await mkdtemp(path.join(tmpdir(), "nd-plugin-"));
  const malformed = await fixture({ ".agents/config.json": "{ not json" });
  const unsupported = await fixture({ ".agents/config.json": `${JSON.stringify({ schemaVersion: 2, mode: "standard" })}\n` });
  try {
    const missingResult = JSON.parse((await runNd(["nd", "detect", "--root", missing, "--json"])).stdout);
    assert.equal(missingResult.supported, false);
    assert.ok(missingResult.diagnostics.some((item) => item.code === "workflow_not_initialized"));

    const malformedResult = JSON.parse((await runNd(["nd", "detect", "--root", malformed, "--json"])).stdout);
    assert.equal(malformedResult.supported, false);
    assert.ok(malformedResult.diagnostics.some((item) => item.code === "config_malformed"));

    const unsupportedResult = JSON.parse((await runNd(["nd", "detect", "--root", unsupported, "--json"])).stdout);
    assert.equal(unsupportedResult.supported, false);
    assert.ok(unsupportedResult.diagnostics.some((item) => item.code === "unsupported_config_schema"));
  } finally {
    await rm(missing, { recursive: true, force: true });
    await rm(malformed, { recursive: true, force: true });
    await rm(unsupported, { recursive: true, force: true });
  }
});

test("snapshot maps lifecycle to board columns and flags legacy archives", async () => {
  const root = await fixture();
  try {
    const result = JSON.parse((await runNd(["nd", "snapshot", "--root", root, "--json"])).stdout);
    const byKey = new Map(result.snapshot.tasks.map((task) => [String(task.key), task]));
    assert.equal(byKey.get("3").displayStatus, "in_progress");
    assert.equal(byKey.get("4").displayStatus, "ready");
    assert.equal(byKey.get("5").displayStatus, "blocked");
    assert.equal(byKey.get("1").displayStatus, "completed");
    assert.equal(byKey.get("2").displayStatus, "completed");

    assert.equal(byKey.get("2").legacyArchive, true);
    assert.equal(byKey.get("1").legacyArchive, false);
    const codes = result.snapshot.diagnostics.map((item) => item.code);
    assert.ok(codes.includes("legacy_archived_filename"));

    const darkMode = byKey.get("3");
    assert.deepEqual(darkMode.criteria.map((criterion) => [criterion.text, criterion.checked]), [
      ["Toggle button in sidebar", true],
      ["Theme switches on click", true],
      ["System preference respected", false],
    ]);
    assert.deepEqual(darkMode.prdRefs, ["3"]);
    assert.equal(darkMode.outcome, "Add a dark/light theme toggle.");
    assert.deepEqual(darkMode.scope, ["Add CSS custom properties", "Persist preference"]);
    assert.match(darkMode.sourcePath, /wip-0003-dark-mode\.md$/);
    assert.match(darkMode.contentHash, /^sha256:[0-9a-f]{64}$/);

    const starter = byKey.get("1");
    assert.equal(starter.humanAcceptance.recorded, true);
    assert.match(starter.humanAcceptance.excerpt, /Human reviewed and accepted/);
    assert.equal(starter.evidence.present, true);
    assert.equal(byKey.get("2").humanAcceptance.recorded, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("snapshot reports PRD drift and broken references", async () => {
  const root = await fixture();
  try {
    const result = JSON.parse((await runNd(["nd", "snapshot", "--root", root, "--json"])).stdout);
    const prdByKey = new Map(result.snapshot.prds.map((prd) => [String(prd.key), prd]));
    assert.equal(prdByKey.get("1").inIndex, true);
    assert.equal(prdByKey.get("1").indexStatus, "approved");
    assert.equal(prdByKey.get("2").inIndex, false);
    assert.equal(prdByKey.get("2").status, "draft");

    const codes = result.snapshot.diagnostics.map((item) => item.code);
    assert.ok(codes.includes("prd_missing_from_index"));
    assert.ok(codes.includes("prd_status_draft"));
    // The active task links PRD 0003, whose file does not exist in the fixture.
    const taskDiagnostics = result.snapshot.tasks.flatMap((task) => task.diagnostics).map((item) => item.code);
    assert.ok(taskDiagnostics.includes("prd_file_missing"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("snapshot reports duplicate numbers, multiple active tasks, and unnumbered records as diagnostics", async () => {
  const root = await fixture({
    [`${docsRoot}/tasks/wip-0003-duplicate.md`]: "# Task 0003: Duplicate\n> State: wip\nSecond active increment.\n",
    [`${docsRoot}/tasks/wip-unnumbered.md`]: "# Task: Unnumbered\n> State: wip\nNo number in the file name.\n",
    [`${docsRoot}/tasks/loose-notes.md`]: "# Loose notes\nNot a task record.\n",
  });
  try {
    const result = JSON.parse((await runNd(["nd", "snapshot", "--root", root, "--json"])).stdout);
    const codes = result.snapshot.diagnostics.map((item) => item.code);
    assert.ok(codes.includes("duplicate_task_number"));
    assert.ok(codes.includes("multiple_active_tasks"));
    assert.ok(codes.includes("unnumbered_task"));
    assert.ok(codes.includes("unrecognized_task_filename"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("snapshot reports merge conflict markers without failing the scan", async () => {
  const root = await fixture({
    [`${docsRoot}/tasks/wip-0003-dark-mode.md`]: `${wipTask}<<<<<<< HEAD\nconflicting line\n>>>>>>> other\n`,
  });
  try {
    const result = JSON.parse((await runNd(["nd", "snapshot", "--root", root, "--json"])).stdout);
    assert.ok(result.snapshot.diagnostics.some((item) => item.code === "merge_conflict_markers"));
    assert.equal(result.snapshot.stale, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("snapshot captures git state including dirty worktrees", async () => {
  const root = await fixture();
  try {
    const clean = JSON.parse((await runNd(["nd", "snapshot", "--root", root, "--json"])).stdout);
    assert.equal(clean.snapshot.git.available, true);
    assert.equal(clean.snapshot.git.dirty, false);
    assert.ok(clean.snapshot.git.head.length >= 7);

    await appendFile(path.join(root, "scratch.txt"), "uncommitted\n", "utf8");
    const dirty = JSON.parse((await runNd(["nd", "snapshot", "--root", root, "--json"])).stdout);
    assert.equal(dirty.snapshot.git.dirty, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("snapshot of a non-repository still reports tasks with unavailable git state", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "nd-plugin-"));
  try {
    await writeFiles(root, {
      ".agents/config.json": config,
      [`${docsRoot}/tasks/wip-0003-dark-mode.md`]: wipTask,
    });
    const result = JSON.parse((await runNd(["nd", "snapshot", "--root", root, "--json"])).stdout);
    assert.equal(result.snapshot.git.available, false);
    assert.equal(result.snapshot.tasks.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("context is bounded, escapes delimiters, and never drops identity or diagnostics", async () => {
  const root = await fixture();
  try {
    const result = JSON.parse((await runNd(["nd", "context", "--root", root, "--json"])).stdout);
    const { envelope } = result.context;
    assert.ok(result.context.estimatedTokens <= result.context.budgetTokens);
    assert.match(envelope, /^\[ND WORKFLOW CONTEXT\]/);
    assert.match(envelope, /read-only mirror/);
    assert.match(envelope, /multiple_active_tasks|prd_missing_from_index|legacy_archived_filename/);
    assert.match(envelope, /active task: 3 Task 0003: Dark Mode/);
    assert.match(envelope, /- \[ \] System preference respected/);
    assert.equal(result.context.activeTaskKeys.length, 2);
    assert.ok(result.context.activeTaskKeys.includes("3"));
    assert.ok(result.context.activeTaskKeys.includes("5"));

    // Identity, capability limits, and diagnostics are never truncated away,
    // so a budget below their combined floor truncates everything droppable
    // but keeps those sections and reports the overshoot honestly.
    const tight = JSON.parse((await runNd(["nd", "context", "--root", root, "--budget", "120", "--json"])).stdout);
    assert.equal(tight.context.truncated, true);
    assert.match(tight.context.envelope, /^\[ND WORKFLOW CONTEXT\]/);
    assert.match(tight.context.envelope, /read-only mirror/);
    assert.match(tight.context.envelope, /diagnostics:/);
    assert.ok(tight.context.estimatedTokens > 120);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("context selects a specific task by key and escapes template delimiters", async () => {
  const root = await fixture({
    [`${docsRoot}/tasks/wip-0009-template.md`]: "# Task 0009: Template\n> State: wip\n\n## Outcome\n\nOutcome mentions {{user_name}} placeholders.\n",
  });
  try {
    const result = JSON.parse((await runNd(["nd", "context", "--root", root, "--task", "9", "--json"])).stdout);
    assert.deepEqual(result.context.selectedTaskKeys, ["9"]);
    assert.match(result.context.envelope, /active task: 9 Task 0009: Template/);
    assert.doesNotMatch(result.context.envelope, /\{\{/);
    assert.match(result.context.envelope, /\{ \{/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("renderNdContextEnvelope reports an idle board without inventing tasks", async () => {
  const envelope = renderNdContextEnvelope({
    root: "/tmp/idle",
    scannedAt: "2026-09-06T00:00:00.000Z",
    git: { available: true, branch: "main", head: "a".repeat(40), dirty: false },
    tasks: [],
    prds: [],
    diagnostics: [],
  }, { rootName: "idle" });
  assert.match(envelope.envelope, /board: 0 ready, 0 in progress, 0 blocked, 0 source-reported completed/);
  assert.doesNotMatch(envelope.envelope, /active task:/);
});

test("CLI enforces its argument contract", async () => {
  const root = await fixture();
  try {
    const unknownMethod = await runNd(["nd", "transmogrify", "--root", root]);
    assert.equal(unknownMethod.status, 1);
    assert.match(unknownMethod.stderr, /unknown nd method/);

    const unknownOption = await runNd(["nd", "detect", "--root", root, "--frobnicate"]);
    assert.equal(unknownOption.status, 1);
    assert.match(unknownOption.stderr, /unknown option/);

    const badBudget = await runNd(["nd", "context", "--root", root, "--budget", "zero"]);
    assert.equal(badBudget.status, 1);
    assert.match(badBudget.stderr, /--budget/);

    const human = await runNd(["nd", "detect", "--root", root]);
    assert.equal(human.status, 0);
    assert.match(human.stdout, /supported: true/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
