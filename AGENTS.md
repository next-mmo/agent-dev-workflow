# Agent Instructions

## Product and Authority

- Product: **Agent Workflow Scrum**; Counter App is only its executable demo.
- Humans own outcomes, priority, acceptance, and workflow policy. Agents may implement, verify, document, and propose; never self-approve.
- Separate **decision authority** (what should be true) from **observation evidence** (what is true now); [`CONTEXT.md`](CONTEXT.md) defines both orders.
- Destructive, production, infrastructure, auth, or external-system writes require explicit scope and a rollback path.

## Smart Context

- For non-trivial work start with `npm run context -- "<scope>"` (L0), not a full-document dump. Use L1 only when needed and `--full` only for explicit deep review/recovery.
- For PR/push/handoff review, verify the live base and use `npm run change:scope -- --base <ref>` plus context/verification with the same base; never infer it from branch names/upstream.
- Generated context and optional providers are advisory. Inspect current code, exact Git scope, fresh checks, active task, and affected PRD before changing or claiming behavior.
- Read [`docs/architecture.md`](docs/architecture.md) before changing workflow/context/provider/verification ownership or extension points.
- Keep `.agents/skills/` canonical; regenerate/check adapters with `scripts/skill.sh`.

## Scoped Instructions

- Documentation: [`docs/AGENTS.md`](docs/AGENTS.md); prose editing also uses `agent-workflow-prose`.
- Workflow scripts: [`scripts/AGENTS.md`](scripts/AGENTS.md).
- Tests: [`tests/AGENTS.md`](tests/AGENTS.md), [`docs/testing.md`](docs/testing.md), and reliability guidance for async/resource-owning work.
- Delivery/risk: [`docs/agent-workflow.md`](docs/agent-workflow.md).

## Workflow

- Track non-trivial work per [`docs/tasks/README.md`](docs/tasks/README.md); keep at most one root WIP/blocked task and move verified work to `docs/tasks/done/`.
- Product behavior changes update the affected PRD/index. Reusable workflow changes follow [`docs/suggestions/README.md`](docs/suggestions/README.md) and require human approval.
- Use npm: `npm ci`, `npm test`, `npm run build`, `npm run workflow:check`, `npm run docs:check` as selected by scope.
- Definition of done: acceptance criteria have fresh evidence; relevant checks pass; docs match behavior; handoff names risks, skipped/pending checks, and human decisions.
- AI commits include `Co-Authored-By: <agent name> <agent-email>`.
