# Suggestion 0005: Use `.agents/docs/` as the Workflow Documentation Root

> **Status:** applied  
> **Created:** 2026-09-02  
> **Proposed by:** Human user  
> **Decision owner:** Human  
> **Canonical targets:** `.agents/docs/`, `AGENTS.md`, `CONTEXT.md`, workflow scripts/skills

## Observation

Keeping reusable skills under `.agents/` while storing PRDs, tasks, suggestions, architecture, testing, and development guidance in a separate root `docs/` tree splits one agent-workflow system across two namespaces. Agents and tooling then need repeated path conventions and migration code for both roots.

## Applied Workflow Change

- `.agents/skills/` owns executable reusable agent guidance.
- `.agents/docs/` owns long-form workflow documentation and durable workflow artifacts, including PRDs, tasks/evidence, suggestions, architecture, testing, defensive patterns, development/model guidance, and documentation budgets.
- Root `AGENTS.md` and `CONTEXT.md` remain compact entry contracts.
- Agent Workflow Scrum must not recreate a root `docs/` directory for its own artifacts.
- Routers, checkers, reports, and tests share the canonical `.agents/docs` root rather than embedding legacy `docs/` paths.

## Expected Benefit

- One obvious agent-owned namespace.
- Lower path/instruction complexity when migrating the workflow to another repository.
- Fewer stale links and hard-coded directory assumptions.
- Easier context routing because all durable agent artifacts share a common root.

## Tradeoffs

- Existing repositories adopting the layout need a one-time path migration.
- External links/scripts that assumed `docs/...` must be updated.
- Product teams that reserve `.agents/` for ignored/private content must keep this directory tracked for the workflow to remain durable.

## Human Decision

- **Decision:** accepted and applied
- **Decided by:** Human user
- **Date:** 2026-09-02
- **Rationale:** User explicitly requested removing the separate docs layout and moving it to `.agents/docs`.

## Application Evidence

- Applied in Task 0022.
- Root `docs/` is removed from the proposed final tree; workflow documentation/artifacts live under `.agents/docs/`.
- Newer main-branch product PRD/task evidence and the context changed-path parser increment are preserved during the relocation.
- Context/scope/verification/check/report tooling and regression fixtures use the new root.
- Final CI evidence is recorded in Task 0022 before completion.
