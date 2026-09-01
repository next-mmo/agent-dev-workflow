# Agent Instructions

## Product and Authority

- Product: **Agent Workflow Scrum**; Counter App is only its executable demo.
- Humans own outcomes, priority, acceptance, and workflow policy. Agents may implement, verify, document, and propose; never self-approve.
- Destructive, production, infrastructure, auth, or external-system writes require explicit scope and a rollback path.

## Smart Context

- For non-trivial work, start with `npm run context -- "<scope>"` (L0) instead of loading every workflow document.
- Use `npm run context -- "<scope>" --level 1` only when more detail is needed; use `--full` only for explicit deep review.
- Treat the generated context pack as a routing aid, not a source of truth. Inspect current code, Git state, tests, the active task, and affected PRD before changing behavior.
- `CONTEXT.md` defines durable cross-agent terms, authority, recovery, and handoff. Tracked PRDs/tasks/evidence remain authoritative over chat or agent-local memory.
- Keep `.agents/skills/` canonical; regenerate/check target adapters with `scripts/skill.sh`.

## Workflow

- Delivery and risk gates: [`docs/agent-workflow.md`](docs/agent-workflow.md).
- Context loading: [`.agents/skills/agent-workflow-scrum/references/context-routing.md`](.agents/skills/agent-workflow-scrum/references/context-routing.md).
- Track non-trivial work per [`docs/tasks/README.md`](docs/tasks/README.md); verified tasks move to `docs/tasks/done/`.
- Product behavior changes update the affected PRD and `docs/prd/0000-prd-index.md`.
- Reusable workflow changes follow [`docs/suggestions/README.md`](docs/suggestions/README.md) and require human approval.

## Checks and Conventions

- Use **npm**: `npm ci`, `npm test`, `npm run build`, `npm run workflow:check`.
- Files: `kebab-case`; JavaScript: ESM and `camelCase`; keep domain logic testable without browser globals.
- Definition of done: acceptance criteria pass with fresh evidence; relevant checks pass; docs match behavior; handoff names risks, skipped checks, and human decisions.
- AI commits include `Co-Authored-By: <agent name> <agent-email>`.
