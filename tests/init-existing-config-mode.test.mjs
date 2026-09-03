import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initializeProject } from "../packages/agent-workflow-scrum/src/init.mjs";

test("explicit re-init mode updates only mode in an existing consumer config", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-init-mode-"));
  try {
    await mkdir(path.join(root, ".agents"), { recursive: true });
    await writeFile(path.join(root, "package.json"), "{\"name\":\"existing-app\",\"private\":true}\n");
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    const original = {
      schemaVersion: 1,
      mode: "standard",
      packageManager: "pnpm",
      paths: {
        product: ["services/api/**"],
        tests: ["qa/**"],
        docs: ["README.md"],
        workflow: ["AGENTS.md", ".agents/**"],
        ci: [".github/**"],
        build: ["package.json"],
      },
      checks: {
        test: "pnpm custom:test",
        build: "pnpm custom:build",
        workflow: "pnpm exec agent-workflow check",
        docs: "pnpm exec agent-workflow docs",
        skills: null,
      },
      contextBudgets: { "AGENTS.md": 700, "CONTEXT.md": 1100 },
      consumerOwnedFlag: "keep-me",
    };
    await writeFile(path.join(root, ".agents/config.json"), `${JSON.stringify(original, null, 2)}\n`);
    execFileSync("git", ["init", "-q"], { cwd: root });

    const result = await initializeProject(["--root", root, "--mode", "vibe"], root);
    assert.equal(result.mode, "vibe");
    assert.equal(result.packageManager, "pnpm");
    assert.ok(result.updated.includes(".agents/config.json"));

    const updated = JSON.parse(await readFile(path.join(root, ".agents/config.json"), "utf8"));
    assert.equal(updated.mode, "vibe");
    assert.equal(updated.packageManager, "pnpm");
    assert.deepEqual(updated.paths, original.paths);
    assert.deepEqual(updated.checks, original.checks);
    assert.deepEqual(updated.contextBudgets, original.contextBudgets);
    assert.equal(updated.consumerOwnedFlag, "keep-me");

    const second = await initializeProject(["--root", root], root);
    assert.equal(second.mode, "vibe", "re-init without --mode should report the preserved configured mode");
    assert.ok(second.preserved.includes(".agents/config.json"));
    assert.deepEqual(JSON.parse(await readFile(path.join(root, ".agents/config.json"), "utf8")), updated);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
