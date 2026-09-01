# Task 0020: Consolidate Workflow Documentation Under `.agents/docs/`

> **Status:** wip
>
> **Scrum Artifact:** active increment
>
> **Created:** 2026-09-02

## Goal

Make `.agents/` the single reusable namespace for Agent Workflow Scrum by moving durable workflow documentation/artifacts from root `docs/` to `.agents/docs/` and updating all consumers without breaking context routing, verification, reports, links, or tests.

## Change Contract

- **Human outcome:** the repository has no workflow-owned root `docs/` tree; agents reliably use `.agents/docs/` for PRDs, tasks, suggestions, architecture, testing, development guidance, and evidence.
- **Acceptance evidence:** root `docs/` absent; canonical docs and skills point to `.agents/docs/`; router/checker/report/planner use the new paths; fixtures cover the new namespace; docs governance rejects a reintroduced root `docs/`; full CI/check suite passes.
- **Non-goals:** do not move `.agents/skills/`; do not claim or delete an application-owned `docs/` directory when this workflow is migrated into another repository; do not rewrite historical evidence solely to erase old path mentions.
- **Affected layers:** documentation namespace, context router, change classification, verification planner, workflow/doc checks, report generator, tests, onboarding.
- **Risk:** path migration can create broken links or silent empty retrieval if one consumer is missed.
- **Recovery:** revert the relocation commit(s) and restore the previous root `docs/` paths.

## Acceptance Criteria

- [x] Workflow docs/artifacts live under `.agents/docs/` and root `docs/` is absent on the feature branch.
- [x] Root `README.md`, `AGENTS.md`, and `CONTEXT.md` describe `.agents/docs/` as canonical.
- [x] Context routing, workflow checks, verification planning, change classification, report generation, and document budgets use `.agents/docs/`.
- [x] Canonical skills and subtree instructions link to the new locations.
- [ ] Documentation governance fails when this template reintroduces a root `docs/` tree.
- [ ] All fixture tests use the new namespace and preserve negative controls.
- [ ] Fresh tests/build/workflow/docs/skill checks pass on the final tree.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Namespace move | repository tree inspection | In progress |
| Path consumers migrated | source inspection + tests | In progress |
| Regression checks | CI + focused checks | Pending |
