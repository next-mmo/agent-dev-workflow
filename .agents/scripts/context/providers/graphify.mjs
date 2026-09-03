import { access, readFile } from "node:fs/promises";
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
  if (!execution.ok) {
    if (execution.status === "unavailable" && !process.env.GRAPHIFY_BIN) {
      try {
        const graphData = JSON.parse(await readFile(graphPath, "utf8"));
        const terms = scope.toLowerCase().split(/\s+/).filter(Boolean);
        const matchingNodes = (graphData.nodes || []).filter((n) =>
          terms.some((t) => n.file.toLowerCase().includes(t) || (n.functions || []).some((f) => f.toLowerCase().includes(t)) || (n.classes || []).some((c) => c.toLowerCase().includes(t)))
        );
        const lines = [
          `Code graph: ${graphData.stats?.filesIndexed || 0} files, ${graphData.stats?.symbolsIndexed || 0} symbols`,
        ];
        for (const node of matchingNodes.slice(0, 4)) {
          lines.push(`- ${node.file}: functions [${(node.functions || []).join(", ")}], classes [${(node.classes || []).join(", ")}]`);
        }
        const text = lines.join("\n");
        const content = trimToBudget(text, budgetTokens);
        return {
          ...provider,
          status: "ok",
          content,
          estimatedTokens: estimateTokens(content),
          durationMs: 5,
        };
      } catch {
        // Continue to return execution below
      }
    }
    return { ...provider, ...execution, content: "", estimatedTokens: 0 };
  }

  const content = trimToBudget(redactSecrets(execution.stdout), budgetTokens);
  return {
    ...provider,
    status: "ok",
    content,
    estimatedTokens: estimateTokens(content),
    durationMs: execution.durationMs,
  };
}
