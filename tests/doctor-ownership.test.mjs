import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { diagnoseProject } from "../packages/agent-workflow-scrum/src/doctor.mjs";

test("doctor preserves local skill ownership while flagging workflow source paths", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "workflow-doctor-ownership-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of ["tutor", "agent-workflow-feedback"]) {
    await mkdir(path.join(root, ".agents/skills", name), { recursive: true });
    await writeFile(path.join(root, ".agents/skills", name, "SKILL.md"), `# ${name}\n`);
  }
  const local = await diagnoseProject([], root);
  assert.ok(local.warnings.every((warning) => !warning.includes(".agents/skills")));
  await mkdir(path.join(root, ".agents/skills/agent-workflow-scrum"));
  await writeFile(path.join(root, ".agents/skills/agent-workflow-scrum/SKILL.md"), "# Workflow\n");
  const mixed = await diagnoseProject([], root);
  assert.ok(mixed.warnings.some((warning) => warning.includes(".agents/skills/agent-workflow-scrum/SKILL.md")));
  assert.ok(mixed.warnings.every((warning) => !warning.includes(".agents/skills/tutor") && !warning.includes(".agents/skills/agent-workflow-feedback")));
});
