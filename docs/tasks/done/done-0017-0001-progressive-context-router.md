# Task 0017: Add Progressive Context Routing and Workflow Consistency Checks

> **Status:** done
>
> **Scrum Artifact:** completed increment
>
> **Created:** 2026-09-01
>
> **Completed:** 2026-09-01

## 1. Goal

Reduce repeated agent prompt/context load while increasing delivery consistency with bounded L0/L1/L2 context routing, smaller on-demand skill references, and deterministic workflow checks.

## 2. Change Contract

- **Human outcome:** Coding agents recover the right task/PRD/rules with a small context pack and mechanically detect common workflow drift before handoff.
- **Acceptance evidence:** Context routing prioritizes active work and relevant PRDs, respects a bounded budget, routes security-sensitive language, and has deterministic tests; workflow checks detect lifecycle/state/link/budget problems; canonical skill startup is substantially smaller and loads details on demand.
- **Non-goals:** No remote memory database, embedding/vector service, Graphify/OpenViking dependency, production action, or generated-context authority.
- **Affected layers and owners:** Agent instructions/context, canonical skill/references, local Node scripts, tests, npm commands, README/development docs, and suggestion governance. Humans retain workflow-policy authority.
- **Risk level and required approvals:** Standard workflow/tooling change; human explicitly approved broad workflow improvement scope on 2026-09-01.
- **Baseline:** Non-trivial startup could load multiple whole workflow documents and the canonical skill was roughly 2.5k heuristic tokens; consistency checks focused on generated adapters rather than task/suggestion/link/context-budget drift.
- **Verification plan:** Syntax checks, positive/negative fixture tests, strict context budgets, existing Counter unit tests, skill-adapter logic inspection, and final branch diff review.
- **Rollback or recovery:** Revert the task's scripts/package/instruction/skill/reference/docs/suggestion changes. No external memory or data migration exists.

## 3. Acceptance Criteria

- [x] `npm run context -- "<scope>"` emits compact L0 routing with branch, changed paths, active task, ranked sources, and rule hints.
- [x] L1/L2 escalation is explicit and bounded by a configurable heuristic token budget.
- [x] Auth/session/login/identity work pulls security guidance without requiring the word `security`.
- [x] Canonical `SKILL.md` fits its configured budget and routes details to focused references.
- [x] `npm run workflow:check` detects multiple active tasks, lifecycle/status drift, suggestion decision drift, broken tracked Markdown links, and context-budget regressions.
- [x] Workflow tools have deterministic positive/negative fixture tests.
- [x] Repository instructions/context/README/development docs explain progressive loading and authority boundaries.
- [x] Existing Counter unit behavior remains passing and no external memory dependency was added.

## 4. Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| New scripts parse | `node --check scripts/context.mjs` and `node --check scripts/workflow-check.mjs` on the exact implementation | Passed |
| Existing product unit behavior | Existing 10 Counter state/persistence tests run with the unchanged `src/counter-state.js` | 10/10 passed |
| Context/workflow tooling | New Node test suite | 6/6 passed |
| Combined test suite | Existing + new Node tests | 16/16 passed |
| Security routing | `session timeout` fixture selects the active task and includes the `security` rule hint | Passed |
| Bounded L1 | Branch-shaped context fixture | ~1,357/1,500 heuristic tokens |
| Instruction budgets | strict workflow check | `AGENTS` ~527/800, `CONTEXT` ~896/1400, `SKILL` ~587/900 |
| Multiple active task guard | negative fixture with WIP + blocked task | Correctly failed |
| Broken-link guard | tracked instruction links to missing Markdown | Correctly failed |
| Suggestion decision guard | `applied` suggestion with `pending` decision | Correctly failed |
| Governance drift repair | Suggestion 0001 reconciled from proposed/pending to applied/ratified | Passed |
| Dependency footprint | `package.json` adds scripts only; no dependency versions or product source changed | Passed |

## 5. Handoff

- **Outcome:** Agent Workflow Scrum now defaults to progressive context rather than whole-workflow loading, with a compact canonical router and deterministic workflow-state checks.
- **Token signal:** canonical `SKILL.md` dropped from roughly ~2.5k to ~587 heuristic tokens (~76% smaller); L1 remains bounded by the configured budget.
- **Changed areas:** agent instructions/context/README, canonical skill + focused references, context/check scripts, package commands, development docs, tests, suggestion governance, and this task record.
- **Skipped:** Vite production build was not rerun in the isolated execution sandbox because project dependencies were unavailable. Product source and dependency versions are unchanged, and all 10 existing Counter unit tests passed.
- **Residual risks:** keyword ranking is not semantic code-graph retrieval; token estimates vary by model; generated Cursor rules rely on the canonical skill path for focused references rather than embedding every reference (intentionally preserving token savings).
- **Human decision:** suggestion 0002 is applied; suggestion 0001 is ratified/applied to resolve its stale governance state. Optional Graphify/OpenViking integration remains deferred until local retrieval is measured on larger repositories.
