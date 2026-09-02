# Task 0026: Benchmark Raw Versus Bounded Context

> **Status:** done
> **Scrum Artifact:** verified increment
> **Created:** 2026-09-02
> **Completed:** 2026-09-02
> **PRD:** No product PRD change required; context tooling only.

## Outcome

The repository now has a read-only `npm run benchmark:context` command that compares a naive whole-repository text baseline with the real bounded context entry path. It defaults to local retrieval, supports an explicit scope/level/budget, reports a versioned JSON schema or concise human-readable output, and never prints the raw repository or full context pack.

## Change Contract

- **Human outcome:** contributors can measure how much the bounded context router reduces a naive whole-repository text prompt without depending on optional providers.
- **Acceptance evidence:** the benchmark reports raw tokens, bounded tokens, savings, reduction percentage, and timing; a deterministic fixture proves meaningful reduction and the budget contract.
- **Non-goals:** do not change product behavior, send repository content to external services, install providers, or treat benchmark output as acceptance authority.
- **Affected layers:** context tooling, package scripts, verification planning, development/testing guidance, and dependency-free tests.
- **Risk:** low; filesystem/Git text classification and timing are local benchmark concerns, not product correctness gates.
- **Recovery:** revert the benchmark script, package command, documentation, test, and this task.

## Acceptance Criteria

- [x] The benchmark compares a documented naive raw repository text baseline with the real bounded context entry path.
- [x] The benchmark uses local retrieval by default, supports an explicit scope/level/budget, and reports context budget status without printing the full pack.
- [x] A deterministic fixture proves the bounded pack is smaller than the raw baseline and remains within budget.
- [x] Benchmark output is machine-readable with a versioned schema and human-readable by default.
- [x] Usage and interpretation are documented without claiming timing results are stable across machines.
- [x] Focused and full verification checks pass.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Raw versus bounded measurement | `npm run benchmark:context -- "feature delivery" --provider local --level 0 --budget 1500 --json` | Raw 102,978 tokens from 98 tracked text files; bounded 639/1,500; savings 99.38% |
| Benchmark regression | `tests/context-benchmark.test.mjs` deterministic fixture | 3 passed, 0 failed |
| Budget/provider boundary | Benchmark defaults to `local`; bounded result reports `budgetExceeded: false` | Passed |
| Verification planner routing | `tests/verify-plan.test.mjs` benchmark-script fixture | Passed; benchmark regression is selected for benchmark tooling changes |
| Usage documentation | `.agents/docs/testing.md` and `.agents/docs/development.md` | Passed |
| Full automated suite | `npm test` | 55 passed, 0 failed |
| Production artifact | `npm run build` | Passed; Vite 8.2.2 |
| Strict workflow and outgoing scope | `npm run workflow:check -- --strict-budget --base origin/main` | Passed |
| Documentation checks | `npm run docs:check` | Passed; existing low-headroom warnings remain |
| Canonical adapters | Git Bash `bash .agents/scripts/skill.sh check all` | Passed |
| Diff hygiene | `git diff --check` and `git diff --cached --check` | Passed |

## Handoff

- Run `npm run benchmark:context -- "<scope>" --provider local --level 1 --budget 1500` for a comparable local measurement.
- Raw means all tracked UTF-8 text files; bounded means the context router's measured JSON pack. Token savings are comparable; timings vary by machine and filesystem state.
- Optional Graphify/OpenViking comparison requires explicit provider selection and should be reported separately from the local baseline.
