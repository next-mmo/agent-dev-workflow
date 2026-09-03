import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { buildNativeCodebaseGraph, queryNativeCodebaseGraph } from "../packages/agent-workflow-scrum/engine/codebase-graph-core.mjs";
import { retrieveGraphify } from "../packages/agent-workflow-scrum/engine/context/providers/graphify.mjs";
import { estimateTokens } from "../packages/agent-workflow-scrum/engine/context/providers/common.mjs";

const root = process.cwd();

// Build / load native graph
const nativeBuild = await buildNativeCodebaseGraph({ root });
const nativeGraph = nativeBuild.graph;

// Raw product files tokens
const productFiles = ["src/audio.js", "src/counter-state.js", "src/main.js"];
let rawChars = 0;
for (const f of productFiles) {
  rawChars += readFileSync(path.join(root, f), "utf8").length;
}
const rawTokens = Math.ceil(rawChars / 4);

const testScopes = [
  "SoundManager audio synthesizer",
  "CounterState history undo",
  "render count step button",
];

const results = [];

for (const scope of testScopes) {
  // 1. Native Graph Query
  const t0 = performance.now();
  const nativeResult = queryNativeCodebaseGraph({ graph: nativeGraph, scope, budgetTokens: 400 });
  const nativeTime = (performance.now() - t0).toFixed(2);
  const nativeTokens = nativeResult.tokens;

  // 2. Graphify Query
  const t1 = performance.now();
  const graphifyResult = await retrieveGraphify({ root, scope, budgetTokens: 400, timeoutMs: 3000 });
  const graphifyTime = (performance.now() - t1).toFixed(2);
  const graphifyTokens = graphifyResult.estimatedTokens || 0;

  // Savings vs Raw Codebase
  const nativeSavings = ((1 - (nativeTokens / rawTokens)) * 100).toFixed(2);
  const graphifySavings = graphifyTokens > 0
    ? ((1 - (graphifyTokens / rawTokens)) * 100).toFixed(2)
    : "N/A";

  results.push({
    scope,
    rawTokens,
    native: { tokens: nativeTokens, latency: `${nativeTime}ms`, savings: `${nativeSavings}%`, content: nativeResult.content },
    graphify: { tokens: graphifyTokens, latency: `${graphifyTime}ms`, savings: `${graphifySavings}%`, content: graphifyResult.content },
  });
}

console.log(JSON.stringify({ rawTokens, results }, null, 2));
