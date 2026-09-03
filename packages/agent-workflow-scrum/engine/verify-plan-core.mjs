import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangeScope } from "./change-scope.mjs";
import { commandWithArgs, loadWorkflowConfig } from "./workflow-config.mjs";

const DOCS_ROOT = ".agents/docs";

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

function matchesAny(paths, patterns) {
  return paths.some((file) => patterns.some((pattern) => pattern.test(file)));
}

function inferRiskHints(paths) {
  const joined = paths.join(" ").toLowerCase();
  const hints = new Set();
  if (/auth|security|secret|credential|permission|payment|session|identity/.test(joined)) hints.add("security");
  if (/migration|release|deploy|production|rollback/.test(joined)) hints.add("release");
  if (/\.github\/|test|spec|worker|subprocess|process|server|socket|network|port|async|concurr|race|timeout|teardown|cleanup/.test(joined)) hints.add("reliability");
  if (/\.agents\/docs\/|readme|agents\.md|context\.md|\.agents\/skills/.test(joined)) hints.add("docs");
  return [...hints];
}

function addCheck(checks, id, command, reason, strength = "required") {
  if (checks.some((item) => item.command === command)) return;
  checks.push({ id, command, reason, strength });
}

function workflowCheckCommand(command, input) {
  const args = ["--strict-budget"];
  if (input.base) args.push("--base", input.base);
  if (input.head !== "HEAD") args.push("--head", input.head);
  return commandWithArgs(command, args);
}

async function focusedWorkflowTests(root) {
  const candidates = [
    "tests/workflow-tools.test.mjs",
    "tests/context-providers.test.mjs",
    "tests/context-budget-contract.test.mjs",
    "tests/context-benchmark.test.mjs",
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

export async function buildVerificationPlan({ root = process.cwd(), base, head = "HEAD" } = {}) {
  const scope = collectChangeScope({ root, base, head });
  const config = await loadWorkflowConfig(scope.repositoryRoot);
  const paths = scope.paths.all;
  const checks = [];
  const manualReview = [];

  const workflowTouched = matchesAny(paths, [
    /^AGENTS\.md$/,
    /^CONTEXT\.md$/,
    /^\.agents\//,
    /^scripts\/(?:context|workflow-check|change-scope|verify-plan|doc-check)/,
    /^packages\/agent-workflow-scrum\/(?:engine|src|bin|templates)\//,
  ]);
  const skillsTouched = matchesAny(paths, [/^\.agents\/skills\//]);
  const workflowToolingTouched = matchesAny(paths, [
    /^scripts\/context(?:\.mjs|\/)/,
    /^scripts\/(?:context-benchmark|change-scope|verify-plan|workflow-check|doc-check)\.mjs$/,
    /^packages\/agent-workflow-scrum\/(?:engine|src|bin)\//,
    /^tests\/(?:workflow-tools|context-providers|context-budget-contract|context-benchmark|openviking-cli-contract|change-scope|verify-plan|scope-aware-context|doc-check)\.test\.mjs$/,
  ]);
  const productTouched = Boolean(scope.layers.product?.length);
  const testTouched = Boolean(scope.layers.tests?.length);
  const buildTouched = Boolean(scope.layers.build?.length || scope.layers.dependencies?.length);
  const docsTouched = Boolean(scope.layers.docs?.length)
    || skillsTouched
    || matchesAny(paths, [/^README\.md$/, /^AGENTS\.md$/, /^CONTEXT\.md$/, /^(?:scripts|tests)\/AGENTS\.md$/]);
  const ciTouched = Boolean(scope.layers.ci?.length);

  addCheck(checks, "diff-unstaged", "git diff --check", "Reject whitespace errors in the current worktree.");
  addCheck(checks, "diff-staged", "git diff --cached --check", "Reject whitespace errors in the staged index.");

  if (workflowTouched && config.checks.workflow) {
    addCheck(checks, "workflow", workflowCheckCommand(config.checks.workflow, scope.input), "Workflow/task/suggestion/link/context-budget state changed; verify product synchronization against the explicit outgoing base when supplied.");
  }

  if (docsTouched && config.checks.docs) {
    addCheck(checks, "docs", config.checks.docs, `Documentation/instruction prose under ${DOCS_ROOT} or standing instructions changed; enforce budgets and repository-relative links.`);
  }

  if (skillsTouched && config.checks.skills) {
    addCheck(checks, "skill-adapters", config.checks.skills, "Canonical skill or generated adapter behavior changed.");
  }

  if (workflowToolingTouched) {
    const focused = await focusedWorkflowTests(scope.repositoryRoot);
    if (focused.length) {
      addCheck(
        checks,
        "workflow-tool-tests",
        `node --test ${focused.join(" ")}`,
        "Context/scope/verification/document tooling changed; run the focused dependency-free regression set before the broad product suite.",
      );
    }
  }

  if ((productTouched || testTouched || buildTouched || ciTouched) && config.checks.test) {
    addCheck(checks, "product-tests", config.checks.test, "Product, tests, build inputs, or CI execution changed.");
  }

  if ((productTouched || buildTouched) && config.checks.build) {
    addCheck(checks, "build", config.checks.build, "Runtime source or build/dependency inputs changed.");
  }

  if (docsTouched) {
    manualReview.push(`Semantically review changed prose against its owning code/behavior and ${DOCS_ROOT} ownership tier; a green budget/link check does not prove accuracy or placement.`);
  }
  if (ciTouched) {
    manualReview.push("Inspect the real CI job/worker topology and confirm the changed workflow still exercises the intended checks on supported platforms.");
  }
  if (inferRiskHints(paths).includes("reliability")) {
    manualReview.push("For resource-owning/asynchronous tests, verify atomic allocation, deterministic synchronization, exact global-state restoration, and cleanup to quiescence; do not use sleeps/retries as the primary fix.");
  }
  if (inferRiskHints(paths).includes("security")) {
    manualReview.push("Trace denial/authorization paths to the real operation and verify negative cases at the user or service boundary.");
  }

  manualReview.push("Changed paths cannot prove dynamic/configuration/subprocess/provider reachability. Add the narrowest owning check when behavior crosses a boundary not visible from filenames.");
  manualReview.push("Tests and historical workflow notes are evidence, not absolute authority; reconcile them with current code, approved acceptance criteria, and explicit human decisions.");

  return {
    schemaVersion: 2,
    docsRoot: DOCS_ROOT,
    packageManager: config.packageManager,
    repositoryRoot: scope.repositoryRoot,
    input: scope.input,
    resolved: scope.resolved,
    paths: scope.paths,
    layers: scope.layers,
    riskHints: inferRiskHints(paths),
    checks,
    manualReview,
  };
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
