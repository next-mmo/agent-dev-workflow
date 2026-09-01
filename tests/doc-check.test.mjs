import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const docCheck = path.join(repositoryRoot, "scripts/doc-check.mjs");
const docsRoot = ".agents/docs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-doc-check-"));
  await mkdir(path.join(root, docsRoot), { recursive: true });
  await writeFile(path.join(root, "AGENTS.md"), "# Agents\nRead [guide](.agents/docs/guide.md).\n", "utf8");
  await writeFile(path.join(root, docsRoot, "guide.md"), "# Guide\nUseful current-state guidance.\n", "utf8");
  await writeFile(path.join(root, docsRoot, "doc-budgets.json"), JSON.stringify({
    "AGENTS.md": 100,
    [`${docsRoot}/guide.md`]: 100,
  }, null, 2), "utf8");
  return root;
}

test("documentation checker accepts bounded .agents docs and valid relative links", async () => {
  const root = await fixture();
  try {
    const output = execFileSync(process.execPath, [docCheck, "--root", root, "--json"], { encoding: "utf8" });
    const result = JSON.parse(output);
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("documentation checker rejects budget overflow and broken links under .agents docs", async () => {
  const root = await fixture();
  try {
    await writeFile(path.join(root, "AGENTS.md"), `# Agents\n${"x".repeat(500)}\n[missing](.agents/docs/missing.md)\n`, "utf8");
    const result = spawnSync(process.execPath, [docCheck, "--root", root, "--json"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.errors.some((error) => error.includes("exceeds documentation budget")));
    assert.ok(parsed.errors.some((error) => error.includes("broken relative link")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
