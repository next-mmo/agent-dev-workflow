# Full-Stack Developer Trial — 2026-09-05

## Outcome

Built a working local full-stack Todo slice in the existing vanilla frontend: a Node HTTP API, atomic JSON persistence, task editing, revision conflicts, explicit refresh, and separate browser/server workspaces. No new dependencies, publication, or hosted access. Human acceptance of task 0031 remains pending.

## Developer journey

| Stage | Observed result |
| :--- | :--- |
| Discover | Initial L0 was bounded but prioritized packaging history and omitted the Todo PRD. Direct source/PRD reads were necessary. |
| Define | One active task recorded the user-approved Node stack, acceptance, failure cases, measurement limits, and recovery. |
| Build | Shared Todo rules supported both browser and API clients; explicit server mode preserved existing browser data. |
| Test | Eight initial domain/HTTP/client tests passed. Browser startup still failed, demonstrating a gap at the real runtime boundary. |
| Fix | Browser `fetch` had an invalid receiver when stored as an object method. A wrapper corrected it; a ninth regression test checks the receiver. |
| Browser acceptance | Create, edit, reload, complete, delete, reject invalid edits, conflict/retry, restart persistence, outage feedback, and reconnection observed. |
| Handoff | Full suite: 109 passing tests; build and strict workflow/docs checks passed. Task remains open for human acceptance; no commit or deployment. |

## Bugs and refinements

- Fixed new browser transport receiver bug, found only by exercising the real browser entry path.
- Fixed existing clear-completed failure feedback: an error object could be displayed as a removed-task count.
- Editing a task's project reconciles a filter that would otherwise point to a project no longer present.
- Keyboard focus restoration now distinguishes Edit and Remove controls.
- Cancel editing clears stale validation feedback.
- Server saves use revision checks and serialized atomic writes. Failure retains acknowledged state; a timeout is described as unconfirmed, requiring refresh before retry.

## Verification evidence

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Unit/integration regressions | `npm test` | 109/109 passed; optional pnpm fixture can skip via diagnostics, so this is not proof of pnpm coverage |
| Store/API/client | `node --test tests/full-stack-todo.test.mjs` | 9 tests: restart, stale/invalid writes, deterministic overlapping saves, failed-write recovery, cross-origin/content/body denial, corrupt disk, client conflict/offline, editing, fetch receiver |
| Production app | `npm run build`, then `src/server/start.js` with isolated temporary data | Built and served successfully |
| Real browser | CUA in-app browser on loopback, temporary trial tasks | Edited title survived reload; two tasks survived process restart; stale save retained form input, Refresh/retry preserved both tasks; invalid edit preserved saved task; Remove preserved neighboring keyboard focus |
| Outage/recovery | Stopped server, clicked Refresh, restarted development server | Unavailable status displayed with existing tasks retained; reconnection loaded saved tasks |
| Layout | 390×844 viewport; DOM overflow observation | Content width 375, viewport 390; no horizontal overflow; temporary override reset |
| Browser console | Console error inspection during successful conflict recovery | No captured errors at that checkpoint; not a complete console-history audit |
| Workflow/docs | `npm run workflow:check -- --mode strict`, `npm run docs:check`, `git diff --check` | Passed before final evidence update; documentation headroom warnings |

## Context size, not actual token savings

Raw data and selected paths: [0031-context-measurement.json](0031-context-measurement.json). Reproduce with `node scripts/developer-trial-measure.mjs` while task 0031 is active. Values are a dated snapshot; later source/evidence edits change the baseline.

| Query | Pack estimate | Reduction vs 10 relevant files | Todo PRD selected |
| :--- | ---: | ---: | :--- |
| Full-stack API/persistence/editing | 1,198 | 89.11% | Yes |
| Task 0031 revision conflict/editing | 1,199 | 89.10% | Yes |
| Task 0031 browser receiver bug | 1,222 | 88.89% | No |

All three packs stayed below 1,500 and found the active task. The relevant-file baseline was 11,002 estimated tokens. The existing corpus benchmark compared 1,198 against 176,688 tokens across 192 tracked text files, reporting 99.32% smaller. That corpus includes irrelevant history and duplicated generated guidance and excludes untracked source; it is a weak proxy for a competent developer's reading.

Estimates use characters/4, not a model tokenizer. L0 is a routing summary with no loaded document bodies, not an equivalent replacement for implementation source. This trial still read the PRD, state, workspace, UI, configuration, and test code directly. No controlled A/B trial, model usage totals, cache accounting, or equal-quality task comparison was available. Actual task-token savings remain **unmeasured**.

## Workflow assessment

Useful for keeping the active change, failure cases, verification evidence, and human acceptance connected. The real-browser gate caught a defect that HTTP tests could not detect. However, routing precision is mixed: packaging history remained highly ranked even for a focused Todo bug query; the Todo PRD appeared in only two of three post-update queries. A small pack alone does not prove a good routing result.

The source checkout's earlier uncommitted increments also influenced retrieval and strict closure checks. Adding an active task made the current strict check pass, but did not isolate prior changes. This is a limitation of the trial environment, not proof that multiple-increment release handoff is solved.

Recommended follow-up: prioritize the active task's linked PRD, measure relevant-document recall alongside size, report optional fixture skips as real skipped tests, and evaluate matched tasks in isolated snapshots with actual model usage accounting. These are recommendations only; workflow policy was not changed.

## Limits and recovery

Local single-user demo, maximum 2,000 tasks and 1 MiB request body; one server process per data file. No auth, multi-process coordination, or hosted readiness claim. Server filters/theme are tab-local. Existing browser tasks remain separate. Tests use temporary files; normal server data lives in ignored `.todo-data/`. Stop the server before backing up/restoring its JSON file. Revert only this trial's changes to recover the previous browser app.
