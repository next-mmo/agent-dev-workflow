# Technical Plans & Architecture Blueprints

Technical plans live under `.agents/docs/plans/`. They capture architectural designs, multi-step implementation roadmaps, data models, and migration strategies before or alongside Sprint task execution.

## Purpose

- **Bridge the Gap**: Connect high-level product requirements (`.agents/docs/prd/`) to day-to-day atomic tasks (`.agents/docs/tasks/`).
- **Compound Engineering**: Document technical architecture, schema decisions, and trade-offs so future agents and developers understand *how* systems are designed.
- **Pre-Implementation Alignment**: Allow humans and agents to review and iterate on technical design before writing production code.

## File Naming

- Use `NNNN-kebab-case-title.md` (e.g. `0001-counter-audio-engine.md`).
- Reserve `0000-template.md` as the design plan template.

## Plan Lifecycle

| Status | Meaning |
| :--- | :--- |
| `draft` | Architecture plan in progress; under human/agent review |
| `approved` | Plan approved for implementation; ready to split into tasks |
| `in-progress` | Associated Scrum tasks are currently being executed |
| `completed` | All milestones implemented, verified, and merged |
| `superseded` | Replaced by a newer architectural design plan |

## When to Create a Plan

- Multi-phase features spanning multiple modules or components.
- Database schema changes, data migrations, or new API contracts.
- Architectural refactors or external provider integrations.
- Simple, single-increment tweaks do not need a full plan; use atomic tasks directly.
