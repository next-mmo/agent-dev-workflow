import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptSource = path.join(repositoryRoot, ".agents/scripts");
const skillSource = path.join(repositoryRoot, ".agents/skills");
const pluginRoot = path.join(repositoryRoot, "plugins/agent-workflow-scrum");
const packageRoot = path.join(repositoryRoot, "packages/agent-workflow-scrum");
const engineTarget = path.join(packageRoot, "engine");
const pluginSkillsTarget = path.join(pluginRoot, "skills");
const packagePluginTarget = path.join(packageRoot, "plugin");
const engineFiles = [
  "change-scope-core.mjs",
  "change-scope.mjs",
  "context-core.mjs",
  "doc-check-core.mjs",
  "report.mjs",
  "verify-plan-core.mjs",
  "verify-plan.mjs",
  "workflow-check-core.mjs",
  "workflow-config.mjs",
  "mode-core.mjs",
  "mode.mjs",
  "archive-core.mjs",
  "archive.mjs",
  "plan-core.mjs",
  "plan.mjs",
  "ignore-core.mjs",
  "index-core.mjs",
  "index.mjs",
  "review-core.mjs",
  "review.mjs",
  "solve-core.mjs",
  "solve.mjs",
  "worktree-core.mjs",
  "worktree.mjs",
  "prd-sync-core.mjs",
  "prd-sync.mjs",
  "codebase-graph-core.mjs",
  "context/providers/common.mjs",
  "context/providers/codebase.mjs",
  "context/providers/graphify.mjs",
  "context/providers/openviking.mjs",
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assertGeneratedTarget(target) {
  const allowed = [engineTarget, pluginSkillsTarget, packagePluginTarget];
  if (!allowed.includes(path.resolve(target))) throw new Error(`refusing to replace unexpected path: ${target}`);
}

async function replaceDirectory(target) {
  assertGeneratedTarget(target);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
}

async function copyEngine() {
  await replaceDirectory(engineTarget);
  for (const relativePath of engineFiles) {
    const target = path.join(engineTarget, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(scriptSource, relativePath)));
  }
}

async function copyTree(source, target) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) await copyTree(sourcePath, targetPath);
    else if (entry.isFile()) await writeFile(targetPath, await readFile(sourcePath));
  }
}

async function copySkills() {
  await replaceDirectory(pluginSkillsTarget);
  await copyTree(skillSource, pluginSkillsTarget);
}

async function copyPlugin() {
  await replaceDirectory(packagePluginTarget);
  await copyTree(pluginRoot, packagePluginTarget);
}

async function filesUnder(root) {
  if (!await exists(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files.sort();
}

async function compareDirectories(source, target, label) {
  const sourceFiles = (await filesUnder(source)).map((file) => path.relative(source, file).replaceAll("\\", "/"));
  const targetFiles = (await filesUnder(target)).map((file) => path.relative(target, file).replaceAll("\\", "/"));
  if (JSON.stringify(sourceFiles) !== JSON.stringify(targetFiles)) {
    throw new Error(`${label} file list is stale; run npm run distribution:build`);
  }
  for (const relativePath of sourceFiles) {
    const [left, right] = await Promise.all([
      readFile(path.join(source, relativePath)),
      readFile(path.join(target, relativePath)),
    ]);
    if (!left.equals(right)) throw new Error(`${label} is stale at ${relativePath}; run npm run distribution:build`);
  }
}

async function checkEngine() {
  const expected = engineFiles.slice().sort();
  const actual = (await filesUnder(engineTarget)).map((file) => path.relative(engineTarget, file).replaceAll("\\", "/")).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error("package engine file list is stale; run npm run distribution:build");
  }
  for (const relativePath of expected) {
    const [left, right] = await Promise.all([
      readFile(path.join(scriptSource, relativePath)),
      readFile(path.join(engineTarget, relativePath)),
    ]);
    if (!left.equals(right)) throw new Error(`package engine is stale at ${relativePath}; run npm run distribution:build`);
  }
}

if (process.argv.includes("--check")) {
  await checkEngine();
  await compareDirectories(skillSource, pluginSkillsTarget, "plugin skills");
  await compareDirectories(pluginRoot, packagePluginTarget, "package plugin bundle");
  console.log("distribution: generated engine and plugin bundles match canonical sources");
} else {
  await copyEngine();
  await copySkills();
  await copyPlugin();
  console.log("distribution: built package engine and portable plugin bundles");
}
