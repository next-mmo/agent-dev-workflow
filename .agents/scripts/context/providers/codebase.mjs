import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { baseProvider, estimateTokens, trimToBudget } from "./common.mjs";
import { buildNativeCodebaseGraph, queryNativeCodebaseGraph } from "../../codebase-graph-core.mjs";

export async function retrieveCodebaseGraph({ root, scope, budgetTokens, changedPaths = [] }) {
  const cachePath = path.join(root, ".agents", "cache", "codebase-graph.json");
  const provider = baseProvider("codebase", budgetTokens, {
    authority: "native-code-graph",
    source: cachePath,
    freshness: changedPaths.length ? "possibly-stale-with-working-tree-changes" : "snapshot",
  });

  if (budgetTokens < 60) {
    return { ...provider, status: "skipped", reason: "insufficient context budget" };
  }

  const start = Date.now();
  let graph;
  try {
    if (existsSync(cachePath)) {
      graph = JSON.parse(await readFile(cachePath, "utf8"));
    } else {
      const buildResult = await buildNativeCodebaseGraph({ root });
      graph = buildResult.graph;
    }
  } catch {
    const buildResult = await buildNativeCodebaseGraph({ root });
    graph = buildResult.graph;
  }

  const queryResult = queryNativeCodebaseGraph({ graph, scope, budgetTokens });
  const durationMs = Date.now() - start;

  if (queryResult.status !== "ok") {
    return { ...provider, status: "unavailable", reason: "failed to query native codebase graph", durationMs };
  }

  const content = trimToBudget(queryResult.content, budgetTokens);
  return {
    ...provider,
    status: "ok",
    content,
    estimatedTokens: estimateTokens(content),
    durationMs,
  };
}
