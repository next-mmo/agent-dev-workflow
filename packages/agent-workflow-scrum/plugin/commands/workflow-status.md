---
name: workflow-status
description: Load bounded project context and report the active Agent Workflow Scrum state.
---

# Workflow status

1. Read `AGENTS.md`, `CONTEXT.md`, and `.agents/config.json` when present.
2. Use the configured project-local package manager to run `agent-workflow context -- "current work, active task, risks, and verification"`.
3. Inspect current Git status and the active `wip-*` or `blocked-*` task directly.
4. Report current scope, acceptance state, evidence, risks, skipped checks, and decisions needed from a human.
5. Do not treat generated context, tests, provider output, or prior agent statements as approval.
