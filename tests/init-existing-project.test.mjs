import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initializeProject } from "../packages/agent-workflow-scrum/src/init.mjs";

const startMarker = "<!-- agent-workflow-scrum:start -->";

function occurrences(value, needle) {
  return value.split(needle).length - 1;
}

test("init safely adopts an existing npm project without requiring --existing", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-init-existing-"));
  try {
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "existing-nest-app",
      private: true,
      scripts: {
        build: "nest build",
        test: "jest",
      },
    }, null, 2));
    await writeFile(path.join(root, "package-lock.json"), "{}\n");
    await writeFile(path.join(root, "AGENTS.md"), "# Team Rules\n\n- Keep our existing instruction.\n");
    execFileSync("git", ["init", "-q"], { cwd: root });

    const first = await initializeProject(["--root", root, "--mode", "vibe"], root);
    assert.equal(first.existingProject, true);
    assert.equal(first.packageManager, "npm");
    assert.equal(first.mode, "vibe");
    assert.deepEqual(first.updated, ["AGENTS.md"]);
    assert.ok(first.created.includes(".agents/config.json"));

    const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
    assert.match(agents, /Keep our existing instruction/);
    assert.match(agents, /Agent Workflow Scrum/);
    assert.equal(occurrences(agents, startMarker), 1, "managed handoff should be appended once");

    const config = JSON.parse(await readFile(path.join(root, ".agents/config.json"), "utf8"));
    assert.equal(config.mode, "vibe");
    assert.equal(config.packageManager, "npm");
    assert.equal(config.checks.test, "npm test");
    assert.equal(config.checks.build, "npm run build");

    const second = await initializeProject(["--root", root, "--mode", "vibe"], root);
    assert.deepEqual(second.updated, []);
    assert.ok(second.preserved.includes("AGENTS.md"));
    const agentsAgain = await readFile(path.join(root, "AGENTS.md"), "utf8");
    assert.equal(occurrences(agentsAgain, startMarker), 1, "re-running init must be idempotent");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
