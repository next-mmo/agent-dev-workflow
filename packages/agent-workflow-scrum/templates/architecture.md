# Product Architecture

This is a project-owned starting document. Inspect current code and replace the open product details below before changing ownership or extension points; initialization has not established them.

| Area | Record from current code |
| :--- | :--- |
| Entry points | Application startup, public interfaces, and runtime processes |
| Domain | Modules owning business rules and invariants |
| Data | Storage owners, schemas, writes, and recovery |
| Integrations | External boundaries, configuration, and failure behavior |
| Verification | Tests covering each boundary and unsupported cases |

The installed `@next-mmo/agent-workflow-scrum` dependency owns the CLI, engine, providers, templates, and reusable plugin skills. This repository owns `AGENTS.md`, `CONTEXT.md`, `.agents/config.json`, and `.agents/docs/`. Do not vendor workflow `packages/` or `plugins/` trees; product packages remain product-owned.

Humans and tracked requirements define intended behavior. Current code and fresh tests provide observations. Context packs and optional providers support retrieval and never approve decisions. Keep requirements in [PRDs](prd/), technical designs in [plans](plans/), execution evidence in [evidence](evidence/) and [tasks](tasks/), reusable fixes in [solutions](solutions/), cross-session learnings in [memory](memory/), and policy rationale in [proposals](proposals/).
