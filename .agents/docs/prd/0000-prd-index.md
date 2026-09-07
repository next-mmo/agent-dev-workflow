# PRD-0000: Master PRD Index

> Status: living doc  
> Updated: 2026-09-07

## Repos / Architecture

| Layer | Role | Tech Stack |
| :--- | :--- | :--- |
| **Client** | UI & Local State | Vanilla JS / CSS3 / HTML5 (No Framework Overhead) |

## PRD Index

| PRD | Title | Status | Summary |
| :--- | :--- | :--- | :--- |
| **0001** | Counter Core Features | **done** | Stateful counter, preset/custom step controls, localStorage persistence, theme toggle, accessible step selection, and one-level undo |
| **0002** | Counter History | **done** | Persistent accessible list of the latest ten count-changing actions with explicit clear control |
| **0004** | Workflow Distribution | **in-progress** | Local CLI, package-owned plugin bundle, consumer document stores, Git/tarball onboarding, MIT licensing, and explicit CI scope/mode |
| **0005** | Todo Workspace | **in-progress** | Browser tasks plus a local API/disk persistence and editing trial; human acceptance pending |
| **0006** | Official Examples | **in-progress** | Minimal runnable templates, starting with vanilla browser plus Express fullstack |
| **0007** | ND Workflow Plugin | **in-progress** | Versioned read-only protocol (`nd detect/snapshot/context`) so the ND host can detect repositories, mirror the board, and inject bounded workflow context |

## Authority

PRDs define approved product requirements; they do not prove current implementation state. Use the decision-authority and observation-evidence orders in [`../../../CONTEXT.md`](../../../CONTEXT.md) when reconciling a PRD with active tasks, current code, tests, or runtime evidence.

- Active workflow task: `.agents/docs/tasks/wip-*.md` or `blocked-*.md`.
- Product requirements: `.agents/docs/prd/00xx-*.md`.
- Completed evidence: `.agents/docs/tasks/done/done-*.md`.
