# Task 0019: Add Scope-Aware Verification and Layered Instructions

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
- **Affected layers:** context router, scope/verification/document tooling, canonical skills, root/subtree instructions, architecture/testing/defensive docs, onboarding/development docs, CI, tests.
- **Risk:** standard workflow/tooling change; an explicitly wrong base can still produce wrong scope, so resolved base/head/merge-base IDs remain visible and callers must verify the live target.
- **Recovery:** revert this increment's scope/planner/layered-instruction changes; the prior L0/L1/L2 + optional-provider router remains usable.

## Acceptance Criteria

- [x] `change:scope` requires an explicit base and reports committed/staged/unstaged/untracked paths.
- [x] `context --base <ref>` includes committed outgoing paths on a clean worktree.
- [x] Generated context separates decision authority from observation evidence.
- [x] `verify:plan` selects narrow known checks and names limitations of path-only inference.
- [x] Root + `docs/`, `scripts/`, and `tests/` instructions load ownership rules at the narrowest useful scope.
- [x] `docs/architecture.md` maps workflow planes, owners, provider seam, verification seam, and extension points.
- [x] Prose and reliability guidance are specialized/on-demand instead of inflating the default Scrum skill.
- [x] `docs:check` enforces standing-document token budgets and relative-link validity; CI runs it.
- [x] `/kb:scope` and `/kb:verify` are documented without turning startup into a universal checklist.
- [x] Fresh combined checks, strict budgets, production build, skill audit, and CI evidence pass.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Exact outgoing scope handles committed + dirty layers | `tests/change-scope.test.mjs` in CI run `33541216392` | Passed |
| Clean feature branches contribute committed paths to context | `tests/scope-aware-context.test.mjs` | Passed |
| Context keeps intended-vs-observed precedence separate | schema v4 authority regression in `tests/scope-aware-context.test.mjs` | Passed |
| Verification planner avoids unrelated checks and routes docs/workflow checks | `tests/verify-plan.test.mjs` | Passed |
| Provider fallback/privacy/budgets remain intact | 7 provider tests + OpenViking CLI contract test | Passed |
| Minimum context budget remains a hard cap | 2 context budget contract tests | Passed |
| Documentation budgets and links have positive + negative controls | 2 `doc-check` tests | Passed |
| Existing product behavior remains intact | 10 Counter tests | Passed |
| Existing workflow consistency behavior remains intact | 6 workflow/router tests | Passed |
| Full automated suite | GitHub Actions run `33541216392`: 33 passed, 0 failed/skipped | Passed |
| Production artifact | `npm run build` / Vite 8.2.2, 6 modules transformed | Passed |
| Workflow consistency | `npm run workflow:check -- --strict-budget` | Passed |
| Standing documentation | `npm run docs:check` | Passed |
| Canonical skills | `bash scripts/skill.sh check` | Passed |
| CI action runtime | `actions/checkout@v7`, `actions/setup-node@v7` | Passed without prior Node-runtime warning |

## Context Budget Evidence

- `AGENTS.md`: ~609 / 800
- `CONTEXT.md`: ~1199 / 1400
- `.agents/skills/agent-workflow-scrum/SKILL.md`: ~821 / 900
- `.agents/skills/agent-workflow-prose/SKILL.md`: ~878 / 1000
- `docs/architecture.md`: ~1506 / 1800
- `docs/AGENTS.md`: ~631 / 900
- `docs/testing.md`: ~875 / 1200
- `docs/defensive-patterns.md`: ~760 / 1000
- `scripts/AGENTS.md`: ~393 / 700
- `tests/AGENTS.md`: ~384 / 700

## Residual Risk

Path-based check selection cannot discover every configuration, dynamic-loading, subprocess, provider, or external-system dependency. `verify:plan` therefore remains a routing aid and explicitly requires semantic boundary review. An incorrect explicitly supplied PR base also remains possible; the tool exposes resolved base/head/merge-base commits instead of hiding the mistake behind inference.
