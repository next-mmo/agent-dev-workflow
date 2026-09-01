# Task 0020: Relocate Workflow Documentation Under `.agents/docs`

> **Status:** wip
>
> **Scrum Artifact:** active increment
>
> **Created:** 2026-09-02

## Goal

Make `.agents/` the single reusable namespace for Agent Workflow Scrum's skills and durable workflow documentation/artifacts, eliminating the split between `.agents/` and legacy root `docs/` workflow paths without taking ownership of application documentation.

## Change Contract

- **Human outcome:** agents find workflow-owned architecture, guidance, PRDs, tasks, suggestions, and evidence under `.agents/docs/` without broken routing, checks, tests, or links.
- **Acceptance evidence:** canonical workflow files use `.agents/docs/`; root legacy workflow paths are absent; context, scope, verification, workflow/doc checks, report generation, skills, and fixtures use the new root; documentation governance rejects reintroduced legacy workflow paths but permits unrelated application docs; fresh CI passes tests/build/checks.
- **Non-goals:** do not move `.agents/skills/`, product source/tests, or host application documentation into `.agents/docs/`; do not change Graphify/OpenViking behavior; do not rewrite historical evidence solely to erase old path mentions.
- **Affected layers:** repository layout, standing instructions, context router, scope/verification/check/report scripts, skills, tests, CI-visible documentation links/budgets.
- **Risk:** stale literal paths can silently disable retrieval or checks; over-broad namespace enforcement could incorrectly reject application-owned docs.
- **Baseline:** Agent Workflow Scrum guidance/artifacts were split across `.agents/` and root `docs/`.
- **Verification plan:** complete test suite, build, strict workflow/context budgets, documentation namespace/budget/link checks, skill audit, tree inspection, fresh PR CI.
- **Recovery:** revert the relocation and restore the prior workflow artifact paths.

## Acceptance Criteria

- [x] Workflow-owned root `docs/` paths are removed and prior content exists under `.agents/docs/`.
- [x] Root README/instructions/shared context declare `.agents/docs/` canonical for workflow artifacts.
- [x] Context routing reads PRDs/tasks from `.agents/docs/` and exposes `docsRoot` in its schema.
- [x] Change-scope and verification planning classify `.agents/docs/` changes correctly.
- [x] Workflow/doc checks and report generation read `.agents/docs/`.
- [x] Canonical skill/document links use the relocated paths.
- [x] Core regression fixtures work without a root workflow `docs/` tree.
- [x] Documentation governance rejects legacy `docs/tasks|prd|suggestions/...` workflow paths while allowing unrelated application docs.
- [ ] Fresh final tests/build/workflow/docs/skill checks and CI evidence are recorded.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Namespace move | feature-branch tree and PR diff | Passed |
| Consumers migrated | context/scope/plan/check/report sources + fixtures | Passed by inspection; automated run pending |
| Host application docs remain allowed | negative-control fixture with `docs/product-guide.md` | Test implemented; run pending |
| Legacy workflow paths are rejected | negative-control fixture with `docs/tasks/todo-legacy.md` | Test implemented; run pending |
| Full regression/build/check suite | GitHub Actions on final tree | Pending |
