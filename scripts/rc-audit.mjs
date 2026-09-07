import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// An opt-in acceptance audit: failures are release findings, never silently accepted.
const source = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const value = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : null;
const tarball = path.resolve(value("--tarball") || path.join(source, "next-mmo-agent-workflow-scrum-0.1.0.tgz"));
const output = value("--output");
const directory = await mkdtemp(path.join(os.tmpdir(), "agent-rc-audit-"));
const checks = [];
const env = { ...process.env, WORKFLOW_MODE: "", AGENT_WORKFLOW_MODE: "", AGENT_CONTEXT_PROVIDER: "auto" };
const run = (command, argv, cwd, extraEnv = {}) => {
  const result = spawnSync(command, argv, { cwd, env: { ...env, ...extraEnv }, encoding: "utf8", timeout: 30000 });
  return { code: result.status, stdout: result.stdout || "", stderr: result.stderr || "", error: result.error?.code || null };
};
const git = (root, ...argv) => {
  const result = run("git", argv, root);
  if (result.code !== 0) throw new Error(`git ${argv[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
};
const put = async (root, name, content) => {
  await mkdir(path.dirname(path.join(root, name)), { recursive: true });
  await writeFile(path.join(root, name), content);
};
const record = (id, passed, evidence) => checks.push({ id, status: passed ? "passed" : "failed", evidence });
const parse = (result) => {
  try { return JSON.parse(result.stdout); } catch { throw new Error(`command returned non-JSON (${result.code}): ${result.stderr}`); }
};
const commit = (root) => {
  git(root, "add", ".");
  git(root, "commit", "-qm", "audit fixture");
  return git(root, "rev-parse", "HEAD");
};

async function fixture(name, files = {}) {
  const root = path.join(directory, name);
  await mkdir(root);
  await put(root, ".gitignore", "node_modules/\n*.db\n");
  await put(root, "package.json", JSON.stringify({ name, private: true }));
  for (const [file, content] of Object.entries(files)) await put(root, file, content);
  git(root, "init", "-q");
  git(root, "config", "user.email", "audit@example.invalid");
  git(root, "config", "user.name", "Audit Fixture");
  const install = run("npm", ["install", "--offline", "--no-audit", "--no-fund", "--save-dev", "--save-exact", tarball], root);
  if (install.code !== 0) throw new Error(`offline package install failed: ${install.stderr}`);
  const binary = path.join(root, "node_modules/@next-mmo/agent-workflow-scrum/bin/agent-workflow.mjs");
  const invoke = (argv, extraEnv) => run(process.execPath, [binary, ...argv], root, extraEnv);
  const init = invoke(["init", "--existing", "--json"]);
  if (init.code !== 0) throw new Error(`init failed: ${init.stderr}`);
  const base = commit(root);
  return { root, invoke, base, config: path.join(root, ".agents/config.json") };
}

const httpTest = `import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import { once } from 'node:events';
test('tenant isolation and idempotent invoice creation at HTTP boundary', async () => {
  const invoices = new Map();
  const server = http.createServer((req, res) => {
    const tenant = req.headers['x-tenant'];
    const key = req.headers['idempotency-key'];
    if (!tenant) { res.writeHead(401).end(); return; }
    if (req.method === 'POST') {
      if (!key) { res.writeHead(400).end(); return; }
      const identity = tenant + ':' + key;
      if (!invoices.has(identity)) invoices.set(identity, { id: String(invoices.size + 1), tenant });
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(invoices.get(identity)));
    } else {
      const invoice = [...invoices.values()].find(item => item.id === req.url.slice(1));
      if (!invoice || invoice.tenant !== tenant) { res.writeHead(404).end(); return; }
      res.end(JSON.stringify(invoice));
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port;
  try {
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, {method:'POST', headers:{'x-tenant':'A'}})).status, 400);
    const create = () => fetch(url, {method:'POST', headers:{'x-tenant':'A','idempotency-key':'one'}}).then(r => r.json());
    const [a,b] = await Promise.all([create(), create()]);
    assert.equal(a.id, b.id);
    assert.equal((await fetch(url+'/'+a.id, {headers:{'x-tenant':'B'}})).status, 404);
    assert.equal((await fetch(url+'/'+a.id, {headers:{'x-tenant':'A'}})).status, 200);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
`;
const sqliteTest = `import sqlite3, unittest
class InvoiceTests(unittest.TestCase):
 def test_constraints_and_rollback(self):
  db=sqlite3.connect(':memory:')
  try:
   db.execute('CREATE TABLE invoice (tenant TEXT NOT NULL, key TEXT NOT NULL, amount INTEGER CHECK(amount>0), UNIQUE(tenant,key))')
   db.execute("INSERT INTO invoice VALUES ('A','one',100)")
   db.commit()
   with self.assertRaises(sqlite3.IntegrityError): db.execute("INSERT INTO invoice VALUES ('A','one',200)")
   db.rollback()
   with self.assertRaises(sqlite3.IntegrityError): db.execute("INSERT INTO invoice VALUES ('A','two',-1)")
   db.rollback()
   db.execute("INSERT INTO invoice VALUES ('B','one',200)")
   db.rollback()
   self.assertEqual(db.execute('SELECT count(*) FROM invoice').fetchone()[0],1)
   self.assertEqual(db.execute("SELECT count(*) FROM invoice WHERE tenant='B'").fetchone()[0],0)
  finally: db.close()
if __name__=='__main__': unittest.main()
`;

try {
  const f = await fixture("company-monorepo", {
    "AGENTS.md": "# Company policy\nProtect tenant data and require reviewed changes.\n",
    "package.json": JSON.stringify({ name: "company-monorepo", private: true, scripts: { test: "node --test tests/*.test.mjs", build: "node --check apps/api/server.mjs" } }),
    "apps/api/server.mjs": "export const release = 'baseline';\n",
    "tests/invoices.test.mjs": httpTest,
  });
  const before = await readFile(f.config, "utf8");
  const again = parse(f.invoke(["init", "--existing", "--json"]));
  record("consumer-repeat-init-preserves-policy", again.created.length === 0 && await readFile(f.config, "utf8") === before
    && (await readFile(path.join(f.root, "AGENTS.md"), "utf8")).includes("Company policy"), { created: again.created.length });
  record("consumer-doctor", f.invoke(["doctor", "--json"]).code === 0, { profile: "npm monorepo" });
  const http = run("npm", ["test"], f.root);
  record("real-http-tenant-and-idempotency-tests", http.code === 0, { exitCode: http.code, scenarios: ["unauthenticated", "invalid input", "concurrent duplicate", "cross-tenant denial", "owner access"] });
  await put(f.root, "apps/api/server.mjs", "export const release = 'changed';\n");
  const plan = parse(f.invoke(["verify", "--base", f.base, "--json"]));
  record("monorepo-verification-selects-project-checks", plan.checks.some(x => x.command === "npm test") && plan.checks.some(x => x.command === "npm run build"), { commands: plan.checks.map(x => x.command) });
  const releaseVerify = f.invoke(["verify"]);
  record("release-skill-command-is-executable", releaseVerify.code === 0, { exitCode: releaseVerify.code, diagnostic: releaseVerify.stderr.trim() });

  const policy = await fixture("quality-gates", { "src/app.js": "export const value = 0;\n" });
  await put(policy.root, "src/app.js", "export const value = 1;\n");
  await put(policy.root, ".agents/docs/prd/0000-prd-index.md", "# PRDs\n- [App](0001-app.md)\n");
  await put(policy.root, ".agents/docs/prd/0001-app.md", "# App\n- [ ] Value is verified.\n");
  await put(policy.root, ".agents/docs/tasks/done/done-0001-0001-app.md", "# Task\n> **Status:** done\n> **PRD:** `.agents/docs/prd/0001-app.md`\n\n## Acceptance Criteria\n- [ ] Deliberately unverified.\n\n## Recovery\nRevert.\n\n## Evidence Ledger\n- This is a claim without a test run.\n");
  commit(policy.root);
  const gate = policy.invoke(["check", "--mode", "strict", "--base", policy.base, "--json"]);
  record("strict-gate-rejects-unchecked-done-task", gate.code !== 0, { exitCode: gate.code, acceptanceUnchecked: true, evidenceIsUnverifiedText: true });
  const prdBefore = await readFile(path.join(policy.root, ".agents/docs/prd/0001-app.md"), "utf8");
  policy.invoke(["prdsync", "--json"]);
  record("prd-sync-preserves-human-acceptance", prdBefore === await readFile(path.join(policy.root, ".agents/docs/prd/0001-app.md"), "utf8"), { readOnly: true });

  const security = await fixture("security-canaries");
  const fake = "AUDIT_CANARY_7e5b9c4d_SYNTHETIC";
  await put(security.root, "credentials.json", JSON.stringify({ api_key: fake }));
  let review = security.invoke(["review", "--json"]);
  record("scanner-detects-basic-credential", review.code !== 0, { exitCode: review.code });
  await put(security.root, "credentials.json", JSON.stringify({ api_key: fake, endpoint: "https://example.invalid" }));
  review = security.invoke(["review", "--json"]);
  record("scanner-does-not-suppress-example-lines", review.code !== 0, { exitCode: review.code, scenario: "credential shares a line with example URL" });
  await rm(path.join(security.root, "credentials.json"));
  await put(security.root, ".env.production.local", `API_KEY=${fake}\n`);
  review = security.invoke(["review", "--json"]);
  record("scanner-covers-multi-suffix-env", review.code !== 0, { exitCode: review.code, skippedFiles: parse(review).skippedFiles });
  await rm(path.join(security.root, ".env.production.local"));
  await put(security.root, "secrets.py", `API_KEY = '${fake}'\n`);
  review = security.invoke(["review", "--json"]);
  record("scanner-covers-python-credential", review.code !== 0, { exitCode: review.code, skippedFiles: parse(review).skippedFiles });
  await rm(path.join(security.root, "secrets.py"));

  await put(security.root, ".agents/docs/prd/0099-payments-private.md", `# Payments private\napi_key=${fake}\n`);
  await put(security.root, ".agentignore", ".agents/docs/prd/0099-payments-private.md\n");
  let context = security.invoke(["context", "payments private", "--provider", "local", "--level", "1", "--budget", "5000", "--json"]);
  record("context-respects-agentignore", !context.stdout.includes(fake), { syntheticCanaryEmitted: context.stdout.includes(fake) });
  await rm(path.join(security.root, ".agentignore"));
  context = security.invoke(["context", "payments private", "--provider", "local", "--level", "1", "--budget", "5000", "--json"]);
  record("context-redacts-common-credentials", !context.stdout.includes(fake), { syntheticCanaryEmitted: context.stdout.includes(fake) });

  const links = await fixture("symlink-containment");
  const outside = path.join(directory, "owned-outside-canary");
  await mkdir(outside);
  await rm(path.join(links.root, ".agents/docs/plans"), { recursive: true });
  await symlink(outside, path.join(links.root, ".agents/docs/plans"), "dir");
  const escaped = links.invoke(["plan", "outside canary", "--json"]);
  const escapedFile = existsSync(path.join(outside, "0001-outside-canary.md"));
  record("plan-writes-stay-inside-project", !escapedFile, { exitCode: escaped.code, wroteOutsideProject: escapedFile, externalTargetWasOwnedTemporaryDirectory: true });

  const worktrees = await fixture("worktree-containment");
  const sibling = path.join(directory, "owned-sibling-worktree");
  git(worktrees.root, "worktree", "add", "-b", "owned-sibling", sibling);
  await mkdir(path.join(worktrees.root, ".worktrees"));
  const finished = worktrees.invoke(["worktree", "finish", "../../owned-sibling-worktree", "--json"]);
  record("worktree-finish-rejects-parent-traversal", existsSync(sibling), { exitCode: finished.code, removedOutsideProject: !existsSync(sibling), externalTargetWasOwnedTemporaryWorktree: true });

  const archive = await fixture("archive-preservation");
  const archivedName = "done-0001-0001-history.md";
  const oldRecord = "# Original durable evidence\n";
  await put(archive.root, `.agents/docs/tasks/archived/2020/${archivedName}`, oldRecord);
  await put(archive.root, `.agents/docs/tasks/done/${archivedName}`, "# Different record\n> Completed: 2020-07-01\n");
  const archived = archive.invoke(["archive", "--days", "1", "--json"]);
  const preserved = await readFile(path.join(archive.root, `.agents/docs/tasks/archived/2020/${archivedName}`), "utf8") === oldRecord;
  record("archive-preserves-existing-evidence", preserved, { exitCode: archived.code, existingEvidenceOverwritten: !preserved });
  await put(archive.root, ".agents/docs/tasks/done/done-0002-0001-year.md", "# Year boundary\n> Completed: 2020-01-01\n");
  const timezone = parse(archive.invoke(["archive", "--days", "1", "--dry-run", "--json"], { TZ: "Pacific/Honolulu" }));
  const yearEntry = timezone.archived.find(x => x.file === "done-0002-0001-year.md");
  record("archive-year-is-timezone-independent", yearEntry?.destPath.includes("/2020/"), { recordedDate: "2020-01-01", timezone: "Pacific/Honolulu", selectedYear: yearEntry?.destPath.split('/').at(-2) });

  await put(security.root, "README.md", '# Report input\n<script>globalThis.auditCanary=1</script>\n[link](javascript:alert)\n');
  const reportRun = security.invoke(["report", "--output", "audit-report"]);
  const html = await readFile(path.join(security.root, "audit-report/index.html"), "utf8");
  record("report-escapes-active-markup", reportRun.code === 0 && !html.includes('<script>globalThis.auditCanary=1</script>') && !html.includes('href="javascript:'), { exitCode: reportRun.code });

  const python = await fixture("python-backend", { "backend/app.py": "VERSION = 1\n", "tests/test_invoices.py": sqliteTest });
  const dbTest = run("python3", ["-m", "unittest", "discover", "-s", "tests"], python.root);
  record("real-sqlite-constraints-and-rollback", dbTest.code === 0, { exitCode: dbTest.code, scenarios: ["unique tenant/key", "positive amount", "rollback", "tenant query"] });
  await put(python.root, "backend/app.py", "VERSION = 2\n");
  const inferred = parse(python.invoke(["verify", "--base", python.base, "--json"]));
  record("python-defaults-select-owning-test", inferred.checks.some(x => /python|pytest/.test(x.command)), { commands: inferred.checks.map(x => x.command), limitation: "non-JS consumers require explicit configuration" });
  const pythonConfig = JSON.parse(await readFile(python.config, "utf8"));
  pythonConfig.paths.product = ["backend/**"];
  pythonConfig.checks.test = "python3 -m unittest discover -s tests";
  await writeFile(python.config, JSON.stringify(pythonConfig));
  const configured = parse(python.invoke(["verify", "--base", python.base, "--json"]));
  record("python-configured-selects-owning-test", configured.checks.some(x => x.command === pythonConfig.checks.test), { commands: configured.checks.map(x => x.command) });

  const provider = await fixture("provider-isolation");
  const marker = path.join(provider.root, "provider-called");
  const mock = path.join(provider.root, "mock-provider.cjs");
  await writeFile(mock, `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'called'); console.log(JSON.stringify({resources:[]}));`);
  const providerEnv = { OPENVIKING_BIN: process.execPath, OPENVIKING_BIN_ARGS: JSON.stringify([mock]) };
  provider.invoke(["context", "payments", "--provider", "auto", "--json"], providerEnv);
  record("auto-provider-never-calls-openviking", !existsSync(marker), { called: existsSync(marker) });
  const explicit = provider.invoke(["context", "payments", "--provider", "openviking", "--json"], providerEnv);
  record("explicit-provider-invocation", explicit.code === 0 && existsSync(marker), { exitCode: explicit.code, called: existsSync(marker) });
  await writeFile(mock, "setInterval(() => {}, 1000);\n");
  const timeout = provider.invoke(["context", "payments", "--provider", "openviking", "--provider-timeout", "100", "--json"], providerEnv);
  const timed = parse(timeout);
  record("provider-timeout-keeps-local-context", timeout.code === 0 && timed.providers.some(x => x.name === "openviking" && x.status === "timeout"), { exitCode: timeout.code, statuses: timed.providers.map(x => ({ name: x.name, status: x.status })) });
  await writeFile(mock, "console.log('invalid-json');\n");
  const malformed = parse(provider.invoke(["context", "payments", "--provider", "openviking", "--json"], providerEnv));
  record("malformed-provider-keeps-local-context", malformed.providers.some(x => x.name === "openviking" && x.status === "error"), { statuses: malformed.providers.map(x => ({ name: x.name, status: x.status })) });

  const ignoredBenchmark = await fixture("benchmark-exclusions");
  const benchmarkConfig = JSON.parse(await readFile(ignoredBenchmark.config, "utf8"));
  benchmarkConfig.ignore = ["generated/**"];
  await writeFile(ignoredBenchmark.config, JSON.stringify(benchmarkConfig));
  commit(ignoredBenchmark.root);
  const measure = () => parse(run(process.execPath, [path.join(source, "scripts/context-benchmark.mjs"), "payments", "--root", ignoredBenchmark.root, "--provider", "local", "--json"], source));
  const emptyBaseline = measure();
  await put(ignoredBenchmark.root, "generated/ignored.txt", "ignored generated content\n".repeat(1000));
  commit(ignoredBenchmark.root);
  const expandedBaseline = measure();
  record("benchmark-respects-configured-exclusions", emptyBaseline.raw.characters === expandedBaseline.raw.characters,
    { rawBefore: emptyBaseline.raw.characters, rawAfter: expandedBaseline.raw.characters, excludedFileCharacters: 26000 });

  for (const budget of [500, 1500, 5000]) {
    const result = f.invoke(["context", "invoice tenant denial", "--provider", "local", "--budget", String(budget), "--json"]);
    const data = parse(result);
    const serializedEstimate = Math.ceil(result.stdout.trim().length / 4);
    record(`context-budget-${budget}`, result.code === 0 && serializedEstimate <= budget, { budget, reportedEstimate: data.estimatedTokens, serializedEstimate });
  }
  const benchmark = run(process.execPath, [path.join(source, "scripts/context-benchmark.mjs"), "invoice tenant denial", "--provider", "local", "--json"], source);
  const measurement = parse(benchmark);
  record("benchmark-does-not-claim-task-savings", measurement.actualTaskTokenSavings === null, { measurement: measurement.measurement, raw: measurement.raw, bounded: measurement.bounded, reduction: measurement.reduction, actualTaskTokenSavings: measurement.actualTaskTokenSavings });
  const sourceContext = run(process.execPath, [path.join(source, "packages/agent-workflow-scrum/bin/agent-workflow.mjs"), "context", "consumer initialization package distribution", "--provider", "local", "--level", "1", "--budget", "1500", "--json"], source);
  const sourceData = parse(sourceContext);
  const emittedEstimate = Math.ceil(sourceContext.stdout.trim().length / 4);
  record("populated-context-bounds-emitted-json", sourceContext.code === 0 && emittedEstimate <= 1500, { budget: 1500, reportedEstimate: sourceData.estimatedTokens, emittedEstimate });

  const report = { schemaVersion: 1, auditedAt: new Date().toISOString(), sourceCommit: git(source, "rev-parse", "HEAD"),
    artifact: { filename: path.basename(tarball), sha256: createHash("sha256").update(await readFile(tarball)).digest("hex") },
    runtime: { node: process.version, platform: process.platform, arch: process.arch, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    scope: "packaged CLI acceptance probes; synthetic owned fixtures; no production or live model calls",
    summary: { passed: checks.filter(x => x.status === "passed").length, failed: checks.filter(x => x.status === "failed").length }, checks };
  if (output) await writeFile(path.resolve(output), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.summary.failed ? 1 : 0;
} finally {
  await rm(directory, { recursive: true, force: true });
}
