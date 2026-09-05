import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repositoryRoot, "packages/agent-workflow-scrum");
const sourceBinary = path.join(packageRoot, "bin/agent-workflow.mjs");
const forbidden = [".agents/scripts", ".agents/skills", ".agents/benchmark"];

function resolveNpmRunner() {
  if (process.platform !== "win32") return { command: "npm", prefix: [], shell: false };
  const candidates = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
  ].filter((candidate) => candidate && existsSync(candidate));
  if (candidates.length) return { command: process.execPath, prefix: [candidates[0]], shell: false };
  return { command: "npm.cmd", prefix: [], shell: true };
}

const npmRunner = resolveNpmRunner();
function resolvePnpm() {
  if (process.platform !== "win32") return { command: "pnpm", prefix: [], shell: false, available: true };
  const configured = process.env.AGENT_WORKFLOW_PNPM_CLI;
  if (configured && existsSync(configured)) {
    return configured.endsWith(".cjs")
      ? { command: process.execPath, prefix: [configured], shell: false, available: true }
      : { command: configured, prefix: [], shell: true, available: true };
  }
  const probe = spawnSync("where.exe", ["pnpm"], { encoding: "utf8", windowsHide: true });
  for (const shim of String(probe.stdout || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean)) {
    try {
      const content = readFileSync(shim, "utf8");
      const match = content.match(/(?:\$basedir|%~?dp0)[\\/]([^"'\r\n]*pnpm\.cjs)/i);
      if (match) {
        const command = path.resolve(path.dirname(shim), match[1].replaceAll("/", path.sep));
        if (existsSync(command)) return { command: process.execPath, prefix: [command], shell: false, available: true };
      }
    } catch {
      // Continue through PATH candidates; pnpm is optional for this fixture.
    }
  }
  if (probe.status !== 0) return { command: "", prefix: [], shell: false, available: false };
  return { command: "pnpm.cmd", prefix: [], shell: true, available: true };
}

const pnpm = resolvePnpm();

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 20000,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}):\n${result.stdout || ""}${result.stderr || ""}`);
  }
  return String(result.stdout || "");
}

function runPnpm(args, cwd) {
  return run(pnpm.command, [...pnpm.prefix, ...args], cwd, { shell: pnpm.shell });
}

function runNpm(args, cwd, options = {}) {
  return run(npmRunner.command, [...npmRunner.prefix, ...args], cwd, { shell: npmRunner.shell, ...options });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function git(root, args) {
  return run("git", ["-C", root, ...args], root);
}

async function assertThinInit(root) {
  for (const relativePath of forbidden) assert.equal(await exists(path.join(root, relativePath)), false, relativePath);
  assert.equal(await exists(path.join(root, ".agents/config.json")), true);
  assert.equal(await exists(path.join(root, ".agents/docs/prd/0000-prd-index.md")), true);
  assert.equal(await exists(path.join(root, ".agents/docs/tasks/README.md")), true);
  assert.equal(await exists(path.join(root, ".agents/docs/suggestions/README.md")), true);
}

async function assertBundledLinks(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) await assertBundledLinks(file);
    else if (file.endsWith(".md")) {
      const content = await readFile(file, "utf8");
      for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
        const target = match[1].split("#")[0];
        if (!target || /^[a-z]+:/i.test(target)) continue;
        assert.ok(await exists(path.resolve(root, target)), `${file}: missing bundled reference ${target}`);
      }
    }
  }
}

test("bundled link check rejects missing documentation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-links-"));
  try {
    await writeFile(path.join(root, "SKILL.md"), "Read [rules](missing.md).\n");
    await assert.rejects(assertBundledLinks(root), /missing bundled reference missing.md/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("init preserves existing files and creates only project-owned workflow state", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-existing-"));
  try {
    await writeFile(path.join(root, "AGENTS.md"), "# Company instructions\n");
    await writeFile(path.join(root, "package.json"), "{\"scripts\":{\"test\":\"node --test\",\"build\":\"node -e \\\"\\\"\"}}\n");
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    const output = run(process.execPath, [sourceBinary, "init", "--existing"], root);
    assert.match(output, /Package manager: pnpm/);
    assert.equal(await readFile(path.join(root, "AGENTS.md"), "utf8"), "# Company instructions\n");
    const config = JSON.parse(await readFile(path.join(root, ".agents/config.json"), "utf8"));
    assert.equal(config.packageManager, "pnpm");
    assert.equal(config.checks.test, "pnpm test");
    assert.equal(config.checks.build, "pnpm build");
    await assertThinInit(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

async function packArtifact(root) {
  const packDirectory = path.join(root, "pack");
  await mkdir(packDirectory);
  const output = runNpm(
    ["pack", "./packages/agent-workflow-scrum", "--json", "--ignore-scripts", "--pack-destination", packDirectory],
    repositoryRoot,
    { env: { ...process.env, NO_COLOR: "1", NPM_CONFIG_CACHE: path.join(root, "npm-cache") } },
  );
  const start = output.indexOf("[");
  if (start < 0) throw new Error(`npm pack did not return JSON: ${output}`);
  const metadata = JSON.parse(output.slice(start))[0];
  return { tarball: path.join(packDirectory, metadata.filename), files: metadata.files.map((item) => item.path) };
}

async function exerciseInstalledFixture(manager, tarball, root) {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, "package.json"), `${JSON.stringify({ name: `${manager}-consumer`, private: true }, null, 2)}\n`);
  git(root, ["init"]);
  git(root, ["config", "user.email", "fixture@example.test"]);
  git(root, ["config", "user.name", "Fixture"]);
  if (manager === "npm") {
    runNpm(
      ["install", "--save-dev", "--save-exact", tarball],
      root,
      { env: { ...process.env, NO_COLOR: "1", NPM_CONFIG_CACHE: path.join(root, "npm-cache") } },
    );
  } else {
    runPnpm(["add", "--save-dev", "--save-exact", tarball], root);
  }
  const installedBinary = path.join(root, "node_modules", "@next-mmo", "agent-workflow-scrum", "bin", "agent-workflow.mjs");
  assert.equal(await exists(installedBinary), true, `${manager} installed package binary`);
  const installedRoot = path.resolve(path.dirname(installedBinary), "..");
  const license = await readFile(path.join(repositoryRoot, "LICENSE"), "utf8");
  assert.equal(await readFile(path.join(installedRoot, "LICENSE"), "utf8"), license);
  assert.equal(await readFile(path.join(installedRoot, "plugin/LICENSE"), "utf8"), license);
  await assertBundledLinks(path.join(installedRoot, "plugin/skills"));
  const invoke = (args) => run(process.execPath, [installedBinary, ...args], root);

  invoke(["init", "--existing"]);
  await assertThinInit(root);
  const config = JSON.parse(await readFile(path.join(root, ".agents/config.json"), "utf8"));
  assert.equal(config.packageManager, manager);
  git(root, ["add", "AGENTS.md", "CONTEXT.md", ".agents", "package.json"]);
  for (const lockfile of ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"]) {
    if (await exists(path.join(root, lockfile))) git(root, ["add", lockfile]);
  }
  git(root, ["commit", "-m", "initialized fixture"]);

  assert.match(invoke(["version"]), /^0\.1\.0/m);
  assert.match(invoke(["doctor"]), /doctor: ready/);
  const plan = JSON.parse(invoke(["plan", "Consumer plan", "--json"]));
  assert.match(await readFile(path.join(root, plan.relativePath), "utf8"), /# Plan 0001: Consumer plan/);
  const solution = JSON.parse(invoke(["solve", "Consumer bug fix", "--json"]));
  assert.match(await readFile(path.join(root, solution.relativePath), "utf8"), /status: draft/);
  assert.equal(await exists(path.join(root, ".agents/docs/plans/0000-template.md")), false);
  assert.equal(JSON.parse(invoke(["prdsync", "--json"])).advisory, true);
  const review = JSON.parse(invoke(["review", "--base", "HEAD", "--json"]));
  assert.ok(review.filesReviewed >= 2, "installed review inspects new plan and solution files");
  assert.match(invoke(["context", "fixture verification", "--provider", "local"]), /Agent Context Pack/);
  assert.match(invoke(["scope", "--base", "HEAD"]), /"formatVersion": 2/);
  assert.match(invoke(["verify", "--base", "HEAD"]), /Verification Plan/);
  assert.match(invoke(["check", "--strict-budget"]), /workflow consistency passed/);
  assert.match(invoke(["docs"]), /documentation checks passed/);
  assert.match(invoke(["report", "--output", `report-${manager}`]), /Generated Agent Workflow Scrum report/);
  assert.equal(await exists(path.join(root, `report-${manager}/index.html`)), true);
  assert.match(invoke(["init", "--existing"]), /Created: none/);
}

test("real npm tarball installs and all public commands run in npm and pnpm fixtures", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-tarball-"));
  try {
    const { tarball, files } = await packArtifact(root);
    assert.ok(files.includes("bin/agent-workflow.mjs"));
    assert.ok(files.includes("engine/context-core.mjs"));
    assert.ok(files.includes("plugin/plugin.json"));
    assert.ok(files.includes("LICENSE"));
    assert.ok(files.includes("plugin/LICENSE"));
    assert.equal(files.some((file) => /benchmark|counter|\.agents\/docs\/tasks\/done/i.test(file)), false);
    await exerciseInstalledFixture("npm", tarball, path.join(root, "npm-consumer"));

    if (!pnpm.available) {
      t.diagnostic("pnpm is unavailable; npm tarball fixture passed and pnpm fixture was skipped");
    } else {
      const pnpmProbe = spawnSync(pnpm.command, [...pnpm.prefix, "--version"], {
        encoding: "utf8",
        windowsHide: true,
        shell: pnpm.shell,
      });
      if (pnpmProbe.status !== 0) {
        t.diagnostic("pnpm is unavailable; npm tarball fixture passed and pnpm fixture was skipped");
      } else {
        await exerciseInstalledFixture("pnpm", tarball, path.join(root, "pnpm-consumer"));
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
