import { readFileSync } from "node:fs";
import path from "node:path";

export const CONFIG_PATH = ".agents/config.json";
export const SUPPORTED_PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"];
export const SUPPORTED_MODES = ["vibe", "standard", "strict", "guided"];
export const DEFAULT_MODE = "standard";

export const DEFAULT_RETENTION_DAYS = 14; // 2 weeks default

const defaultConfig = Object.freeze({
  schemaVersion: 1,
  mode: DEFAULT_MODE,
  packageManager: "npm",
  archive: {
    autoArchiveDone: true,
    retentionDays: DEFAULT_RETENTION_DAYS,
  },
  paths: {
    product: ["src/**", "public/**", "index.html"],
    tests: ["tests/**", "**/*.test.*", "**/*.spec.*"],
    docs: ["README.md", ".agents/docs/**"],
    workflow: ["AGENTS.md", "CONTEXT.md", ".agents/**"],
    ci: [".github/**"],
    build: [
      "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb",
      "Cargo.toml", "Cargo.lock", "go.mod", "go.sum", "pyproject.toml", "vite.config.*",
      "tsconfig*", "eslint*", "biome*", "Dockerfile*", "docker-compose*",
    ],
  },
  ignore: [
    "dist/**",
    "coverage/**",
    "**/*.min.js",
    "**/*.min.css",
    "**/*.map",
    "node_modules/**",
    ".playwright-mcp/**",
    "scratch/**",
  ],
  checks: {
    test: "npm test",
    build: "npm run build",
    workflow: "npm exec -- agent-workflow check",
    docs: "npm exec -- agent-workflow docs",
    skills: null,
  },
  contextBudgets: {
    "AGENTS.md": 800,
    "CONTEXT.md": 1400,
  },
});

const legacyConfig = Object.freeze({
  ...defaultConfig,
  checks: {
    test: "npm test",
    build: "npm run build",
    workflow: "npm run workflow:check --",
    docs: "npm run docs:check",
    skills: ".agents/scripts/skill.sh check",
  },
});

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultConfig));
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function validateStringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`${CONFIG_PATH}: ${label} must be an array of non-empty strings`);
  }
  return value.map((item) => item.replaceAll("\\", "/"));
}

export function normalizeWorkflowConfig(input = {}) {
  const defaults = cloneDefaults();
  const source = objectOrEmpty(input);
  if (source.schemaVersion !== undefined && source.schemaVersion !== 1) {
    throw new Error(`${CONFIG_PATH}: schemaVersion must be 1`);
  }
  const envMode = (process.env.WORKFLOW_MODE || process.env.AGENT_WORKFLOW_MODE || "").trim().toLowerCase();
  const rawMode = (envMode && SUPPORTED_MODES.includes(envMode)) ? envMode : (source.mode ?? defaults.mode);
  const mode = String(rawMode || "").trim().toLowerCase();
  if (!SUPPORTED_MODES.includes(mode)) {
    throw new Error(`${CONFIG_PATH}: mode must be one of: ${SUPPORTED_MODES.join(", ")}`);
  }
  const packageManager = source.packageManager ?? defaults.packageManager;
  if (!SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
    throw new Error(`${CONFIG_PATH}: packageManager must be ${SUPPORTED_PACKAGE_MANAGERS.join(", ")}`);
  }

  const sourcePaths = objectOrEmpty(source.paths);
  const paths = {};
  for (const [group, fallback] of Object.entries(defaults.paths)) {
    paths[group] = sourcePaths[group] === undefined
      ? fallback
      : validateStringArray(sourcePaths[group], `paths.${group}`);
  }

  const sourceChecks = objectOrEmpty(source.checks);
  const checks = {};
  for (const [name, fallback] of Object.entries(defaults.checks)) {
    const value = sourceChecks[name] === undefined ? fallback : sourceChecks[name];
    if (value !== null && (typeof value !== "string" || !value.trim())) {
      throw new Error(`${CONFIG_PATH}: checks.${name} must be a non-empty string or null`);
    }
    checks[name] = value;
  }

  const sourceBudgets = source.contextBudgets === undefined
    ? defaults.contextBudgets
    : objectOrEmpty(source.contextBudgets);
  const contextBudgets = {};
  for (const [file, budget] of Object.entries(sourceBudgets)) {
    if (!file || !Number.isInteger(budget) || budget < 100) {
      throw new Error(`${CONFIG_PATH}: invalid contextBudgets entry for ${file || "<empty>"}`);
    }
    contextBudgets[file.replaceAll("\\", "/")] = budget;
  }

  const sourceArchive = source.archive === undefined
    ? defaults.archive
    : (typeof source.archive === "boolean"
      ? { autoArchiveDone: source.archive, retentionDays: DEFAULT_RETENTION_DAYS }
      : objectOrEmpty(source.archive));

  const autoArchiveDone = sourceArchive.autoArchiveDone !== undefined
    ? Boolean(sourceArchive.autoArchiveDone)
    : (sourceArchive.enabled !== undefined ? Boolean(sourceArchive.enabled) : true);

  let retentionDays = DEFAULT_RETENTION_DAYS;
  if (sourceArchive.retentionDays !== undefined) {
    const days = Number(sourceArchive.retentionDays);
    if (!Number.isInteger(days) || days < 1) {
      throw new Error(`${CONFIG_PATH}: archive.retentionDays must be an integer >= 1`);
    }
    retentionDays = days;
  }

  const ignore = source.ignore === undefined
    ? defaults.ignore
    : validateStringArray(source.ignore, "ignore");

  const archive = {
    autoArchiveDone,
    retentionDays,
  };

  return { schemaVersion: 1, mode, packageManager, paths, ignore, checks, contextBudgets, archive };
}

export function loadWorkflowConfigSync(root = process.cwd()) {
  const configPath = path.join(root, CONFIG_PATH);
  try {
    return normalizeWorkflowConfig(JSON.parse(readFileSync(configPath, "utf8")));
  } catch (error) {
    if (error?.code === "ENOENT") return normalizeWorkflowConfig(legacyConfig);
    if (error instanceof SyntaxError) throw new Error(`${CONFIG_PATH}: invalid JSON: ${error.message}`);
    throw error;
  }
}

export async function loadWorkflowConfig(root = process.cwd()) {
  return loadWorkflowConfigSync(root);
}

function globRegex(pattern) {
  const normalized = pattern.replaceAll("\\", "/").replace(/^\.\//, "");
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const withGlobstarDirectory = escaped.replaceAll("**/", "\u0001");
  const withGlobstar = withGlobstarDirectory.replaceAll("**", "\u0000");
  const withStars = withGlobstar.replaceAll("*", "[^/]*");
  return new RegExp(`^${withStars.replaceAll("\u0001", "(?:.*/)?").replaceAll("\u0000", ".*")}$`);
}

export function matchesPathPattern(file, pattern) {
  return globRegex(pattern).test(String(file || "").replaceAll("\\", "/").replace(/^\.\//, ""));
}

export function matchesPathGroup(file, config, group) {
  return (config.paths[group] || []).some((pattern) => matchesPathPattern(file, pattern));
}

export function commandWithArgs(command, args = []) {
  if (!command) return null;
  const suffix = args.join(" ");
  return command.includes("{args}")
    ? command.replace("{args}", suffix)
    : `${command}${suffix ? ` ${suffix}` : ""}`;
}
