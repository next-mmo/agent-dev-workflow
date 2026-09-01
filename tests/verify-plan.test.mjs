import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildVerificationPlan } from "../scripts/verify-plan.mjs";

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-verify-plan-"));
  await mkdir(path.join(root, "scripts"), { recursive: true });
  await writeFile(path.join(root, "package.json"), JSON.stringify({
    type: "module",
    scripts: {
      test: "node --test",
      build: "echo build",
      "workflow:check": "node scripts/check.mjs",
      "docs:check": "node scripts/doc-check.mjs",
    },
  }, null, 2), "utf8");
  await writeFile(path.join(root, "scripts/skill.sh"), "#!/bin/sh\nexit 0\n", "utf8");
  await writeFile(path.join(root, "README.md"), "# Fixture\n", "utf8");
  git(root, "init", "-q");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test");
  git(root, "add", ".");
  git(root, "commit", "-qm", "base");
  const baseSha = git(root, "rev-parse", "HEAD");
  git(root, "switch", "-qc", "feature");
  return { root, baseSha };
}

test("product changes select tests and build without inventing unrelated checks", async () => {
  const { root, baseSha } = await fixture();
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/app.js"), "export const value = 1;\n", "utf8");
    git(root, "add", ".");
    git(root, "commit", "-qm", "product");

    const plan = await buildVerificationPlan({ root, base: baseSha });
    const commands = plan.checks.map((item) => item.command);
    assert.ok(commands.includes("npm test"));
    assert.ok(commands.includes("npm run build"));
    assert.ok(!commands.includes("scripts/skill.sh check"));
    assert.ok(!commands.includes("npm run docs:check"));
    assert.ok(plan.layers.product.includes("src/app.js"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("skill changes select workflow, docs, and adapter checks but skip product build", async () => {
  const { root, baseSha } = await fixture();
  try {
    await mkdir(path.join(root, ".agents/skills/example"), { recursive: true });
    await writeFile(path.join(root, ".agents/skills/example/SKILL.md"), "# Skill\n", "utf8");
    git(root, "add", ".");
    git(root, "commit", "-qm", "skill");

    const plan = await buildVerificationPlan({ root, base: baseSha });
    const commands = plan.checks.map((item) => item.command);
    assert.ok(commands.includes("npm run workflow:check -- --strict-budget"));
    assert.ok(commands.includes("npm run docs:check"));
    assert.ok(commands.includes("scripts/skill.sh check"));
    assert.ok(!commands.includes("npm run build"));
    assert.ok(plan.layers.workflow.includes(".agents/skills/example/SKILL.md"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
