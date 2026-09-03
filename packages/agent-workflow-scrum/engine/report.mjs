import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const options = { root: process.cwd(), output: "report" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--output") options.output = argv[++index] || "";
    else throw new Error(`unknown option: ${arg}`);
  }
  if (!options.output) throw new Error("--output requires a directory path");
  return options;
}

const options = parseArgs(process.argv.slice(2));
const repositoryRoot = options.root;
const reportDirectory = path.resolve(repositoryRoot, options.output);

const sourceDefinitions = [
  ["Repository instructions", "AGENTS.md"],
  ["Shared context", "CONTEXT.md"],
  ["Workflow documentation rules", ".agents/docs/AGENTS.md"],
  ["Workflow guide", ".agents/docs/agent-workflow.md"],
  ["Architecture guide", ".agents/docs/architecture.md"],
  ["Development guide", ".agents/docs/development.md"],
  ["Testing guide", ".agents/docs/testing.md"],
  ["Defensive patterns", ".agents/docs/defensive-patterns.md"],
  ["Model recommendations", ".agents/docs/model-recommend.md"],
  ["PRD index", ".agents/docs/prd/0000-prd-index.md"],
  ["Plans guide", ".agents/docs/plans/README.md"],
  ["Task board guide", ".agents/docs/tasks/README.md"],
  ["Solutions guide", ".agents/docs/solutions/README.md"],
  ["Proposals guide", ".agents/docs/proposals/README.md"],
  ["Canonical workflow skill", ".agents/skills/agent-workflow-scrum/SKILL.md"],
  ["Prose skill", ".agents/skills/agent-workflow-prose/SKILL.md"],
];

const projectDocDefinitions = [
  ["Project readme", "README.md"],
];

const navGroupOrder = [
  "Overview",
  "Workflow sources",
  "Project docs",
  "PRDs",
  "Active tasks",
  "Completed tasks",
  "Proposals",
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
  const match = filePath.match(
    /(?:todo|wip|blocked|done)-(\d{4}-\d{4})-|(?:docs\/prd\/)?(\d{4})-/,
  );
  return match?.[1] || match?.[2] || "unknown";
}

