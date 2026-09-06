import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const ciScript = path.join(repositoryRoot, "scripts/ci-workflow-check.mjs");
const binary = path.join(repositoryRoot, "packages/agent-workflow-scrum/bin/agent-workflow.mjs");

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" }).trim();
}

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "workflow-ci-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = path.join(directory, "repo");
  await mkdir(root);
  const put = async (file, content) => {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  };
  await put(".agents/config.json", JSON.stringify({ schemaVersion: 1, mode: "vibe" }));
  await put("src/app.js", "export const value = 0;\n");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.test");
  git(root, "config", "user.name", "Fixture");
  const commit = () => {
    git(root, "add", ".");
    git(root, "commit", "-qm", "fixture increment");
    return git(root, "rev-parse", "HEAD");
  };
  const base = commit();
  const env = { ...process.env, WORKFLOW_MODE: "vibe", AGENT_WORKFLOW_MODE: "vibe" };
  const check = (...args) => spawnSync(process.execPath,
    [binary, "check", "--root", root, "--json", ...args], { cwd: root, env, encoding: "utf8" });
  const run = async (eventName, event, sha = git(root, "rev-parse", "HEAD")) => {
    const eventPath = path.join(directory, "event.json");
    await writeFile(eventPath, JSON.stringify(event));
    return spawnSync(process.execPath, [ciScript], {
      cwd: root, encoding: "utf8",
      env: { ...env, GITHUB_EVENT_NAME: eventName, GITHUB_EVENT_PATH: eventPath, GITHUB_SHA: sha },
    });
  };
  return { root, base, put, commit, check, run };
}

function taskText({ acceptance = true, evidence = true, recovery = true } = {}) {
  return `# Task\n> **Status:** done\n> **PRD:** \`.agents/docs/prd/0001-app.md\`\n\n`
    + (acceptance ? "## Acceptance Criteria\n- [x] The value is one.\n\n" : "")
    + (evidence ? "## Evidence Ledger\n- Fixture assertion: passed.\n\n" : "")
    + (recovery ? "## Recovery\nRevert the value change.\n" : "");
}

async function addTask(f, options) {
  await f.put(".agents/docs/prd/0000-prd-index.md", "# PRDs\n- [App](0001-app.md)\n");
  await f.put(".agents/docs/prd/0001-app.md", "# App\nThe value is one.\n");
  await f.put(".agents/docs/tasks/done/done-0001-0001-app.md", taskText(options));
}

test("CI rejects committed PR product changes despite a clean checkout and vibe defaults", async (t) => {
  const f = await fixture(t);
  await f.put("src/app.js", "export const value = 1;\n");
  const head = f.commit();
  assert.equal(git(f.root, "status", "--porcelain"), "");
  assert.equal(f.check("--strict-budget").status, 0, "negative control reproduces the old CI bypass");
  const result = await f.run("pull_request", { pull_request: { base: { sha: f.base }, head: { sha: head } } });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /ceremony mode: strict/);
  assert.match(result.stdout, /product changes require one active/);
});

test("push scope includes earlier product commits when the last commit only changes docs", async (t) => {
  const f = await fixture(t);
  await f.put("src/app.js", "export const value = 1;\n");
  f.commit();
  await f.put("README.md", "# Readme\n");
  const head = f.commit();
  const result = await f.run("push", { before: f.base, after: head });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /product changes require one active/);
});

test("PR merge checkout checks integration changes against the event base", async (t) => {
  const f = await fixture(t);
  git(f.root, "switch", "-qc", "feature");
  await f.put("src/app.js", "export const value = 1;\n");
  await addTask(f);
  const head = f.commit();
  git(f.root, "switch", "-q", "main");
  await f.put("README.md", "# Base advanced\n");
  const base = f.commit();
  git(f.root, "merge", "--no-ff", "-qm", "PR merge", head);
  const result = await f.run("pull_request", { pull_request: { base: { sha: base }, head: { sha: head } } });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(`base=${base}`));
  assert.match(result.stdout, /ceremony mode: strict/);
  assert.match(result.stdout, /product path\(s\) require task/);
});

test("CI accepts documented push changes and the style-only fast path", async (t) => {
  const f = await fixture(t);
  await f.put("src/app.js", "export const value = 1;\n");
  await addTask(f);
  const documented = f.commit();
  const result = await f.run("push", { before: f.base, after: documented });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  await f.put("src/styles.css", "body { color: black; }\n");
  const styled = f.commit();
  const styleResult = await f.run("push", { before: documented, after: styled });
  assert.equal(styleResult.status, 0, styleResult.stdout + styleResult.stderr);
  assert.match(styleResult.stdout, /fast path active/);
});

test("CI refuses invalid events, unavailable history, and mismatched checkouts", async (t) => {
  const f = await fixture(t);
  await f.put("README.md", "# Change\n");
  const head = f.commit();
  const cases = [
    ["push", { before: "0".repeat(40), after: head }, head, /no previous commit/],
    ["push", { before: "--help", after: head }, head, /before.*full commit SHA/],
    ["push", { before: "f".repeat(40), after: head }, head, /base commit.*unavailable/],
    ["push", { before: f.base, after: f.base }, head, /after.*GITHUB_SHA/],
    ["push", { before: f.base, after: f.base }, f.base, /checkout.*does not match/],
    ["pull_request", { pull_request: { head: { sha: head } } }, head, /base.sha.*full commit SHA/],
    ["pull_request", { pull_request: { base: { sha: f.base }, head: { sha: f.base } } }, head, /PR head or.*merge/],
    ["workflow_dispatch", {}, head, /unsupported event/],
  ];
  for (const [name, event, sha, pattern] of cases) {
    const result = await f.run(name, event, sha);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, pattern);
    assert.doesNotMatch(result.stdout, /workflow consistency passed/);
  }
});

test("force-push divergence fails instead of silently using a different merge base", async (t) => {
  const f = await fixture(t);
  await f.put("README.md", "# Old branch\n");
  const before = f.commit();
  git(f.root, "switch", "-qc", "replacement", f.base);
  await f.put("README.md", "# Replacement\n");
  const after = f.commit();
  const result = await f.run("push", { before, after });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /non-fast-forward push/);
});

test("mode contracts enforce acceptance, evidence, and recovery independently", async (t) => {
  const f = await fixture(t);
  await f.put("src/app.js", "export const value = 1;\n");
  await addTask(f);
  f.commit();
  for (const mode of ["vibe", "standard", "guided", "strict"]) {
    const args = ["--base", f.base, "--mode", mode];
    for (const field of ["acceptance", "evidence", "recovery"]) {
      await addTask(f, { [field]: false });
      const result = f.check(...args);
      const shouldFail = mode !== "vibe" && (field !== "recovery" || mode === "strict");
      assert.equal(result.status, shouldFail ? 1 : 0, `${mode}/${field}: ${result.stdout}`);
      if (shouldFail) {
        const pattern = { acceptance: /Acceptance Criteria/, evidence: /Evidence Ledger/, recovery: /Rollback or Recovery/ }[field];
        assert.match(result.stdout, pattern);
      }
    }
    await addTask(f);
    assert.equal(f.check(...args).status, 0);
  }
});

test("Actions checks out complete event history and invokes the tested CI entry point", async () => {
  const workflow = await readFile(path.join(repositoryRoot, ".github/workflows/ci.yml"), "utf8");
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/);
  assert.match(workflow, /run: node scripts\/ci-workflow-check\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});
