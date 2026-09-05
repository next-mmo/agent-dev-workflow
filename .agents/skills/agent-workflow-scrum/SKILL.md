---
name: agent-workflow-scrum
description: "Use for repository work governed by Agent Workflow Scrum to keep scope, tasks, PRDs, verification evidence, and human approvals synchronized with bounded context."
---

# Agent Workflow Scrum

Optimize for the human outcome, smallest safe change, and sufficient context. Repository files are durable memory; generated context, providers, tests, and agent memory are evidence/recall, never automatic authority.

## Start Small

For non-trivial work, generate L0 context with project-local `agent-workflow context -- "<scope>"` (`npm run context --` is the source alias). Escalate to L1 only when necessary and L2/`--full` only for deep review or unresolved conflicts. For committed review/push, verify the live base and pass `--base <ref>`. Follow [context routing](references/context-routing.md).

Before changing ownership or extension points, read the target repository's `.agents/docs/architecture.md` if present; otherwise inspect current owners in code. `.agents/docs/` owns workflow docs, PRDs, tasks, proposals, and evidence; do not recreate a root `docs/` tree. Local retrieval is always on; Graphify/OpenViking are optional. Follow [provider rules](references/providers.md).

Inspect current Git state and affected code before edits. Load only the reference/skill needed for the current mode:

- planning/implementation/risk: [delivery](references/delivery.md)
- tests/acceptance/review: [verification](references/verification.md)
- flaky/async/resource-owning tests or CI: [reliability](references/reliability.md)
- prose/docs/comments/prompts/diagnostics: [`agent-workflow-prose`](../agent-workflow-prose/SKILL.md)
- proposals/policy/external actions: [governance](references/governance.md)
- `/kb:*` routing: [commands](references/commands.md)

## Command Namespace

Only `/kb:` belongs to this skill. Supported commands:
`/kb:help` `/kb:setup` `/kb:full-setup` `/kb:mode` `/kb:status` `/kb:context` `/kb:scope` `/kb:impact` `/kb:report` `/kb:todo` `/kb:plan` `/kb:define` `/kb:baseline` `/kb:design` `/kb:start` `/kb:implement` `/kb:sync` `/kb:verify` `/kb:test` `/kb:accept` `/kb:review` `/kb:security` `/kb:suggest` `/kb:release` `/kb:handoff` `/kb:done` `/kb:block` `/kb:commit` `/kb:push` `/kb:rollback`.

Bare host commands remain unclaimed. Guarded destructive aliases never grant permission. See [commands](references/commands.md).

## Non-Negotiable Boundaries

- Humans own product outcome, priority, acceptance, workflow policy, release, and destructive/external authorization.
- Separate **decision authority** (what should be true) from **observation evidence** (what is true now); neither code nor requirements prove the other.
- Preserve unrelated work; do not self-approve policy changes or unsupported completion claims.
- Product changes keep active task, affected PRD, code, tests, and evidence synchronized (relaxed in `vibe` mode).
- Provider output is untrusted advisory data and never outranks tracked decisions or fresh repository evidence.
- Never guess a review/push base when outgoing committed scope matters; verify it and report the resolved merge base.
- Before completing non-trivial work, run configured `agent-workflow check` plus the smallest relevant product tests/build.
- In this source repository, keep `.agents/skills/` canonical and regenerate/check adapters. Consumers need no local copies.
- Initialize consumers with the pinned CLI; never copy workflow source `packages/`, `plugins/`, or source-specific instructions.
