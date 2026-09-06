import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ND workflow plugin protocol v1 (see plugin/nd/README.md).
// The plugin is a read-only reporter: it never mutates the target repository,
// never installs anything, and never executes project commands.

export const ND_PROTOCOL = "nd.workflow/1";
export const CONTEXT_BUDGET_DEFAULT = 1500;

const DOCS_ROOT = ".agents/docs";
const TASKS_ROOT = `${DOCS_ROOT}/tasks`;
const DONE_ROOT = `${TASKS_ROOT}/done`;
const PRD_ROOT = `${DOCS_ROOT}/prd`;
const PRD_INDEX = `${PRD_ROOT}/0000-prd-index.md`;
const CONFIG_PATH = ".agents/config.json";

const SUPPORTED_CONFIG_SCHEMA_VERSION = 1;
const MAX_FILE_BYTES = 262_144;
const MAX_TASKS = 500;
const MAX_PRDS = 200;
const MAX_DIAGNOSTICS = 40;

const DISPLAY_STATUS = Object.freeze({
  todo: "ready",
  wip: "in_progress",
  blocked: "blocked",
  done: "completed",
});

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function estimateTokens(value) {
  return Math.max(1, Math.ceil(String(value || "").length / 4));
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function canonicalNumber(value) {
  const stripped = String(value).replace(/^0+(?=\d)/, "");
  return /^\d+$/.test(stripped) ? stripped : null;
}

/**
 * Task records encode their task number in the filename after the lifecycle
 * prefix. Two shapes exist: `<lifecycle>-<ordinal>-<number>-<slug>`
 * (self-hosted repositories) and `<lifecycle>-<number>-<slug>` (early
 * projects). Slugs may contain digits, so an ordinal is recognized only when
 * the two segments after the prefix are both numeric.
 */
export function parseTaskFileName(fileName) {
  const base = fileName.replace(/\.md$/i, "");
  const lifecycleMatch = base.match(/^(todo|wip|blocked|done)-(.+)$/);
  if (!lifecycleMatch) return { lifecycle: null, ordinal: null, number: null };
  const lifecycle = lifecycleMatch[1];
  const segments = lifecycleMatch[2].split("-");
  let ordinal = null;
  let number = null;
  if (segments.length >= 2 && /^\d+$/.test(segments[0]) && /^\d+$/.test(segments[1])) {
    ordinal = segments[0];
    number = segments[1];
  } else if (/^\d+$/.test(segments[0])) {
    number = segments[0];
  }
  return { lifecycle, ordinal, number: canonicalNumber(number) };
}

function statusOf(markdown) {
  return markdown?.match(/^>\s+\*\*(?:State|Status):\*\*\s*(.+?)\s*$/im)?.[1]?.replaceAll("*", "").trim().toLowerCase()
    || markdown?.match(/^>\s+(?:State|Status):\s*(.+?)\s*$/im)?.[1]?.trim().toLowerCase()
    || "";
}

function titleOf(markdown, fallback) {
  return markdown?.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback;
}

function prdNumbersOf(markdown) {
  const numbers = new Set();
  const metadata = markdown?.match(/^>\s+\*\*PRD:?\*\*\s*(.+?)\s*$/im)?.[1]
    || markdown?.match(/^>\s+PRD:\s*(.+?)\s*$/im)?.[1] || "";
  for (const match of metadata.matchAll(/\b(\d{3,4})\b/g)) {
    const canonical = canonicalNumber(match[1]);
    if (canonical) numbers.add(canonical);
  }
  for (const match of markdown?.matchAll(/\]\((?:[^)]*\/)?(\d{3,4})-[^)]*\.md\)/g) || []) {
    const canonical = canonicalNumber(match[1]);
    if (canonical) numbers.add(canonical);
  }
  return [...numbers];
}

function sectionText(markdown, heading) {
  const wanted = heading.toLowerCase();
  const lines = (markdown || "").split("\n");
  const out = [];
  let capturing = false;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (capturing) break;
      capturing = line.replace(/^##\s+/, "").trim().toLowerCase() === wanted;
      continue;
    }
    if (capturing) out.push(line);
  }
  return out.join("\n").trim();
}

