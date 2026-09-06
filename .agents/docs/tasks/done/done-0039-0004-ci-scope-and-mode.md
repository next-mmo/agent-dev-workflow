# Task 0039: CI Change Scope and Workflow Mode

> **Status:** done
> **Created:** 2026-09-07
> **PRD:** `.agents/docs/prd/0004-workflow-distribution.md`

## Change Contract

- Outcome: CI checks committed contributions against the event's verified base and explicitly enforces strict workflow requirements.
- Authorization: the user requested implementation after reviewing the contribution checklist and recommended first PR.
- Scope: source CI, event-to-Git validation, regression fixtures, and contributor documentation.
- Non-goals: executing verification plans, security scanner expansion, consumer adoption matrices, outcome benchmarking, or changing consumer/local mode defaults.
- Risk: CI can reject contributions with incomplete task metadata or unavailable Git history.
- Verification: real temporary Git histories and the shipped checker, full local quality loop, and remote PR CI when available.

## Acceptance Criteria

- [x] Clean-checkout PR and multi-commit push changes cannot bypass product synchronization.
- [x] CI forces strict mode even when repository/environment defaults select vibe.
- [x] Missing, malformed, unavailable, and mismatched event commits fail with actionable diagnostics.
- [x] Valid PR merge checkouts, task evidence, and style-only fast paths pass.
- [x] Mode-specific acceptance, evidence, and recovery requirements have negative regression coverage.

## Recovery

Revert this contribution's CI/script/test/docs changes together. For missing event history, restore the exact commits and rerun; do not substitute an arbitrary comparison base.

## Evidence Ledger

- Baseline: `npm run local:check` passed before implementation (129 tests).
- Negative control: the old `check --strict-budget` invocation passes a clean committed product change without task metadata; the new CI entry point rejects that same state in strict mode.
- `node --test tests/ci-workflow.test.mjs`: passed 8/8; real temporary Git histories cover PR integration merges, multi-commit pushes, invalid event scope, valid evidence, style-only changes, and mode-specific missing sections.
- `npm run local:check`: passed 137/137 tests with zero skips, production build, strict workflow consistency, documentation budgets/links, and generated distribution checks.
- `git diff --check`: passed.
- GitHub-hosted CI and maintainer merge acceptance are separate from these local results; inspect the draft PR checks before merge.
