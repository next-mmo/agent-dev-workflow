import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");

test("workflow report links Markdown paths to in-page previews", async () => {
  execFileSync(process.execPath, [".agents/scripts/report.mjs"], { cwd: repositoryRoot, stdio: "pipe" });

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
