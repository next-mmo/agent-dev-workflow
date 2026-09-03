export { buildVerificationPlan } from "./verify-plan-core.mjs";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildVerificationPlan } from "./verify-plan-core.mjs";

function parseArgs(argv) {
  const options = { root: process.cwd(), base: "", head: "HEAD", json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") options.base = argv[++index] || "";
    else if (arg === "--head") options.head = argv[++index] || "";
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--json") options.json = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

function renderText(plan) {
  const lines = [
    "# Verification Plan",
    "",
    `- Base: ${plan.input.base} (${plan.resolved.baseSha.slice(0, 12)})`,
    `- Head: ${plan.input.head} (${plan.resolved.headSha.slice(0, 12)})`,
    `- Merge base: ${plan.resolved.mergeBaseSha.slice(0, 12)}`,
    `- Changed paths: ${plan.paths.all.length}`,
    `- Docs root: ${plan.docsRoot}`,
    `- Package manager: ${plan.packageManager}`,
    `- Risk hints: ${plan.riskHints.join(", ") || "none"}`,
    "",
    "## Selected checks",
    "",
  ];
  if (!plan.checks.length) lines.push("- No deterministic command mapping found; select the owning project check manually.");
  else for (const check of plan.checks) lines.push(`- \`${check.command}\` — ${check.reason}`);
  lines.push("", "## Manual review", "");
  for (const item of plan.manualReview) lines.push(`- ${item}`);
  return `${lines.join("\n")}\n`;
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const plan = await buildVerificationPlan(options);
    process.stdout.write(options.json ? `${JSON.stringify(plan, null, 2)}\n` : renderText(plan));
  } catch (error) {
    console.error(`verify-plan: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
