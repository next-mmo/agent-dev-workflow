import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { documentationTemplates } from "./scaffold.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = path.join(packageRoot, "templates");
const packageManagers = new Set(["npm", "pnpm", "yarn", "bun"]);
const forbiddenDirectories = [".agents/scripts", ".agents/skills", ".agents/benchmark"];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv, cwd) {
  const options = { root: cwd, existing: false, dryRun: false, json: false, packageManager: "", mode: "standard", positional: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--existing") options.existing = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--package-manager") options.packageManager = argv[++index] || "";
    else if (arg === "--mode") options.mode = argv[++index] || "";
    else if (arg.startsWith("--")) throw new Error(`unknown option: ${arg}`);
    else options.positional.push(arg);
  }
  if (options.positional.length > 1) throw new Error("init accepts at most one target path");
  if (options.positional.length) options.root = path.resolve(cwd, options.positional[0]);
  if (options.packageManager && !packageManagers.has(options.packageManager)) {
    throw new Error("--package-manager must be npm, pnpm, yarn, or bun");
  }
  if (!["vibe", "standard", "strict", "guided"].includes(options.mode)) {
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
      docs: ["README.md", "AGENT-QUICKSTART.md", ".agents/docs/**"],
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
    docBudgets: {
      "AGENT-QUICKSTART.md": 2200,
      "AGENTS.md": 800,
      "CONTEXT.md": 1400,
      ".agents/docs/prd/0000-prd-index.md": 600,
      ".agents/docs/tasks/README.md": 700,
      ".agents/docs/proposals/README.md": 700,
      ".agents/docs/AGENTS.md": 900,
      ".agents/docs/agent-workflow.md": 1400,
      ".agents/docs/architecture.md": 2000,
      ".agents/docs/development.md": 1600,
      ".agents/docs/testing.md": 1200,
      ".agents/docs/defensive-patterns.md": 1000,
    },
  };
}

async function renderedTemplate(name, replacements = {}) {
  let content = await readFile(path.join(templateRoot, name), "utf8");
  for (const [key, value] of Object.entries(replacements)) content = content.replaceAll(`{{${key}}}`, value);
  return content;
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
  if (meaningful.length && !options.existing) {
    throw new Error(`target is not empty: ${options.root}; pass --existing to preserve existing files`);
  }

  const packageManager = options.packageManager || await detectPackageManager(options.root);
  const scripts = await packageScripts(options.root);
  const localRunner = runner(packageManager);
  const today = new Date().toISOString().slice(0, 10);
  const files = new Map([
    ["AGENTS.md", await renderedTemplate("AGENTS.md", { RUNNER: localRunner })],
    ["CONTEXT.md", await renderedTemplate("CONTEXT.md")],
    [".agents/config.json", `${JSON.stringify(configFor(packageManager, scripts, options.mode), null, 2)}\n`],
    [".agents/docs/prd/0000-prd-index.md", await renderedTemplate("prd-index.md", { TODAY: today })],
    ...await Promise.all(Object.entries(documentationTemplates).map(async ([target, template]) =>
      [target, await renderedTemplate(template, { RUNNER: localRunner })])),
  ]);

  const created = [];
  const preserved = [];
  for (const [relativePath, content] of files) {
    const absolutePath = path.join(options.root, relativePath);
    if (await exists(absolutePath)) {
      preserved.push(relativePath);
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
    schemaVersion: 1,
    root: options.root.replaceAll("\\", "/"),
    packageManager,
    dryRun: options.dryRun,
    skillsCommand: `${localRunner} skills --json`,
    created,
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
    `- Package manager: ${packageManager}`,
    `- Created: ${created.length ? created.join(", ") : "none"}`,
    `- Preserved: ${preserved.length ? preserved.join(", ") : "none"}`,
    "- Reusable scripts, skills, and benchmarks copied: none",
  ];
  if (presentForbidden.length) lines.push(`- Existing vendored directories left unchanged: ${presentForbidden.join(", ")}`);
  lines.push(`- Next: ${localRunner} doctor`);
  lines.push(`- Skills: run ${localRunner} skills --json and load the reported plugin or skills path through your agent host`);
  return { ...result, json: false, output: `${lines.join("\n")}\n` };
}
