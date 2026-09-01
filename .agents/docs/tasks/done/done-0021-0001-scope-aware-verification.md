# Task 0021: Add Scope-Aware Verification and Layered Instructions

> **Status:** done
>
> **Scrum Artifact:** verified increment
>
> **Created:** 2026-09-02
> **Completed:** 2026-09-02

## Goal

Improve agent success rate and token/runtime efficiency by making review/context aware of committed outgoing changes, selecting the smallest credible verification set, and loading detailed architecture/prose/test rules only in the subtree or task mode that owns them.

## Change Contract

- **Human outcome:** agents do not miss committed branch changes, confuse intended requirements with current implementation evidence, or load/run unrelated guidance/checks.
- **Acceptance evidence:** explicit base/head/merge-base scope report; context consumes committed scope and exposes separate decision/evidence orders; verification planner selects affected checks; architecture/document/test/script ownership is explicit; prose/reliability guidance is on-demand; standing docs are budgeted; negative fixtures cover base refusal, dirty layers, clean committed scope, check selection, doc budget/link failure, and authority schema.
- **Non-goals:** do not infer/fetch a PR base, replace semantic review with filename mapping, require DeepSeek Harness conventions, or copy its full Agent Note/i18n/package machinery.
- **Affected layers:** context router, scope/verification/document tooling, canonical skills, root/subtree instructions, architecture/testing/defensive guidance, onboarding/development docs, CI, tests.
- **Risk:** an explicitly wrong base can still produce wrong scope, so resolved base/head/merge-base IDs remain visible and callers must verify the live target.
- **Recovery:** revert this increment's scope/planner/layered-instruction changes; the prior L0/L1/L2 + optional-provider router remains usable.

## Acceptance Criteria

- [x] `change:scope` requires an explicit base and reports committed/staged/unstaged/untracked paths.
- [x] `context --base <ref>` includes committed outgoing paths on a clean worktree.
- [x] Generated context separates decision authority from observation evidence.
- [x] `verify:plan` selects narrow known checks and names limitations of path-only inference.
- [x] Root + scoped `.agents/docs/`, `scripts/`, and `tests/` instructions load ownership rules at the narrowest useful scope.
- [x] `.agents/docs/architecture.md` maps workflow planes, owners, provider seam, verification seam, and extension points.
- [x] Prose and reliability guidance are specialized/on-demand instead of inflating the default Scrum skill.
- [x] `docs:check` enforces standing-document token budgets and relative-link validity; CI runs it.
- [x] `/kb:scope` and `/kb:verify` are documented without turning startup into a universal checklist.
- [x] Fresh combined checks, strict budgets, production build, skill audit, and CI evidence passed on the original verified tree.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Exact outgoing scope handles committed + dirty layers | `tests/change-scope.test.mjs` | Passed |
| Clean feature branches contribute committed paths to context | `tests/scope-aware-context.test.mjs` | Passed |
| Context keeps intended-vs-observed precedence separate | authority regression in `tests/scope-aware-context.test.mjs` | Passed |
| Verification planner avoids unrelated checks and routes workflow/doc checks | `tests/verify-plan.test.mjs` | Passed |
| Provider fallback/privacy/budgets remain intact | provider tests + OpenViking CLI contract test | Passed |
| Documentation budgets and links have positive + negative controls | `tests/doc-check.test.mjs` | Passed |
| Existing product behavior remains intact | Counter tests | Passed |
| Full automated suite | GitHub Actions run `33541216392`: 33 passed, 0 failed/skipped | Passed |
| Production artifact | Vite production build | Passed |
| Workflow consistency | strict workflow/context budgets | Passed |
| Standing documentation | documentation budgets/links | Passed |
| Canonical skills | `bash scripts/skill.sh check` | Passed |

## Context Budget Evidence

The original verified tree kept standing instructions under their configured ceilings. The later `.agents/docs/` relocation re-runs the same budget checks under the new namespace rather than treating these historical counts as current proof.

## Residual Risk

Path-based check selection cannot discover every configuration, dynamic-loading, subprocess, provider, or external-system dependency. `verify:plan` remains a routing aid and requires semantic boundary review. An incorrect explicitly supplied PR base also remains possible; the tool exposes resolved base/head/merge-base commits instead of hiding the mistake behind inference.
