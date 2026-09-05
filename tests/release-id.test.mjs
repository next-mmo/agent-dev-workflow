import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceScript = path.join(repositoryRoot, "scripts/bump-release-id.sh");

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function git(root, args) {
  const result = run("git", ["-C", root, ...args], root);
  assert.equal(result.status, 0, `${args.join(" ")} failed: ${result.stderr}`);
  return String(result.stdout || "").trim();
}

test("release ID bump defaults to HEAD and synchronizes tracked and untracked references", async (t) => {
  const bashProbe = run("bash", ["--version"], repositoryRoot);
  if (bashProbe.status !== 0) {
    t.skip("Bash is unavailable; release script is tested in supported Bash environments");
    return;
  }

  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-release-id-"));
  const oldId = "a".repeat(40);
  try {
    await mkdir(path.join(root, "scripts"), { recursive: true });
    await cp(sourceScript, path.join(root, "scripts/bump-release-id.sh"));
    await writeFile(path.join(root, "package.json"), `{"dependency":"github:next-mmo/agent-dev-workflow#${oldId}"}\n`);
    await writeFile(path.join(root, "package-lock.json"), `{"resolved":"git+ssh://git@github.com/next-mmo/agent-dev-workflow.git#${oldId}"}\n`);
    await writeFile(path.join(root, "README.md"), `The current reviewed commit is \`${oldId}\`.\n`);
    await writeFile(path.join(root, "notes.md"), `Untracked pin: github:next-mmo/agent-dev-workflow#${oldId}\n`);

    git(root, ["init"]);
    git(root, ["config", "user.email", "fixture@example.test"]);
    git(root, ["config", "user.name", "Fixture"]);
    git(root, ["add", "package.json", "package-lock.json", "README.md", "scripts/bump-release-id.sh"]);
    git(root, ["commit", "-m", "release fixture"]);
    const expectedId = git(root, ["rev-parse", "HEAD"]);

    const update = run("bash", ["scripts/bump-release-id.sh"], root);
    assert.equal(update.status, 0, update.stderr);
    assert.match(update.stdout, new RegExp(`release ID synchronized to ${expectedId}`));
    for (const file of ["package.json", "package-lock.json", "README.md", "notes.md"]) {
      const content = await readFile(path.join(root, file), "utf8");
      assert.equal(content.includes(oldId), false, file);
      assert.equal(content.includes(expectedId), true, file);
    }

    const check = run("bash", ["scripts/bump-release-id.sh", "--check"], root);
    assert.equal(check.status, 0, check.stderr);

    await writeFile(path.join(root, "notes.md"), `Untracked pin: github:next-mmo/agent-dev-workflow#${oldId}\n`);
    const mismatch = run("bash", ["scripts/bump-release-id.sh", "--check"], root);
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stderr, /not synchronized/);

    const invalid = run("bash", ["scripts/bump-release-id.sh", "not-a-sha"], root);
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /full 40-character lowercase commit SHA/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
