# Task 0041: Consumer Feedback and Reporting Corrections

> Status: wip
> Created: 2026-09-08
> Related PRD: `.agents/docs/prd/0004-workflow-distribution.md`

## Change Contract

- Human outcome: consumers see accurate PRD/task reports and keep legitimate project-owned skills without a misleading vendoring warning.
- Authorization: the user requested applying collected feedback in this external source repository.
- Scope: fix report parsing, lifecycle collections, canonical proposal/archive discovery, doctor ownership diagnostics, review coverage status, managed worktree containment, and failed completed-evidence results; retain remaining feedback in a source-owned review record.
- Non-goals: publication, consumer dependency update, company approval infrastructure, remote-provider changes, worktree deletion, and automatic human acceptance.
- Owners: package report engine and doctor; source regression fixtures; PRD 0004.
- Baseline: clean source checkout at `8ebb2b220b624693a4b3c769c34aa873d2e79462`; matches the consumer's pinned revision. Dependencies installed with `npm ci` after the first context command found no binary.
- Verification: consumer report fixtures, diagnostic ownership negative control, full source tests/build, workflow/docs/distribution checks, and read-only execution against the reporting consumer.

## Acceptance Criteria

- [ ] Linked/plain/bold PRD IDs and plain/bold task status labels render consistently.
- [ ] Backlog is separate from active tasks; archived records and canonical/legacy proposals remain discoverable.
- [ ] Project-owned skills cause no generic vendoring warning; workflow-owned source paths remain visible.
- [ ] Static review reports zero supported files as inconclusive rather than passed.
- [ ] Managed worktree creation validates branch/path containment; cleanup requires exact Git registration and ownership.
- [ ] Completed-task evidence cannot report a failed or unresolved result in its Evidence Ledger table.
- [ ] Report schema change and unresolved enterprise feedback are documented with evidence.

## Recovery

Revert only this increment's source/test/document changes if required. No consumer pin or publication changes are made; generated report output is disposable.

## Evidence Ledger

Implementation and regression fixtures verified; human review remains pending. Report JSON advances to schema 3 because active task semantics change and backlog/archived collections become explicit.

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Parser/lifecycle, review coverage, ownership, and worktree regression | `rtk proxy node --test tests/readiness-tools.test.mjs tests/report.test.mjs tests/doctor-ownership.test.mjs tests/worktree-core.test.mjs` | 11 passed; zero-file review is inconclusive, report lifecycle parsing is covered, project/workflow skill ownership is distinct, and traversal/unregistered cleanup is rejected |
| Completed-evidence regression | `rtk proxy node --test tests/workflow-tools.test.mjs` | 16 passed; a completed task with a `Failed` Evidence Ledger result is rejected while valid pending active-task evidence remains allowed |
| Full regression | `rtk npm test` | 142 tests: 141 passed, 0 failed, 1 skipped (Bash unavailable for release-ID test); existing subprocess shell deprecation warning observed |
| Build/distribution | `rtk npm run build`; `rtk npm run distribution:check` | Passed |
| Workflow/document structure | `rtk npm run workflow:check -- --mode strict`; `rtk npm run docs:check` | Passed; four existing near-budget warnings in unchanged standing docs |
| Actual consumer report | Source CLI `report --root C:/Users/MT-Staff/Documents/GitHub/spring-boot-full-stack --output <fresh OS temp directory>` | 2 indexed PRDs, 1 active wip, 1 backlog todo; consumer files unchanged |
| Actual consumer diagnostic | Source CLI `doctor --root C:/Users/MT-Staff/Documents/GitHub/spring-boot-full-stack --json` | `ok: true`, no warnings or errors |

Remaining findings and acceptance scenarios are retained in [consumer feedback](../evidence/2026-09-08-consumer-feedback.md). Changes are local and uncommitted; consumer dependency remains pinned to the baseline. No published version or public issue exists for these fixes yet.
