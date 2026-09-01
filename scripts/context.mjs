import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangeScope } from "./change-scope.mjs";
import { estimateTokens, trimToBudget } from "./context/providers/common.mjs";
import { retrieveGraphify } from "./context/providers/graphify.mjs";
import { retrieveOpenViking } from "./context/providers/openviking.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "..");
const DEFAULT_BUDGET = 1500;
const MIN_CONTEXT_BUDGET = 500;
const DEFAULT_PROVIDER_TIMEOUT = 8000;
const MIN_LOCAL_BUDGET = 500;
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "into", "when", "what",
  "where", "which", "your", "our", "their", "have", "has", "will", "would",
  "should", "could", "about", "change", "task", "work", "repo", "repository",
  "please", "make", "add", "fix", "use", "using", "need", "want",
]);

function parseArgs(argv) {
  const options = {
    level: 0,
    json: false,
    budget: DEFAULT_BUDGET,
    root: defaultRoot,
    scope: [],
    provider: process.env.AGENT_CONTEXT_PROVIDER || "auto",
    providerTimeout: DEFAULT_PROVIDER_TIMEOUT,
    base: "",
    head: "HEAD",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--full") options.level = 2;
    else if (arg === "--level") {
      const value = Number(argv[++index]);
      if (![0, 1, 2].includes(value)) throw new Error("--level must be 0, 1, or 2");
      options.level = value;
    } else if (arg === "--budget") {
      const value = Number(argv[++index]);
      if (!Number.isInteger(value) || value < MIN_CONTEXT_BUDGET) {
        throw new Error(`--budget must be an integer >= ${MIN_CONTEXT_BUDGET}`);
      }
      options.budget = value;
    } else if (arg === "--root") {
      options.root = path.resolve(argv[++index] || "");
    } else if (arg === "--provider") {
      options.provider = String(argv[++index] || "").toLowerCase();
    } else if (arg === "--provider-timeout") {
      const value = Number(argv[++index]);
      if (!Number.isInteger(value) || value < 50) throw new Error("--provider-timeout must be an integer >= 50 milliseconds");
      options.providerTimeout = value;
    } else if (arg === "--base") {
      options.base = String(argv[++index] || "");
    } else if (arg === "--head") {
      options.head = String(argv[++index] || "");
    } else if (arg.startsWith("--")) {
      throw new Error(`unknown option: ${arg}`);
    } else {
      options.scope.push(arg);
    }
  }
  if (!["auto", "local", "graphify", "openviking", "all"].includes(options.provider)) {
    throw new Error("--provider must be auto, local, graphify, openviking, or all");
  }
  if (options.head !== "HEAD" && !options.base) throw new Error("--head requires --base <verified-ref>");
  return options;
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

async function readText(root, relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function markdownFiles(root, directory, recursive = false) {
  const absolute = path.join(root, directory);
  try {
    const entries = await readdir(absolute, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const relative = normalizePath(path.join(directory, entry.name));
      if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative);
      else if (recursive && entry.isDirectory()) files.push(...await markdownFiles(root, relative, true));
    }
    return files.sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function git(root, args, { trim = true } = {}) {
  try {
    const output = execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return trim ? output.trim() : output.replace(/[\r\n]+$/, "");
  } catch {
    return "";
  }
}

function tokenize(value) {
  return [...new Set(String(value || "")
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9_.:/-]{2,}/g) || [])]
    .map((term) => term.replace(/^\/kb:/, ""))
    .filter((term) => !STOP_WORDS.has(term));
}

function titleOf(markdown, fallback) {
  return markdown?.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback;
}

function statusOf(markdown, fallback = "unknown") {
  return markdown?.match(/^>\s+\*\*Status:\*\*\s*(.+?)\s*$/im)?.[1]?.replaceAll("*", "").trim()
    || markdown?.match(/^>\s+Status:\s*(.+?)\s*$/im)?.[1]?.trim()
    || fallback;
}

function summarize(markdown, max = 220) {
  if (!markdown) return "";
  const text = markdown
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/^>\s?/gm, "")
    .replace(/\|/g, " ")
    .replace(/[*_`~\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function scoreDocument(document, terms, changedPaths) {
  const haystack = `${document.path}\n${document.title}\n${document.content}`.toLowerCase();
  let score = document.kind === "active-task" ? 100 : 0;
  if (document.kind === "prd-index") score += 18;
  if (document.kind === "prd") score += 10;
  for (const term of terms) {
    if (document.path.toLowerCase().includes(term)) score += 12;
    if (document.title.toLowerCase().includes(term)) score += 10;
    const matches = haystack.split(term).length - 1;
    score += Math.min(matches, 8) * 2;
  }
  for (const changed of changedPaths) {
    const base = path.posix.basename(changed).toLowerCase().replace(/\.[^.]+$/, "");
    if (base.length >= 3 && haystack.includes(base)) score += 4;
  }
  return score;
}

function relevantExcerpt(markdown, terms, maxChars = 2200) {
  if (!markdown) return "";
  const lines = markdown.split(/\r?\n/);
  if (terms.length === 0) return lines.slice(0, 45).join("\n").slice(0, maxChars);
  const indices = [];
  for (let i = 0; i < lines.length; i += 1) {
    const lower = lines[i].toLowerCase();
    if (terms.some((term) => lower.includes(term))) indices.push(i);
  }
  if (indices.length === 0) return lines.slice(0, 35).join("\n").slice(0, maxChars);
  const selected = new Set();
  for (const index of indices.slice(0, 8)) {
    let heading = index;
    while (heading > 0 && !/^#{1,6}\s+/.test(lines[heading])) heading -= 1;
    for (let i = Math.max(0, heading); i <= Math.min(lines.length - 1, index + 6); i += 1) selected.add(i);
  }
  const output = [...selected].sort((a, b) => a - b).map((index) => lines[index]).join("\n");
  return output.slice(0, maxChars);
}

function classifyRuleHints(terms, changedPaths = []) {
  const joined = `${terms.join(" ")} ${changedPaths.join(" ")}`.toLowerCase();
  const hints = new Set(["context"]);
  if (/auth|security|secret|permission|credential|session|login|identity|authorization/.test(joined)) hints.add("security");
  if (/release|deploy|production|rollback|migration/.test(joined)) hints.add("release");
  if (/test|verify|accept|bug|regression|ui|accessib/.test(joined)) hints.add("verification");
  if (/\.github|flaky|concurr|race|timeout|subprocess|worker|socket|port|network|cleanup|teardown|async/.test(joined)) hints.add("reliability");
  if (/plan|design|implement|refactor|feature|api|data/.test(joined)) hints.add("delivery");
  if (/suggest|policy|workflow|rule|governance/.test(joined)) hints.add("governance");
  return [...hints];
}

async function collectDocuments(root) {
  const documents = [];
  const add = async (relativePath, kind) => {
    const content = await readText(root, relativePath);
    if (content === null) return;
    documents.push({ path: relativePath, kind, title: titleOf(content, relativePath), content });
  };

  await add("AGENTS.md", "instruction");
  await add("CONTEXT.md", "context");
  await add("docs/prd/0000-prd-index.md", "prd-index");

  for (const file of await markdownFiles(root, "docs/prd")) {
    if (!file.endsWith("0000-prd-index.md")) await add(file, "prd");
  }
  for (const file of await markdownFiles(root, "docs/tasks")) {
    if (/\/((wip|blocked)-[^/]+\.md)$/.test(`/${file}`)) await add(file, "active-task");
    else if (/\/(todo-[^/]+\.md)$/.test(`/${file}`)) await add(file, "todo-task");
  }
  return documents;
}

function providerNames(mode) {
  if (mode === "local") return [];
  if (mode === "graphify") return ["graphify"];
  if (mode === "openviking") return ["openviking"];
  if (mode === "all") return ["graphify", "openviking"];
  return ["graphify"];
}

function allocateProviderBudgets(totalBudget, names) {
  const reserve = Math.max(0, totalBudget - MIN_LOCAL_BUDGET - 120);
  const desired = {
    graphify: Math.min(450, Math.floor(totalBudget * 0.30)),
    openviking: Math.min(300, Math.floor(totalBudget * 0.20)),
  };
  const requested = names.map((name) => [name, desired[name] || 0]);
  const desiredTotal = requested.reduce((sum, [, budget]) => sum + budget, 0);
  if (desiredTotal <= reserve) return Object.fromEntries(requested);
  if (reserve <= 0 || desiredTotal <= 0) return Object.fromEntries(names.map((name) => [name, 0]));
  const scale = reserve / desiredTotal;
  return Object.fromEntries(requested.map(([name, budget]) => [name, Math.floor(budget * scale)]));
}

async function retrieveProviders({ options, root, scope, changedPaths }) {
  const names = providerNames(options.provider);
  const budgets = allocateProviderBudgets(options.budget, names);
  const providers = [];
  for (const name of names) {
    if (name === "graphify") {
      providers.push(await retrieveGraphify({
        root,
        scope,
        budgetTokens: budgets.graphify,
        timeoutMs: options.providerTimeout,
        changedPaths,
      }));
    } else if (name === "openviking") {
      providers.push(await retrieveOpenViking({
        root,
        scope,
        budgetTokens: budgets.openviking,
        timeoutMs: options.providerTimeout,
      }));
    }
  }
  return providers;
}

async function buildLocalContext({ options, root, branch, changedPaths, scope, localBudget }) {
  const documents = await collectDocuments(root);
  const active = documents.filter((document) => document.kind === "active-task");
  const terms = tokenize(scope);
  const ruleHints = classifyRuleHints(terms, changedPaths);

  const ranked = documents
    .map((document) => ({ ...document, score: scoreDocument(document, terms, changedPaths) }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  const selected = ranked.filter((document) => document.score > 0 || document.kind === "active-task").slice(0, 8);
  if (!selected.some((document) => document.kind === "prd-index")) {
    const index = ranked.find((document) => document.kind === "prd-index");
    if (index) selected.push(index);
  }

  const local = {
    branch,
    changedPaths,
    activeTasks: active.map((task) => ({ path: task.path, title: task.title, status: statusOf(task.content, "active") })),
    ruleHints,
    selected: selected.map((document) => ({
      path: document.path,
      kind: document.kind,
      title: document.title,
      score: document.score,
      summary: summarize(document.content),
    })),
    documents: [],
  };

  if (options.level >= 1) {
    let remainingChars = Math.max(0, localBudget * 4 - JSON.stringify(local).length - 400);
    for (const document of selected) {
      if (remainingChars < 200) break;
      const maxChars = Math.min(options.level === 2 ? document.content.length : 2200, remainingChars);
      const content = options.level === 2
        ? document.content.slice(0, maxChars)
        : relevantExcerpt(document.content, terms, maxChars);
      local.documents.push({ path: document.path, content });
      remainingChars -= content.length + document.path.length + 80;
    }
  }
  return { ...local, estimatedTokens: estimateTokens(JSON.stringify(local)) };
}

function enforceBudget(result) {
  const update = () => {
    result.estimatedTokens = estimateTokens(JSON.stringify(result));
    return result.estimatedTokens - result.budgetTokens;
  };
  let over = update();
  if (over <= 0) return;

  for (let index = result.providers.length - 1; index >= 0 && over > 0; index -= 1) {
    const provider = result.providers[index];
    if (!provider.content) continue;
    provider.content = trimToBudget(provider.content, Math.max(0, provider.estimatedTokens - over - 8));
    provider.estimatedTokens = provider.content ? estimateTokens(provider.content) : 0;
    over = update();
  }
  for (let index = result.documents.length - 1; index >= 0 && over > 0; index -= 1) {
    const document = result.documents[index];
    const current = estimateTokens(document.content);
    document.content = trimToBudget(document.content, Math.max(0, current - over - 8));
    if (!document.content) result.documents.splice(index, 1);
    over = update();
  }
  for (let index = result.selected.length - 1; index >= 0 && over > 0; index -= 1) {
    const item = result.selected[index];
    const current = estimateTokens(item.summary);
    item.summary = trimToBudget(item.summary, Math.max(8, current - over - 4));
    over = update();
  }
  update();
}

async function buildContext(options) {
  const root = options.root;
  const branch = git(root, ["branch", "--show-current"]) || "unavailable";
  const status = git(root, ["status", "--short"], { trim: false });
  const worktreeChangedPaths = status.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim()).filter(Boolean);
  const outgoing = options.base
    ? collectChangeScope({ root, base: options.base, head: options.head })
    : null;
  const changedPaths = outgoing?.paths.all || worktreeChangedPaths;
  const documents = await collectDocuments(root);
  const active = documents.filter((document) => document.kind === "active-task");

  const explicitScope = options.scope.join(" ").trim();
  const fallbackScope = active.map((task) => `${task.title} ${summarize(task.content, 350)}`).join(" ")
    || changedPaths.join(" ")
    || path.basename(root);
  const scope = explicitScope || fallbackScope;

  const providers = await retrieveProviders({ options, root, scope, changedPaths });
  const externalTokens = providers.reduce((sum, provider) => sum + (provider.estimatedTokens || 0), 0);
  const localBudget = Math.max(300, options.budget - externalTokens - 150);
  const local = await buildLocalContext({ options, root, branch, changedPaths, scope, localBudget });

  const result = {
    schemaVersion: 4,
    level: options.level,
    budgetTokens: options.budget,
    localBudgetTokens: localBudget,
    providerMode: options.provider,
    root: normalizePath(root),
    repository: path.basename(root),
    scope,
    terms: tokenize(scope),
    git: {
      branch,
      changedPaths,
      ...(outgoing ? {
        outgoing: {
          base: outgoing.input.base,
          head: outgoing.input.head,
          mergeBaseSha: outgoing.resolved.mergeBaseSha,
          committedPaths: outgoing.paths.committed,
        },
      } : {}),
    },
    activeTasks: local.activeTasks,
    ruleHints: local.ruleHints,
    selected: local.selected,
    documents: local.documents,
    providers: [
      {
        name: "local",
        status: "ok",
        authority: "repository-first",
        budgetTokens: localBudget,
        estimatedTokens: local.estimatedTokens,
      },
      ...providers,
    ],
    budgetExceeded: false,
    decisionAuthority: [
      "human decision + approved acceptance",
      "active task change contract",
      "affected current PRD",
      "accepted/applied workflow policy",
      "completed-task/history rationale",
    ],
    observationEvidence: [
      "current source/config + real entry path",
      "fresh checks + external observation",
      "exact Git/outgoing scope",
      "Graphify derived relationships",
      "OpenViking/completed-task recall",
      "generated context/chat/local memory",
    ],
  };

  enforceBudget(result);
  result.budgetExceeded = result.estimatedTokens > options.budget;
  return result;
}

function renderText(result) {
  const lines = [
    "# Agent Context Pack",
    "",
    `- Repository: ${result.repository}`,
    `- Branch: ${result.git.branch}`,
    `- Level: L${result.level}`,
    `- Scope: ${result.scope}`,
    `- Estimated tokens: ~${result.estimatedTokens}/${result.budgetTokens}`,
    `- Provider mode: ${result.providerMode}`,
    `- Rule hints: ${result.ruleHints.join(", ") || "context"}`,
  ];

  if (result.git.outgoing) {
    lines.push(`- Outgoing base: ${result.git.outgoing.base} (merge base ${result.git.outgoing.mergeBaseSha.slice(0, 12)})`);
  }
  if (result.git.changedPaths.length) lines.push(`- Changed paths: ${result.git.changedPaths.join(", ")}`);
  lines.push("", "## Active task", "");
  if (result.activeTasks.length === 0) lines.push("- None detected.");
  else for (const task of result.activeTasks) lines.push(`- ${task.title} (${task.status}) — ${task.path}`);

  lines.push("", "## Ranked repository context", "");
  for (const document of result.selected) {
    lines.push(`- [${document.kind}] ${document.path} — score ${document.score}: ${document.summary}`);
  }

  const external = result.providers.filter((provider) => provider.name !== "local");
  if (external.length) {
    lines.push("", "## Optional provider evidence", "");
    for (const provider of external) {
      lines.push(`### ${provider.name}: ${provider.status}`);
      lines.push(`- Authority: ${provider.authority}`);
      if (provider.freshness) lines.push(`- Freshness: ${provider.freshness}`);
      if (provider.reason) lines.push(`- Note: ${provider.reason}`);
      if (provider.content) lines.push("", provider.content.trim());
      lines.push("");
    }
  }

  if (result.documents.length) {
    lines.push("", "## Loaded repository excerpts", "");
    for (const document of result.documents) {
      lines.push(`### ${document.path}`, "", document.content.trim(), "");
    }
  }
  if (result.budgetExceeded) lines.push("", "> Warning: estimated context exceeds the requested budget; use a narrower scope or lower level.");
  return `${lines.join("\n").trim()}\n`;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = await buildContext(options);
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : renderText(result));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
