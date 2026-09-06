# Agent Instructions

- Humans own outcomes, priority, acceptance, and workflow policy. Agents may implement, verify, document, and propose; never self-approve.
- For non-trivial work, start with `npm exec -- agent-workflow context -- "<scope>"` and inspect current code, Git state, the active task, and affected PRD before changing behavior.
- Keep exactly one active `wip-*` or `blocked-*` record under `.agents/docs/tasks/`; completed evidence moves to `.agents/docs/tasks/done/`.
- Product behavior changes update the affected PRD and `.agents/docs/prd/0000-prd-index.md`.
- Reusable workflow policy changes require a human decision recorded under `.agents/docs/proposals/`.
- Before handoff, run the checks selected by `npm exec -- agent-workflow verify --base <verified-ref>` plus `npm exec -- agent-workflow check`.
- Destructive, production, infrastructure, authentication, or external-system writes require explicit scope and a rollback path.
- Project-specific package manager, path ownership, checks, and context budgets live in `.agents/config.json`.
- Follow [delivery](.agents/docs/agent-workflow.md), [architecture](.agents/docs/architecture.md), [development](.agents/docs/development.md), and [testing](.agents/docs/testing.md). Keep these documents specific to this product.
- Install the workflow as a project dependency; never copy its source `packages/` or `plugins/` trees into this repository.
