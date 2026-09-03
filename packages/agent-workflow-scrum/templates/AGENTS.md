# Agent Instructions

- Humans own outcomes, priority, acceptance, and workflow policy. Agents may implement, verify, document, and propose; never self-approve.
- Read `.agents/config.json` before non-trivial work. Its `mode` is authoritative: `vibe` keeps task/PRD synchronization optional for routine product changes; `standard`, `guided`, and `strict` require the stronger task/PRD/evidence lifecycle enforced by `{{RUNNER}} check`.
- For non-trivial work, start with `{{RUNNER}} context "<scope>"` and inspect current code, Git state, tests, and relevant requirements before changing behavior. Escalate context only when the small pack is insufficient.
- In `standard`, `guided`, or `strict` mode, keep at most one active `wip-*` or `blocked-*` record under `.agents/docs/tasks/`; product behavior changes synchronize the affected PRD and `.agents/docs/prd/0000-prd-index.md`. In `vibe` mode, create those artifacts only when ambiguity, risk, coordination, or durable requirements make them useful.
- Reusable workflow policy changes require a human decision recorded under `.agents/docs/suggestions/`.
- Before handoff, run the smallest relevant configured tests/build plus `{{RUNNER}} check`. When a verified Git base exists, use `{{RUNNER}} verify --base <verified-ref>` to select additional checks; never guess a base just to satisfy the workflow.
- Do not claim success from skipped, retried, timed-out, pending, or unobserved checks. Verify the real user/service boundary for changed behavior when practical.
- Destructive, production, infrastructure, authentication, or external-system writes require explicit scope and a rollback path.
- Project-specific package manager, path ownership, checks, and context budgets live in `.agents/config.json`.
