# Consumer Feedback: Full-Stack Tutor Repository

Source: `spring-boot-full-stack`, consumer records `.agents/docs/feedback/agent-workflow/0001-*.md` through `0009-*.md`, reviewed 2026-09-08. Both consumer pin and source baseline are `8ebb2b220b624693a4b3c769c34aa873d2e79462`. This record preserves actionable findings without copying personal conversation or credentials. No public issue or published fix is claimed.

Implementation owner: [task 0041](../tasks/wip-0041-0004-consumer-feedback.md). Priorities are engineering recommendations, not accepted company policy.

| Consumer case | Evidence and proposed response | Disposition |
| :--- | :--- | :--- |
| 0001 Direction alignment | Green structural checks coexisted with stale product direction. Add advisory alignment prompts with source links; never infer approval or rewrite requirements automatically. | Retained for design; semantic consistency is not established by CLI success |
| 0002 Human overview | Humans needed feature outcome, usable behavior, next milestone, and evidence/acceptance together. Extend the existing report after fixing its counts; avoid checkbox percentages. | Retained for report design |
| 0003 Report integrity | Consumer report returned zero PRDs and two active tasks despite two linked PRDs, one wip, and one deferred todo. Plain status labels were ignored; canonical proposals and archived tasks were omitted. | Fix and regression fixtures in task 0041 |
| 0004 Approval/evidence | The isolated strict synchronization validator accepted a completed-task ledger saying tests failed; `pending` was rejected. Proposal decision checks validate text, not identity/revision. | Implemented a narrow guard: completed-task Evidence Ledger table results cannot be `pending`, `failed`, `inconclusive`, `blocked`, or `unverified`; structured evidence outcomes and external approval identity/revision remain separate |
| 0005 Review coverage | Java/POM-only `runStaticReview` returned `ok: true` with zero inspections. Text output does disclose unsupported files. | Implemented in review schema 3: zero supported files returns `status: inconclusive`, `ok: false`, and an explicit inconclusive report line |
| 0006 Worktree ownership | Cleanup joins unvalidated branch input under `.worktrees`; `../../` calculation escapes that directory. Git registration may constrain impact; no deletion tested. No cross-checkout task claims/leases exist in helpers. | Implemented containment, Git branch validation, and exact registered-worktree ownership checks; dirty-state/concurrent-claim policy remains separate |
| 0007 Data boundaries | Explicit-only remote recall passes query unchanged; a mock captured a synthetic token. Report HTML contains selected internal documents. | Retained: configurable pre-dispatch and export policies; no real leak or remote call observed |
| 0008 Artifact identity | Git consumer root identifies as counter-app 1.0.0 while nested package identifies as workflow 0.1.0; binary works and revision is pinned. | Retained: clarify packaged artifact and source identity; do not silently replace consumer pins |
| 0009 Skill ownership | Doctor warned that all `.agents/skills` was vendored when it contained tutor/feedback skills authored for the project. Report also assumes local canonical skill files. | Doctor fix in task 0041; external skill discovery/report availability remains open |

## Follow-up acceptance scenarios

- Overview: a new reader identifies what works today and what is pending without conflating draft PRDs, tests, and human acceptance.
- Evidence/coverage: failed or wrong-revision required checks do not authorize completion; zero inspected product files remain visibly inconclusive for a required gate.
- Worktree: traversal, foreign registered worktrees, dirty state, and concurrent claims fail safely; valid nested branch names remain supported.
- Data policy: synthetic sensitive queries are rejected/redacted before dispatch when configured; default retrieval makes no remote request.
- Distribution: an isolated consumer can identify the actual engine/plugin versions and artifact origin; source installs remain supported.

These proposals require separate scoped implementation and tests. The current changes correct reporting and diagnostic behavior; they do not establish enterprise certification or complete human acceptance.

Source-review clarification for case 0008: the package README already documents the root/demo metadata difference and directs users to `agent-workflow version` for the engine version. Preserve that explanation; machine-readable artifact identity remains an enhancement candidate rather than an undocumented installation failure.

Task 0041 verification: full suite 138 passed, 1 Bash-related skip, zero failures; build, strict workflow, docs, and distribution checks passed. Source CLI against the original consumer now reports two PRDs, one active task, one backlog task, and no doctor warnings. The consumer's installed pin is unchanged, so adoption still requires a future version/pin update.
