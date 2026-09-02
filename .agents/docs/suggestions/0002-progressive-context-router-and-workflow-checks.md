# Suggestion 0002: Progressive Context Router and Mechanical Workflow Checks

> **Status:** applied
> **Created:** 2026-09-01
> **Proposed by:** ChatGPT
> **Decision owner:** Human
> **Canonical targets:** `AGENTS.md`, `CONTEXT.md`, `.agents/skills/agent-workflow-scrum/`, local workflow scripts and docs

## Observation

- Durable repository memory is strong, but non-trivial startup could load multiple whole workflow documents before task/code inspection.
- The canonical skill repeated rules only relevant to specific modes.
- Adapter drift was checked mechanically while task lifecycle, suggestion decisions, links, and context-size regression were mostly agent-enforced.

## Evidence

### Facts

- The pre-change canonical skill was about 9.9 KB (~2.5k characters/4 heuristic tokens).
- `scripts/skill.sh check` already demonstrates the value of deterministic adapter drift checks.
- The new compact `SKILL.md` is ~587 heuristic tokens, `AGENTS.md` ~527/800, and `CONTEXT.md` ~896/1400 under the configured budgets.
- A realistic L1 context fixture stayed at ~1,357/1,500 heuristic tokens while ranking the active task first.

### Inference

- Progressive retrieval reduces repeated input context while preserving correctness when task/PRD/code remain authoritative.
- Focused references reduce irrelevant instructions loaded per mode.
- Mechanical consistency checks catch recoverable workflow-state bugs before review/handoff.

## Applied Workflow Change

1. Added dependency-free `scripts/context.mjs` with bounded L0/L1/L2 retrieval and JSON output.
2. Split the canonical skill into a compact router plus focused context/delivery/verification/governance/command references.
3. Added `scripts/workflow-check.mjs` for active-task lifecycle, suggestion decisions, tracked Markdown links, and context budgets.
4. Added npm commands, fixture tests, concise instructions, and development guidance.
5. Kept Graphify/OpenViking/vector memory optional and non-authoritative until local retrieval is measured on larger repositories.

## Expected Benefit

- Lower repeated context/token load and faster cross-agent recovery.
- Better probability that an agent sees the active task/PRD/rules relevant to current scope.
- Earlier detection of workflow drift and fewer unsupported handoffs.

## Scope and Exceptions

- Applies to non-trivial repository work and workflow maintenance.
- Fast-path fixes may skip generated context when scope is obvious and narrow.
- L2 remains available for deep review/recovery; correctness evidence is never omitted merely to hit a token budget.

## Tradeoffs and Risks

- Keyword ranking is intentionally simple and may miss semantic relationships; direct code inspection remains required.
- Character/4 token estimates are approximate across models.
- Local scripts add maintenance surface; they use built-in Node APIs and deterministic fixtures to limit that risk.

## Validation

- 16/16 combined tests passed: 10 existing Counter tests and 6 workflow-tool tests.
- Workflow fixtures cover active-task prioritization, session/security routing, L1 budget behavior, consistent state, multiple active tasks, broken links, and applied-without-decision failure.
- Strict context budgets pass in the branch-shaped fixture.
- A Vite production build was not rerun in the isolated execution sandbox because project dependencies were unavailable; no product source or dependency version changed.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human repository owner
- **Date:** 2026-09-01
- **Rationale:** Explicitly approved building smarter context, token-saving, reliability, and workflow-success improvements and authorized changes needed to achieve them.

## Application Evidence

- **Changed canonical files:** `AGENTS.md`, `CONTEXT.md`, `README.md`, `.agents/skills/agent-workflow-scrum/`, `.agents/docs/development.md`, package scripts, workflow tooling/tests.
- **Verification:** Node syntax and 16/16 combined tests passed; strict workflow/context-budget fixture checks passed.
- **Follow-up:** Measure ranking quality on several larger real repositories before adding an optional code-graph or long-memory provider.
