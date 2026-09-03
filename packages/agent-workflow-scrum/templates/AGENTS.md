# Agent Instructions

- Humans own outcomes, priority, acceptance, and workflow policy. Agents may implement, verify, document, and propose; never self-approve.
- For non-trivial work, start with `{{RUNNER}} context -- "<scope>"` and inspect current code, Git state, the active task, and affected PRD before changing behavior.
- Keep exactly one active `wip-*` or `blocked-*` record under `.agents/docs/tasks/`; completed evidence moves to `.agents/docs/tasks/done/`.
- Product behavior changes update the affected PRD and `.agents/docs/prd/0000-prd-index.md`.
- Reusable workflow policy changes require a human decision recorded under `.agents/docs/suggestions/`.
- Before handoff, run the checks selected by `{{RUNNER}} verify --base <verified-ref>` plus `{{RUNNER}} check`.
- Destructive, production, infrastructure, authentication, or external-system writes require explicit scope and a rollback path.
- Project-specific package manager, path ownership, checks, and context budgets live in `.agents/config.json`.
