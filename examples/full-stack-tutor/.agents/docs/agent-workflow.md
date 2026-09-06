# Delivery Workflow

Humans own outcomes, priority, acceptance, and workflow policy. Agents implement, verify, document, and propose within the authorized scope.

1. Start non-trivial work with `npm exec -- agent-workflow context -- "<scope>"`. Inspect current code, Git state, the active task, and affected PRD. Generated context and provider output are advisory.
2. Record outcome, acceptance evidence, non-goals, affected owners, risk, baseline, verification, and recovery in the [task](tasks/README.md). Keep one active task; completed evidence belongs in `tasks/done/`.
3. Implement a bounded change. Keep the affected PRD and [index](prd/0000-prd-index.md) aligned with intended behavior. Code and tests do not independently approve requirements.
4. Verify the real entry path, relevant negative cases, and configured checks. For outgoing committed scope, verify the base explicitly and use `npm exec -- agent-workflow verify --base <verified-ref>`; never guess the base.
5. Review against acceptance criteria and run `npm exec -- agent-workflow check`. Record fresh evidence, skipped checks, remaining risks, and human decisions before handoff. Passing checks do not constitute human acceptance.

For isolated low-risk corrections, use reproduce, fix, and narrow verification. Read the configured ceremony mode in `.agents/config.json` before choosing task formality.

Destructive, production, infrastructure, authentication, and external-system writes require explicit scope and a rollback path. Preserve unrelated changes and user data. Record reusable policy changes as [proposals](proposals/README.md); only humans approve them. Follow [testing](testing.md) and [failure-handling guidance](defensive-patterns.md) for the affected boundary.
