# Agent Instructions

## Scope and Authority

- Product: **Agent Workflow Scrum**; Counter App is only its executable demo.
- Humans own outcomes, priority, acceptance, and workflow policy. Agents may
  implement, verify, document, and propose; never self-approve.
- Destructive, production, infrastructure, auth, or external-system writes
  require explicit scope and a rollback path.

## Package Manager

- Use **npm**: `npm ci`, `npm run dev`, `npm test`, `npm run build`.
- Setup, Node version, and preview:
  [`docs/development.md`](docs/development.md).

## Workflow

- Delivery method and risk gates:
  [`docs/agent-workflow.md`](docs/agent-workflow.md).
- Track non-trivial work per [`docs/tasks/README.md`](docs/tasks/README.md);
  verified tasks move to `docs/tasks/done/`. Minor fixes need no task record.
- Product behavior changes update the relevant PRD and
  `docs/prd/0000-prd-index.md`.
- Propose reusable improvements per
  [`docs/suggestions/README.md`](docs/suggestions/README.md); require explicit
  human approval before changing canonical workflow.

## Conventions

- Files: `kebab-case`; JavaScript functions and variables: `camelCase`.
- JavaScript: ESM; keep domain logic testable without browser globals.

## Definition of Done

- Acceptance criteria pass with user-visible evidence; relevant checks pass;
  docs match behavior; handoff names risks, skipped checks, and human decisions.

## Commit Attribution

- AI commits include `Co-Authored-By: <agent name> <agent-email>`.
