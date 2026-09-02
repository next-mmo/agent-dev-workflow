# Task 0025: Enforce Beta Workflow Synchronization and Context Limits

> **Status:** done
> **Scrum Artifact:** verified increment
> **Created:** 2026-09-02
> **Completed:** 2026-09-02
> **PRD:** No product PRD change required; workflow tooling only.

## Outcome

Product changes now require a synchronized task, canonical PRD, PRD-index entry, acceptance criteria, and evidence ledger. Context output is hard-capped, including the 500-token minimum, and stale inline references to legacy workflow paths are rejected.

## Change Contract

- **Human outcome:** a feature or breaking change cannot pass the local workflow check without a task/PRD/evidence trail, and bounded context never exceeds its requested budget.
- **Acceptance evidence:** product-scope synchronization has positive and negative controls; a 500-token real-context case stays within budget; stale inline workflow paths fail documentation checks.
- **Non-goals:** do not change Counter App behavior, infer a review base, install optional providers, or alter human approval authority.
- **Affected layers:** workflow checker, context router, documentation checker, verification planner, canonical workflow guidance, and dependency-free regression tests.
- **Risk:** standard workflow-tooling change; false-positive path detection and over-trimming are covered by fixtures.
- **Recovery:** revert this task and its focused checker/context/documentation changes.

## Acceptance Criteria

- [x] Product paths require one active task or one changed completed task with a valid PRD reference, PRD-index entry, acceptance criteria, and evidence ledger.
- [x] Workflow checks accept a synchronized product increment and reject missing or malformed synchronization artifacts.
- [x] Context output remains at or below the requested budget, including the 500-token minimum, while preserving the smallest useful routing metadata.
- [x] Documentation checks reject stale inline references to the legacy root `docs/` workflow paths and preserve intentional legacy-path evidence wording.
- [x] Canonical docs and current task/PRD metadata use `.agents/docs/` paths.
- [x] Focused and full verification checks pass.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Product synchronization guard | `tests/workflow-tools.test.mjs`: positive, negative, incomplete-metadata, and explicit-base fixtures | Passed |
| Hard context budget | `tests/context-budget-contract.test.mjs`: minimum, many-dirty-path, and impossible-scope 500-token cases; breaking-change context measured 357/500 after compaction | Passed |
| Inline legacy-path detection | `tests/doc-check.test.mjs`: stale-path rejection and intentional legacy wording control | Passed |
| Verification planner base propagation | `tests/verify-plan.test.mjs`: workflow check receives the verified base | Passed |
| Canonical metadata paths | `npm run docs:check` | Passed; low-headroom warnings remain for existing standing documents |
| Focused workflow regressions | `node --test tests/workflow-tools.test.mjs tests/context-budget-contract.test.mjs tests/doc-check.test.mjs tests/verify-plan.test.mjs` | 24 passed, 0 failed |
| Full automated suite | `npm test` | 51 passed, 0 failed |
| Production artifact | `npm run build` | Passed; Vite 8.2.2 |
| Strict workflow and outgoing scope | `npm run workflow:check -- --strict-budget --base origin/main` | Passed |
| Canonical adapters | Git Bash `bash .agents/scripts/skill.sh check all` | Passed |
| Diff hygiene | `git diff --check` and `git diff --cached --check` | Passed |

## Handoff

- `workflow:check` inspects local Git changes by default; pass the same explicit verified `--base` used for outgoing scope to include committed product paths.
- Product paths are `src/`, `index.html`, and `public/`. A synchronized increment uses one active `wip-*`/`blocked-*` task, or one changed `done-*` task with evidence.
- Tight context budgets compact summaries and low-priority path detail; an impossible scope exits with a narrowing/increase-budget error rather than emitting an over-budget pack.
- Generated Claude and Cursor adapters were regenerated from the canonical `.agents/skills/` sources and passed the all-adapter audit.
