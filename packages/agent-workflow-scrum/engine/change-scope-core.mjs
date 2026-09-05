import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkflowConfigSync, matchesPathGroup } from "./workflow-config.mjs";

const FORMAT_VERSION = 2;
const MAX_BUFFER = 32 * 1024 * 1024;
const DOCS_ROOT = ".agents/docs";

function runGit(cwd, args, { binary = false, context = "git command failed" } = {}) {
  const result = spawnSync("git", ["-C", cwd, "-c", "core.fsmonitor=false", ...args], {
    encoding: binary ? undefined : "utf8",
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LANG: "C", LC_ALL: "C" },
    maxBuffer: MAX_BUFFER,
    windowsHide: true,
  });
  if (result.status !== 0) {
    const stderr = binary ? Buffer.from(result.stderr || "").toString("utf8") : String(result.stderr || "");
    const detail = result.error?.message || stderr.trim() || `git exited with status ${result.status}`;
    throw new Error(`${context}: ${detail}`);
  }
  return result.stdout;
}

function repositoryRoot(cwd) {
  return String(runGit(cwd, ["rev-parse", "--show-toplevel"], { context: "cannot locate Git worktree" })).trim();
}

function resolveCommit(root, label, ref) {
  if (!ref) throw new Error(`missing required ${label} ref`);
  const result = spawnSync(
    "git",
    ["-C", root, "-c", "core.fsmonitor=false", "-c", "core.warnAmbiguousRefs=true", "rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`],
    {
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LANG: "C", LC_ALL: "C" },
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
    },
  );
  if (/\bambiguous\b/i.test(String(result.stderr || ""))) {
    throw new Error(`${label} ref ${JSON.stringify(ref)} is ambiguous; use a fully qualified ref or commit SHA`);
  }
  if (result.status !== 0) {
    const detail = result.error?.message || String(result.stderr || "").trim() || `git exited with status ${result.status}`;
    throw new Error(`${label} ref ${JSON.stringify(ref)} does not resolve to a commit: ${detail}`);
  }
  const commits = String(result.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  if (commits.length !== 1) throw new Error(`${label} ref ${JSON.stringify(ref)} did not resolve to exactly one commit`);
  return commits[0];
}

function resolveMergeBase(root, baseSha, headSha) {
  const output = String(runGit(root, ["merge-base", "--all", baseSha, headSha], { context: "cannot resolve merge base" }));
  const mergeBases = output.trim().split(/\r?\n/).filter(Boolean);
  if (mergeBases.length !== 1) throw new Error(`base and head do not have a unique merge base; found ${mergeBases.length}`);
  return mergeBases[0];
}

function parseNulPaths(output) {
  const buffer = Buffer.isBuffer(output) ? output : Buffer.from(output || "");
  const paths = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index > start) paths.push(buffer.subarray(start, index).toString("utf8"));
    start = index + 1;
  }
  return [...new Set(paths)].sort();
}

function diffPaths(root, args, context) {
  return parseNulPaths(runGit(root, [
    "diff",
    "--no-ext-diff",
    "--no-textconv",
    "--no-renames",
    "--ignore-submodules=none",
    "--name-only",
    "-z",
    ...args,
    "--",
  ], { binary: true, context }));
}

function pathLayers(file, config) {
  const value = file.replaceAll("\\", "/");
  const docsPrefix = `${DOCS_ROOT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`;
  const layers = new Set();
  if (matchesPathGroup(value, config, "product")) layers.add("product");
  if (matchesPathGroup(value, config, "tests")) layers.add("tests");
  if (matchesPathGroup(value, config, "docs")) layers.add("docs");
  if (new RegExp(`^${docsPrefix}prd/`).test(value)) layers.add("prd");
  if (new RegExp(`^${docsPrefix}plans/`).test(value)) layers.add("plans");
  if (new RegExp(`^${docsPrefix}tasks/`).test(value)) layers.add("tasks");
  if (new RegExp(`^${docsPrefix}(?:proposals|suggestions)/`).test(value)) layers.add("governance");
  if (matchesPathGroup(value, config, "workflow")) layers.add("workflow");
  if (/^(?:packages\/agent-workflow-scrum\/engine|scripts)\/context\/providers\//.test(value)) layers.add("providers");
  if (matchesPathGroup(value, config, "ci")) layers.add("ci");
  if (/^(package(?:-lock)?\.json$|pnpm-lock\.yaml$|yarn\.lock$|bun\.lockb?$|Cargo\.(?:toml|lock)$|go\.(?:mod|sum)$|pyproject\.toml$)/.test(value)) layers.add("dependencies");
  if (matchesPathGroup(value, config, "build")) layers.add("build");
  if (layers.size === 0) layers.add("other");
  return [...layers];
}

export function classifyChangedPaths(paths, config = loadWorkflowConfigSync()) {
  const output = {};
  for (const file of paths) {
    for (const layer of pathLayers(file, config)) {
      if (!output[layer]) output[layer] = [];
      output[layer].push(file);
    }
  }
  return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
}

export function collectChangeScope({ root = process.cwd(), base, head = "HEAD" } = {}) {
  if (!base) throw new Error("missing required --base <ref>; verify the live PR base or stack parent instead of guessing");
  const repoRoot = repositoryRoot(root);
  const baseSha = resolveCommit(repoRoot, "base", base);
  const headSha = resolveCommit(repoRoot, "head", head);
  const mergeBaseSha = resolveMergeBase(repoRoot, baseSha, headSha);
  const paths = {
    committed: diffPaths(repoRoot, [mergeBaseSha, headSha], "cannot inspect committed paths"),
    ...dirtyPaths(repoRoot),
  };
  const all = [...new Set(Object.values(paths).flat())].sort();
  const config = loadWorkflowConfigSync(repoRoot);
  return {
    formatVersion: FORMAT_VERSION,
    repositoryRoot: repoRoot,
    docsRoot: DOCS_ROOT,
    input: { base, head },
    resolved: { baseSha, headSha, mergeBaseSha },
    paths: { ...paths, all },
    layers: classifyChangedPaths(all, config),
  };
}

function dirtyPaths(repoRoot) {
  return {
    staged: diffPaths(repoRoot, ["--cached"], "cannot inspect staged paths"),
    unstaged: diffPaths(repoRoot, [], "cannot inspect unstaged paths"),
    untracked: parseNulPaths(runGit(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z", "--"], {
      binary: true,
      context: "cannot inspect untracked paths",
    })),
  };
}

/** Inspect only staged, unstaged and untracked paths; does not infer a branch base. */
export function collectWorkingTreeScope({ root = process.cwd() } = {}) {
  const repoRoot = repositoryRoot(root);
  const paths = dirtyPaths(repoRoot);
  const all = [...new Set(Object.values(paths).flat())].sort();
  const config = loadWorkflowConfigSync(repoRoot);
  return {
    formatVersion: FORMAT_VERSION,
    repositoryRoot: repoRoot,
    docsRoot: DOCS_ROOT,
    paths: { ...paths, all },
    layers: classifyChangedPaths(all, config),
  };
}

function parseArgs(argv) {
  const options = { root: process.cwd(), base: "", head: "HEAD" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") options.base = argv[++index] || "";
    else if (arg === "--head") options.head = argv[++index] || "";
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

export function renderChangeScope(argv, cwd = process.cwd()) {
  const options = parseArgs(argv);
  const report = collectChangeScope({ ...options, root: options.root || cwd });
  return `${JSON.stringify(report, null, 2)}\n`;
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(renderChangeScope(process.argv.slice(2), process.cwd()));
  } catch (error) {
    console.error(`change-scope: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
