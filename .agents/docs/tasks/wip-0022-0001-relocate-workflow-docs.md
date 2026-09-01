# Task 0022: Relocate Workflow Documentation Under `.agents/docs`

> **Status:** wip
>
> **Scrum Artifact:** active increment
>
> **Created:** 2026-09-02

## Goal

Make `.agents/` the single namespace for Agent Workflow Scrum's reusable skills, long-form workflow documentation, PRDs, tasks, suggestions, and evidence, eliminating the split between `.agents/` and a root `docs/` tree.

## Change Contract

- **Human outcome:** the repository has no root `docs/` directory; agents find all workflow-owned durable documentation and artifacts under `.agents/docs/` without broken routing, checks, tests, or links.
- **Acceptance evidence:** root tree has no `docs/`; `.agents/docs/` contains prior documentation/artifacts plus newer main-branch PRD/task evidence; context, scope, verification, workflow/doc checks, report generation, skills, and fixtures use the new root; fresh CI passes tests/build/checks.
- **Non-goals:** do not move product source/tests into `.agents/`, change Graphify/OpenViking behavior, or make external providers mandatory.
- **Affected layers:** repository layout, standing instructions, context router, scope/verification/check/report scripts, skills, tests, CI-visible documentation links/budgets.
- **Risk:** stale literal paths can silently disable retrieval or checks; parallel main changes must be preserved, including the changed-path parser regression.
- **Baseline:** workflow guidance/artifacts were split across `.agents/` and `docs/`.
- **Verification plan:** complete test suite, build, strict workflow/context budgets, documentation budgets/links, skill audit, root-tree inspection, fresh PR CI.
- **Recovery:** revert the relocation commit/tree and restore the prior root `docs/` paths.

## Acceptance Criteria

- [x] Root `docs/` tree is removed and workflow content is under `.agents/docs/`.
- [x] Newer main-branch PRD/task evidence is preserved under `.agents/docs/`.
- [x] Task ID collisions are normalized: 0019 Counter History, 0020 Context Path Parser, 0021 Scope-Aware Verification, 0022 relocation.
- [x] Root instructions and shared context declare `.agents/docs/` canonical and forbid recreating root `docs/` for workflow artifacts.
- [x] Context routing reads PRDs/tasks from `.agents/docs/`, exposes `docsRoot`, and preserves the main changed-path parser fix.
- [x] Change-scope and verification planning classify `.agents/docs/` changes correctly.
- [x] Workflow/doc checks and report generation read `.agents/docs/`.
- [x] Regression fixtures work without a root `docs/` directory.
- [ ] Fresh final tests/build/checks and CI evidence are recorded.
