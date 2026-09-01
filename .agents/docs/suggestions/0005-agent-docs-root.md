# Suggestion 0005: Use `.agents/docs/` as the Workflow Documentation Root

> **Status:** applied  
> **Created:** 2026-09-02  
> **Proposed by:** Human user  
> **Decision owner:** Human  
> **Canonical targets:** `.agents/docs/`, `AGENTS.md`, `CONTEXT.md`, workflow scripts/skills

## Observation

Keeping reusable skills under `.agents/` while storing PRDs, tasks, suggestions, architecture, testing, and development guidance in a separate root `docs/` tree splits one agent-workflow system across two namespaces. Agents and tooling then need repeated path conventions and migration code for both roots.

## Workflow Change

- `.agents/skills/` owns executable reusable agent guidance.
- `.agents/docs/` owns long-form workflow documentation and durable workflow artifacts, including PRDs, tasks/evidence, suggestions, architecture, testing, defensive patterns, development/model guidance, and documentation budgets.
- Root `AGENTS.md` and `CONTEXT.md` remain compact entry contracts.
- Agent Workflow Scrum must not recreate a root `docs/` directory for its own artifacts.
- Routers/checkers/reports/tests expose or share the canonical `.agents/docs` root instead of embedding legacy `docs/` paths.

## Expected Benefit

- One obvious agent-owned namespace.
- Lower path/instruction complexity when migrating the workflow to another repository.
- Fewer stale links and hard-coded directory assumptions.
- Easier context routing because all durable agent artifacts share a common root.

## Tradeoffs

- Existing repositories adopting the new layout need a one-time path migration.
- External links/scripts that assumed `docs/...` must be updated.
- Product teams that already reserve `.agents/` for ignored/private content must keep this directory tracked for the workflow to remain durable.

## Human Decision

- **Decision:** accepted and applied
- **Decided by:** Human user
- **Date:** 2026-09-02
- **Rationale:** User explicitly requested removing the separate docs layout and moving it to `.agents/docs`.

## Application Evidence

- Root `docs/` tree removed on the feature branch and relocated under `.agents/docs/`.
- Context/scope/verification/check/report tooling and regression fixtures migrated to the new root.
- Final test/build/CI evidence is recorded in task 0020 after verification completes.
