import { access } from "node:fs/promises";
import path from "node:path";
import { baseProvider, estimateTokens, parseArgPrefix, redactSecrets, runCli, trimToBudget } from "./common.mjs";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function retrieveGraphify({ root, scope, budgetTokens, timeoutMs, changedPaths = [] }) {
  const graphPath = process.env.GRAPHIFY_GRAPH
    ? path.resolve(process.env.GRAPHIFY_GRAPH)
    : path.join(root, "graphify-out", "graph.json");
  const provider = baseProvider("graphify", budgetTokens, {
    authority: "derived-code-graph",
    source: graphPath,
    freshness: changedPaths.length ? "possibly-stale-with-working-tree-changes" : "snapshot",
  });

  if (budgetTokens < 80) {
    return { ...provider, status: "skipped", reason: "insufficient context budget" };
  }
  if (!await exists(graphPath)) {
    return {
      ...provider,
      status: "unavailable",
      reason: "graphify-out/graph.json not found; build or update the graph first",
    };
  }

  const command = process.env.GRAPHIFY_BIN || "graphify";
  const prefixArgs = parseArgPrefix(process.env.GRAPHIFY_BIN_ARGS);
  const execution = runCli(
    command,
    [...prefixArgs, "query", scope, "--budget", String(budgetTokens), "--graph", graphPath],
    { cwd: root, timeoutMs },
  );
  if (!execution.ok) return { ...provider, ...execution, content: "", estimatedTokens: 0 };

  const content = trimToBudget(redactSecrets(execution.stdout), budgetTokens);
  return {
    ...provider,
    status: "ok",
    content,
    estimatedTokens: estimateTokens(content),
    durationMs: execution.durationMs,
  };
}
