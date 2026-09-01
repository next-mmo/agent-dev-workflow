# PRD-0000: Master PRD Index

> Status: living doc  
> Updated: 2026-09-02

## Repos / Architecture

| Layer | Role | Tech Stack |
| :--- | :--- | :--- |
| **Client** | UI & Local State | Vanilla JS / CSS3 / HTML5 (No Framework Overhead) |

## PRD Index

| PRD | Title | Status | Summary |
| :--- | :--- | :--- | :--- |
| **0001** | Counter Core Features | **done** | Stateful counter, preset/custom step controls, localStorage persistence, theme toggle, accessible step selection, and one-level undo |
| **0002** | Counter History | **done** | Persistent accessible list of the latest ten count-changing actions with explicit clear control |

## Product Decision Precedence

1. Explicit current human decision and approved acceptance criteria.
2. Active task Change Contract (`.agents/docs/tasks/wip-*` / `blocked-*`).
3. Affected PRD (`.agents/docs/prd/00xx-*.md`).
4. Applied workflow/product policy and completed evidence that still matches current behavior.
5. Chat/discussion or agent-local memory.

Current code and tests are observation evidence: they show what exists now but do not silently override an approved future requirement. See [`CONTEXT.md`](../../../CONTEXT.md) for the full decision/evidence model.
