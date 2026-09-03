import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const contextScript = path.join(repositoryRoot, "packages/agent-workflow-scrum/bin/agent-workflow.mjs");
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
    [contextScript, "context", "session timeout", "--root", root, ...args, "--json"],
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
    assert.ok(provider(result, "memory"), "memory provider should be present in auto mode");
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
    assert.deepEqual(result.providers.map((item) => item.name), ["local", "codebase", "memory", "graphify", "openviking"]);
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

test("trimToBudget truncates at clean semantic boundaries without cutting words", async () => {
  const { trimToBudget } = await import("../packages/agent-workflow-scrum/engine/context/providers/common.mjs");

  // Case 1: Sentence boundary preferred when complete sentence is available
  const twoSentences = "First sentence completed. Second sentence with important details and words.";
  const trimmedSentences = trimToBudget(twoSentences, 10); // 40 chars
  assert.ok(trimmedSentences.length <= 40, `expected <= 40 chars, got ${trimmedSentences.length}`);
  assert.equal(trimmedSentences, "First sentence completed.…");

  // Case 2: Word boundary when no sentence boundary is in the lookback window
  const singleLongSentence = "Feature implementation with detailed verification and acceptance criteria";
  const trimmedWords = trimToBudget(singleLongSentence, 10); // 40 chars. Char 39 falls inside 'verification'.
  assert.ok(trimmedWords.length <= 40, `expected <= 40 chars, got ${trimmedWords.length}`);
  assert.doesNotMatch(trimmedWords, /verifi…/);
  assert.equal(trimmedWords, "Feature implementation with detailed…");
});