function slugForPath(relativePath) {
  return normalizePath(relativePath)
    .replace(/\.md$/i, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function stripLeadingSpaces(text, count) {
  let spaces = 0;
  while (spaces < text.length && text[spaces] === " " && spaces < count) {
    spaces += 1;
  }
  return text.slice(spaces);
}

function splitTableRow(row) {
  let value = row.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|")) value = value.slice(0, -1);
  return value.split("|").map((cell) => cell.trim());
}

function resolveDocLink(href, docBySlug, sourcePath) {
  if (/^(?:https?:|mailto:|tel:)/i.test(href) || href.startsWith("//")) return href;
  if (href.startsWith("#")) return `#doc-${slugForPath(sourcePath)}`;

  const [filePath] = href.split("#");
  const sourceDirectory = path.posix.dirname(normalizePath(sourcePath));
  const relativeTarget = normalizePath(path.posix.normalize(path.posix.join(sourceDirectory, filePath)));
  const candidates = [relativeTarget.replace(/^\.\//, "")];
  if (filePath.startsWith(".agents/") || filePath === "AGENTS.md" || filePath === "CONTEXT.md") {
    candidates.push(normalizePath(filePath).replace(/^\.\//, ""));
  }
  if (filePath.endsWith("/")) candidates.unshift(`${relativeTarget}/README.md`);

  for (const candidate of candidates) {
    if (!candidate.endsWith(".md")) continue;
    const slug = slugForPath(candidate);
    if (docBySlug && docBySlug[slug]) return `#doc-${slug}`;
  }

  return "#doc-dashboard";
}

function renderInline(text, docBySlug, sourcePath) {
  const code = [];
  const links = [];
  let output = escapeHtml(text);

  output = output.replace(/`([^`]+)`/g, (_match, content) => {
    const index = code.length;
    code.push(content);
    return `\u0000C${index}\u0000`;
  });

  output = output.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+[A-Za-z"']([^)"']*))?\)/g,
    (_match, label, href, title) => {
      const index = links.length;
      links.push({ label, href, title: title || "" });
      return `\u0000L${index}\u0000`;
    },
  );

  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/(^|[^*\u0000])\*([^*\u0000]+)\*(?!\*)/g, "$1<em>$2</em>");
  output = output.replace(/(^|[^\u0000A-Za-z0-9])_([^_\u0000]+)_/g, "$1<em>$2</em>");
  output = output.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  function resolveLabel(label) {
    return label
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\u0000])\*([^*\u0000]+)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/\u0000C(\d+)\u0000/g, (_match, index) => `<code>${code[index]}</code>`);
  }

  output = output.replace(/\u0000C(\d+)\u0000/g, (_match, index) => `<code>${code[index]}</code>`);
  output = output.replace(/\u0000L(\d+)\u0000/g, (_match, index) => {
    const { label, href, title } = links[index];
    const target = resolveDocLink(href, docBySlug, sourcePath);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(target)}"${titleAttr}>${resolveLabel(label)}</a>`;
  });

  return output;
}

function isBlockStart(line) {
  const trimmed = line.trim();
  return (
    trimmed === "" ||
    /^(#{1,6})\s+/.test(trimmed) ||
    /^(`{3,}|~{3,})/.test(trimmed) ||
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed) ||
    trimmed.startsWith(">") ||
    trimmed.startsWith("|") ||
    /^(\s*)([-*+]|\d+[.)])\s+/.test(trimmed)
  );
}

function renderList(lines, startIndex, docBySlug, sourcePath) {
  const firstMarker = lines[startIndex].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
  const indent = firstMarker[1].length;
  const ordered = /\d/.test(firstMarker[2]);
  const items = [];
  let next = startIndex;

  while (next < lines.length) {
    const marker = lines[next].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (!marker || marker[1].length !== indent || /\d/.test(marker[2]) !== ordered) {
      break;
    }

    const itemText = marker[3];
    const bodyLines = [];
    let cursor = next + 1;
    while (cursor < lines.length) {
      const bodyLine = lines[cursor];
      if (bodyLine.trim() === "") {
        bodyLines.push("");
        cursor += 1;
        continue;
      }
      const bodyIndent = bodyLine.length - bodyLine.trimStart().length;
      if (bodyIndent > indent) {
        bodyLines.push(bodyLine);
        cursor += 1;
        continue;
      }
      break;
    }

    if (bodyLines.length === 0 || bodyLines.every((line) => line.trim() === "")) {
      items.push(`<li>${renderInline(itemText, docBySlug, sourcePath)}</li>`);
    } else {
      const stripped = bodyLines.map((line) =>
        line.trim() === "" ? "" : stripLeadingSpaces(line, indent),
      );
      const bodyHtml = renderBlocks(stripped, docBySlug, sourcePath);
      items.push(`<li>${renderInline(itemText, docBySlug, sourcePath)}${bodyHtml}</li>`);
    }

    next = cursor;
  }

  const tag = ordered ? "ol" : "ul";
  return { html: `<${tag}>${items.join("")}</${tag}>`, next };
}

function renderTable(rows, docBySlug, sourcePath) {
  if (rows.length === 0) return "";
  const parsed = rows.map(splitTableRow);
  const header = parsed[0];
  let body = parsed.slice(1);
  if (body.length && body[0].every((cell) => /^:?-{2,}:?$/.test(cell.trim()))) {
    body = body.slice(1);
  }
  const headCells = header
    .map((cell) => `<th>${renderInline(cell, docBySlug, sourcePath)}</th>`)
    .join("");
  const bodyRows = body
    .map((cells) => `<tr>${cells.map((cell) => `<td>${renderInline(cell, docBySlug, sourcePath)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function renderBlocks(lines, docBySlug, sourcePath) {
  let html = "";
  let index = 0;
  while (index < lines.length) {
    const block = renderBlock(lines, index, docBySlug, sourcePath);
    html += block.html;
    index = block.next;
  }
  return html;
}

function renderBlock(lines, index, docBySlug, sourcePath) {
  const line = lines[index];
  const trimmed = line.trim();

  if (trimmed === "") {
    let next = index;
    while (next < lines.length && lines[next].trim() === "") next += 1;
    return { html: "", next };
  }

  const fence = trimmed.match(/^(```+|~~~+)/);
  if (fence) {
    const marker = fence[1][0];
    const baseIndent = line.length - line.trimStart().length;
    const code = [];
    let next = index + 1;
    while (next < lines.length && !lines[next].trim().match(`^${marker}{3,}`)) {
      code.push(stripLeadingSpaces(lines[next], baseIndent));
      next += 1;
    }
    next += 1;
    return { html: `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`, next };
  }

  const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
  if (heading) {
    const level = heading[1].length;
    return { html: `<h${level}>${renderInline(heading[2], docBySlug, sourcePath)}</h${level}>`, next: index + 1 };
  }

  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
    return { html: "<hr>", next: index + 1 };
  }

  if (trimmed.startsWith(">")) {
    const quote = [];
    let next = index;
    while (next < lines.length && lines[next].trim().startsWith(">")) {
      quote.push(lines[next].replace(/^\s*>\s?/, ""));
      next += 1;
    }
    return { html: `<blockquote>${renderBlocks(quote, docBySlug, sourcePath)}</blockquote>`, next };
  }

  if (trimmed.startsWith("|")) {
    const rows = [];
    let next = index;
    while (next < lines.length && lines[next].trim().startsWith("|")) {
      rows.push(lines[next].trim());
      next += 1;
    }
    return { html: renderTable(rows, docBySlug, sourcePath), next };
  }

  if (/^(\s*)([-*+]|\d+[.)])\s+/.test(trimmed)) {
    return renderList(lines, index, docBySlug, sourcePath);
  }

  const paragraph = [];
  let next = index;
  while (next < lines.length) {
    const current = lines[next];
    if (isBlockStart(current)) break;
    paragraph.push(current.trim());
    next += 1;
  }
  return { html: `<p>${renderInline(paragraph.join(" "), docBySlug, sourcePath)}</p>`, next };
}

function renderMarkdown(markdown, docBySlug, sourcePath) {
  if (!markdown) return "<p>No content is available.</p>";
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  return renderBlocks(lines, docBySlug, sourcePath);
}

async function loadTasks() {
  const activePaths = (await markdownFiles(".agents/docs/tasks")).filter((filePath) =>
    /\/(?:todo|wip|blocked)-[^/]+\.md$/.test(`/${filePath}`),
  );
  const completedPaths = (await markdownFiles(".agents/docs/tasks/done")).filter((filePath) =>
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
      path: matchingPath || ".agents/docs/prd/0000-prd-index.md",
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

function docLink(document) {
  return `#doc-${document.id}`;
}

function renderTaskRows(tasks, taskSlugs) {
  if (tasks.length === 0) {
    return '<tr><td colspan="4" class="empty">No tasks in this lifecycle column.</td></tr>';
  }

  return tasks
    .map((task) => {
      const slug = taskSlugs[task.path];
      const href = slug ? `#doc-${slug}` : `../${normalizePath(task.path)}`;
      return `
        <tr>
          <td>${escapeHtml(task.id)}</td>
          <td><a href="${escapeHtml(href)}">${escapeHtml(task.title)}</a></td>
          <td><span class="badge ${statusClass(task.status)}">${escapeHtml(task.status)}</span></td>
          <td><a href="${escapeHtml(href)}"><code>${escapeHtml(task.path)}</code></a></td>
        </tr>`;
    })
    .join("");
}

function renderPrdRows(prds, prdSlugs) {
  if (prds.length === 0) {
    return '<tr><td colspan="4" class="empty">No PRDs are indexed.</td></tr>';
  }

  return prds
    .map((prd) => {
      const slug = prdSlugs[prd.path];
      const href = slug ? `#doc-${slug}` : `../${normalizePath(prd.path)}`;
      return `
        <tr>
          <td>${escapeHtml(prd.id)}</td>
          <td><a href="${escapeHtml(href)}">${escapeHtml(prd.title)}</a></td>
          <td><span class="badge ${statusClass(prd.status)}">${escapeHtml(prd.status)}</span></td>
          <td>${escapeHtml(prd.summary)}</td>
        </tr>`;
    })
    .join("");
}

async function collectDocuments() {
  const definitions = [];
  const add = (label, relativePath, group) =>
    definitions.push({ label, relativePath, group });

  for (const [label, relativePath] of sourceDefinitions) {
    add(label, relativePath, "Workflow sources");
  }
  for (const [label, relativePath] of projectDocDefinitions) {
    add(label, relativePath, "Project docs");
  }

  const prdPaths = (await markdownFiles(".agents/docs/prd")).filter(
    (filePath) => !/0000-prd-index\.md$/.test(filePath),
  );
  for (const filePath of prdPaths) {
    add(`PRD ${taskId(filePath)}`, filePath, "PRDs");
  }

  const activeTasks = (await markdownFiles(".agents/docs/tasks")).filter((filePath) =>
    /\/(?:todo|wip|blocked)-[^/]+\.md$/.test(`/${filePath}`),
  );
  const completedTasks = (await markdownFiles(".agents/docs/tasks/done")).filter((filePath) =>
    /\/done-[^/]+\.md$/.test(`/${filePath}`),
  );
  for (const filePath of activeTasks) {
    add(`Task ${taskId(filePath)}`, filePath, "Active tasks");
  }
  for (const filePath of completedTasks) {
    add(`Task ${taskId(filePath)}`, filePath, "Completed tasks");
  }

  const suggestions = (await markdownFiles(".agents/docs/suggestions")).filter(
    (filePath) => !/README\.md$/.test(filePath),
  );
  for (const filePath of suggestions) {
    add(`Suggestion ${taskId(filePath)}`, filePath, "Proposals");
  }
  for (const filePath of await markdownFiles(".agents/skills/agent-workflow-scrum/references")) {
    add(`Workflow reference: ${path.basename(filePath, ".md")}`, filePath, "Workflow references");
  }

  const docBySlug = {};
  const documents = definitions.map(({ label, relativePath, group }) => {
    const id = slugForPath(relativePath);
    docBySlug[id] = true;
    return { id, label, group, path: relativePath, html: "" };
  });

  for (const document of documents) {
    const source = await readText(document.path);
    document.exists = source !== null;
    document.html = source ? renderMarkdown(source, docBySlug, document.path) : "";
  }

  return { documents, docBySlug };
}

function renderSidebar(documents) {
  const byGroup = new Map();
  for (const document of documents) {
    if (!byGroup.has(document.group)) byGroup.set(document.group, []);
    byGroup.get(document.group).push(document);
  }

  const groups = [];
  for (const group of navGroupOrder) {
    if (!byGroup.has(group)) continue;
    groups.push(`
      <div class="nav-group">
        <div class="nav-title">${escapeHtml(group)}</div>
        ${byGroup
          .get(group)
          .map(
            (document) => `
          <a class="nav-link" data-target="${escapeHtml(document.id)}" href="${docLink(document)}">${escapeHtml(document.label)}</a>`,
          )
          .join("")}
      </div>`);
  }

  return `
    <nav class="sidebar">
      <a class="brand" href="#doc-dashboard">Agent Workflow Scrum</a>
      <div class="nav-scroll">
        <div class="nav-group">
          <div class="nav-title">Overview</div>
          <a class="nav-link" data-target="dashboard" href="#doc-dashboard">Dashboard</a>
        </div>
        ${groups.join("")}
      </div>
    </nav>`;
}

function renderDocSection(document) {
  return `
    <section id="doc-${escapeHtml(document.id)}" class="doc-view" hidden>
      <div class="doc-head">
        <h1>${escapeHtml(document.label)}</h1>
        <code>${escapeHtml(document.path)}</code>
      </div>
      <article>${document.html}</article>
    </section>`;
}

function renderDashboard(report, documents, taskSlugs, prdSlugs) {
  const generatedDate = new Date(report.generatedAt).toLocaleString();
  const gitStatus = report.git.clean ? "clean" : `${report.git.changeCount} change(s)`;
  const documentsById = new Map(documents.map((document) => [document.id, document]));

  const sourceList = [...sourceDefinitions, ...projectDocDefinitions]
    .map(([label, relativePath]) => {
      const id = slugForPath(relativePath);
      const document = documentsById.get(id);
      const exists = document?.exists !== false;
      return `
        <li>
          <span class="badge ${exists ? "status-good" : "status-risk"}">${exists ? "available" : "missing"}</span>
          <a href="${docLink({ id })}">${escapeHtml(label)}</a>
          <a href="${docLink({ id })}"><code>${escapeHtml(relativePath)}</code></a>
        </li>`;
    })
    .join("");

  return `
    <section id="doc-dashboard" class="doc-view">
      <header>
        <p class="muted">Generated ${escapeHtml(generatedDate)}</p>
        <h1>Agent Workflow Scrum Report</h1>
        <p class="muted">A navigable snapshot of the repository's Git state, PRDs, tasks, and workflow sources. Use the sidebar to read any tracked markdown document in place.</p>
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
          <tbody>${renderTaskRows(report.tasks.active, taskSlugs)}</tbody>
        </table>
      </section>

      <h2>Completed tasks</h2>
      <section>
        <table>
          <thead><tr><th>ID</th><th>Task</th><th>Status</th><th>Source</th></tr></thead>
          <tbody>${renderTaskRows(report.tasks.completed, taskSlugs)}</tbody>
        </table>
      </section>

      <h2>PRD index</h2>
      <section>
        <table>
          <thead><tr><th>PRD</th><th>Title</th><th>Status</th><th>Summary</th></tr></thead>
          <tbody>${renderPrdRows(report.prds, prdSlugs)}</tbody>
        </table>
      </section>

      <h2>Shared workflow sources</h2>
      <section>
        <ul class="sources">${sourceList}</ul>
      </section>
    </section>`;
}

function renderHtml(report, documents, taskSlugs, prdSlugs) {
  const dashboard = renderDashboard(report, documents, taskSlugs, prdSlugs);
  const sections = documents.map(renderDocSection).join("");
  const sidebar = renderSidebar(documents);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Agent Workflow Scrum Report</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f5f7fb;
        color: #172033;
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      .app { display: flex; min-height: 100vh; }
      .sidebar {
        width: 280px; flex: 0 0 280px;
        background: #fff; border-right: 1px solid #dce2ee;
        position: sticky; top: 0; align-self: flex-start; height: 100vh;
        overflow-y: auto; padding: 1rem 0 2rem;
      }
      .brand { display: block; padding: .5rem 1.25rem; font-weight: 700; color: #172033; text-decoration: none; font-size: 1.05rem; }
      .nav-scroll { padding: .5rem 0 0; }
      .nav-group { margin-bottom: .5rem; }
      .nav-title { padding: .35rem 1.25rem; color: #5d687c; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }
      .nav-link { display: block; padding: .3rem 1.25rem .3rem 1.5rem; color: #2457c5; text-decoration: none; font-size: .9rem; }
      .nav-link:hover { background: #eef3fb; }
      .nav-link.active { background: #e4edfb; color: #173f9b; font-weight: 700; }
      .content { flex: 1 1 auto; padding: 2rem 1rem 4rem; min-width: 0; }
      main { max-width: 1080px; margin: 0 auto; }
      h1, h2 { line-height: 1.2; }
      h2 { margin-top: 2rem; }
      h3, h4 { line-height: 1.25; }
      p { line-height: 1.55; }
      .muted { color: #5d687c; }
      a { color: #2457c5; }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: .8rem; }
      .card, section { background: #fff; border: 1px solid #dce2ee; border-radius: 14px; box-shadow: 0 4px 16px rgb(28 43 76 / 7%); }
      .card { padding: 1rem; }
      .card strong { display: block; font-size: 1.35rem; margin-top: .35rem; }
      section { padding: 1rem; overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; min-width: 640px; }
      th, td { border-bottom: 1px solid #e7ebf3; text-align: left; padding: .7rem .5rem; vertical-align: top; }
      th { color: #4a5870; font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; }
      tr:last-child td { border-bottom: 0; }
      code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .82rem; overflow-wrap: anywhere; }
      pre { background: #172033; border-radius: 10px; color: #edf2ff; overflow-x: auto; padding: 1rem; }
      pre code { background: transparent; color: inherit; padding: 0; }
      .doc-head { border-bottom: 1px solid #e7ebf3; margin-bottom: 1.25rem; padding-bottom: .75rem; }
      .doc-head h1 { margin: 0 0 .35rem; }
      article { overflow-x: hidden; }
      article blockquote { border-left: 3px solid #c8d4e8; margin: 0 0 1rem; padding: .25rem 1rem; color: #42506b; }
      article ul, article ol { padding-left: 1.5rem; }
      .badge { border-radius: 999px; display: inline-block; font-size: .75rem; font-weight: 700; padding: .22rem .55rem; white-space: nowrap; }
      .status-good { background: #d9f6e5; color: #12643c; }
      .status-active { background: #fff0c2; color: #765500; }
      .status-risk { background: #ffe0e0; color: #8b1e1e; }
      .status-neutral { background: #e8edf6; color: #46546b; }
      .empty { color: #69758a; font-style: italic; }
      ul.sources { list-style: none; margin: 0; padding: 0; display: grid; gap: .65rem; }
      ul.sources li { align-items: center; display: flex; flex-wrap: wrap; gap: .55rem; }
      footer { color: #5d687c; font-size: .9rem; margin-top: 2rem; }
      @media (max-width: 780px) {
        .app { flex-direction: column; }
        .sidebar { width: 100%; flex: 0 0 auto; position: static; height: auto; }
      }
    </style>
  </head>
  <body>
    <div class="app">
      ${sidebar}
      <main class="content" id="content">
        ${dashboard}
        ${sections}
      </main>
    </div>
    <script>
      (function () {
        var content = document.getElementById("content");
        function targetId() {
          var hash = window.location.hash;
          if (hash.indexOf("#doc-") === 0) return hash.slice(5);
          return "dashboard";
        }
        function show() {
          var id = targetId();
          var sections = document.querySelectorAll(".doc-view");
          for (var i = 0; i < sections.length; i += 1) {
            sections[i].hidden = sections[i].id !== "doc-" + id;
          }
          var links = document.querySelectorAll(".nav-link");
          for (var j = 0; j < links.length; j += 1) {
            links[j].classList.toggle("active", links[j].getAttribute("data-target") === id);
          }
          content.scrollTop = 0;
        }
        window.addEventListener("hashchange", show);
        show();
      })();
    </script>
  </body>
</html>
`;
}

async function main() {
  const [prdIndex, prdPaths, tasks, collected] = await Promise.all([
    readText(".agents/docs/prd/0000-prd-index.md"),
    markdownFiles(".agents/docs/prd"),
    loadTasks(),
    collectDocuments(),
  ]);

  const { documents, docBySlug } = collected;
  const taskSlugs = {};
  for (const task of [...tasks.active, ...tasks.completed]) {
    taskSlugs[task.path] = slugForPath(task.path);
  }
  const prdSlugs = {};
  for (const prd of tasks ? parsePrdIndex(prdIndex, prdPaths) : []) {
    prdSlugs[prd.path] = slugForPath(prd.path);
  }
  const prds = parsePrdIndex(prdIndex, prdPaths);

  const sources = await Promise.all(
    sourceDefinitions.map(async ([label, relativePath]) => ({
      label,
      path: relativePath,
      exists: (await readText(relativePath)) !== null,
    })),
  );

  const report = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    repository: path.basename(repositoryRoot),
    git: gitSnapshot(),
    summary: {
      activeTasks: tasks.active.length,
      completedTasks: tasks.completed.length,
      prds: prds.length,
      documents: documents.length,
    },
    tasks,
    prds,
    sources,
    documents: documents.map(({ id, label, group, path, exists }) => ({
      id,
      label,
      group,
      path,
      exists,
    })),
  };

  await mkdir(reportDirectory, { recursive: true });
  const htmlPath = path.join(reportDirectory, "index.html");
  const jsonPath = path.join(reportDirectory, "report.json");
  await Promise.all([
    writeFile(htmlPath, renderHtml(report, documents, taskSlugs, prdSlugs), "utf8"),
    writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  ]);

  console.log(`Generated Agent Workflow Scrum report for ${report.repository}`);
  console.log(`- HTML: ${displayPath(htmlPath)}`);
  console.log(`- JSON: ${displayPath(jsonPath)}`);
  console.log(`- Active tasks: ${report.summary.activeTasks}`);
  console.log(`- Completed tasks: ${report.summary.completedTasks}`);
  console.log(`- Indexed PRDs: ${report.summary.prds}`);
  console.log(`- Navigable documents: ${report.summary.documents}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
