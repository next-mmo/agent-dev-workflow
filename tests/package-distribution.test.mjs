import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repositoryRoot, "packages/agent-workflow-scrum");
const sourceBinary = path.join(packageRoot, "bin/agent-workflow.mjs");
const forbidden = [".agents/scripts", ".agents/skills", ".agents/benchmark", "packages", "plugins", ".agents/docs/model-recommend.md"];
const consumerDocs = ["AGENTS.md", "agent-workflow.md", "architecture.md", "defensive-patterns.md", "development.md", "testing.md"];

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
  assert.equal(await exists(path.join(root, ".agents/docs/proposals/README.md")), true);
  assert.equal(await exists(path.join(root, ".agents/docs/suggestions")), false);
  for (const name of consumerDocs) assert.equal(await exists(path.join(root, ".agents/docs", name)), true, name);
  assert.equal(await exists(path.join(root, ".agents/docs/doc-budgets.json")), false);
  await assertBundledLinks(path.join(root, ".agents/docs"));
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

test("distribution builds only package skills and preserves owned plugin files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-single-plugin-"));
  try {
    await mkdir(path.join(root, "scripts"));
    await cp(path.join(repositoryRoot, "scripts/build-distribution.mjs"), path.join(root, "scripts/build-distribution.mjs"));
    const skill = path.join(root, ".agents/skills/example/SKILL.md");
    await mkdir(path.dirname(skill), { recursive: true });
    await writeFile(skill, "# Canonical skill\n");
    await writeFile(path.join(root, "LICENSE"), "License fixture\n");
    const plugin = path.join(root, "packages/agent-workflow-scrum/plugin");
    const owned = ["plugin.json", ".codex-plugin/plugin.json", ".cursor-plugin/plugin.json", "commands/workflow-status.md", "README.md"];
    for (const name of owned) {
      await mkdir(path.dirname(path.join(plugin, name)), { recursive: true });
      await writeFile(path.join(plugin, name), `Owned ${name}\n`);
    }
    const build = (...args) => run(process.execPath, [path.join(root, "scripts/build-distribution.mjs"), ...args], root);
    build();
    build("--check");
    assert.equal(await exists(path.join(root, "plugins")), false);
    assert.equal(await readFile(path.join(plugin, "skills/example/SKILL.md"), "utf8"), "# Canonical skill\n");
    for (const name of owned) assert.equal(await readFile(path.join(plugin, name), "utf8"), `Owned ${name}\n`);
    await writeFile(path.join(plugin, "skills/example/SKILL.md"), "Stale skill\n");
    assert.throws(() => build("--check"), /plugin skills is stale/);
    build();
    await writeFile(path.join(plugin, "LICENSE"), "Stale license\n");
    assert.throws(() => build("--check"), /license is stale/);
    assert.equal(await exists(path.join(repositoryRoot, "plugins")), false, "source has no root plugin duplicate");
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
    await writeFile(path.join(root, ".agents/docs/architecture.md"), "# Product-specific architecture\n");
    await mkdir(path.join(root, ".agents/docs/suggestions"));
    await writeFile(path.join(root, ".agents/docs/suggestions/0001-decision.md"), "# Existing human decision\n");
    const configBefore = await readFile(path.join(root, ".agents/config.json"), "utf8");
    assert.match(run(process.execPath, [sourceBinary, "init", "--existing"], root), /Created: none/);
    assert.equal(await readFile(path.join(root, ".agents/docs/architecture.md"), "utf8"), "# Product-specific architecture\n");
    assert.equal(await readFile(path.join(root, ".agents/docs/suggestions/0001-decision.md"), "utf8"), "# Existing human decision\n");
    assert.equal(await readFile(path.join(root, ".agents/config.json"), "utf8"), configBefore);
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

async function exerciseInstalledFixture(manager, tarball, root, runtimePrefix = "") {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, "package.json"), `${JSON.stringify({ name: `${manager}-consumer`, private: true }, null, 2)}\n`);
  git(root, ["init"]);
  git(root, ["config", "user.email", "fixture@example.test"]);
  git(root, ["config", "user.name", "Fixture"]);
  if (manager === "npm") {
    runNpm(
      ["install", "--offline", "--no-audit", "--no-fund", "--save-dev", "--save-exact", tarball],
      root,
      { env: { ...process.env, NO_COLOR: "1", ...(runtimePrefix ? {} : { NPM_CONFIG_CACHE: path.join(root, "npm-cache") }) } },
    );
  } else {
    runPnpm(["add", "--save-dev", "--save-exact", tarball], root);
  }
  const installedBinary = path.join(root, "node_modules", "@next-mmo", "agent-workflow-scrum", runtimePrefix, "bin", "agent-workflow.mjs");
  assert.equal(await exists(installedBinary), true, `${manager} installed package binary`);
  const installedRoot = path.resolve(path.dirname(installedBinary), "..");
  // Git checkouts may normalize line endings; verify the complete license text.
  const license = (await readFile(path.join(repositoryRoot, "LICENSE"), "utf8")).replaceAll("\r\n", "\n");
  assert.equal((await readFile(path.join(installedRoot, "LICENSE"), "utf8")).replaceAll("\r\n", "\n"), license);
  assert.equal((await readFile(path.join(installedRoot, "plugin/LICENSE"), "utf8")).replaceAll("\r\n", "\n"), license);
  await assertBundledLinks(path.join(installedRoot, "plugin/skills"));
  const invoke = (args) => run(process.execPath, [installedBinary, ...args], root);
  if (manager === "npm") assert.match(runNpm(["exec", "--offline", "--", "agent-workflow", "version"], root), /^0\.1\.0/m);

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

