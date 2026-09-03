import { spawnSync } from "node:child_process";

export function estimateTokens(value) {
  return Math.max(1, Math.ceil(String(value || "").length / 4));
}

export function trimToBudget(value, budgetTokens) {
  const text = String(value || "").trim();
  const maxChars = Math.max(0, Math.floor(budgetTokens * 4));
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return "";

  const targetLimit = maxChars - 1;
  const lookback = Math.min(160, Math.max(16, Math.floor(targetLimit * 0.25)));
  const searchStart = Math.max(0, targetLimit - lookback);
  const candidateSlice = text.slice(searchStart, targetLimit);

  let sliceOffset = -1;

  const paraIndex = candidateSlice.lastIndexOf("\n\n");
  if (paraIndex !== -1) {
    sliceOffset = searchStart + paraIndex;
  } else {
    const sentenceMatch = candidateSlice.match(/([.!?])(?:\s|$)(?!.*[.!?](?:\s|$))/s);
    if (sentenceMatch && typeof sentenceMatch.index === "number") {
      sliceOffset = searchStart + sentenceMatch.index + 1;
    } else {
      const lineIndex = candidateSlice.lastIndexOf("\n");
      if (lineIndex !== -1) {
        sliceOffset = searchStart + lineIndex;
      } else {
        const spaceIndex = candidateSlice.lastIndexOf(" ");
        if (spaceIndex !== -1) {
          sliceOffset = searchStart + spaceIndex;
        }
      }
    }
  }

  const finalLimit = sliceOffset > 0 ? sliceOffset : targetLimit;
  let trimmed = text.slice(0, finalLimit).trimEnd();
  if (!trimmed) trimmed = text.slice(0, targetLimit).trimEnd();

  const openFences = (trimmed.match(/```/g) || []).length % 2 === 1;
  if (openFences) {
    if (trimmed.length + 5 > maxChars) {
      const fenceSafeLimit = Math.max(0, maxChars - 5);
      const safeLine = trimmed.slice(0, fenceSafeLimit).lastIndexOf("\n");
      const cutAt = safeLine > 0 ? safeLine : fenceSafeLimit;
      trimmed = trimmed.slice(0, cutAt).trimEnd();
    }
    const stillOpen = (trimmed.match(/```/g) || []).length % 2 === 1;
    return stillOpen ? `${trimmed}\n\`\`\`…` : `${trimmed}…`;
  }

  return `${trimmed}…`;
}


export function redactSecrets(value) {
  return String(value || "")
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [redacted]")
    .replace(/((?:api[_-]?key|token|secret|password)\s*[=:]\s*)[^\s,;]+/gi, "$1[redacted]");
}

function sanitizeDiagnostic(value) {
  return redactSecrets(value).slice(0, 320);
}

export function runCli(command, args, { cwd, timeoutMs = 8000, env = {} } = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
    env: { ...process.env, ...env },
    windowsHide: true,
  });
  const durationMs = Date.now() - started;

  if (result.error?.code === "ENOENT") {
    return { ok: false, status: "unavailable", reason: `${command} is not installed or not on PATH`, durationMs };
  }
  if (result.error?.code === "ETIMEDOUT" || result.signal) {
    return { ok: false, status: "timeout", reason: `${command} exceeded ${timeoutMs}ms`, durationMs };
  }
  if (result.status !== 0) {
    const detail = sanitizeDiagnostic(String(result.stderr || result.stdout || "").trim().split(/\r?\n/).slice(-3).join(" "));
    return {
      ok: false,
      status: "error",
      reason: detail || `${command} exited with status ${result.status}`,
      durationMs,
      exitCode: result.status,
    };
  }
  return { ok: true, status: "ok", stdout: String(result.stdout || ""), durationMs };
}

export function parseJsonFromMixedOutput(output) {
  const value = String(output || "").trim();
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    // Some CLIs echo the command before JSON. Parse the widest object payload.
  }
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(value.slice(first, last + 1));
    } catch {
      return null;
    }
  }
  return null;
}

export function parseArgPrefix(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function baseProvider(name, budgetTokens, overrides = {}) {
  return {
    name,
    status: "skipped",
    authority: "advisory",
    trust: "untrusted-data",
    budgetTokens,
    estimatedTokens: 0,
    content: "",
    ...overrides,
  };
}
