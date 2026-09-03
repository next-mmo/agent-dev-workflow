import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = path.join(packageRoot, "templates");
const packageManagers = new Set(["npm", "pnpm", "yarn", "bun"]);
const workflowModes = new Set(["vibe", "standard", "strict", "guided"]);
const forbiddenDirectories = [".agents/scripts", ".agents/skills", ".agents/benchmark"];
const agentHandoffStart = "<!-- agent-workflow-scrum:start -->";
const agentHandoffEnd = "<!-- agent-workflow-scrum:end -->";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv, cwd) {
  const options = {
    root: cwd,
    existing: false,
    dryRun: false,
    json: false,
    packageManager: "",
    mode: "",
    modeProvided: false,
    positional: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--existing") options.existing = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--package-manager") options.packageManager = argv[++index] || "";
    else if (arg === "--mode") {
      options.mode = argv[++index] || "";
      options.modeProvided = true;
    } else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else options.positional.push(arg);
  }
  if (options.positional.length > 1) throw new Error("init accepts at most one target path");
  if (options.positional.length) options.root = path.resolve(cwd, options.positional[0]);
  if (options.packageManager && !packageManagers.has(options.packageManager)) {
    throw new Error("--package-manager must be npm, pnpm, yarn, or bun");
  }
  if (options.modeProvided && !workflowModes.has(options.mode)) {
    throw new Error("--mode must be vibe, standard, strict, or guided");
  }
  return options;
}

async function detectPackageManager(root) {
  const candidates = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];
  for (const [lockfile, manager] of candidates) {
    if (await exists(path.join(root, lockfile))) return manager;
  }
  return "npm";
}

async function packageScripts(root) {
  try {
    const parsed = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    return parsed?.scripts && typeof parsed.scripts === "object" ? parsed.scripts : {};
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw new Error(`package.json: invalid JSON: ${error.message}`);
  }
}

