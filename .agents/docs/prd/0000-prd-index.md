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

## Authority

PRDs define approved product requirements; they do not prove current implementation state. Use the decision-authority and observation-evidence orders in [`../../../CONTEXT.md`](../../../CONTEXT.md) when reconciling a PRD with active tasks, current code, tests, or runtime evidence.

- Active workflow task: `.agents/docs/tasks/wip-*.md` or `blocked-*.md`.
- Product requirements: `.agents/docs/prd/00xx-*.md`.
- Completed evidence: `.agents/docs/tasks/done/done-*.md`.
