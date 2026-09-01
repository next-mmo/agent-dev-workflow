---
name: agent-workflow-scrum
description: "Use for repository work governed by Agent Workflow Scrum to keep scope, tasks, PRDs, verification evidence, and human approvals synchronized with bounded context."
---

# Agent Workflow Scrum

Optimize for the human outcome, the smallest safe change, and the smallest sufficient context. The repository is the durable source of truth; generated context and agent memory are recall aids only.

## Start Small

For non-trivial work, generate L0 context with `npm run context -- "<scope>"`. Escalate to L1 only when necessary and to L2/`--full` only for explicit deep review or unresolved conflicts. Follow [context routing](references/context-routing.md).

Inspect current Git state and affected code before edits. Load only the reference needed for the current mode:

- planning/implementation/risk: [delivery](references/delivery.md)
- tests/acceptance/review: [verification](references/verification.md)
- suggestions/policy/external actions: [governance](references/governance.md)
- `/kb:*` routing: [commands](references/commands.md)

All `references/...` links resolve from canonical `.agents/skills/agent-workflow-scrum/`, including when a generated adapter renders this router.

## Command Namespace

Only `/kb:` belongs to this skill. Supported commands:
`/kb:help` `/kb:status` `/kb:context` `/kb:report` `/kb:todo` `/kb:plan` `/kb:define` `/kb:baseline` `/kb:design` `/kb:start` `/kb:implement` `/kb:sync` `/kb:test` `/kb:accept` `/kb:review` `/kb:security` `/kb:suggest` `/kb:release` `/kb:handoff` `/kb:done` `/kb:block` `/kb:commit` `/kb:push` `/kb:rollback`.

Bare `/help`, `/plan`, and similar host commands are intentionally unclaimed. Guarded destructive aliases never grant permission. See [commands](references/commands.md).

## Non-Negotiable Boundaries

- Humans own product outcome, priority, acceptance, workflow policy, release, and destructive/external authorization.
- Preserve unrelated work; do not self-approve policy changes or unsupported completion claims.
- Product behavior changes keep active task, affected PRD, code, tests, and evidence synchronized.
- Run `npm run workflow:check` before completing non-trivial workflow work; run relevant product tests/build as well.
- Keep `.agents/skills/` canonical and regenerate/check target adapters with `scripts/skill.sh`.
