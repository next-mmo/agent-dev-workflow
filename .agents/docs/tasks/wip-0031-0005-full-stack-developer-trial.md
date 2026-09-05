# Task 0031: Full-Stack Developer Trial

> Status: wip
> Created: 2026-09-05
> Related PRD: `.agents/docs/prd/0005-todo-workspace.md`

## Change Contract

- Human outcome: exercise Agent Workflow Scrum on realistic frontend/backend work and report delivery friction and context-size evidence.
- Authorization: user approved the current stack with a local Node.js backend, persistent tasks, and editing.
- Scope: optional server workspace, local disk persistence, editing, validation/conflict/error handling, tests and browser acceptance.
- Non-goals: hosted deployment, accounts, multi-user access, remote writes, automatic migration of browser tasks, or workflow-policy changes.
- Risk: local application data; bind loopback, retain browser mode, write disk atomically, reject stale revisions.
- Baseline: prior 100 tests passed; existing working copy contains accepted but uncommitted tasks 0029/0030. Initial L0 returned packaging history ahead of the Todo PRD, requiring a direct read.
- Verification: domain/API/client regressions, persistent restart and stale-write controls, browser create/edit/reload/error paths, full suite/build/workflow checks.
- Measurement: compare bounded packs with both the existing raw-corpus baseline and a small relevant-file baseline. Record routing misses and follow-up reads. No claim of actual billed/task-token savings without usage and controlled comparison.

## Acceptance Criteria

- [ ] Users create, edit, complete, and delete tasks in the server workspace; data survives restart.
- [ ] Invalid input, failed writes, and stale revisions cannot silently overwrite saved tasks.
- [ ] Browser mode and local task data remain usable without migration.
- [ ] Browser and automated evidence cover normal and failure paths.
- [ ] Trial report distinguishes context-size reduction, workflow friction, and unmeasured token savings.

## Evidence Ledger

See the [developer trial report](../evidence/0031-full-stack-developer-trial.md) and [measurement data](../evidence/0031-context-measurement.json).

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Full regression suite | `npm test` | 109/109 passed; optional pnpm fixture is not proven |
| Build and workflow | `npm run build`; strict workflow/docs checks; `git diff --check` | Passed; docs headroom warnings |
| Real user boundary | Browser create/edit/reload/complete/delete, invalid edit, stale-tab recovery, full process restart, outage/reconnection | Observed successfully with isolated test data |
| Context measurement | Three local L0 queries | 1,198–1,222 estimated tokens; 88.89–89.11% smaller than selected relevant files; actual task-token savings unmeasured |

## Handoff

Implementation and verification are complete; acceptance checkboxes remain for human review. No commit, publication, data migration, or workflow-policy change was performed. Current working copy includes prior increments. The report records retrieval misses, test-coverage gaps, and recommendations rather than treating compact output as proven token savings.

## Recovery

Revert only trial changes; use browser mode for prior local tasks. Keep `.todo-data/` for server data recovery. Do not delete existing user data.
