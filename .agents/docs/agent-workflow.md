# Agent Workflow Scrum: Universal Full-Stack Delivery

## System and Demo Boundary

- Agent Workflow Scrum is the product defined by this repository.
- Counter App is an executable demo used to test and explain the workflow.
- Demo requirements validate workflow quality but do not limit the workflow to
  Vite, frontend applications, counters, or any specific technology.
- Human product authority and universal delivery outcomes take precedence over
  demo-specific optimization.

## Operating Principle

- Optimize for the human outcome, not the amount of code changed.
- Scale ceremony to risk; apply only gates relevant to affected layers.
- Prefer evidence from the real user boundary over internal implementation claims.
- Keep canonical rules stable; improve them through the human-approved
  suggestion loop.

## Scrum Operating Model

<!-- markdownlint-disable MD013 -->

| Scrum concept | Repository representation | Authority or exit gate |
| :--- | :--- | :--- |
| Product Goal | Human outcome and product PRDs | Human Product Owner |
| Product Backlog | PRDs and root `docs/tasks/todo-*` tasks | Human orders priority |
| Sprint Goal | Approved outcome for the current work cycle | Human and agent share scope understanding |
| Sprint Backlog | Root `docs/tasks/wip-*` task and checklist | Agent maintains progress and evidence |
| Increment | Working change plus `docs/tasks/done/done-*` record | Definition of Done passes |
| Sprint Review | Final handoff and user-boundary demonstration | Human accepts or requests adaptation |
| Retrospective | `docs/suggestions/NNNN-*.md` proposal | Human accepts, rejects, or defers |

<!-- markdownlint-enable MD013 -->

- Agents may facilitate planning, review, and retrospective activities.
- Agents do not replace human product ownership or self-approve policy changes.

## Delivery Loop

<!-- markdownlint-disable MD013 -->

| Phase | Required Output | Exit Gate |
| :--- | :--- | :--- |
| Discover | Instructions, current state, affected layers, dependencies, risks | Scope and constraints are understood |
| Define | Outcome, acceptance criteria, non-goals, risk level | Material ambiguity is resolved |
| Baseline | Reproduction and existing test/build/runtime results | Pre-existing failures are separated from new work |
| Design | Contracts, data flow, security boundaries, rollout and rollback | The smallest safe vertical slice is identified |
| Implement | Reviewable code, tests, migrations, configuration and docs | Slice is complete without unrelated rewrites |
| Verify | Automated checks plus user-boundary evidence | Acceptance criteria pass at every changed layer |
| Release | Deployment inputs, health signals, staged rollout and rollback | Change can be operated safely |
| Handoff | Outcome, files, evidence, risks, skipped checks, decisions | Human can evaluate and continue without rediscovery |
| Learn | Deduplicated reusable workflow proposal | Human accepts, rejects, or defers the proposal |

<!-- markdownlint-enable MD013 -->

## Risk Levels

### Fast Path

- Typos, comments, minor CSS, and isolated one-line defects.
- Reproduce, patch, run the smallest relevant check, report the result.

### Standard Path

- Components, endpoints, refactors, dependencies, or behavior changes.
- Use an active task, baseline evidence, acceptance criteria, tests, build, and
  documentation sync.

### High-Risk Path

- Authentication, authorization, payments, destructive data migrations,
  production infrastructure, secrets, or external side effects.
- Require explicit human scope, threat/risk review, rollback, staged rollout,
  observability, and post-deploy verification.

## Full-Stack Quality Matrix

<!-- markdownlint-disable MD013 -->

| Layer | Design Questions | Verification Evidence |
| :--- | :--- | :--- |
| Frontend | Loading, empty, error, offline, responsive and accessible states? | Unit/component checks, browser flow, console, accessibility, build |
| API | Contract, validation, errors, versioning, retries and idempotency? | Contract, integration, negative-path and concurrency tests |
| Domain | Invariants isolated from frameworks and I/O? | Deterministic unit and property/boundary tests |
| Data | Constraints, indexes, migration, compatibility, privacy and rollback? | Migration dry run, integration tests, backup/restore or rollback proof |
| Auth/security | Identity, authorization, trust boundaries, secrets and abuse cases? | Denial-path tests, dependency audit, threat review, secret scan |
| Operations | Config, health, metrics, logs, alerts, capacity and rollback? | CI/build, deploy preview, health check, observable success signals |

<!-- markdownlint-enable MD013 -->

## Demo: Counter App Full-Stack Increment

### Human Outcome

- Signed-in users keep count, step, and theme across devices without losing the
  current fast local experience.

### Vertical Slices

<!-- markdownlint-disable MD013 -->

| Slice | Change | Evidence |
| :--- | :--- | :--- |
| Contract | Define `GET /api/counter` and versioned `PATCH /api/counter` payloads | Schema and contract tests cover success and invalid input |
| Data | Add one counter record per user with value, step, theme, version and timestamps | Constraint, migration, rollback and concurrent-update tests |
| Backend | Authenticate, authorize by user, validate values and enforce optimistic concurrency | Integration tests cover denial, conflict, retry and idempotency paths |
| Frontend | Hydrate local state, sync changes, show offline/conflict states and preserve keyboard behavior | State tests plus visible browser flows for loading, offline and conflict recovery |
| Delivery | Gate remote sync, emit sync success/failure metrics and retain local-only rollback | Preview deploy, health signal, staged enablement and rollback exercise |

<!-- markdownlint-enable MD013 -->

### Demo Acceptance Example

- Anonymous users retain current `localStorage` behavior.
- Signed-in users load the latest server state and can recover from offline use.
- One user cannot read or mutate another user's counter.
- Conflicting updates do not silently overwrite newer data.
- Increment, decrement, reset, step, theme and keyboard interactions remain
  responsive while synchronization occurs.
- Unit, API integration, migration, end-to-end, build and dependency checks pass.

## Evidence Rules

- Record exact commands and results; do not replace evidence with “works.”
- Distinguish failures caused by the change from pre-existing or environmental
  failures.
- For UI work, verify through the visible product and check browser console output.
- For APIs, verify success, validation, authorization, failure and retry paths.
- For data changes, prove forward migration, compatibility and rollback.
- For deployment work, name the health signal and rollback trigger.
- For a human-readable repository snapshot, run `npm run report`; the
  generated `report/index.html` lets a reader navigate and view rendered
  workflow sources in place, but treat the `report/` files as a convenience
  view, not canonical evidence.

## Learning Loop

- Observe a repeated friction, failure mode, or clearly better verified method.
- Search [`suggestions/`](suggestions/) for an existing proposal.
- Create or strengthen one evidence-backed proposal using
  [`suggestions/0000-template.md`](suggestions/0000-template.md).
- Complete the current task; suggestions should not silently expand its scope.
- Surface the proposal to the human with expected benefit and tradeoffs.
- Apply it to canonical instructions only after explicit human acceptance.
- Revalidate the updated workflow on a later task; supersede rules that no
  longer improve outcomes.
