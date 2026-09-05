import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const cli = path.join(repositoryRoot, "packages/agent-workflow-scrum/bin/agent-workflow.mjs");

test("context retains an active task's linked PRD ahead of generic history and explains selection", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-context-priority-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, ".agents/docs/prd"), { recursive: true });
  await mkdir(path.join(root, ".agents/docs/tasks"), { recursive: true });
  await writeFile(path.join(root, "AGENTS.md"), "# Instructions\n", "utf8");
  await writeFile(path.join(root, "CONTEXT.md"), "# Context\n", "utf8");
  await writeFile(path.join(root, ".agents/docs/prd/0000-prd-index.md"), "# PRD Index\n", "utf8");
  await writeFile(path.join(root, ".agents/docs/prd/0005-todo-workspace.md"), "# Todo Workspace\nThe API persistence edit flow must retain task identity.\n", "utf8");
  await writeFile(path.join(root, ".agents/docs/prd/0004-workflow-distribution.md"), `# Workflow Distribution\n${"package release CI workflow ".repeat(80)}\n`, "utf8");
  await writeFile(path.join(root, ".agents/docs/tasks/wip-0031-0005-full-stack-developer-trial.md"), [
    "# Task 0031: Full-Stack Developer Trial",
    "> Status: wip",
    "> Related PRD: `.agents/docs/prd/0005-todo-workspace.md`",
    "",
    "Implement API persistence and task editing.",
  ].join("\n"), "utf8");

  const output = execFileSync(process.execPath, [cli, "context", "API persistence editing", "--provider", "local", "--json", "--root", root], { encoding: "utf8" });
  const result = JSON.parse(output);
  assert.deepEqual(result.linkedPaths, [".agents/docs/prd/0005-todo-workspace.md"]);
  assert.equal(result.selected[0].kind, "active-task");
  const linked = result.selected.find((item) => item.path.endsWith("0005-todo-workspace.md"));
  assert.equal(linked.reason, "linked-prd");
  assert.ok(linked.score > result.selected.find((item) => item.path.endsWith("0004-workflow-distribution.md")).score);
  assert.ok(result.estimatedTokens <= result.budgetTokens);
});
