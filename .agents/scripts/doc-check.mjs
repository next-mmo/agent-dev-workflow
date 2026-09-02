import { spawnSync } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const core = path.join(scriptDirectory, "doc-check-core.mjs");

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function markdownFiles(root, directory) {
  try {
    const entries = await readdir(path.join(root, directory), { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const relative = normalizePath(path.join(directory, entry.name));
      if (entry.isDirectory()) files.push(...await markdownFiles(root, relative));
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative);
    }
    return files.sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function relativeMarkdownLinks(markdown) {
  const links = [];
  const regex = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of String(markdown || "").matchAll(regex)) {
    let href = match[1].trim().replace(/^<|>$/g, "");
    if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    href = href.split("#", 1)[0].split("?", 1)[0];
    if (!href || href.includes("${")) continue;
    links.push(href);
  }
  return links;
}

function requestedRoot(argv) {
  let root = repositoryRoot;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") root = path.resolve(argv[index + 1] || "");
  }
  return root;
}

function render(result) {
  const lines = [];
  for (const item of result.info || []) lines.push(`docs: info: ${item}`);
  for (const item of result.warnings || []) lines.push(`docs: WARN: ${item}`);
  for (const item of result.errors || []) lines.push(`docs: FAIL: ${item}`);
  lines.push(result.ok ? "docs: documentation checks passed" : `docs: documentation checks failed (${result.errors.length} error(s))`);
  return `${lines.join("\n")}\n`;
}

const argv = process.argv.slice(2);
const root = requestedRoot(argv);
const child = spawnSync(process.execPath, [core, "--root", repositoryRoot, ...argv, "--json"], {
  cwd: process.cwd(),
  env: process.env,
  encoding: "utf8",
  windowsHide: true,
});

let result;
try {
  result = JSON.parse(String(child.stdout || ""));
} catch {
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (child.error) console.error(`doc-check: ${child.error.message}`);
  process.exitCode = child.status ?? 1;
}

if (result) {
  for (const source of await markdownFiles(root, ".agents/scripts")) {
    const content = await readFile(path.join(root, source), "utf8");
    for (const href of relativeMarkdownLinks(content)) {
      const target = normalizePath(path.normalize(path.join(path.dirname(source), href)));
      if (!await exists(path.join(root, target))) result.errors.push(`${source}: broken relative link '${href}' -> ${target}`);
    }
  }
  result.ok = result.errors.length === 0;
  process.stdout.write(argv.includes("--json") ? `${JSON.stringify(result, null, 2)}\n` : render(result));
  if (!result.ok) process.exitCode = 1;
}
