# Task 0029: Build a Realistic Local Todo Workspace

> **Status:** done
> **Scrum Artifact:** completed increment
> **Created:** 2026-09-04
> **Completed:** 2026-09-05
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
- [x] CI indentation is valid; review fails on invalid refs and reports inspected vs skipped files; plan and solve use packaged fallback templates; PRD sync is read-only and advisory; product path indexing is shared; Todo workspace coordinates concurrent tab writes and preserves keyboard focus.

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

### Readiness repair verification

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| CI configuration | `.github/workflows/ci.yml`: step indentation and executable step sequence verified | **Passed** |
| Review scope and failure modes | `tests/readiness-tools.test.mjs`: unstaged/untracked inspection, non-existent base failure, deleted/unsupported reporting | **2/2 passed** |
| Packaged plan/solve templates | `tests/package-distribution.test.mjs`: thin initialized consumer generates plan and solve drafts from packaged defaults without local templates | **Passed** (npm tarball fixture) |
| PRD sync advisory semantics | `tests/readiness-tools.test.mjs`: schema v2 advisory output, PRD bytes unchanged, evidence candidate linking | **Passed** |
| Product path indexing | `tests/readiness-tools.test.mjs`: `buildCodebaseIndex` and `buildNativeCodebaseGraph` discover configured product globs (`apps/`, `packages/`, etc.) | **Passed** |
| Concurrent tab coordination | `tests/todo-workspace.test.mjs`: serialized updates with Web Locks, failure retention, quota recovery, conflict warnings | **6/6 passed** |
| Keyboard completion focus | Playwright browser smoke: Space key toggles completion and reopen while maintaining focus on the task row input | **Passed**; `{ tag: 'INPUT', label: 'Reopen...', checked: true }` |
| Full regression suite | `npm test`: **99/99 passed** across all unit, integration, and distribution tests | **Passed** |
| Production build & distribution drift | `npm run build`; `npm run distribution:check` | **Passed** |
| Strict workflow & documentation checks | `npm run workflow:check -- --mode strict`; `npm run docs:check` | **Passed** |

## Handoff

- Beta fixes were authorized by the user's 2026-09-04 “fix it” request. Focused repair evidence was verified and reconciled package migration paths.
- Readiness repairs and task closure were authorized by the user on 2026-09-05 ("continue" and "both"). All 8 acceptance criteria passed with fresh evidence across 99 automated tests, packed npm distribution verification, Vite build, strict workflow/doc checks, and Playwright browser smoke tests.
- Reusable boundaries are recorded in Proposal 0011 and Proposal 0012. Publication, registry deployment, and cross-repo migration remain explicit separate human decisions.

## Beta Repair Scope

- Prevent ID reuse after restoring missing/stale counters, including safe-integer rollover.
- Preserve spaces during search entry and catch storage access inside the error boundary; expose failed saves.
- Exclude draft/placeholder memory from recall and label benchmark results as context-size comparisons.
- Run strict workflow synchronization, documentation checks, focused regressions, and browser verification.
- Reusable corrections are recorded in [proposal 0011](../../proposals/0011-beta-claim-and-recall-corrections.md).

## Recovery

Revert only this increment's source/doc changes and regenerate the package. No data migration is required. Preserve the existing `todo_workspace_state` entry; removing it intentionally resets the local workspace.

## Readiness Repairs — 2026-09-05

The user's “continue” following the readiness review authorizes its seven local repairs. This extends the active increment to the workflow package as well as the demo; affected requirements are [PRD 0004](../../prd/0004-workflow-distribution.md) and [PRD 0005](../../prd/0005-todo-workspace.md). No publication, deployment, or ceremony-mode change is included.

- Baseline: full tests, build, docs, distribution and strict workflow checks passed, but independent fixtures reproduced skipped review files, false review success on invalid refs, missing plan/solution templates, false PRD-sync updates, incomplete indexing, and cross-tab Todo data loss. Browser completion also lost keyboard focus.
- Acceptance: CI has executable steps; review uses shared Git scope and reports actual inspections; initialized consumers can plan and record solutions; PRD sync reports advisory evidence without accepting criteria; both indexes honor product paths; Todo writes coordinate across tabs and preserve unsaved work; completion preserves useful focus.
- Verification: negative-control and integration regressions, installed tarball commands, full suite, build, strict workflow/docs/distribution checks, and browser persistence/keyboard checks.
- Recovery: revert this repair diff and rebuild generated bundles. Preserve local Todo storage; no destructive migration is planned.
- Evidence: verified across `tests/readiness-tools.test.mjs`, `tests/todo-workspace.test.mjs`, `tests/package-distribution.test.mjs`, Playwright browser smoke on focus retention, `npm test` (99/99 passed), `npm run build`, `npm run workflow:check -- --mode strict`, and `npm run docs:check`. Human product acceptance remains separate from automated verification.
