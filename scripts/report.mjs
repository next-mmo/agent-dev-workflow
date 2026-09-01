import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const reportDirectory = path.join(repositoryRoot, "report");

const sourceDefinitions = [
  ["Repository instructions", "AGENTS.md"],
  ["Shared context", "CONTEXT.md"],
  ["Workflow guide", "docs/agent-workflow.md"],
  ["PRD index", "docs/prd/0000-prd-index.md"],
  ["Task board guide", "docs/tasks/README.md"],
  ["Canonical workflow skill", ".agents/skills/agent-workflow-scrum/SKILL.md"],
];

function normalizePath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function displayPath(absolutePath) {
  return normalizePath(path.relative(repositoryRoot, absolutePath));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripMarkdown(value) {
  return String(value ?? "")
    .replaceAll("**", "")
    .replaceAll("`", "")
    .trim();
}

function readGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

async function readText(relativePath) {
  try {
    return await readFile(path.join(repositoryRoot, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function markdownFiles(directory) {
  try {
    const entries = await readdir(path.join(repositoryRoot, directory), {
      withFileTypes: true,
    });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => normalizePath(path.join(directory, entry.name)))
      .sort();
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function firstHeading(markdown, fallback) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback;
}

function taskStatus(markdown, lifecycle) {
  const status = markdown.match(/^>\s+\*\*Status:\*\*\s*(.+)$/im)?.[1];
  return stripMarkdown(status || lifecycle);
}

function taskId(filePath) {
  return filePath.match(/(?:todo|wip|blocked|done)-(\d{4}-\d{4})-/)?.[1] || "unknown";
}

async function loadTasks() {
  const activePaths = (await markdownFiles("docs/tasks")).filter((filePath) =>
    /\/(?:todo|wip|blocked)-[^/]+\.md$/.test(`/${filePath}`),
  );
  const completedPaths = (await markdownFiles("docs/tasks/done")).filter((filePath) =>
    /\/done-[^/]+\.md$/.test(`/${filePath}`),
  );

  async function loadTask(filePath, lifecycle) {
    const markdown = await readText(filePath);
    const fallback = path.basename(filePath, ".md");
    return {
      id: taskId(filePath),
      title: markdown ? firstHeading(markdown, fallback) : fallback,
      status: markdown ? taskStatus(markdown, lifecycle) : lifecycle,
      path: filePath,
    };
  }

  const [active, completed] = await Promise.all([
    Promise.all(activePaths.map((filePath) => loadTask(filePath, "active"))),
    Promise.all(completedPaths.map((filePath) => loadTask(filePath, "done"))),
  ]);

  return { active, completed };
}

function parsePrdIndex(markdown, prdPaths) {
  if (!markdown) {
    return [];
  }

  const rows = markdown
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\*\*\d{4}\*\*/.test(line))
    .map((line) => line.split("|").slice(1, -1).map(stripMarkdown));

  return rows.map(([id, title, status, summary]) => {
    const normalizedId = id || "—";
    const matchingPath = prdPaths.find((filePath) =>
      path.basename(filePath).startsWith(`${normalizedId}-`),
    );
    return {
      id: normalizedId,
      title: title || "Untitled PRD",
      status: status || "unknown",
      summary: summary || "No summary provided.",
      path: matchingPath || "docs/prd/0000-prd-index.md",
    };
  });
}

function gitSnapshot() {
  const status = readGit(["status", "--short", "--branch"]);
  const statusLines = status ? status.split(/\r?\n/).filter(Boolean) : [];
  const changes = statusLines.filter((line) => !line.startsWith("##"));

  return {
    branch: readGit(["branch", "--show-current"]) || "detached or unavailable",
    commit: readGit(["rev-parse", "--short", "HEAD"]) || "unavailable",
    lastCommit: readGit(["log", "-1", "--format=%s"]) || "unavailable",
    status,
    clean: changes.length === 0 && Boolean(status),
    changeCount: changes.length,
  };
}

function statusClass(value) {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("done") || normalized.includes("clean")) {
    return "status-good";
  }
  if (normalized.includes("blocked") || normalized.includes("unavailable")) {
    return "status-risk";
  }
  if (normalized.includes("wip") || normalized.includes("active")) {
    return "status-active";
  }
  return "status-neutral";
}

function localSourceLink(relativePath) {
  return `../${normalizePath(relativePath)}`;
}

function renderTaskRows(tasks) {
  if (tasks.length === 0) {
    return '<tr><td colspan="4" class="empty">No tasks in this lifecycle column.</td></tr>';
  }

  return tasks
    .map(
      (task) => `
        <tr>
          <td>${escapeHtml(task.id)}</td>
          <td><a href="${escapeHtml(localSourceLink(task.path))}">${escapeHtml(task.title)}</a></td>
          <td><span class="badge ${statusClass(task.status)}">${escapeHtml(task.status)}</span></td>
          <td><code>${escapeHtml(task.path)}</code></td>
        </tr>`,
    )
    .join("");
}

function renderPrdRows(prds) {
  if (prds.length === 0) {
    return '<tr><td colspan="4" class="empty">No PRDs are indexed.</td></tr>';
  }

  return prds
    .map(
      (prd) => `
        <tr>
          <td>${escapeHtml(prd.id)}</td>
          <td><a href="${escapeHtml(localSourceLink(prd.path))}">${escapeHtml(prd.title)}</a></td>
          <td><span class="badge ${statusClass(prd.status)}">${escapeHtml(prd.status)}</span></td>
          <td>${escapeHtml(prd.summary)}</td>
        </tr>`,
    )
    .join("");
}

function renderSourceRows(sources) {
  return sources
    .map(
      (source) => `
        <li>
          <span class="badge ${source.exists ? "status-good" : "status-risk"}">${source.exists ? "available" : "missing"}</span>
          <a href="${escapeHtml(localSourceLink(source.path))}">${escapeHtml(source.label)}</a>
          <code>${escapeHtml(source.path)}</code>
        </li>`,
    )
    .join("");
}

function renderHtml(report) {
  const generatedDate = new Date(report.generatedAt).toLocaleString();
  const gitStatus = report.git.clean ? "clean" : `${report.git.changeCount} change(s)`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Agent Workflow Scrum Report</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f5f7fb;
        color: #172033;
      }
      body { margin: 0; }
      main { max-width: 1180px; margin: 0 auto; padding: 2rem 1rem 4rem; }
      header { margin-bottom: 1.5rem; }
      h1, h2 { line-height: 1.2; }
      h1 { margin-bottom: .5rem; }
      h2 { margin-top: 2rem; }
      p { line-height: 1.55; }
      .muted { color: #5d687c; }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .8rem; }
      .card, section { background: #fff; border: 1px solid #dce2ee; border-radius: 14px; box-shadow: 0 4px 16px rgb(28 43 76 / 7%); }
      .card { padding: 1rem; }
      .card strong { display: block; font-size: 1.4rem; margin-top: .35rem; }
      section { padding: 1rem; overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; min-width: 640px; }
      th, td { border-bottom: 1px solid #e7ebf3; text-align: left; padding: .7rem .5rem; vertical-align: top; }
      th { color: #4a5870; font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; }
      tr:last-child td { border-bottom: 0; }
      a { color: #2457c5; }
      code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .82rem; overflow-wrap: anywhere; }
      .badge { border-radius: 999px; display: inline-block; font-size: .75rem; font-weight: 700; padding: .22rem .55rem; white-space: nowrap; }
      .status-good { background: #d9f6e5; color: #12643c; }
      .status-active { background: #fff0c2; color: #765500; }
      .status-risk { background: #ffe0e0; color: #8b1e1e; }
      .status-neutral { background: #e8edf6; color: #46546b; }
      .empty { color: #69758a; font-style: italic; }
      ul.sources { list-style: none; margin: 0; padding: 0; display: grid; gap: .65rem; }
      ul.sources li { align-items: center; display: flex; flex-wrap: wrap; gap: .55rem; }
      pre { background: #172033; border-radius: 10px; color: #edf2ff; overflow-x: auto; padding: 1rem; white-space: pre-wrap; }
      footer { color: #5d687c; font-size: .9rem; margin-top: 2rem; }
      @media (prefers-color-scheme: dark) {
        :root { background: #111827; color: #e8edf6; }
        .muted, footer { color: #a7b2c6; }
        .card, section { background: #1a2435; border-color: #334158; box-shadow: none; }
        th, td { border-color: #334158; }
        th { color: #b5c0d3; }
        a { color: #8fb3ff; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="muted">Generated ${escapeHtml(generatedDate)}</p>
        <h1>Agent Workflow Scrum Report</h1>
        <p class="muted">A local snapshot of the repository's Git state, PRDs, tasks, and shared workflow sources.</p>
      </header>

      <div class="cards" aria-label="Repository summary">
        <div class="card"><span class="muted">Branch</span><strong>${escapeHtml(report.git.branch)}</strong></div>
        <div class="card"><span class="muted">Commit</span><strong><code>${escapeHtml(report.git.commit)}</code></strong></div>
        <div class="card"><span class="muted">Working tree</span><strong><span class="badge ${statusClass(gitStatus)}">${escapeHtml(gitStatus)}</span></strong></div>
        <div class="card"><span class="muted">Active tasks</span><strong>${report.summary.activeTasks}</strong></div>
        <div class="card"><span class="muted">Completed tasks</span><strong>${report.summary.completedTasks}</strong></div>
        <div class="card"><span class="muted">Indexed PRDs</span><strong>${report.summary.prds}</strong></div>
      </div>

      <h2>Repository signal</h2>
      <section>
        <p><strong>Last commit:</strong> ${escapeHtml(report.git.lastCommit)}</p>
        <p><strong>Git status:</strong></p>
        <pre>${escapeHtml(report.git.status || "Git status unavailable")}</pre>
      </section>

      <h2>Active tasks</h2>
      <section>
        <table>
          <thead><tr><th>ID</th><th>Task</th><th>Status</th><th>Source</th></tr></thead>
          <tbody>${renderTaskRows(report.tasks.active)}</tbody>
        </table>
      </section>

      <h2>Completed tasks</h2>
      <section>
        <table>
          <thead><tr><th>ID</th><th>Task</th><th>Status</th><th>Source</th></tr></thead>
          <tbody>${renderTaskRows(report.tasks.completed)}</tbody>
        </table>
      </section>

      <h2>PRD index</h2>
      <section>
        <table>
          <thead><tr><th>PRD</th><th>Title</th><th>Status</th><th>Summary</th></tr></thead>
          <tbody>${renderPrdRows(report.prds)}</tbody>
        </table>
      </section>

      <h2>Shared workflow sources</h2>
      <section>
        <ul class="sources">${renderSourceRows(report.sources)}</ul>
      </section>

      <footer>
        This report is generated locally by <code>scripts/report.mjs</code>.
        The report output is ignored by Git; canonical requirements, tasks, PRDs,
        and evidence remain in the tracked source documents.
      </footer>
    </main>
  </body>
</html>
`;
}

async function main() {
  const [prdIndex, prdPaths, tasks] = await Promise.all([
    readText("docs/prd/0000-prd-index.md"),
    markdownFiles("docs/prd"),
    loadTasks(),
  ]);

  const sources = await Promise.all(
    sourceDefinitions.map(async ([label, relativePath]) => ({
      label,
      path: relativePath,
      exists: (await readText(relativePath)) !== null,
    })),
  );

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repository: path.basename(repositoryRoot),
    git: gitSnapshot(),
    summary: {
      activeTasks: tasks.active.length,
      completedTasks: tasks.completed.length,
      prds: parsePrdIndex(prdIndex, prdPaths).length,
    },
    tasks,
    prds: parsePrdIndex(prdIndex, prdPaths),
    sources,
  };

  await mkdir(reportDirectory, { recursive: true });
  const htmlPath = path.join(reportDirectory, "index.html");
  const jsonPath = path.join(reportDirectory, "report.json");
  await Promise.all([
    writeFile(htmlPath, renderHtml(report), "utf8"),
    writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  ]);

  console.log(`Generated Agent Workflow Scrum report for ${report.repository}`);
  console.log(`- HTML: ${displayPath(htmlPath)}`);
  console.log(`- JSON: ${displayPath(jsonPath)}`);
  console.log(`- Active tasks: ${report.summary.activeTasks}`);
  console.log(`- Completed tasks: ${report.summary.completedTasks}`);
  console.log(`- Indexed PRDs: ${report.summary.prds}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
