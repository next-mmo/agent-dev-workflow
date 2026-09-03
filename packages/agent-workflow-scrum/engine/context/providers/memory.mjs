import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { baseProvider, estimateTokens, trimToBudget } from "./common.mjs";

/**
 * Parse YAML frontmatter from a Markdown string.
 * Returns { meta: {title, tags, problem, solution, scope}, body }.
 * Handles only the subset of YAML we need — no dependency.
 */
function parseFrontmatter(content) {
  const text = String(content || "").replace(/^\uFEFF/, "");
  const fenceMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fenceMatch) return { meta: {}, body: text };

  const yamlBlock = fenceMatch[1];
  const meta = {};
  for (const line of yamlBlock.split(/\r?\n/)) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!kvMatch) continue;
    const [, key, rawValue] = kvMatch;
    let value = rawValue.trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Parse inline array [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((t) => t.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    meta[key] = value;
  }
  const body = text.slice(fenceMatch[0].length).trim();
  return { meta, body };
}

/**
 * Tokenize a scope string into normalised lowercase terms.
 */
function tokenizeScope(scope) {
  return String(scope || "")
    .toLowerCase()
    .split(/[\s/\-_.,:;|]+/)
    .filter((t) => t.length > 1);
}

/**
 * Score a memory entry against scope terms.
 * Tags weighted 2×, title 1.5×, other fields 1×.
 */
function scoreEntry(entry, terms) {
  if (terms.length === 0) return 0;

  const tagsText = (Array.isArray(entry.meta.tags) ? entry.meta.tags.join(" ") : String(entry.meta.tags || "")).toLowerCase();
  const titleText = String(entry.meta.title || "").toLowerCase();
  const scopeText = String(entry.meta.scope || "").toLowerCase();
  const problemText = String(entry.meta.problem || "").toLowerCase();
  const solutionText = String(entry.meta.solution || "").toLowerCase();
  const bodyText = entry.body.toLowerCase().slice(0, 500);

  let score = 0;
  for (const term of terms) {
    if (tagsText.includes(term)) score += 2.0;
    if (titleText.includes(term)) score += 1.5;
    if (scopeText.includes(term)) score += 1.2;
    if (problemText.includes(term)) score += 1.0;
    if (solutionText.includes(term)) score += 1.0;
    if (bodyText.includes(term)) score += 0.5;
  }
  // Normalise by number of terms so longer scopes don't inflate scores
  return score / terms.length;
}

/**
 * Scan a directory for .md files (non-recursive), parse frontmatter, return entries.
 */
async function loadEntries(dirPath, contextType) {
  if (!existsSync(dirPath)) return [];
  const entries = [];
  const files = await readdir(dirPath, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".md")) continue;
    if (file.name === "README.md" || file.name === "0000-template.md") continue;
    try {
      const content = await readFile(path.join(dirPath, file.name), "utf8");
      const { meta, body } = parseFrontmatter(content);
      entries.push({
        file: file.name,
        contextType,
        meta,
        body,
      });
    } catch {
      // Skip unreadable files
    }
  }
  return entries;
}

/**
 * Format ranked matches as compact recall lines.
 */
function formatMatches(matches, budgetTokens) {
  if (matches.length === 0) return "No relevant native memory matches.";

  const lines = [];
  for (const match of matches) {
    const type = match.contextType;
    const score = match.score.toFixed(2);
    const title = match.meta.title || match.file;
    const summary = String(match.meta.problem || match.meta.scope || match.meta.solution || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    lines.push(`- [${type} score=${score}] ${title}${summary ? ` — ${summary}` : ""}`);
    if (estimateTokens(lines.join("\n")) >= budgetTokens) break;
  }
  return trimToBudget(lines.join("\n"), budgetTokens);
}

/**
 * Native memory provider — scans solutions/ and memory/ for scope-relevant recall.
 * Zero-dependency alternative inspired by OpenViking's semantic retrieval pattern.
 */
export async function retrieveNativeMemory({ root, scope, budgetTokens }) {
  const provider = baseProvider("memory", budgetTokens, {
    authority: "native-recall",
    source: "file-based memory and solutions",
  });

  if (budgetTokens < 60) {
    return { ...provider, status: "skipped", reason: "insufficient context budget" };
  }

  const start = Date.now();
  const terms = tokenizeScope(scope);

  // Load from both knowledge stores
  const solutionsDir = path.join(root, ".agents", "docs", "solutions");
  const memoryDir = path.join(root, ".agents", "docs", "memory");
  const [solutions, memories] = await Promise.all([
    loadEntries(solutionsDir, "solution"),
    loadEntries(memoryDir, "memory"),
  ]);

  const allEntries = [...solutions, ...memories];
  if (allEntries.length === 0) {
    return {
      ...provider,
      status: "ok",
      content: "No memory or solution entries found.",
      estimatedTokens: estimateTokens("No memory or solution entries found."),
      durationMs: Date.now() - start,
    };
  }

  // Score and rank
  const scored = allEntries
    .map((entry) => ({ ...entry, score: scoreEntry(entry, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const content = formatMatches(scored, budgetTokens);
  return {
    ...provider,
    status: "ok",
    content,
    estimatedTokens: estimateTokens(content),
    durationMs: Date.now() - start,
  };
}

// Export internals for testing
export { parseFrontmatter, tokenizeScope, scoreEntry };
