import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const contextScript = path.join(repositoryRoot, "scripts/context.mjs");
const docsRoot = ".agents/docs";

async function fixture({ graph = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-context-provider-"));
  await Promise.all([
    mkdir(path.join(root, docsRoot, "tasks"), { recursive: true }),
    mkdir(path.join(root, docsRoot, "prd"), { recursive: true }),
    mkdir(path.join(root, "graphify-out"), { recursive: true }),
  ]);
  const files = {
    "AGENTS.md": "# Agent Instructions\nUse repository evidence.\n",
    "CONTEXT.md": "# Context\nAuthentication sessions are high risk.\n",
    [`${docsRoot}/prd/0000-prd-index.md`]: "# PRD Index\nAuth\n",
    [`${docsRoot}/prd/0001-auth.md`]: "# Auth PRD\nSession timeout and authorization.\n",
    [`${docsRoot}/tasks/wip-0001-0001-auth.md`]: "# Auth Task\n> **Status:** wip\nImplement session timeout.\n",
  };
  if (graph) files["graphify-out/graph.json"] = "{}\n";
  await Promise.all(Object.entries(files).map(async ([file, content]) => {
    const absolute = path.join(root, file);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content, "utf8");
  }));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  return root;
}

async function fakeCli(source) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "agent-provider-cli-"));
  const script = path.join(directory, "fake-cli.mjs");
  await writeFile(script, source, "utf8");
  return { directory, script };
}

function runContext(root, args = [], env = {}) {
  return JSON.parse(execFileSync(
    process.execPath,
    [contextScript, "session timeout", "--root", root, ...args, "--json"],
    { encoding: "utf8", env: { ...process.env, ...env } },
  ));
}

function provider(result, name) {
  return result.providers.find((item) => item.name === name);
}

test("auto mode uses Graphify when a local graph is ready", async () => {
  const root = await fixture({ graph: true });
  const fake = await fakeCli("console.log('AuthService -> SessionStore [EXTRACTED] src/auth/service.js:42')\n");
  try {
    const result = runContext(root, [], {
      GRAPHIFY_BIN: process.execPath,
      GRAPHIFY_BIN_ARGS: JSON.stringify([fake.script]),
    });
    assert.equal(result.docsRoot, docsRoot);
    assert.equal(result.providerMode, "auto");
    assert.equal(provider(result, "graphify").status, "ok");
    assert.match(provider(result, "graphify").content, /EXTRACTED/);
    assert.equal(provider(result, "openviking"), undefined);
    assert.ok(result.estimatedTokens <= result.budgetTokens);
  } finally {
    await Promise.all([rm(root, { recursive: true, force: true }), rm(fake.directory, { recursive: true, force: true })]);
  }
});

