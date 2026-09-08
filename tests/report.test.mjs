import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");

test("workflow report links Markdown paths to in-page previews", async () => {
  execFileSync(process.execPath, ["packages/agent-workflow-scrum/bin/agent-workflow.mjs", "report"], { cwd: repositoryRoot, stdio: "pipe" });

  const report = JSON.parse(await readFile(path.join(repositoryRoot, "report/report.json"), "utf8"));
  const html = await readFile(path.join(repositoryRoot, "report/index.html"), "utf8");
  const taskPath = ".agents/docs/tasks/done/done-0001-0001-counter-state-and-ui.md";
  const taskId = "agents-docs-tasks-done-done-0001-0001-counter-state-and-ui";

  assert.ok(report.documents.some((document) => document.path === taskPath));
  assert.match(
    html,
    new RegExp(`<td><a href="#doc-${taskId}"><code>${taskPath.replaceAll(".", "\\.")}</code></a></td>`),
  );
  assert.match(html, new RegExp(`<section id="doc-${taskId}" class="doc-view" hidden>`));
  assert.match(html, /<article><h1>Task 0001: Implement Counter State/);

  const targets = new Set([...html.matchAll(/id="(doc-[^"]+)"/g)].map((match) => match[1]));
  const internalLinks = [...html.matchAll(/href="#(doc-[^"]+)"/g)].map((match) => match[1]);
  assert.ok(internalLinks.length > 0);
  assert.ok(internalLinks.every((target) => targets.has(target)));
  assert.doesNotMatch(html, /href="\.\.?\/[^"#]+\.md(?:#[^"]*)?"/);
});

test("consumer report preserves PRD identities and separates backlog, active, done, and archived tasks", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "workflow-report-consumer-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  async function fixture(file, content) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
  await fixture(".agents/docs/prd/0000-prd-index.md", `# Index
| PRD | Title | Status | Summary |
| :--- | :--- | :--- | :--- |
| [PRD-0001](0001-first.md) | First | draft | Linked ID |
| **0002** | Second | **in-progress** | Bold ID |
| 0003 | Third | draft | Plain ID |
| **[PRD-0004](0004-fourth.md)** | Fourth | draft | Bold link |
| arbitrary | Not a PRD | unknown | Ignore non-PRD rows |
`);
  for (const name of ["0001-first", "0002-second", "0003-third", "0004-fourth"]) {
    await fixture(`.agents/docs/prd/${name}.md`, `# ${name}\n`);
  }
  const records = [
    ["todo-0001-0001-deferred.md", "todo", "Backlog"],
    ["wip-0002-0002-current.md", "wip", "Active tasks"],
    ["blocked-0003-0003-wait.md", "blocked", "Active tasks"],
    ["done/done-0004-0004-finished.md", "done", "Completed tasks"],
    ["archived/2025/done-0005-0001-history.md", "done", "Archived tasks"],
  ];
  for (const [file, status] of records) {
    const header = status === "blocked" ? `> **Status:** ${status}` : `> Status: ${status}`;
    await fixture(`.agents/docs/tasks/${file}`, `# ${file}\n${header}\n`);
  }
  await fixture(".agents/docs/tasks/todo-0006-0001-no-header.md", "# Filename fallback\n");
  await fixture(".agents/docs/proposals/0001-current.md", "# Canonical proposal\n");
  await fixture(".agents/docs/suggestions/0002-legacy.md", "# Legacy proposal\n");
  execFileSync(process.execPath, [path.join(repositoryRoot, "packages/agent-workflow-scrum/bin/agent-workflow.mjs"), "report", "--root", root], { stdio: "pipe" });
  const result = JSON.parse(await readFile(path.join(root, "report/report.json"), "utf8"));
  const html = await readFile(path.join(root, "report/index.html"), "utf8");
  assert.equal(result.schemaVersion, 3);
  assert.deepEqual(result.prds.map((prd) => prd.id), ["0001", "0002", "0003", "0004"]);
  assert.equal(result.prds[1].status, "in-progress");
  assert.equal(result.prds[0].path, ".agents/docs/prd/0001-first.md");
  assert.equal(result.summary.activeTasks, 2);
  assert.equal(result.summary.backlogTasks, 2);
  assert.equal(result.summary.completedTasks, 1);
  assert.equal(result.summary.archivedTasks, 1);
  assert.deepEqual(result.tasks.active.map((task) => task.status).sort(), ["blocked", "wip"]);
  assert.ok(result.tasks.backlog.every((task) => task.status === "todo"));
  assert.equal(result.tasks.archived[0].lifecycle, "archived");
  for (const [file, , group] of records) {
    assert.ok(result.documents.some((doc) => doc.path === `.agents/docs/tasks/${file}` && doc.group === group));
  }
  for (const file of ["proposals/0001-current.md", "suggestions/0002-legacy.md"]) {
    assert.ok(result.documents.some((doc) => doc.path === `.agents/docs/${file}` && doc.group === "Proposals"));
  }
  assert.match(html, /<h2>Backlog<\/h2>/);
  assert.match(html, /<h2>Archived tasks<\/h2>/);
  const targets = new Set([...html.matchAll(/id="(doc-[^"]+)"/g)].map((match) => match[1]));
  assert.ok([...html.matchAll(/href="#(doc-[^"]+)"/g)].every((match) => targets.has(match[1])));
});
