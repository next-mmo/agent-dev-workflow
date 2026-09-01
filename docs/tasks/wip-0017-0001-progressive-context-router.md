# Task 0017: Add Progressive Context Routing and Workflow Consistency Checks

> **Status:** wip
>
> **Scrum Artifact:** active increment
>
> **Created:** 2026-09-01

## 1. Goal

Reduce repeated agent prompt/context load while increasing delivery consistency by adding bounded L0/L1/L2 context routing, smaller on-demand skill references, and deterministic workflow checks.

## 2. Change Contract

- **Human outcome:** Coding agents can recover the right task/PRD/rules with a small context pack and mechanically detect common workflow drift before handoff.
- **Acceptance evidence:** Context routing prioritizes active work and relevant PRDs, respects a bounded budget, routes security-sensitive language correctly, and has fixture tests; workflow checks detect lifecycle/state/link/budget problems; canonical skill startup becomes smaller and loads detailed references on demand.
- **Non-goals:** Do not add a remote memory database, embedding/vector service, Graphify/OpenViking dependency, production action, or make generated context authoritative.
- **Affected layers and owners:** Agent instructions/context, canonical skill/references, local Node scripts, tests, npm commands, development docs, suggestion governance. Humans retain workflow-policy authority.
- **Risk level and required approvals:** Standard workflow/tooling change. Human explicitly approved implementation and broad workflow improvement scope on 2026-09-01.
- **Baseline:** Non-trivial startup could load multiple whole workflow documents and the canonical skill was roughly 2.5k heuristic tokens; consistency checks focused on generated skill adapters rather than task/suggestion/link/context-budget drift.
- **Verification plan:** Node syntax checks, fixture tests for positive/negative routing and workflow state, run strict workflow check on repository state, existing Counter tests/build when available, skill init/check, and final diff review.
- **Rollback or recovery:** Revert scripts/package/instruction/skill/reference/docs/task/suggestion changes. No external memory or schema migration is introduced.

## 3. Acceptance Criteria

- [ ] `npm run context -- "<scope>"` emits compact L0 routing with branch, changed paths, active task, ranked sources, and rule hints.
- [ ] L1/L2 escalation is explicit and bounded by a configurable heuristic token budget.
- [ ] Auth/session/login/identity work pulls security guidance without requiring the word `security`.
- [ ] Canonical `SKILL.md` fits the configured budget and routes details to focused references.
- [ ] `npm run workflow:check` detects multiple active tasks, lifecycle/status drift, suggestion decision drift, broken tracked Markdown links, and context-budget regressions.
- [ ] Workflow tools have deterministic fixture tests including a negative lifecycle case.
- [ ] Repository instructions/context/development docs explain progressive loading and authority boundaries.
- [ ] Existing product behavior remains passing; no external memory dependency is added.

## 4. Verification Evidence

Pending implementation and repository-level verification.
