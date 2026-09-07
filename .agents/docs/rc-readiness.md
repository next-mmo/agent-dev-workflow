# Release Candidate Readiness Review — 2026-09-07

**Decision: no-go for an enterprise release candidate.** The workflow is suitable for supervised evaluation in disposable, non-sensitive projects. The current package has demonstrated privacy, filesystem containment, evidence-integrity, and output-budget defects that must be resolved before RC. This review does not authorize publication or production deployment.

## Evaluated scope and identity

- Main branch: `a24ec8bf15b1a6d18cde1ab0f3397324f7de2b2a`.
- Evaluated working baseline: `a8dee57553ba8d59d7eb7d3041136ac3e9014579`, including [draft PR #9](https://github.com/next-mmo/agent-dev-workflow/pull/9). That PR fixes CI scope/mode and was still unmerged during this review.
- Package: `@next-mmo/agent-workflow-scrum` version `0.1.0`, built with `npm run distribution:pack`; 86 files, approximately 87 kB compressed.
- Tarball SHA-256: `fda76cd5651ee30bdf1806da96dcc1fe4fad4bbb7f0543b2a1c98324b7f74571`.
- Local runtime: Linux x64, Node `v24.19.0`. PR #9's Ubuntu/Node 22 CI also passed. Windows/macOS and the minimum supported Node version were not independently exercised by this audit.
- All adversarial tests used synthetic canaries, owned temporary directories, and local HTTP/SQLite fixtures. No production systems, customer data, or live LLM APIs were used.

The package runtime was unchanged during this audit. Source context measurements include the audit worktree's task/routing metadata. The tarball hash identifies the exact tested bytes; a repack can have a different hash because archive metadata can change.

## Results

| Evidence | Result | What it establishes |
| :--- | :--- | :--- |
| Existing `npm run local:check` | 137 tests passed, zero reported skips; build, strict workflow, docs, and distribution passed | Existing regression contracts remain satisfied |
| Actual package installation | npm and pnpm distribution fixtures passed; additional npm monorepo/backend installations passed | Packaged CLI starts and supports basic adoption |
| New packaged acceptance audit | 31 probes: 17 passed, 14 failed expectations | Additional defects and adoption limits listed below |
| Local HTTP trial | Passed | Fixture tenant denial, missing identity/input, owner access, and concurrent duplicate handling |
| SQLite trial | Passed | Fixture uniqueness, positive-value constraint, tenant query, and rollback |
| Provider trials | Passed | `auto` did not invoke OpenViking; explicit invocation, timeout, and malformed-output fallback behaved as tested |
| Dependency audit | Zero vulnerabilities reported by `npm audit` at audit time | Registry audit result for this lockfile, not a security guarantee |
| Tokenizer audit | 15 context scenarios using tiktoken `0.14.0`, two encodings | Actual tokenization of emitted context; no task-cost measurement |

The HTTP/SQLite applications are deterministic synthetic consumer fixtures, not customer deployments and not evidence that the workflow itself implements tenant authorization or payment processing. The audit deliberately fails when an acceptance expectation is not met; failed probes do not all have the same severity.

Machine-readable evidence: [packaged probes](evidence/0040-rc-audit.json), [token measurements](evidence/0040-token-measurements.json), [dependency audit](evidence/0040-dependency-audit.json), and [forge snapshot](evidence/0040-forge-snapshot.json).

## RC blockers and required corrections

| Priority | Finding and demonstrated consequence | Required acceptance before RC |
| :--- | :--- | :--- |
| P0 | **Context privacy:** a document excluded through `.agentignore` was still selected, and a synthetic `api_key` value appeared in emitted local context. [Collector](../../packages/agent-workflow-scrum/engine/context-core.mjs) | Apply the same exclusion rules to document discovery, native recall, and output. Redact supported secret forms before serialization and provider queries. Test both text and JSON. Redaction supplements isolation; it cannot guarantee detection of every secret. |
| P0 | **Worktree containment:** `finish` accepted parent traversal and removed an owned test worktree outside the target project. [Worktree engine](../../packages/agent-workflow-scrum/engine/worktree-core.mjs) | Validate branch names; enforce canonical containment and exact registered worktree/branch ownership; reject traversal and symlink escapes. Preserve unrelated worktrees. |
| P0 | **Write containment:** a symlinked plans directory redirected a successful plan write outside its project. [Plan engine](../../packages/agent-workflow-scrum/engine/plan-core.mjs) | Introduce a shared safe-write boundary and apply it to init, plans, solutions, archive, and other mutations. Test symlinked parents and collision/race behavior. |
| P1 | **Evidence loss:** archive renamed a completed task over an existing archived record on Linux. [Archive engine](../../packages/agent-workflow-scrum/engine/archive-core.mjs) | Refuse conflicting destinations without modifying either record, or use a documented collision-preserving scheme. Add a real filesystem regression. |
| P1 | **False completion:** strict mode returned success for a done task with unchecked acceptance and an unverified text claim as its evidence. [Workflow checker](../../packages/agent-workflow-scrum/engine/workflow-check-core.mjs) | Reject unchecked done criteria. Bind automated evidence to executed commands, exit status, and source identity; mark stale/skipped/blocked results distinctly. Keep human acceptance separate. |
| P1 | **Scanner false negatives:** adding an example URL on the same JSON line suppressed detection of a synthetic credential; `.env.production.local` was skipped. [Scanner](../../packages/agent-workflow-scrum/engine/review-core.mjs) | Replace broad line exclusions with narrow, reviewable suppressions. Recognize multi-suffix environment files. Test matches and nonmatches through the packaged command. |
| P1 | **Release procedure is not executable as written:** the release skill's bare `verify` exits 1 because it requires a base. Bare `review` also omits committed changes on a clean checkout. [Release skill](../skills/agent-workflow-release/SKILL.md) | Supply the verified release base to all scope-dependent commands; execute the planned checks rather than treating a plan as their result. Resolve warnings individually. Do not require irrelevant service/database evidence for a standalone CLI. |
| P1 | **Output budget is applied before final formatting:** a populated response reports 1,496 heuristic tokens for a 1,500 budget, but emitted pretty JSON estimates at 1,717 by the same characters/4 rule. [Budget owner](../../packages/agent-workflow-scrum/engine/context-core.mjs) | Budget the actual emitted representation. Clearly expose the estimator; use model-specific tokenization or conservative limits when a model window is a hard requirement. |
| P1 | **Unenforced forge gates:** the GitHub API reported `main.protected=false`, an empty ruleset list, and no releases. The tracked workflow tree has no CODEOWNERS file. | Maintainers configure required checks, review ownership, stale-review handling, and restricted bypasses, then verify enforcement with a rejected merge attempt in an appropriate test setup. Merge the reviewed CI fix before evaluating main as the RC baseline. |

P0 means this review treats the defect as a release blocker because an agent can expose data or affect files outside its intended scope. These are local trust-boundary failures, not a claim of unauthenticated remote exploitation.

## Additional findings and scope limits

- **Archive date consistency:** a task completed `2020-01-01` was assigned to year `2019` under `Pacific/Honolulu`. Use the recorded date or UTC consistently and add a timezone regression.
- **Python coverage is not automatic:** the scanner explicitly skips Python; the default backend fixture's verification plan contained only whitespace checks. Configuring `paths.product` and a Python test command selected and ran the owning SQLite test successfully. Require explicit onboarding validation or narrow the advertised RC platform/language scope. Unsupported files must never be presented as inspected.
- **Benchmark baseline ignores configured exclusions:** adding 26,000 characters under a configured ignored directory increased the raw baseline from 22,104 to 48,104 characters. [Benchmark](../../scripts/context-benchmark.mjs) must use the same configuration/exclusion contract as the context path before its ratios are trusted.
- **Review is heuristic:** regular-expression matches do not establish semantic correctness, exploit resistance, or independent review. The README's AST terminology should match the implemented scanner.
- **Host enforcement is separate:** Markdown rules do not sandbox a coding agent, protect production credentials, or prevent it from rewriting its own gates. Enterprise use needs host permissions, environment isolation, protected policy ownership, and durable evidence outside agent-controlled claims.
- **Unverified integrations:** real IDE host loading, live Graphify/OpenViking services, production-scale monorepos, customer deployment history, supported OS/Node combinations, and upgrade compatibility were not established here. There is no published-release history to treat as field validation.

## Token-saving assessment

The bundled benchmark compared approximately **263,981 estimated tokens across all 292 tracked text files** with a context pack of **1,108 estimated tokens**, reporting **99.58% smaller context** in this run. It correctly reports `actualTaskTokenSavings: null`.

That baseline includes repository history documents, duplicated packaged guidance, and examples that a developer would not normally load all at once. The exclusion defect also affects the baseline. This percentage must not be advertised as 99.58% lower task cost or improved product quality.

Actual emitted-token measurements illustrate why the estimator needs careful labeling:

| Scenario | Level / budget | Reported heuristic | Emitted JSON, `o200k_base` | Emitted text, `o200k_base` |
| :--- | :--- | ---: | ---: | ---: |
| Source: consumer initialization | L1 / 1,500 | 1,496 | 1,821 | 1,135 |
| English fixture | L2 / 1,500 | 1,484 | 1,296 | 852 |
| Khmer fixture | L2 / 1,500 | 1,484 | 3,226 | 2,719 |
| Chinese fixture | L2 / 1,500 | 1,398 | 2,899 | 2,366 |

These are token counts for explicit encodings, not billed requests. Other models/tokenizers differ; for example, the same Khmer JSON produced 7,604 `cl100k_base` tokens.

Before claiming task savings, run matched tasks with the same model, harness, starting commit, tools, and acceptance tests. Compare a normal targeted-context baseline with this router. Record total input/output tokens, repeated file reads, tools, cached input, elapsed time, rework, and independent acceptance results. Include seeded bugs, backend/monorepo tasks, and repeated trials. Accept savings only when completion quality is maintained; report cost and latency separately.

## RC exit criteria

1. Fix the P0 privacy/containment issues and P1 evidence-loss/false-completion failures, with negative regressions in normal CI.
2. Correct release commands, scan coverage claims, and emitted-output budgeting. Validate all required project checks actually run on the candidate commit.
3. Establish a declared RC support matrix. Run the exact tarball through supported Node/OS/package-manager combinations, repeat initialization, upgrade/reinstall, and documented recovery.
4. Verify branch/review protections; identify the human release owner and the exact reviewed source and package hashes. Publish through an auditable process; consider [npm provenance](https://docs.npmjs.com/generating-provenance-statements/) for artifact/source traceability.
5. For an RC advertised as enterprise-ready or token-saving, add realistic independent task evaluations. A narrowly described workflow preview can state that task-token savings remain unmeasured, but it still needs the safety fixes above.

Release scope for this package is the CLI/plugin artifact. Database migrations, production health endpoints, and on-call service metrics are not applicable unless a hosted service is included. CLI rollback should restore the prior pinned package and lockfile while preserving project-owned tasks, evidence, configuration, and backups.

## Reproduction

From this source checkout:

```bash
npm ci
npm run distribution:pack
npm run local:check
node scripts/rc-audit.mjs --output /tmp/rc-audit.json
```

The opt-in audit requires npm, Git, Python 3, and a POSIX environment for its symlink/worktree scenarios. It installs only the local tarball into private fixtures. Exit 1 with a complete JSON report means failed acceptance expectations; an exception without a report is an audit infrastructure error. It is not part of default CI until maintainers adopt the corresponding RC criteria.

Tokenizer measurements use an optional audit-only dependency in an isolated environment:

```bash
python3 -m venv /tmp/workflow-token-audit
/tmp/workflow-token-audit/bin/pip install tiktoken==0.14.0
/tmp/workflow-token-audit/bin/python scripts/token-audit.py --output /tmp/token-audit.json
```

Tokenizer vocabulary downloads may require network access on first use. The measurements make no LLM calls. This report is an evidence-backed readiness review, not a full penetration test or a guarantee that all defects have been found.
