# Task 0029: Build a Realistic Local Todo Workspace

> **Status:** wip  
> **Scrum Artifact:** active increment with beta review fixes  
> **Created:** 2026-09-04  
> **Related PRD:** `.agents/docs/prd/0005-todo-workspace.md`

## Change Contract

- **Human outcome:** the executable demo supports a realistic, usable personal Todo workflow rather than only counting actions.
- **Acceptance evidence:** users can create, organize, find, complete, and clear local tasks; state tests prove validation, filtering, persistence, and completed-task recovery.
- **Non-goals:** accounts, server synchronization, collaboration, reminders, or destructive bulk deletion without an explicit user action.
- **Affected layers and owners:** Todo domain state, vanilla browser UI, responsive/accessibility styles, tests, and product requirements.
- **Risk level and required approvals:** low; data is browser-local and can be reset by clearing the `todo_workspace_state` localStorage entry.
- **Baseline:** beta review ran 29 selected tests successfully but independently reproduced ID collisions, broken incremental phrase search, denied-storage startup failure, and placeholder memory recall. The benchmark did not measure task-level token savings.
- **Verification plan:** focused Todo state tests, full test suite, production build, workflow checks, and browser smoke validation.
- **Rollback or recovery:** restore the prior demo files; individual local Todo data can be reset by removing `todo_workspace_state`.

## Acceptance Criteria

- [x] A user can add a non-empty task with project, priority, and optional due date.
- [x] A user can complete, reopen, and remove an individual task.
- [x] Search and status/project filters produce the expected visible tasks and empty state.
- [x] Users can clear completed tasks only through an explicit action.
- [x] Task state, filters, and theme persist safely and malformed stored values do not prevent loading.
- [x] The UI has an accessible task form, status feedback, and responsive task list.
- [x] Focused tests, full tests, build, and workflow checks pass after the beta repair; package migration regressions are reconciled.

## Evidence Ledger

The entries below describe the initial implementation run. Beta review found gaps in that coverage; final repair evidence follows separately.

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Todo state behavior | `node --test tests/todo-state.test.cjs`: 6/6 passed; covers validation, filters, completion, deletion, recovery, persistence, and malformed state | Passed |
| Full regression suite | Permissioned `npm test`: 82/82 passed | Passed |
| Production build | `npm run build` | Passed |
| Workflow and documentation | `npm run workflow:check`; `npm run docs:check`; `git diff --check` | Passed |
| Browser boundary | Local Vite smoke: add task, complete it, filter by completed plus text, reload and retain task/filter state | Passed |

### Beta repair verification

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Repaired Todo and recall regressions | `node --test --test-reporter=spec tests/todo-state.test.cjs tests/context-providers.test.mjs tests/context-benchmark.test.mjs` | **29/29 passed**; covers stale/rolled-over IDs, phrase search, denied storage, save recovery, draft/placeholder recall exclusion, and benchmark schema v2 |
| Context-size claim wording | `npm run benchmark:context -- "beta claim audit" --provider local --level 0 --budget 1500` | Reports **99.26% smaller context pack** and explicitly says actual task token savings are not measured |
| Production build and package drift | `npm run build`; `npm run distribution:check` | Passed |
| Strict workflow | `npm run workflow:check -- --mode strict` | Passed through the package-owned CLI |
| Browser phrase-search persistence | Vite + Playwright smoke: typed `release notes` character-by-character, confirmed the task remained visible, reloaded, and confirmed the query/task remained | Passed; no browser errors |
| Full regression suite | `npm test` | **89/89 passed** after routing tests through the package bin and isolating filesystem-writing fixtures |
| Documentation check | `npm run docs:check` | **Passed**; package engine documentation is budgeted under `packages/agent-workflow-scrum/engine/AGENTS.md` |

## Handoff

Beta fixes were authorized by the user's 2026-09-04 “fix it” request. Focused repair evidence is complete; full-suite and documentation evidence now pass after the package migration updated its test and check paths.

## Beta Repair Scope

- Prevent ID reuse after restoring missing/stale counters, including safe-integer rollover.
- Preserve spaces during search entry and catch storage access inside the error boundary; expose failed saves.
- Exclude draft/placeholder memory from recall and label benchmark results as context-size comparisons.
- Run strict workflow synchronization, documentation checks, focused regressions, and browser verification.
- Reusable corrections are recorded in [proposal 0011](../proposals/0011-beta-claim-and-recall-corrections.md).

## Recovery

Revert only this increment's source/doc changes and regenerate the package. No data migration is required. Preserve the existing `todo_workspace_state` entry; removing it intentionally resets the local workspace.
