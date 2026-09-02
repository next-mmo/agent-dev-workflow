import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), "utf8");
}

test("setup modes separate the required baseline from full local setup", async () => {
  const [skill, commands, development, readme] = await Promise.all([
    read(".agents/skills/agent-workflow-scrum/SKILL.md"),
    read(".agents/skills/agent-workflow-scrum/references/commands.md"),
    read(".agents/docs/development.md"),
    read("README.md"),
  ]);

  assert.match(skill, /`\/kb:setup`/);
  assert.match(skill, /`\/kb:full-setup`/);
  assert.match(commands, /`\/kb:setup`.*npm\/Git.*npm ci.*optional adapters\/providers/s);
  assert.match(commands, /`\/kb:full-setup`.*repository-local adapters.*skill\.sh init all.*external providers opt-in/s);
  for (const required of ["npm ci", "npm test", "npm run build", "npm run workflow:check", "npm run docs:check", "skill.sh check"]) {
    assert.match(development, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(development, /`\/kb:setup`/);
  assert.match(development, /`\/kb:full-setup`/);
  assert.match(development, /skill\.sh init all/);
  assert.match(development, /skill\.sh check all/);
  assert.match(development, /external Graphify\/OpenViking providers/);
  assert.match(readme, /`\/kb:full-setup`/);
  assert.match(readme, /`\/kb:setup`/);
});