test("trimToBudget preserves unclosed markdown code fences when budget permits", async () => {
  const { trimToBudget } = await import("../packages/agent-workflow-scrum/engine/context/providers/common.mjs");
  const codeBlock = "```javascript\nfunction test() {\n  return 42;\n}\n// trailing content";
  const trimmed = trimToBudget(codeBlock, 12); // 48 chars
  assert.ok(trimmed.length <= 48, `expected <= 48 chars, got ${trimmed.length}`);
  assert.match(trimmed, /```…$/);
});

// --- Native Memory Provider Tests ---

test("parseFrontmatter extracts YAML fields and body from markdown", async () => {
  const { parseFrontmatter } = await import("../packages/agent-workflow-scrum/engine/context/providers/memory.mjs");
  const md = `---
title: Audio Autoplay Fix
tags: [audio, webaudio, browser]
problem: "AudioContext suspended on load"
solution: "Call resume() on user gesture"
---

# Audio Autoplay Fix

Body content here.`;

  const { meta, body } = parseFrontmatter(md);
  assert.equal(meta.title, "Audio Autoplay Fix");
  assert.deepEqual(meta.tags, ["audio", "webaudio", "browser"]);
  assert.equal(meta.problem, "AudioContext suspended on load");
  assert.equal(meta.solution, "Call resume() on user gesture");
  assert.match(body, /Body content here/);
});

test("parseFrontmatter returns empty meta for files without frontmatter", async () => {
  const { parseFrontmatter } = await import("../packages/agent-workflow-scrum/engine/context/providers/memory.mjs");
  const { meta, body } = parseFrontmatter("# Just a heading\n\nSome text.");
  assert.deepEqual(meta, {});
  assert.match(body, /Just a heading/);
});

test("scoreEntry weights tags > title > body", async () => {
  const { scoreEntry } = await import("../packages/agent-workflow-scrum/engine/context/providers/memory.mjs");
  const entry = {
    meta: {
      title: "Web Audio Autoplay Fix",
      tags: ["audio", "webaudio", "browser"],
      problem: "AudioContext suspended",
      solution: "Call resume on gesture",
    },
    body: "Detailed explanation about the audio context problem.",
  };

  const terms = ["audio"];
  const score = scoreEntry(entry, terms);
  // tags match (2.0) + title match (1.5) + problem match (1.0) + body match (0.5) = 5.0
  assert.ok(score >= 4.0, `expected score >= 4.0, got ${score}`);

  const unrelated = scoreEntry(entry, ["database"]);
  assert.equal(unrelated, 0);
});

test("retrieveNativeMemory returns scored matches from solutions dir", async () => {
  const { retrieveNativeMemory } = await import("../packages/agent-workflow-scrum/engine/context/providers/memory.mjs");
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-memory-test-"));
  const solutionsDir = path.join(root, ".agents", "docs", "solutions");
  const memoryDir = path.join(root, ".agents", "docs", "memory");
  await mkdir(solutionsDir, { recursive: true });
  await mkdir(memoryDir, { recursive: true });

  await writeFile(path.join(solutionsDir, "0001-audio-fix.md"), `---
title: Web Audio Autoplay Fix
tags: [audio, webaudio, autoplay]
problem: "AudioContext suspended on page load"
solution: "Resume on user gesture"
---

# Web Audio Fix
Body content.
`, "utf8");

  await writeFile(path.join(memoryDir, "0001-esm-pattern.md"), `---
title: ESM Import Conventions
tags: [esm, import, javascript]
scope: "Module system conventions"
created: 2026-09-04
---

# ESM Conventions
Always use .mjs extension.
`, "utf8");

  try {
    const audioResult = await retrieveNativeMemory({ root, scope: "audio autoplay context", budgetTokens: 200 });
    assert.equal(audioResult.status, "ok");
    assert.match(audioResult.content, /audio/i);
    assert.ok(audioResult.estimatedTokens > 0);
    assert.ok(audioResult.estimatedTokens <= 200);

    const esmResult = await retrieveNativeMemory({ root, scope: "esm import module", budgetTokens: 200 });
    assert.equal(esmResult.status, "ok");
    assert.match(esmResult.content, /ESM/i);

    const noMatchResult = await retrieveNativeMemory({ root, scope: "kubernetes deployment", budgetTokens: 200 });
    assert.equal(noMatchResult.status, "ok");
    assert.match(noMatchResult.content, /No relevant/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("retrieveNativeMemory respects budget constraint", async () => {
  const { retrieveNativeMemory } = await import("../packages/agent-workflow-scrum/engine/context/providers/memory.mjs");
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-memory-budget-"));
  const solutionsDir = path.join(root, ".agents", "docs", "solutions");
  await mkdir(solutionsDir, { recursive: true });

  // Create several entries to test budget pressure
  for (let i = 1; i <= 5; i++) {
    await writeFile(path.join(solutionsDir, `000${i}-test-fix.md`), `---
title: Test Fix Number ${i} for Authentication
tags: [auth, session, security]
problem: "Auth session problem variant ${i}"
solution: "Fix auth with approach ${i}"
---

# Auth Fix ${i}
Detailed auth content for variant ${i}.
`, "utf8");
  }

  try {
    const result = await retrieveNativeMemory({ root, scope: "auth session", budgetTokens: 80 });
    assert.equal(result.status, "ok");
    assert.ok(result.estimatedTokens <= 80, `budget exceeded: ${result.estimatedTokens}`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("native memory provider appears in context output for native mode", async () => {
  const root = await fixture();
  try {
    const result = runContext(root, ["--provider", "native"]);
    const mem = provider(result, "memory");
    assert.ok(mem, "memory provider should be present in native mode");
    assert.equal(mem.authority, "native-recall");
    assert.ok(["ok", "skipped"].includes(mem.status));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("native recall excludes drafts and template summaries while retaining completed entries", async () => {
  const { retrieveNativeMemory } = await import("../packages/agent-workflow-scrum/engine/context/providers/memory.mjs");
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-memory-drafts-"));
  try {
    const dir = path.join(root, ".agents/docs/solutions");
    await mkdir(dir, { recursive: true });
    const entries = [
      ['0001-draft.md', 'title: Draft fix\nstatus: draft\nproblem: Windows paths fail\nsolution: Normalize paths'],
      ['0002-placeholder.md', 'title: Placeholder fix\nproblem: "<One-line explanation of the symptom/error>"\nsolution: "<One-line explanation of the fix>"'],
      ['0003-ready.md', 'title: Ready fix\nproblem: Windows paths fail\nsolution: Normalize separators'],
    ];
    for (const [file, fields] of entries) {
      await writeFile(path.join(dir, file), `---\n${fields}\ntags: [windows, paths]\n---\nWindows paths.\n`);
    }
    const result = await retrieveNativeMemory({ root, scope: 'windows paths', budgetTokens: 300 });
    assert.match(result.content, /Ready fix/);
    assert.doesNotMatch(result.content, /Draft fix|Placeholder fix|One-line/);
    await rm(path.join(dir, '0003-ready.md'));
    const empty = await retrieveNativeMemory({ root, scope: 'windows paths', budgetTokens: 300 });
    assert.doesNotMatch(empty.content, /Draft fix|Placeholder fix|One-line/);
    assert.match(empty.content, /No memory or solution entries/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

