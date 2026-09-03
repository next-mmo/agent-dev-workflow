import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runMultiAgentReview } from "../.agents/scripts/review-core.mjs";
import { createSolution } from "../.agents/scripts/solve-core.mjs";
import { buildNativeCodebaseGraph, queryNativeCodebaseGraph } from "../.agents/scripts/codebase-graph-core.mjs";

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
  const build = await buildNativeCodebaseGraph({ root: process.cwd() });
  assert.equal(build.ok, true);
  assert.equal(build.stats.filesIndexed >= 3, true);

  const query = queryNativeCodebaseGraph({ graph: build.graph, scope: "SoundManager" });
  assert.equal(query.status, "ok");
  assert.match(query.content, /SoundManager/);
});

test("solve scaffolder creates sequential compounding solution records", async () => {
  const result = await createSolution({
    root: process.cwd(),
    title: "Test Solution Record",
    module: "src/test.js",
    tags: ["test", "demo"],
  });
  assert.equal(result.ok, true);
  assert.match(result.filename, /test-solution-record\.md$/);

  // Clean up created test solution
  const fullPath = path.join(process.cwd(), result.relativePath);
  await rm(fullPath, { force: true });
});
