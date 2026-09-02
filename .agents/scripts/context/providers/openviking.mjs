import { baseProvider, estimateTokens, parseArgPrefix, parseJsonFromMixedOutput, redactSecrets, runCli, trimToBudget } from "./common.mjs";

function normalizeFindPayload(payload, budgetTokens) {
  const root = payload?.result || payload;
  const groups = ["memories", "resources", "skills"];
  const matches = groups
    .flatMap((group) => Array.isArray(root?.[group]) ? root[group] : [])
    .sort((a, b) => Number(b?.score || 0) - Number(a?.score || 0));

  if (matches.length === 0) return "No relevant OpenViking memory/resource/skill matches.";

  const lines = [];
  for (const item of matches) {
    const type = item?.context_type || "context";
    const level = Number.isFinite(Number(item?.level)) ? `L${item.level}` : "L?";
    const score = Number.isFinite(Number(item?.score)) ? Number(item.score).toFixed(3) : "?";
    const uri = item?.uri || "viking://unknown";
    const summary = String(item?.abstract || item?.overview || item?.match_reason || "").replace(/\s+/g, " ").trim();
    lines.push(`- [${type} ${level} score=${score}] ${uri}${summary ? ` — ${summary}` : ""}`);
    if (estimateTokens(lines.join("\n")) >= budgetTokens) break;
  }
  return trimToBudget(redactSecrets(lines.join("\n")), budgetTokens);
}

export async function retrieveOpenViking({ root, scope, budgetTokens, timeoutMs, limit = 5 }) {
  const provider = baseProvider("openviking", budgetTokens, {
    authority: "recall-only",
    source: "OpenViking semantic retrieval",
    privacy: "query-may-be-sent-to-the-configured-openviking-server",
  });
  if (budgetTokens < 80) {
    return { ...provider, status: "skipped", reason: "insufficient context budget" };
  }

  const command = process.env.OPENVIKING_BIN || "ov";
  const prefixArgs = parseArgPrefix(process.env.OPENVIKING_BIN_ARGS);
  const execution = runCli(
    command,
    [
      ...prefixArgs,
      "-o",
      "json",
      "find",
      scope,
      "--context-type",
      "memory,resource,skill",
      "--limit",
      String(limit),
    ],
    {
      cwd: root,
      timeoutMs,
      env: process.env.OPENVIKING_LANG ? {} : { OPENVIKING_LANG: "en" },
    },
  );
  if (!execution.ok) {
    return {
      ...provider,
      ...execution,
      content: "",
      estimatedTokens: 0,
      reason: execution.reason || "OpenViking retrieval failed",
    };
  }

  const parsed = parseJsonFromMixedOutput(execution.stdout);
  if (!parsed) {
    return {
      ...provider,
      status: "error",
      reason: "OpenViking returned output that was not parseable JSON",
      durationMs: execution.durationMs,
    };
  }
  if (parsed.ok === false || parsed.status === "error") {
    return {
      ...provider,
      status: "error",
      reason: redactSecrets(String(parsed.error || parsed.message || "OpenViking retrieval failed")).slice(0, 320),
      durationMs: execution.durationMs,
    };
  }

  const content = normalizeFindPayload(parsed, budgetTokens);
  return {
    ...provider,
    status: "ok",
    content,
    estimatedTokens: estimateTokens(content),
    durationMs: execution.durationMs,
  };
}
