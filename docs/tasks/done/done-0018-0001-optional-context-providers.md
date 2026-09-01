# Task 0018: Add Optional Context Providers

> **Status:** done
>
> **Scrum Artifact:** completed increment
>
> **Created:** 2026-09-01
>
> **Completed:** 2026-09-01

## Goal

Complete the smart context architecture with local repository retrieval plus optional Graphify code-graph and OpenViking semantic-recall providers without weakening repository authority, privacy, failure isolation, or the total token budget.

## Change Contract

- **Human outcome:** agents can use all three context layers when useful while the workflow still succeeds when Graphify/OpenViking are missing, stale, slow, or broken.
- **Acceptance evidence:** provider composition is bounded by one total budget; `auto` never queries OpenViking; Graphify uses an existing local graph; provider timeout/error preserves local context; provider evidence is untrusted and common secret shapes are redacted; tests cover success/failure/budget/privacy paths.
- **Non-goals:** do not require either provider, auto-install tools, auto-build Graphify, configure/write OpenViking, move canonical task/PRD state out of Git, or trust provider output as authorization.
- **Affected layers:** context router, provider adapters, skill references/commands, context authority docs, development/onboarding docs, tests, CI.
- **Risk:** standard tooling/workflow change. OpenViking may send the explicit query to a configured remote service, so it remains explicit opt-in.
- **Baseline:** local L0/L1/L2 router worked under a total token budget but had no pluggable external retrieval.
- **Verification plan:** syntax checks, existing workflow tests, provider fixture tests, strict context budgets, workflow consistency, product tests/build where environment permits.
- **Recovery:** revert provider modules/docs and retain the local router from task 0017.

## Acceptance Criteria

- [x] Local repository context remains mandatory and authoritative.
- [x] Graphify is optional, local, budgeted, timeout-safe, and staleness-aware.
- [x] OpenViking is optional, read-only, explicit opt-in, budgeted, timeout-safe, and normalized before injection.
- [x] `--provider auto|local|graphify|openviking|all` is supported.
- [x] Provider failure never turns a valid local context request into a failure.
- [x] Total context stays under the caller's requested budget after provider composition.
- [x] Budgets below the viable 500-token minimum are rejected instead of producing misleading over-budget packs.
- [x] Common provider diagnostic and evidence secret shapes are redacted.
- [x] Canonical skill/docs define provider precedence, trust, and privacy boundaries.
- [x] Final combined checks and handoff evidence are recorded.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Final context/provider code parses | `node --check` on final `scripts/context.mjs` and provider modules in reconstructed branch test surface | Passed |
| Local + Graphify + OpenViking behavior | Final combined Node suite covers provider selection, composition, missing graph, timeout, oversized output, explicit OpenViking opt-in, and CLI ordering | Passed |
| Provider evidence is secret-safe | Tests reject leaked `api_key`/Bearer values; final adapters redact provider stdout/error summaries | Passed |
| Minimum and total token budgets are enforced | 499-token request is rejected; 500-token local fixture stays at or under 500; oversized provider fixture stays under requested total | Passed |
| Original workflow/router behavior remains healthy | Six original workflow/context fixture tests pass against the final router | Passed |
| Counter demo behavior remains healthy | Ten existing Counter state/persistence/undo/theme tests pass | Passed |
| Combined regression suite | 26 tests, 26 passed, 0 failed | Passed |
| Canonical context budgets | Strict branch-level workflow/context-budget check passed before final provider hardening; final hardening changes only scripts/tests/CI and lifecycle records | Passed |
| CI regression gate | `.github/workflows/ci.yml` runs install, tests, build, strict workflow check, and skill audit for future PR/main events | Added; no run on this PR because the new workflow is not on the base branch yet |
| Production build | Vite build requires installed dependencies not available in the current execution environment; product source/dependency versions are unchanged | Skipped |

## Handoff

- **Outcome:** Agent Workflow Scrum now has a three-layer context model: repository-local retrieval always, optional Graphify code-impact retrieval, and optional explicit OpenViking semantic recall.
- **Privacy:** `auto` never sends scope to OpenViking; OpenViking runs only via explicit provider selection. Provider content is advisory/untrusted data.
- **Reliability:** provider absence, errors, timeouts, stale Graphify working-tree state, and oversized responses degrade safely to bounded local context.
- **Token safety:** one global budget with provider sub-budgets, hard trimming, and a 500-token minimum contract.
- **Verification:** fresh final combined suite: 26/26 passed.
- **Skipped:** Vite production build for this task because installed dependencies are unavailable in the execution environment; no application or dependency source changed.
- **Residual risk:** Graphify/OpenViking CLI formats can evolve, and retrieval quality on large repositories still needs real-task measurement. Regression tests lock the currently documented adapter contracts and local fallback remains authoritative.
- **Human decision:** optional provider layer explicitly approved by the user and recorded in suggestion 0003.
