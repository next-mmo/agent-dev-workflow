# Suggestion 0002: Progressive Context Router and Mechanical Workflow Checks

> **Status:** accepted  
> **Created:** 2026-09-01  
> **Proposed by:** ChatGPT  
> **Decision owner:** Human  
> **Canonical targets:** `AGENTS.md`, `CONTEXT.md`, `.agents/skills/agent-workflow-scrum/`, local workflow scripts and docs  

## Observation

- Durable repository memory is strong, but non-trivial startup can require multiple whole workflow documents before task/code inspection.
- A large canonical skill repeats rules that are only relevant to specific modes.
- Adapter drift is checked mechanically, while task lifecycle, suggestion decisions, links, and context-size regression are mostly agent-enforced.

## Evidence

### Facts

- `AGENTS.md` and `CONTEXT.md` direct agents to tracked task/PRD/evidence as durable cross-agent memory.
- The pre-change canonical skill is about 9.9 KB (~2.5k characters/4 heuristic tokens).
- `scripts/skill.sh check` already demonstrates the value of deterministic drift checks for generated adapters.

### Inference

- Progressive retrieval should reduce repeated input context while preserving correctness if active task/PRD/code remain authoritative.
- Focused references should reduce irrelevant instructions loaded per command.
- Mechanical consistency checks should catch recoverable workflow-state bugs earlier than review/handoff.

## Proposed Workflow Change

1. Add a dependency-free `scripts/context.mjs` with bounded L0/L1/L2 retrieval.
2. Split the canonical skill into a compact router plus focused references.
3. Add `scripts/workflow-check.mjs` for lifecycle, suggestion, link, and context-budget checks.
4. Add fixture tests and npm commands; keep remote/semantic memory providers optional and non-authoritative.

## Expected Benefit

- Lower repeated context/token load and faster cross-agent recovery.
- Higher probability that the agent reads the active task/PRD/rules relevant to the current scope.
- Earlier detection of workflow drift and fewer unsupported handoffs.

## Scope and Exceptions

- Applies to non-trivial repository work and workflow maintenance.
- Fast-path fixes may skip generated context when the scope is obvious and narrow.
- L2 remains available for deep review/recovery; safety or correctness evidence must never be omitted merely to hit a token budget.

## Tradeoffs and Risks

- Keyword ranking is intentionally simple and may miss semantic relationships; direct code inspection remains required.
- Character/4 token estimates are approximate across models.
- More local scripts add maintenance surface; mitigate with built-in Node APIs and fixture tests.

## Validation

- Verify active-task prioritization, security hint routing, budget behavior, positive consistency state, and negative multiple-active-task detection.
- Run strict context budgets and normal product/skill checks before applying.
- Reassess ranking quality after several real tasks before considering Graphify/OpenViking or vector retrieval.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human repository owner
- **Date:** 2026-09-01
- **Rationale:** Explicitly approved building the proposed smarter context, token-saving, reliability, and workflow-success improvements and authorized changes needed to achieve them.

## Application Evidence

- Changed canonical files: pending implementation
- Verification results: pending
- Follow-up or superseding suggestion: consider optional code-graph provider only after local retrieval is measured on larger repositories
