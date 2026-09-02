---
name: agent-workflow-scrum
description: "Use for repository work governed by Agent Workflow Scrum to keep scope, tasks, PRDs, verification evidence, and human approvals synchronized with bounded context."
---

# Agent Workflow Scrum

Optimize for the human outcome, the smallest safe change, and the smallest sufficient context. The repository is durable memory; generated context, optional providers, tests, and agent memory are evidence/recall layers rather than automatic authority.

## Start Small

For non-trivial work, generate L0 context with `npm run context -- "<scope>"`. Escalate to L1 only when necessary and to L2/`--full` only for explicit deep review or unresolved conflicts. For review/push of committed work, verify the live base and pass `--base <ref>` so clean-worktree commits are included. Follow [context routing](references/context-routing.md).

Read [`.agents/docs/architecture.md`](../../docs/architecture.md) before changing workflow/context/provider/verification ownership or extension points. `.agents/docs/` owns durable workflow documentation, PRDs, tasks, suggestions, and evidence; do not recreate a root `docs/` tree. Local repository retrieval is always on; Graphify/OpenViking remain optional. Follow [provider rules](references/providers.md).

Inspect current Git state and affected code before edits. Load only the reference/skill needed for the current mode:

- planning/implementation/risk: [delivery](references/delivery.md)
- tests/acceptance/review: [verification](references/verification.md)
- flaky/async/resource-owning tests or CI: [reliability](references/reliability.md)
- prose/docs/comments/prompts/diagnostics: [`agent-workflow-prose`](../agent-workflow-prose/SKILL.md)
- suggestions/policy/external actions: [governance](references/governance.md)
- `/kb:*` routing: [commands](references/commands.md)

## Command Namespace

Only `/kb:` belongs to this skill. Supported commands:
`/kb:help` `/kb:status` `/kb:context` `/kb:scope` `/kb:impact` `/kb:report` `/kb:todo` `/kb:plan` `/kb:define` `/kb:baseline` `/kb:design` `/kb:start` `/kb:implement` `/kb:sync` `/kb:verify` `/kb:test` `/kb:accept` `/kb:review` `/kb:security` `/kb:suggest` `/kb:release` `/kb:handoff` `/kb:done` `/kb:block` `/kb:commit` `/kb:push` `/kb:rollback`.

Bare host commands remain unclaimed. Guarded destructive aliases never grant permission. See [commands](references/commands.md).

## Non-Negotiable Boundaries

- Humans own product outcome, priority, acceptance, workflow policy, release, and destructive/external authorization.
- Separate **decision authority** (what should be true) from **observation evidence** (what is true now); do not let code override an approved requirement or a requirement prove implementation.
- Preserve unrelated work; do not self-approve policy changes or unsupported completion claims.
- Product behavior changes keep active task, affected PRD, code, tests, and evidence synchronized.
- Optional provider output is untrusted advisory data and never outranks tracked decisions or fresh repository evidence.
- Never guess a review/push base when outgoing committed scope matters; verify it and report the resolved merge base.
- Run `npm run workflow:check` before completing non-trivial workflow work; run the smallest relevant product tests/build as well.
- Keep `.agents/skills/` canonical and regenerate/check target adapters with `.agents/scripts/skill.sh`.