async function readExistingConfig(root) {
  const configPath = path.join(root, ".agents/config.json");
  if (!await exists(configPath)) return null;
  try {
    const parsed = JSON.parse(await readFile(configPath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("expected a JSON object");
    }
    return parsed;
  } catch (error) {
    throw new Error(`.agents/config.json: invalid JSON: ${error.message}`);
  }
}

function runner(packageManager) {
  if (packageManager === "pnpm") return "pnpm exec -- agent-workflow";
  if (packageManager === "yarn") return "yarn agent-workflow";
  if (packageManager === "bun") return "bun run agent-workflow";
  return "npm exec -- agent-workflow";
}

function scriptCommand(packageManager, name, scripts) {
  if (!scripts[name]) return null;
  if (packageManager === "npm") return name === "test" ? "npm test" : `npm run ${name}`;
  if (packageManager === "bun") return name === "test" ? "bun test" : `bun run ${name}`;
  return `${packageManager} ${name}`;
}

function configFor(packageManager, scripts, mode = "standard") {
  const localRunner = runner(packageManager);
  return {
    schemaVersion: 1,
    mode,
    packageManager,
    paths: {
      product: ["src/**", "apps/**", "packages/**", "crates/**", "public/**", "index.html"],
      tests: ["tests/**", "**/tests/**", "**/*.test.*", "**/*.spec.*"],
      docs: ["README.md", ".agents/docs/**"],
      workflow: ["AGENTS.md", "CONTEXT.md", ".agents/**"],
      ci: [".github/**"],
      build: ["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock*", "Cargo.*", "vite.config.*", "tsconfig*", "Dockerfile*", "docker-compose*"],
    },
    checks: {
      test: scriptCommand(packageManager, "test", scripts),
      build: scriptCommand(packageManager, "build", scripts),
      workflow: `${localRunner} check`,
      docs: `${localRunner} docs`,
      skills: null,
    },
    contextBudgets: {
      "AGENTS.md": 800,
      "CONTEXT.md": 1400,
    },
  };
}

async function renderedTemplate(name, replacements = {}) {
  let content = await readFile(path.join(templateRoot, name), "utf8");
  for (const [key, value] of Object.entries(replacements)) content = content.replaceAll(`{{${key}}}`, value);
  return content;
}

function agentHandoff(template) {
  const body = template.replace(/^# Agent Instructions\s*\n+/i, "").trim();
  return `${agentHandoffStart}\n## Agent Workflow Scrum\n${body}\n${agentHandoffEnd}`;
}

async function ensureAgentInstructions(root, template, dryRun) {
  const absolutePath = path.join(root, "AGENTS.md");
  const block = agentHandoff(template);
  if (!await exists(absolutePath)) {
    if (!dryRun) {
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, `# Agent Instructions\n\n${block}\n`, { encoding: "utf8", flag: "wx" });
    }
    return "created";
  }

  const current = await readFile(absolutePath, "utf8");
  const startIndex = current.indexOf(agentHandoffStart);
  const endStart = current.indexOf(agentHandoffEnd);
  const hasStart = startIndex >= 0;
  const hasEnd = endStart >= 0;
  if (hasStart !== hasEnd || (hasStart && endStart < startIndex)) {
    throw new Error("AGENTS.md: Agent Workflow Scrum managed markers are incomplete or out of order; repair the marker-bounded block before re-running init");
  }
  if (hasStart) {
    const secondStart = current.indexOf(agentHandoffStart, startIndex + agentHandoffStart.length);
    const secondEnd = current.indexOf(agentHandoffEnd, endStart + agentHandoffEnd.length);
    if (secondStart >= 0 || secondEnd >= 0) {
      throw new Error("AGENTS.md: multiple Agent Workflow Scrum managed blocks detected; keep exactly one marker-bounded block before re-running init");
    }
    const endIndex = endStart + agentHandoffEnd.length;
    const existingBlock = current.slice(startIndex, endIndex);
    if (existingBlock === block) return "preserved";
    if (!dryRun) {
      await writeFile(absolutePath, `${current.slice(0, startIndex)}${block}${current.slice(endIndex)}`, "utf8");
    }
    return "updated";
  }

  const hasLegacyWorkflow = current.includes("Humans own outcomes, priority, acceptance, and workflow policy")
    && current.includes(".agents/config.json");
  if (hasLegacyWorkflow) return "preserved";

  if (!dryRun) {
    const merged = `${current.trimEnd()}\n\n${block}\n`;
    await writeFile(absolutePath, merged, "utf8");
  }
  return "updated";
}

export async function initializeProject(argv, cwd = process.cwd()) {
  const options = parseArgs(argv, cwd);
  let entries;
  try {
    entries = await readdir(options.root);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    entries = [];
  }
  const meaningful = entries.filter((entry) => entry !== ".git");
  const existingProject = meaningful.length > 0;

  const existingConfig = await readExistingConfig(options.root);
  const detectedPackageManager = await detectPackageManager(options.root);
  const configuredPackageManager = typeof existingConfig?.packageManager === "string" && packageManagers.has(existingConfig.packageManager)
    ? existingConfig.packageManager
    : "";
  const packageManager = options.packageManager || configuredPackageManager || detectedPackageManager;
  const configuredMode = typeof existingConfig?.mode === "string" && workflowModes.has(existingConfig.mode)
    ? existingConfig.mode
    : "standard";
  const mode = options.modeProvided ? options.mode : configuredMode;
  const scripts = await packageScripts(options.root);
  const localRunner = runner(packageManager);
  const today = new Date().toISOString().slice(0, 10);
  const renderedAgents = await renderedTemplate("AGENTS.md", { RUNNER: localRunner });

  let configContent;
  let configNeedsUpdate = false;
  if (existingConfig) {
    const nextConfig = { ...existingConfig };
    if (options.modeProvided && nextConfig.mode !== mode) {
      nextConfig.mode = mode;
      configNeedsUpdate = true;
    }
    if (options.packageManager && nextConfig.packageManager !== packageManager) {
      nextConfig.packageManager = packageManager;
      configNeedsUpdate = true;
    }
    configContent = `${JSON.stringify(nextConfig, null, 2)}\n`;
  } else {
    configContent = `${JSON.stringify(configFor(packageManager, scripts, mode), null, 2)}\n`;
  }

  const files = new Map([
    ["CONTEXT.md", await renderedTemplate("CONTEXT.md")],
    [".agents/config.json", configContent],
    [".agents/docs/doc-budgets.json", await renderedTemplate("doc-budgets.json")],
    [".agents/docs/prd/0000-prd-index.md", await renderedTemplate("prd-index.md", { TODAY: today })],
    [".agents/docs/tasks/README.md", await renderedTemplate("tasks-readme.md")],
    [".agents/docs/suggestions/README.md", await renderedTemplate("suggestions-readme.md")],
  ]);

  const created = [];
  const updated = [];
  const preserved = [];
  const agentAction = await ensureAgentInstructions(options.root, renderedAgents, options.dryRun);
  if (agentAction === "created") created.push("AGENTS.md");
  else if (agentAction === "updated") updated.push("AGENTS.md");
  else preserved.push("AGENTS.md");

  for (const [relativePath, content] of files) {
    const absolutePath = path.join(options.root, relativePath);
    if (await exists(absolutePath)) {
      if (relativePath === ".agents/config.json" && configNeedsUpdate) {
        updated.push(relativePath);
        if (!options.dryRun) await writeFile(absolutePath, content, "utf8");
      } else {
        preserved.push(relativePath);
      }
      continue;
    }
    created.push(relativePath);
    if (!options.dryRun) {
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content, { encoding: "utf8", flag: "wx" });
    }
  }

  const presentForbidden = [];
  for (const relativePath of forbiddenDirectories) {
    if (await exists(path.join(options.root, relativePath))) presentForbidden.push(relativePath);
  }
  const result = {
    schemaVersion: 2,
    root: options.root.replaceAll("\\", "/"),
    packageManager,
    mode,
    existingProject,
    dryRun: options.dryRun,
    created,
    updated,
    preserved,
    forbiddenDirectoriesCreated: [],
    existingForbiddenDirectories: presentForbidden,
  };
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return { ...result, json: true, output: "" };
  }
  const lines = [
    `${options.dryRun ? "Would initialize" : "Initialized"} Agent Workflow Scrum in ${options.root}`,
    `- Existing project detected: ${existingProject ? "yes; existing files are preserved" : "no"}`,
    `- Package manager: ${packageManager}`,
    `- Mode: ${mode}`,
    `- Created: ${created.length ? created.join(", ") : "none"}`,
    `- Updated: ${updated.length ? updated.join(", ") : "none"}`,
    `- Preserved: ${preserved.length ? preserved.join(", ") : "none"}`,
    "- Reusable scripts, skills, and benchmarks copied: none",
  ];
  if (options.existing) lines.push("- Note: --existing is retained for compatibility; existing-project safety is now automatic");
  if (presentForbidden.length) lines.push(`- Existing vendored directories left unchanged: ${presentForbidden.join(", ")}`);
  lines.push(`- Next: ${localRunner} doctor`);
  return { ...result, json: false, output: `${lines.join("\n")}\n` };
}
