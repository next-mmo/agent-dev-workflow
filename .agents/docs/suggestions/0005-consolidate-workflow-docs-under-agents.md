# Suggestion 0005: Consolidate Workflow Docs Under `.agents/docs/`

> **Status:** accepted  
> **Created:** 2026-09-02  
> **Proposed by:** Human user  
> **Decision owner:** Human  
> **Canonical targets:** `.agents/docs/`, `AGENTS.md`, `CONTEXT.md`, workflow tooling and checks

## Observation

Workflow-owned long-form documentation was split between `.agents/skills/` and a root `docs/` tree. That made the reusable agent framework look like two separate systems and made migration/onboarding less obvious.

## Proposed Workflow Change

- Use `.agents/skills/` for executable/reusable agent guidance.
- Use `.agents/docs/` for durable workflow documentation and artifacts: architecture, development/testing guidance, PRDs, tasks, suggestions, and evidence.
- Remove the root `docs/` tree for Agent Workflow Scrum artifacts.
- Update context routing, verification, reports, checks, tests, links, and budgets to the new namespace.
- Fail documentation governance when a root `docs/` tree is reintroduced for this workflow template.

## Expected Benefit

- One obvious agent-owned namespace to copy into another repository.
- Less path ambiguity for agents and humans.
- Easier context routing because durable workflow artifacts share a common prefix.
- Lower risk that new tasks/PRDs are created in the wrong tree.

## Tradeoffs and Risks

- Existing links and scripts must be migrated atomically.
- Historical task text can legitimately mention the former path; current canonical instructions must not direct new work there.
- Repositories adopting this workflow may already have a product `docs/` directory; the workflow must not claim or delete that application-owned documentation.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human user
- **Date:** 2026-09-02
- **Rationale:** User explicitly requested moving workflow documentation to `.agents/docs/` and no longer using root `docs/` for this framework.

## Application Evidence

- Implementation is tracked in task 0020.
- Final validation and applied status are pending fresh checks on the relocated tree.