test("auto mode degrades cleanly when Graphify is not initialized", async () => {
  const root = await fixture();
  try {
    const result = runContext(root);
    assert.equal(provider(result, "graphify").status, "unavailable");
    assert.match(provider(result, "graphify").reason, /graph\.json not found/);
    assert.equal(provider(result, "local").status, "ok");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("OpenViking is queried only when explicitly selected", async () => {
  const root = await fixture();
  const fake = await fakeCli(`
console.log('cmd: ov find session timeout')
console.log(JSON.stringify({status:'ok',result:{memories:[{context_type:'memory',uri:'viking://~/memories/auth.md',level:2,score:.91,abstract:'Use rotating sessions.'}],resources:[],skills:[],total:1}}))
`);
  try {
    const env = {
      OPENVIKING_BIN: process.execPath,
      OPENVIKING_BIN_ARGS: JSON.stringify([fake.script]),
    };
    const automatic = runContext(root, [], env);
    assert.equal(provider(automatic, "openviking"), undefined);

    const explicit = runContext(root, ["--provider", "openviking"], env);
    assert.equal(provider(explicit, "openviking").status, "ok");
    assert.match(provider(explicit, "openviking").content, /viking:\/\/~\/memories\/auth\.md/);
    assert.match(provider(explicit, "openviking").content, /Use rotating sessions/);
  } finally {
    await Promise.all([rm(root, { recursive: true, force: true }), rm(fake.directory, { recursive: true, force: true })]);
  }
});

test("all mode composes local, Graphify, and OpenViking under one budget", async () => {
  const root = await fixture({ graph: true });
  const graph = await fakeCli("console.log('Auth -> Session [EXTRACTED] src/auth.js:1')\n");
  const ov = await fakeCli("console.log(JSON.stringify({ok:true,result:{memories:[],resources:[{context_type:'resource',uri:'viking://resources/auth.md',level:1,score:.8,abstract:'Architecture decision.'}],skills:[],total:1}}))\n");
  try {
    const result = runContext(root, ["--provider", "all", "--level", "1", "--budget", "1000"], {
      GRAPHIFY_BIN: process.execPath,
      GRAPHIFY_BIN_ARGS: JSON.stringify([graph.script]),
      OPENVIKING_BIN: process.execPath,
      OPENVIKING_BIN_ARGS: JSON.stringify([ov.script]),
    });
    assert.deepEqual(result.providers.map((item) => item.name), ["local", "graphify", "openviking"]);
    assert.equal(provider(result, "graphify").status, "ok");
    assert.equal(provider(result, "openviking").status, "ok");
    assert.ok(result.estimatedTokens <= 1000, `estimated ${result.estimatedTokens}`);
  } finally {
    await Promise.all([
      rm(root, { recursive: true, force: true }),
      rm(graph.directory, { recursive: true, force: true }),
      rm(ov.directory, { recursive: true, force: true }),
    ]);
  }
});

test("provider output is hard-trimmed even when a CLI ignores its budget", async () => {
  const root = await fixture({ graph: true });
  const fake = await fakeCli("console.log('x'.repeat(20000))\n");
  try {
    const result = runContext(root, ["--provider", "graphify", "--budget", "700"], {
      GRAPHIFY_BIN: process.execPath,
      GRAPHIFY_BIN_ARGS: JSON.stringify([fake.script]),
    });
    assert.ok(provider(result, "graphify").estimatedTokens <= provider(result, "graphify").budgetTokens);
    assert.ok(result.estimatedTokens <= result.budgetTokens, `estimated ${result.estimatedTokens}`);
  } finally {
    await Promise.all([rm(root, { recursive: true, force: true }), rm(fake.directory, { recursive: true, force: true })]);
  }
});

test("provider timeout returns local context instead of hanging", async () => {
  const root = await fixture({ graph: true });
  const fake = await fakeCli("setTimeout(() => console.log('late'), 5000)\n");
  try {
    const result = runContext(root, ["--provider", "graphify", "--provider-timeout", "80"], {
      GRAPHIFY_BIN: process.execPath,
      GRAPHIFY_BIN_ARGS: JSON.stringify([fake.script]),
    });
    assert.equal(provider(result, "graphify").status, "timeout");
    assert.equal(provider(result, "local").status, "ok");
  } finally {
    await Promise.all([rm(root, { recursive: true, force: true }), rm(fake.directory, { recursive: true, force: true })]);
  }
});

test("provider diagnostics redact common secret shapes", async () => {
  const root = await fixture({ graph: true });
  const fake = await fakeCli("console.error('api_key=super-secret Bearer abc.def.ghi'); process.exit(2)\n");
  try {
    const result = runContext(root, ["--provider", "graphify"], {
      GRAPHIFY_BIN: process.execPath,
      GRAPHIFY_BIN_ARGS: JSON.stringify([fake.script]),
    });
    assert.equal(provider(result, "graphify").status, "error");
    assert.doesNotMatch(provider(result, "graphify").reason, /super-secret|abc\.def\.ghi/);
    assert.match(provider(result, "graphify").reason, /redacted/);
  } finally {
    await Promise.all([rm(root, { recursive: true, force: true }), rm(fake.directory, { recursive: true, force: true })]);
  }
});
