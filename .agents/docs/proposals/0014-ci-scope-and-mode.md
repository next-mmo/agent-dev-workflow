# Proposal 0014: Explicit CI Scope and Mode

> **Status:** applied
> **Created:** 2026-09-07
> **Decision owner:** Human
> **Canonical targets:** `.github/workflows/ci.yml`, `scripts/ci-workflow-check.mjs`, `.agents/docs/ci.md`

## Observation

CI invokes the workflow checker without a base and with `--strict-budget`. The source configuration selects vibe mode. A clean checkout consequently omits committed product synchronization, and the budget flag does not enable strict ceremony.

## Approved Change

Read the GitHub event's exact comparison commits, retain PR merge integration testing, fetch complete history, reject unverifiable scope, and explicitly run the checker in strict mode. Preserve local/consumer defaults and existing style-only exceptions. This applies the existing scope and mode mechanisms from proposals 0004 and 0007 at the source CI boundary.

## Tradeoffs and Recovery

Incomplete contribution evidence fails CI; unavailable or rewritten history requires explicit review instead of a guessed base. Full history increases checkout cost. Revert this contribution's CI helper, workflow, tests, and guide together if needed. Repository rulesets and maintainer review remain external enforcement requirements.

## Validation

The [task](../tasks/done/done-0039-0004-ci-scope-and-mode.md) records real Git/checker regression results and the complete local quality loop. Remote CI is reported separately.

## Human Decision

- **Decision:** accepted
- **Decided by:** Requesting user
- **Date:** 2026-09-07
- **Rationale:** The user requested implementation after the contribution checklist recommended CI scope and mode as the first PR. This authorizes preparing the change; merging remains a separate decision.