function listItems(text) {
  return (text || "").split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function criteriaOf(markdown) {
  const criteria = [];
  for (const line of sectionText(markdown, "Acceptance Criteria").split("\n")) {
    const match = line.trim().match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (match) criteria.push({ text: match[2].trim(), checked: match[1].toLowerCase() === "x" });
  }
  return criteria;
}

function hasConflictMarkers(markdown) {
  return /^<{7}(\s|$)|^={7}$|^>{7}(\s|$)/m.test(markdown || "");
}

function evidenceOf(markdown) {
  for (const heading of ["Evidence", "Evidence Ledger"]) {
    const section = sectionText(markdown, heading);
    if (section) {
      return { present: true, excerpt: (section.split("\n").find(Boolean) || "").slice(0, 200) };
    }
  }
  const commandLine = (markdown || "").split("\n")
    .find((line) => /^\s*(?:[-*]\s+)?`?(?:npm|pnpm|yarn|bun|node|git)\s/.test(line));
  return commandLine
    ? { present: true, excerpt: commandLine.trim().replace(/^[-*]\s+/, "").replaceAll("`", "").slice(0, 200) }
    : { present: false, excerpt: "" };
}

function humanAcceptanceOf(markdown) {
  const line = (markdown || "").split("\n").find((candidate) =>
    /(human|owner|product owner)[^.]{0,80}\baccept/i.test(candidate)
    || /\baccept\w*[^.]{0,80}(human|owner)/i.test(candidate));
  return line
    ? { recorded: true, excerpt: line.trim().slice(0, 200) }
    : { recorded: false, excerpt: "" };
}

async function readText(root, relativePath) {
  const absolute = path.join(root, relativePath);
  const info = await stat(absolute).catch(() => null);
  if (!info?.isFile()) return null;
  if (info.size > MAX_FILE_BYTES) return { oversized: true, content: null };
  const content = await readFile(absolute, "utf8");
  return { oversized: false, content };
}

async function markdownFiles(root, directory) {
  try {
    const entries = await readdir(path.join(root, directory), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
      .map((entry) => normalizePath(path.join(directory, entry.name)))
      .sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export async function loadNdConfig(root) {
  const read = await readText(root, CONFIG_PATH).catch(() => null);
  if (!read) return { config: null, error: "missing" };
  if (read.oversized) return { config: null, error: "unreadable" };
  try {
    const parsed = JSON.parse(read.content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { config: null, error: "malformed" };
    return { config: parsed, error: null };
  } catch {
    return { config: null, error: "malformed" };
  }
}

function baseResult(root) {
  return {
    protocol: ND_PROTOCOL,
    plugin: { id: "agent-workflow-scrum", version: null },
    root: path.resolve(root),
    diagnostics: [],
  };
}

async function pluginVersion() {
  try {
    const parsed = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

function configFacts(config) {
  if (!config) return { schemaVersion: null, mode: null, packageManager: null };
  return {
    schemaVersion: Number.isInteger(config.schemaVersion) ? config.schemaVersion : null,
    mode: typeof config.mode === "string" ? config.mode : null,
    packageManager: typeof config.packageManager === "string" ? config.packageManager : null,
  };
}

function configDiagnostics(config) {
  const diagnostics = [];
  if (config && !config.schemaVersion) {
    diagnostics.push({ severity: "warning", code: "config_schema_version_missing", message: ".agents/config.json has no schemaVersion; treated as supported.", sourcePath: CONFIG_PATH });
  }
  if (config && config.schemaVersion && config.schemaVersion !== SUPPORTED_CONFIG_SCHEMA_VERSION) {
    diagnostics.push({ severity: "error", code: "unsupported_config_schema", message: `config schemaVersion ${config.schemaVersion} is not supported by plugin version in use.`, sourcePath: CONFIG_PATH });
  }
  return diagnostics;
}

function schemaSupported(config) {
  return !!config && (!config.schemaVersion || config.schemaVersion === SUPPORTED_CONFIG_SCHEMA_VERSION);
}

export function gitInfo(root) {
  const spawn = (args) => spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LANG: "C", LC_ALL: "C" },
    windowsHide: true,
  });
  const head = spawn(["rev-parse", "HEAD"]);
  if (head.status !== 0) return { available: false, branch: null, head: null, dirty: null };
  const branch = spawn(["rev-parse", "--abbrev-ref", "HEAD"]);
  const status = spawn(["status", "--porcelain=v1"]);
  return {
    available: true,
    branch: branch.status === 0 ? branch.stdout.trim() : null,
    head: head.stdout.trim(),
    dirty: status.status === 0 ? status.stdout.trim().length > 0 : null,
  };
}

function taskKeyConflicts(tasks) {
  const byKey = new Map();
  for (const task of tasks) {
    if (!task.key) continue;
    if (!byKey.has(task.key)) byKey.set(task.key, []);
    byKey.get(task.key).push(task);
  }
  return [...byKey.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => ({ key, tasks: group }));
}

function configErrorDiagnostics(error) {
  if (error === "missing") {
    return [{ severity: "error", code: "workflow_not_initialized", message: "No .agents/config.json found; this project does not use Agent Workflow Scrum.", sourcePath: CONFIG_PATH }];
  }
  if (error === "malformed") {
    return [{ severity: "error", code: "config_malformed", message: ".agents/config.json is not parseable JSON.", sourcePath: CONFIG_PATH }];
  }
  if (error === "unreadable") {
    return [{ severity: "error", code: "config_unreadable", message: `.agents/config.json exceeds ${MAX_FILE_BYTES} bytes.`, sourcePath: CONFIG_PATH }];
  }
  return [];
}

export async function detectNdPlugin(root) {
  const resolved = path.resolve(root);
  const result = baseResult(resolved);
  result.plugin.version = await pluginVersion();
  const { config, error } = await loadNdConfig(resolved);
  result.config = configFacts(config);
  result.supported = error === null && schemaSupported(config);
  result.diagnostics = [...configErrorDiagnostics(error), ...configDiagnostics(config)];
  return result;
}

async function readPrdRecords(resolved, diagnostics) {
  const indexRows = new Map();
  const indexRead = await readText(resolved, PRD_INDEX);
  if (indexRead && !indexRead.oversized) {
    if (hasConflictMarkers(indexRead.content)) {
      diagnostics.push({ severity: "error", code: "merge_conflict_markers", message: "PRD index contains merge conflict markers.", sourcePath: PRD_INDEX });
    }
    for (const line of indexRead.content.split("\n")) {
      if (!/^\s*\|/.test(line) || /^\s*\|[\s:|-]+\|\s*$/.test(line)) continue;
      const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      if (cells.length < 4 || cells[0].startsWith("#")) continue;
      const number = canonicalNumber((cells[0].match(/\d{3,4}/) || [])[0] || "");
      if (!number) continue;
      indexRows.set(number, {
        title: cells[1].replaceAll("**", ""),
        status: cells[2].replaceAll("**", "").toLowerCase(),
        summary: cells[3],
      });
    }
  }

  const prds = [];
  for (const file of await markdownFiles(resolved, PRD_ROOT)) {
    if (prds.length >= MAX_PRDS) {
      diagnostics.push({ severity: "warning", code: "scan_limit_exceeded", message: `PRD scan stopped at ${MAX_PRDS} records.`, sourcePath: PRD_ROOT });
      break;
    }
    if (file.endsWith("0000-prd-index.md") || file.endsWith("README.md")) continue;
    const number = canonicalNumber((path.basename(file).match(/^(\d{3,4})-/) || [])[1] || "");
    const read = await readText(resolved, file);
    if (!read || read.oversized) {
      diagnostics.push({ severity: "warning", code: "file_oversized", message: `PRD file exceeds ${MAX_FILE_BYTES} bytes and was skipped.`, sourcePath: file });
      continue;
    }
    if (hasConflictMarkers(read.content)) {
      diagnostics.push({ severity: "error", code: "merge_conflict_markers", message: "PRD contains merge conflict markers.", sourcePath: file });
    }
    const indexRow = number !== null ? indexRows.get(number) : undefined;
    const record = {
      key: number,
      sourcePath: file,
      contentHash: sha256(read.content),
      title: titleOf(read.content, path.basename(file)),
      status: statusOf(read.content) || null,
      inIndex: indexRow !== undefined,
      indexStatus: indexRow?.status ?? null,
      summary: indexRow?.summary ?? null,
    };
    if (number !== null && !indexRow) {
      diagnostics.push({ severity: "warning", code: "prd_missing_from_index", message: `PRD ${number} is not listed in ${PRD_INDEX}.`, sourcePath: file });
    }
    if ((record.status || "").includes("draft")) {
      diagnostics.push({ severity: "warning", code: "prd_status_draft", message: `PRD ${number ?? file} is still a draft.`, sourcePath: file });
    }
    prds.push(record);
  }
  return prds;
}

async function readTaskRecords(resolved, prds, diagnostics) {
  const prdByNumber = new Map(prds.filter((prd) => prd.key !== null).map((prd) => [prd.key, prd]));
  const tasks = [];
  const entries = [
    ...(await markdownFiles(resolved, TASKS_ROOT)).map((file) => ({ file, archived: false })),
    ...(await markdownFiles(resolved, DONE_ROOT)).map((file) => ({ file, archived: true })),
  ];
  for (const { file, archived } of entries) {
    if (tasks.length >= MAX_TASKS) {
      diagnostics.push({ severity: "warning", code: "scan_limit_exceeded", message: `Task scan stopped at ${MAX_TASKS} records.`, sourcePath: TASKS_ROOT });
      break;
    }
    if (path.basename(file).toLowerCase() === "readme.md") continue;
    const parsedName = parseTaskFileName(path.basename(file));
    if (!parsedName.lifecycle) {
      diagnostics.push({ severity: "warning", code: "unrecognized_task_filename", message: "Task file name does not start with todo-, wip-, blocked-, or done-.", sourcePath: file });
    }
    if (archived && parsedName.lifecycle && parsedName.lifecycle !== "done") {
      diagnostics.push({ severity: "warning", code: "legacy_archived_filename", message: `Archived record keeps its active ${parsedName.lifecycle}- prefix; expected done-.`, sourcePath: file });
    }
    const read = await readText(resolved, file);
    if (!read || read.oversized) {
      diagnostics.push({ severity: "warning", code: "file_oversized", message: `Task file exceeds ${MAX_FILE_BYTES} bytes and was skipped.`, sourcePath: file });
      continue;
    }
    if (hasConflictMarkers(read.content)) {
      diagnostics.push({ severity: "error", code: "merge_conflict_markers", message: "Task file contains merge conflict markers.", sourcePath: file });
    }
    const lifecycle = archived ? "done" : parsedName.lifecycle || "wip";
    const prdRefs = prdNumbersOf(read.content);
    const taskDiagnostics = [];
    for (const ref of prdRefs) {
      const prd = prdByNumber.get(ref);
      if (!prd) {
        taskDiagnostics.push({ severity: "warning", code: "prd_file_missing", message: `Task references PRD ${ref}, but no ${PRD_ROOT}/${ref}-*.md file exists.`, sourcePath: file });
      } else if (!prd.inIndex) {
        taskDiagnostics.push({ severity: "warning", code: "prd_missing_from_index", message: `Linked PRD ${ref} is not listed in ${PRD_INDEX}.`, sourcePath: file });
      } else if ((prd.status || "").includes("draft")) {
        taskDiagnostics.push({ severity: "warning", code: "prd_status_draft", message: `Linked PRD ${ref} is still a draft.`, sourcePath: file });
      }
    }
    tasks.push({
      key: parsedName.number,
      sourcePath: file,
      contentHash: sha256(read.content),
      title: titleOf(read.content, path.basename(file)),
      lifecycle,
      state: statusOf(read.content) || lifecycle,
      displayStatus: DISPLAY_STATUS[lifecycle] || "needs_attention",
      archived,
      legacyArchive: Boolean(archived && parsedName.lifecycle && parsedName.lifecycle !== "done"),
      prdRefs,
      outcome: sectionText(read.content, "Outcome").slice(0, 600),
      scope: listItems(sectionText(read.content, "Scope")).slice(0, 20),
      criteria: criteriaOf(read.content),
      evidence: evidenceOf(read.content),
      humanAcceptance: humanAcceptanceOf(read.content),
      diagnostics: taskDiagnostics,
    });
  }
  return tasks;
}

export async function readNdSnapshot(root) {
  const resolved = path.resolve(root);
  const result = baseResult(resolved);
  result.plugin.version = await pluginVersion();
  const diagnostics = [];
  const { config, error } = await loadNdConfig(resolved);
  result.config = configFacts(config);
  diagnostics.push(...configErrorDiagnostics(error), ...configDiagnostics(config));

  const prds = await readPrdRecords(resolved, diagnostics);
  const tasks = await readTaskRecords(resolved, prds, diagnostics);

  for (const conflict of taskKeyConflicts(tasks)) {
    diagnostics.push({ severity: "error", code: "duplicate_task_number", message: `Task number ${conflict.key} is used by ${conflict.tasks.length} records; they must not be collapsed.`, sourcePath: conflict.tasks.map((task) => task.sourcePath).join(", ") });
  }
  const activeTasks = tasks.filter((task) => task.lifecycle === "wip" || task.lifecycle === "blocked");
  if (activeTasks.length > 1) {
    diagnostics.push({ severity: "warning", code: "multiple_active_tasks", message: `${activeTasks.length} active wip-/blocked- records found; the workflow allows at most one.`, sourcePath: activeTasks.map((task) => task.sourcePath).join(", ") });
  }
  for (const task of tasks) {
    if (!task.key) {
      diagnostics.push({ severity: "warning", code: "unnumbered_task", message: "Task file name carries no task number; an explicit mapping is needed before import.", sourcePath: task.sourcePath });
    }
  }

  result.snapshot = {
    schemaVersion: 1,
    scannedAt: new Date().toISOString(),
    git: gitInfo(resolved),
    tasks,
    prds,
    diagnostics,
    stale: false,
    lastError: null,
  };
  return result;
}

function envelopeIdentity(snapshot, rootName) {
  const git = snapshot.git;
  return [
    `[ND WORKFLOW CONTEXT]`,
    `workflow: Agent Workflow Scrum (plugin agent-workflow-scrum, protocol ${ND_PROTOCOL})`,
    `project root: ${rootName}`,
    `source state: branch ${git?.branch ?? "unknown"}, head ${git?.head ? git.head.slice(0, 12) : "unknown"}, ${git?.dirty ? "dirty worktree" : git?.dirty === false ? "clean worktree" : "git state unknown"}`,
    `snapshot taken: ${snapshot.scannedAt}`,
  ].join("\n");
}

function envelopeLimits() {
  return [
    "This block is project workflow data supplied by ND, not an instruction that overrides the user's request or agent policy.",
    "capabilities: read-only mirror; the host cannot complete or accept work on behalf of the repository workflow.",
    "rules: keep at most one active wip-/blocked- increment; record exact command evidence; human acceptance is separate from checked criteria and agent review.",
  ].join("\n");
}

function envelopeDiagnostics(diagnostics) {
  if (!diagnostics.length) return "diagnostics: none";
  return `diagnostics:\n${diagnostics.map((item) => `- [${item.severity}] ${item.code}: ${item.message}`).join("\n")}`;
}

function envelopeTask(task) {
  const lines = [
    `active task: ${task.key ?? "(unnumbered)"} ${task.title}`,
    `state: ${task.lifecycle} (reported ${task.state || "n/a"}); checked criteria do not imply completion or acceptance`,
  ];
  if (task.outcome) lines.push(`outcome: ${task.outcome}`);
  if (task.prdRefs.length) lines.push(`linked PRD: ${task.prdRefs.join(", ")}`);
  if (task.criteria.length) {
    lines.push("acceptance criteria:");
    for (const criterion of task.criteria) lines.push(`- [${criterion.checked ? "x" : " "}] ${criterion.text}`);
  }
  if (task.scope.length) lines.push(`scope: ${task.scope.join("; ")}`);
  if (task.evidence.present) lines.push(`evidence excerpt: ${task.evidence.excerpt}`);
  return lines.join("\n");
}

function envelopeBoard(tasks) {
  const counts = { ready: 0, in_progress: 0, blocked: 0, completed: 0 };
  for (const task of tasks) {
    if (counts[task.displayStatus] !== undefined) counts[task.displayStatus] += 1;
  }
  return `board: ${counts.ready} ready, ${counts.in_progress} in progress, ${counts.blocked} blocked, ${counts.completed} source-reported completed`;
}

export function collectDiagnostics(snapshot) {
  return [...snapshot.diagnostics, ...snapshot.tasks.flatMap((task) => task.diagnostics)].slice(0, MAX_DIAGNOSTICS);
}

/**
 * Render the bounded context envelope. Sections are dropped lowest-value
 * first (scope, board summary, outcome); identity, capability limits, and
 * diagnostics are never truncated away.
 */
export function renderNdContextEnvelope(snapshot, options = {}) {
  const budget = Number.isInteger(options.budget) && options.budget > 0 ? options.budget : CONTEXT_BUDGET_DEFAULT;
  const active = snapshot.tasks.filter((task) => task.lifecycle === "wip" || task.lifecycle === "blocked");
  const selected = options.task
    ? snapshot.tasks.filter((task) => task.key === canonicalNumber(options.task))
    : active;
  const dropped = { scope: false, board: false, outcome: false };
  const build = () => {
    const parts = [envelopeIdentity(snapshot, options.rootName ?? path.basename(snapshot.root ?? "")), envelopeLimits()];
    if (!dropped.board) parts.push(envelopeBoard(snapshot.tasks));
    parts.push(envelopeDiagnostics(collectDiagnostics(snapshot)));
    for (const task of selected) {
      const rendered = envelopeTask(task);
      parts.push(dropped.outcome || dropped.scope
        ? rendered.split("\n").filter((line) => !line.startsWith("outcome:") && !line.startsWith("scope:")).join("\n")
        : rendered);
    }
    return parts.join("\n\n").replaceAll("{{", "{ {");
  };
  let envelope = build();
  if (estimateTokens(envelope) > budget) { dropped.scope = true; envelope = build(); }
  if (estimateTokens(envelope) > budget) { dropped.board = true; envelope = build(); }
  if (estimateTokens(envelope) > budget) { dropped.outcome = true; envelope = build(); }
  return {
    envelope,
    estimatedTokens: estimateTokens(envelope),
    truncated: dropped.outcome || dropped.board || dropped.scope,
  };
}

export async function buildNdContext(root, options = {}) {
  const resolved = path.resolve(root);
  const detect = await detectNdPlugin(resolved);
  if (!detect.supported) {
    return { ...detect, context: null, lastError: "workflow not detected or unsupported for this plugin version" };
  }
  const snapshotResult = await readNdSnapshot(resolved);
  const snapshot = snapshotResult.snapshot;
  const rendered = renderNdContextEnvelope(snapshot, { ...options, rootName: path.basename(resolved) });
  const active = snapshot.tasks.filter((task) => task.lifecycle === "wip" || task.lifecycle === "blocked");
  const selected = options.task
    ? snapshot.tasks.filter((task) => task.key === canonicalNumber(options.task))
    : active;
  return {
    ...detect,
    context: {
      budgetTokens: Number.isInteger(options.budget) && options.budget > 0 ? options.budget : CONTEXT_BUDGET_DEFAULT,
      estimatedTokens: rendered.estimatedTokens,
      truncated: rendered.truncated,
      envelope: rendered.envelope,
      activeTaskKeys: active.map((task) => task.key),
      selectedTaskKeys: selected.map((task) => task.key).filter(Boolean),
      diagnostics: collectDiagnostics(snapshot),
    },
  };
}
