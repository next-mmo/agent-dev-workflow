import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initializeProject } from "../packages/agent-workflow-scrum/src/init.mjs";

const startMarker = "<!-- agent-workflow-scrum:start -->";
const endMarker = "<!-- agent-workflow-scrum:end -->";

function occurrences(value, needle) {
  return value.split(needle).length - 1;
}

test("re-init refreshes only the managed AGENTS handoff and keeps user rules", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-init-refresh-"));
  try {
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "brownfield-app",
      private: true,
      scripts: { test: "node --test", build: "node -e \"\"" },
    }, null, 2));
    await writeFile(path.join(root, "package-lock.json"), "{}\n");
    await writeFile(path.join(root, "AGENTS.md"), `# Team Rules

- Keep this project-owned rule before the managed block.

${startMarker}
## Agent Workflow Scrum
- Old managed guidance that should be upgraded.
${endMarker}

- Keep this project-owned rule after the managed block.
`);
    execFileSync("git", ["init", "-q"], { cwd: root });

    const first = await initializeProject(["--root", root, "--mode", "vibe"], root);
    assert.ok(first.updated.includes("AGENTS.md"));

    const refreshed = await readFile(path.join(root, "AGENTS.md"), "utf8");
    assert.match(refreshed, /Keep this project-owned rule before/);
    assert.match(refreshed, /Keep this project-owned rule after/);
    assert.doesNotMatch(refreshed, /Old managed guidance/);
    assert.match(refreshed, /`vibe` keeps task\/PRD synchronization optional for routine product changes/);
    assert.equal(occurrences(refreshed, startMarker), 1);
    assert.equal(occurrences(refreshed, endMarker), 1);

    const second = await initializeProject(["--root", root, "--mode", "vibe"], root);
    assert.deepEqual(second.updated, []);
    assert.ok(second.preserved.includes("AGENTS.md"));
    assert.equal(await readFile(path.join(root, "AGENTS.md"), "utf8"), refreshed);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("re-init rejects corrupt or duplicated managed AGENTS markers", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-init-corrupt-"));
  try {
    await writeFile(path.join(root, "package.json"), "{\"name\":\"corrupt-app\",\"private\":true}\n");
    await writeFile(path.join(root, "AGENTS.md"), `# Team Rules\n\n${startMarker}\nmissing end marker\n`);
    execFileSync("git", ["init", "-q"], { cwd: root });

    await assert.rejects(
      initializeProject(["--root", root, "--mode", "vibe"], root),
      /managed markers are incomplete or out of order/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
