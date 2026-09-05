import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillSource = path.join(repositoryRoot, ".agents/skills");
const pluginRoot = path.join(repositoryRoot, "plugins/agent-workflow-scrum");
const packageRoot = path.join(repositoryRoot, "packages/agent-workflow-scrum");
const pluginSkillsTarget = path.join(pluginRoot, "skills");
const packagePluginTarget = path.join(packageRoot, "plugin");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assertGeneratedTarget(target) {
  const allowed = [pluginSkillsTarget, packagePluginTarget];
  if (!allowed.includes(path.resolve(target))) throw new Error(`refusing to replace unexpected path: ${target}`);
}

async function replaceDirectory(target) {
  assertGeneratedTarget(target);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
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

async function syncLicenses(check) {
  const source = await readFile(path.join(repositoryRoot, "LICENSE"));
  for (const target of [path.join(pluginRoot, "LICENSE"), path.join(packageRoot, "LICENSE")]) {
    if (check) {
      if (!source.equals(await readFile(target))) throw new Error(`license is stale: ${target}; run npm run distribution:build`);
    } else {
      await writeFile(target, source);
    }
  }
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

if (process.argv.includes("--check")) {
  await syncLicenses(true);
  await compareDirectories(skillSource, pluginSkillsTarget, "plugin skills");
  await compareDirectories(pluginRoot, packagePluginTarget, "package plugin bundle");
  console.log("distribution: generated plugin bundles match canonical sources");
} else {
  await syncLicenses(false);
  await copySkills();
  await copyPlugin();
  console.log("distribution: built portable plugin bundles; package engine is canonical source");
}
