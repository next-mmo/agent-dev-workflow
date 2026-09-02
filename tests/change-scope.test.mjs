import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { classifyChangedPaths, collectChangeScope } from "../.agents/scripts/change-scope.mjs";

const docsRoot = ".agents/docs";

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-change-scope-"));
  git(root, "init", "-q");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test");
  await writeFile(path.join(root, "README.md"), "# Fixture\n", "utf8");
  git(root, "add", ".");
  git(root, "commit", "-qm", "base");
  const baseSha = git(root, "rev-parse", "HEAD");
  git(root, "switch", "-qc", "feature");
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
  git(root, "add", ".");
  git(root, "commit", "-qm", "feature");
  return { root, baseSha };
}

test("change scope reports committed and every dirty layer against an explicit base", async () => {
  const { root, baseSha } = await fixture();
  try {
    await mkdir(path.join(root, docsRoot), { recursive: true });
    const stagedDoc = `${docsRoot}/note.md`;
    await writeFile(path.join(root, stagedDoc), "staged\n", "utf8");
    git(root, "add", stagedDoc);
    await writeFile(path.join(root, "src/app.js"), "export const value = 2;\n", "utf8");
    await writeFile(path.join(root, "scratch.txt"), "untracked\n", "utf8");

    const report = collectChangeScope({ root, base: baseSha, head: "HEAD" });
    assert.equal(report.formatVersion, 2);
    assert.equal(report.docsRoot, docsRoot);
    assert.deepEqual(report.paths.committed, ["src/app.js"]);
    assert.deepEqual(report.paths.staged, [stagedDoc]);
    assert.deepEqual(report.paths.unstaged, ["src/app.js"]);
    assert.deepEqual(report.paths.untracked, ["scratch.txt"]);
    assert.deepEqual(report.paths.all, [stagedDoc, "scratch.txt", "src/app.js"]);
    assert.ok(report.layers.product.includes("src/app.js"));
    assert.ok(report.layers.docs.includes(stagedDoc));
    assert.ok(report.layers.workflow.includes(stagedDoc));
    assert.ok(report.layers.other.includes("scratch.txt"));
    assert.equal(report.resolved.baseSha, baseSha);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test(".agents script providers stay classified as workflow and provider changes", () => {
  const providerPath = ".agents/scripts/context/providers/openviking.mjs";
  const layers = classifyChangedPaths([providerPath]);
  assert.deepEqual(layers.providers, [providerPath]);
  assert.deepEqual(layers.workflow, [providerPath]);
});

test("change scope refuses to guess a base", async () => {
  const { root } = await fixture();
  try {
    assert.throws(
      () => collectChangeScope({ root }),
      /missing required --base <ref>/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
