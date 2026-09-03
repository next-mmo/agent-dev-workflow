# Suggestion 0005: Use `.agents/docs/` as the Workflow Documentation Root

> **Status:** applied  
> **Created:** 2026-09-02  
> **Proposed by:** Human user  
> **Decision owner:** Human  
> **Canonical targets:** `.agents/docs/`, `AGENTS.md`, `CONTEXT.md`, workflow scripts/skills/checks

## Observation

Keeping reusable skills under `.agents/` while storing PRDs, tasks, suggestions, architecture, testing, and development guidance in a separate root `docs/` tree splits one agent-workflow system across two namespaces. Agents and tooling then need repeated path conventions and migration code for both roots.

## Workflow Change

- `.agents/skills/` owns executable reusable agent guidance.
- `.agents/docs/` owns Agent Workflow Scrum long-form documentation and durable artifacts, including PRDs, tasks/evidence, suggestions, architecture, testing, defensive patterns, development/model guidance, and documentation budgets.
- Root `AGENTS.md` and `CONTEXT.md` remain compact entry contracts.
- Agent Workflow Scrum must not recreate its legacy artifact paths under root `docs/`.
- An adopting repository may keep unrelated application/product documentation in root `docs/`; this policy owns workflow artifacts, not the host repository's documentation namespace.
- Routers/checkers/reports/tests expose or share the canonical `.agents/docs` root instead of embedding legacy workflow paths.
- Documentation governance rejects known legacy workflow paths such as `docs/tasks/`, `docs/prd/`, and `docs/suggestions/` while allowing unrelated application docs.

## Expected Benefit

- One obvious agent-owned namespace.
- Lower path/instruction complexity when migrating the workflow to another repository.
- Fewer stale links and hard-coded directory assumptions.
- Easier context routing because all durable workflow artifacts share a common root.
- No collision with application-owned documentation when the workflow is copied into another repository.

## Tradeoffs

- Existing repositories adopting the new layout need a one-time workflow-artifact path migration.
- External links/scripts that assumed legacy `docs/...` workflow paths must be updated.
- Product teams that already reserve `.agents/` for ignored/private content must keep this directory tracked for the workflow to remain durable.
- Historical completed tasks may truthfully mention their former paths; current canonical instructions and automation are the migration target.

## Human Decision

- **Decision:** accepted and applied
- **Decided by:** Human user
- **Date:** 2026-09-02
- **Rationale:** User explicitly requested removing the separate workflow docs layout and moving it to `.agents/docs`.

## Application Evidence

- Implementation is tracked in task 0022.
- Root workflow artifacts were relocated to `.agents/docs/`; context/scope/planning/check/report tooling and fixtures use the new root.
- Counter History and the newer context changed-path fix from `main` were preserved while their workflow artifacts were reconciled into the new namespace.
- Documentation governance allows application-owned `docs/product-guide.md` but rejects legacy workflow paths such as `docs/tasks/`.
- GitHub Actions run `33545458510` passed 39/39 tests, Vite production build, strict workflow/context checks, documentation budgets/links/namespace checks, and canonical skill audit.
