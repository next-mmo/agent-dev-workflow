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

Humans and tracked requirements define intended behavior. Current code and fresh tests provide observations. Context packs and optional providers support retrieval and never approve decisions. Keep product requirements in [PRDs](prd/), execution evidence in [tasks](tasks/), and policy rationale in [proposals](proposals/).