test("init dry-run writes nothing and doctor identifies each missing consumer document", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-scaffold-"));
  try {
    const target = path.join(root, "new-product");
    const preview = JSON.parse(run(process.execPath, [sourceBinary, "init", target, "--dry-run", "--json"], root));
    assert.ok(preview.created.includes(".agents/docs/proposals/README.md"));
    assert.equal(await exists(target), false);
    run(process.execPath, [sourceBinary, "init", target], root);
    git(target, ["init"]);
    for (const name of consumerDocs) {
      const file = path.join(target, ".agents/docs", name);
      const content = await readFile(file);
      await rm(file);
      const result = spawnSync(process.execPath, [sourceBinary, "doctor", "--json"], { cwd: target, encoding: "utf8", windowsHide: true });
      assert.equal(result.status, 1, name);
      assert.ok(JSON.parse(result.stdout).errors.includes(`missing .agents/docs/${name}`));
      await writeFile(file, content);
    }
    const before = await readFile(path.join(target, ".agents/config.json"));
    run(process.execPath, [sourceBinary, "init", target, "--existing", "--dry-run"], root);
    assert.deepEqual(await readFile(path.join(target, ".agents/config.json")), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("commit-pinned Git dependency installs the root CLI without registry publication or consumer vendoring", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workflow-git-"));
  try {
    const source = path.join(root, "source");
    await mkdir(source);
    const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8"));
    for (const relative of ["package.json", "package-lock.json", "README.md", ...manifest.files]) {
      const destination = path.join(source, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await cp(path.join(repositoryRoot, relative), destination, { recursive: true });
    }
    git(source, ["init"]);
    git(source, ["config", "user.email", "fixture@example.test"]);
    git(source, ["config", "user.name", "Fixture"]);
    git(source, ["add", "."]);
    git(source, ["commit", "-m", "Git dependency fixture"]);
    const revision = git(source, ["rev-parse", "HEAD"]).trim();
    const spec = `@next-mmo/agent-workflow-scrum@git+${pathToFileURL(source).href}#${revision}`;
    const consumer = path.join(root, "consumer");
    await exerciseInstalledFixture("npm", spec, consumer, "packages/agent-workflow-scrum");
    const installedManifest = JSON.parse(await readFile(path.join(consumer, "package.json"), "utf8"));
    assert.ok(installedManifest.devDependencies["@next-mmo/agent-workflow-scrum"].endsWith(`#${revision}`));
    assert.equal(await exists(path.join(consumer, "node_modules/vite")), false, "source demo dev dependencies are not installed");
    const installedRoot = path.join(consumer, "node_modules/@next-mmo/agent-workflow-scrum");
    for (const file of ["src/main.js", "tests", ".agents", "plugins", "scripts"]) {
      assert.equal(await exists(path.join(installedRoot, file)), false, `Git package excludes source-only ${file}`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
