# `/kb:` Command Routing

Treat text after a command as the exact scope. Report the selected mode and do not silently expand it.

| Command | Mode |
| :--- | :--- |
| `/kb:help` | List namespaced commands and explain they are skill conventions. |
| `/kb:status` | Read-only task, PRD, branch, checks, blockers, and changes. |
| `/kb:context` | Generate the smallest useful L0/L1 context pack; do not change files. |
| `/kb:report` | Generate local ignored HTML/JSON workflow snapshot; never publish it. |
| `/kb:todo` | Create/refine a backlog task; no implementation. |
| `/kb:plan` | Define outcome, acceptance, non-goals, risk, baseline, verification, recovery. |
| `/kb:define` | Clarify the change contract; do not broaden scope. |
| `/kb:baseline` | Inspect current state and failures; do not fix findings. |
| `/kb:design` | Propose smallest safe design/data flow/boundaries/rollback. |
| `/kb:start` | Select a task or move an approved todo into one WIP task. |
| `/kb:implement` | Implement the approved active task. |
| `/kb:sync` | Reconcile behavior, evidence, affected PRD, index, and workflow state. |
| `/kb:test` | Run relevant automated checks and report exact results. |
| `/kb:accept` | Run user-boundary acceptance without fixing during the round. |
| `/kb:review` | Read-only diff/contract/evidence/security/docs review. |
| `/kb:security` | Read-only security/dependency/secret review. |
| `/kb:suggest` | Create/refine a reusable workflow proposal; never self-approve. |
| `/kb:release` | Prepare rollout/health/rollback inputs; never deploy implicitly. |
| `/kb:handoff` | Report outcome, changed files, evidence, risks, skipped checks, decisions. |
| `/kb:done` | Close only after criteria and evidence pass. |
| `/kb:block` | Record external blocker and dependent unverified criteria. |
| `/kb:commit` | Create a local commit only when requested; include AI attribution. |
| `/kb:push` | External Git write; require exact scoped remote/branch. |
| `/kb:rollback` | Recover only with an exact authorized target and rollback path. |

Unknown `/kb:*` commands route to `/kb:help`. `/kb:reset`, `/kb:clean`, `/kb:delete`, `/kb:deploy`, and `/kb:publish` never grant destructive or production permission; route them through rollback/release and human approval.
