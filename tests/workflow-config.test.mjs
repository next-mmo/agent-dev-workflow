import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { collectChangeScope } from "../.agents/scripts/change-scope.mjs";
import { buildVerificationPlan } from "../.agents/scripts/verify-plan.mjs";
import { matchesPathGroup, normalizeWorkflowConfig } from "../.agents/scripts/workflow-config.mjs";

function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: "pipe" });
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-config-"));
  await mkdir(path.join(root, ".agents"), { recursive: true });
  await mkdir(path.join(root, "apps/client"), { recursive: true });
  const config = {
    schemaVersion: 1,
    packageManager: "pnpm",
    paths: {
      product: ["apps/**"],
      tests: ["checks/**"],
      docs: ["handbook/**"],
      workflow: ["AGENTS.md", "CONTEXT.md", ".agents/**"],
      ci: ["pipelines/**"],
      build: ["workspace.yaml"],
    },
    checks: {
      test: "pnpm test:unit",
      build: "pnpm build:desktop",
      workflow: "pnpm exec agent-workflow check",
      docs: "pnpm exec agent-workflow docs",
      skills: null,
    },
    contextBudgets: { "AGENTS.md": 800 },
  };
  await writeFile(path.join(root, ".agents/config.json"), `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(path.join(root, "apps/client/main.ts"), "export const ready = false;\n");
  git(root, ["init"]);
  git(root, ["config", "user.email", "fixture@example.test"]);
  git(root, ["config", "user.name", "Fixture"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "baseline"]);
  await writeFile(path.join(root, "apps/client/main.ts"), "export const ready = true;\n");
  return root;
}

test("workflow config validates package manager and matches configured paths", () => {
  const config = normalizeWorkflowConfig({ packageManager: "pnpm", paths: { product: ["apps/**"] } });
  assert.equal(matchesPathGroup("apps/desktop/src/main.ts", config, "product"), true);
  assert.equal(matchesPathGroup("src/main.ts", config, "product"), false);
  const testConfig = normalizeWorkflowConfig({ paths: { tests: ["**/*.test.*"] } });
  assert.equal(matchesPathGroup("root.test.mjs", testConfig, "tests"), true);
  assert.equal(matchesPathGroup("nested/root.test.mjs", testConfig, "tests"), true);
  assert.throws(() => normalizeWorkflowConfig({ packageManager: "invalid" }), /packageManager/);
  assert.throws(() => normalizeWorkflowConfig({ paths: { product: "apps" } }), /paths\.product/);
});

test("workflow config normalizes and validates ceremony modes", () => {
  const defaultConf = normalizeWorkflowConfig({});
  assert.equal(defaultConf.mode, "standard");
  for (const validMode of ["vibe", "standard", "strict", "guided"]) {
    assert.equal(normalizeWorkflowConfig({ mode: validMode }).mode, validMode);
  }
  assert.throws(() => normalizeWorkflowConfig({ mode: "cowboy" }), /mode must be one of/);
});

test("workflow config normalizes and validates archive settings with default 2 weeks", () => {
  const defaultConf = normalizeWorkflowConfig({});
  assert.deepEqual(defaultConf.archive, { autoArchiveDone: true, retentionDays: 14 });

  const customConf = normalizeWorkflowConfig({ archive: { autoArchiveDone: false, retentionDays: 30 } });
  assert.deepEqual(customConf.archive, { autoArchiveDone: false, retentionDays: 30 });

  const boolConf = normalizeWorkflowConfig({ archive: false });
  assert.equal(boolConf.archive.autoArchiveDone, false);

  assert.throws(() => normalizeWorkflowConfig({ archive: { retentionDays: -5 } }), /retentionDays/);
  assert.throws(() => normalizeWorkflowConfig({ archive: { retentionDays: "invalid" } }), /retentionDays/);
});

test("scope and verification use consumer path and command configuration", async () => {
  const root = await fixture();
  try {
    const scope = collectChangeScope({ root, base: "HEAD" });
    assert.deepEqual(scope.layers.product, ["apps/client/main.ts"]);
    const plan = await buildVerificationPlan({ root, base: "HEAD" });
    assert.ok(plan.checks.some((item) => item.command === "pnpm test:unit"));
    assert.ok(plan.checks.some((item) => item.command === "pnpm build:desktop"));
    assert.equal(plan.packageManager, "pnpm");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
