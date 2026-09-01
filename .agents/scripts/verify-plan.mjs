import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildVerificationPlan as buildCoreVerificationPlan } from "./verify-plan-core.mjs";

const SKILL_SCRIPT = ".agents/scripts/skill.sh";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function packageScripts(root) {
  try {
    const parsed = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    return parsed?.scripts && typeof parsed.scripts === "object" ? parsed.scripts : {};
  } catch {
    return {};
  }
}

async function focusedWorkflowTests(root) {
  const candidates = [
    "tests/workflow-tools.test.mjs",
    "tests/context-providers.test.mjs",
    "tests/context-budget-contract.test.mjs",
    "tests/openviking-cli-contract.test.mjs",
    "tests/change-scope.test.mjs",
    "tests/verify-plan.test.mjs",
    "tests/scope-aware-context.test.mjs",
    "tests/doc-check.test.mjs",
  ];
  const present = [];
  for (const file of candidates) {
    if (await exists(path.join(root, file))) present.push(file);
  }
  return present;
}

function addCheck(checks, id, command, reason, strength = "required") {
  if (checks.some((item) => item.command === command)) return;
  checks.push({ id, command, reason, strength });
}

export async function buildVerificationPlan(options = {}) {
  const plan = await buildCoreVerificationPlan(options);
  const root = plan.repositoryRoot;
  const paths = plan.paths.all;
  const scripts = await packageScripts(root);

  const toolingTouched = paths.some((file) => /^(?:\.agents\/scripts|scripts)\/(?:context(?:-core)?(?:\.mjs|\/)|change-scope(?:-core)?\.mjs|verify-plan(?:-core)?\.mjs|workflow-check(?:-core)?\.mjs|doc-check(?:-core)?\.mjs)$/.test(file));
  if (toolingTouched) {
    const focused = await focusedWorkflowTests(root);
    if (focused.length) {
      addCheck(
        plan.checks,
        "workflow-tool-tests",
        `node --test ${focused.join(" ")}`,
        "Context/scope/verification/document tooling changed; run the focused dependency-free regression set before the broad product suite.",
      );
    }
  }

  const skillsTouched = paths.some((file) => /^\.agents\/skills\//.test(file));
  const skillToolTouched = paths.includes(SKILL_SCRIPT) || paths.includes("scripts/skill.sh");
  plan.checks = plan.checks.filter((item) => item.command !== "scripts/skill.sh check");
  if ((skillsTouched || skillToolTouched) && await exists(path.join(root, SKILL_SCRIPT))) {
    addCheck(plan.checks, "skill-adapters", `${SKILL_SCRIPT} check`, "Canonical skill or generated adapter behavior changed.");
  }

  if (paths.includes(".agents/scripts/AGENTS.md") && scripts["docs:check"]) {
    addCheck(plan.checks, "docs", "npm run docs:check", "Workflow-script standing instructions changed; validate documentation links and budgets.");
  }

  return plan;
}

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
