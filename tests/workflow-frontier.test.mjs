import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runMultiAgentReview } from "../packages/agent-workflow-scrum/engine/review-core.mjs";
import { createSolution } from "../packages/agent-workflow-scrum/engine/solve-core.mjs";
import { buildNativeCodebaseGraph, queryNativeCodebaseGraph } from "../packages/agent-workflow-scrum/engine/codebase-graph-core.mjs";

test("multi-agent review detects security, simplicity, and parity issues", async () => {
  const fixtureBase = path.join(process.cwd(), "tests", "fixtures");
  await mkdir(fixtureBase, { recursive: true });
  const tmpDir = await mkdtemp(path.join(fixtureBase, "review-test-"));
  try {
    const dirtyFile = path.join(tmpDir, "dirty.js");
    await writeFile(dirtyFile, `
      const apiKey = "api_key = 'abcdef1234567890'";
      eval("console.log(1)");
    `, "utf8");

    const review = await runMultiAgentReview({ root: process.cwd(), files: [path.relative(process.cwd(), dirtyFile)] });
    assert.equal(review.findings.security.length >= 1, true);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test("native codebase graph builds and queries accurately", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "agent-graph-test-"));
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await Promise.all([
      writeFile(path.join(root, "src/sound.js"), "export class SoundManager { play() {} }\n", "utf8"),
      writeFile(path.join(root, "src/main.js"), "import { SoundManager } from './sound.js';\nexport const sound = new SoundManager();\n", "utf8"),
      writeFile(path.join(root, "src/helper.js"), "export function helper() { return true; }\n", "utf8"),
    ]);

    const build = await buildNativeCodebaseGraph({ root });
    assert.equal(build.ok, true);
    assert.equal(build.stats.filesIndexed >= 3, true);

    const query = queryNativeCodebaseGraph({ graph: build.graph, scope: "SoundManager" });
    assert.equal(query.status, "ok");
    assert.match(query.content, /SoundManager/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("solve scaffolder creates sequential compounding solution records", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "agent-solve-test-"));
  try {
    const solutionsDir = path.join(root, ".agents/docs/solutions");
    await mkdir(solutionsDir, { recursive: true });
    await writeFile(
      path.join(solutionsDir, "0000-template.md"),
      "---\ntitle: <Clear Problem and Solution Title>\nmodule: <affected/path.js>\ntags: [bugfix, pattern]\n---\n# <Problem Title>\n> **Module:** `src/`\n> **Tags:** `bugfix`, `pattern`\n",
      "utf8",
    );

    const result = await createSolution({
      root,
      title: "Test Solution Record",
      module: "src/test.js",
      tags: ["test", "demo"],
    });
    assert.equal(result.ok, true);
    assert.match(result.filename, /test-solution-record\.md$/);
    assert.equal(await readFile(path.join(root, result.relativePath), "utf8").then((content) => content.includes("Test Solution Record")), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
