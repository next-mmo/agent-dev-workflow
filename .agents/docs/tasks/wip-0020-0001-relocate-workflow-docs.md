# Task 0020: Relocate Workflow Documentation Under `.agents/docs`

> **Status:** wip
>
> **Scrum Artifact:** active increment
>
> **Created:** 2026-09-02

## Goal

Make `.agents/` the single namespace for Agent Workflow Scrum's reusable skills, long-form workflow documentation, PRDs, tasks, suggestions, and evidence, eliminating the split between `.agents/` and a root `docs/` tree.

## Change Contract

- **Human outcome:** the repository has no root `docs/` directory; agents find all workflow-owned durable documentation and artifacts under `.agents/docs/` without broken routing, checks, tests, or links.
- **Acceptance evidence:** root tree has no `docs/`; `.agents/docs/` contains the prior documentation/artifact tree; context, scope, verification, workflow/doc checks, report generation, skills, and fixtures use the new root; fresh CI passes tests/build/checks.
- **Non-goals:** do not move product source/tests into `.agents/`, change Graphify/OpenViking behavior, or make external providers mandatory.
- **Affected layers:** repository layout, standing instructions, context router, scope/verification/check/report scripts, skills, tests, CI-visible documentation links/budgets.
- **Risk:** standard workflow migration; stale literal paths can silently disable retrieval or checks, so regression fixtures must run without a root `docs/` tree.
- **Baseline:** workflow guidance/artifacts were split across `.agents/` and `docs/`.
- **Verification plan:** complete test suite, build, strict workflow/context budgets, documentation budgets/links, skill audit, root-tree inspection, fresh PR CI.
- **Recovery:** revert the relocation commit/tree and restore the prior `docs/` paths.

## Acceptance Criteria

- [x] Root `docs/` tree is removed and previous content exists under `.agents/docs/`.
- [x] Root instructions and shared context declare `.agents/docs/` canonical and forbid recreating root `docs/` for workflow artifacts.
- [x] Context routing reads PRDs/tasks from `.agents/docs/` and exposes `docsRoot` in its schema.
- [x] Change-scope and verification planning classify `.agents/docs/` changes correctly.
- [x] Workflow/doc checks and report generation read `.agents/docs/`.
- [x] Core regression fixtures work without a root `docs/` directory.
- [ ] Fresh final tests/build/checks and CI evidence are recorded.
