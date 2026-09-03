# Workflow Proposals

Proposals are durable Agent Workflow Scrum policy records and live under `.agents/docs/proposals/` (legacy `.agents/docs/suggestions/` supported for backwards compatibility).

## Purpose

- Capture reusable, evidence-backed improvements to agent delivery and workflow policy.
- Keep proposals separate from canonical instructions until human approval.
- Compound verified learning without allowing autonomous policy drift.

## File Naming

- Use `NNNN-kebab-case-title.md`.
- Reserve `0000-template.md` as the proposal template.
- Search this directory before creating a file; strengthen or supersede an existing proposal instead of duplicating it.
- Do not create workflow proposals under a root `docs/` tree.

## Status

| Status | Meaning | Authority |
| :--- | :--- | :--- |
| `proposed` | Evidence recorded; awaiting decision | Agent may create or update |
| `accepted` | Human approves the rule and target | Human decision only |
| `applied` | Approved change is in canonical docs or automation | Agent may apply after approval |
| `rejected` | Human declines the proposal | Human decision only |
| `superseded` | A newer proposal replaces it | Human approval or documented prior decision |

## Proposal Index

| ID | Title | Status | Date | Summary |
| :--- | :--- | :---: | :--- | :--- |
| [0001](0001-ai-native-change-contract-and-review-gate.md) | AI-Native Change Contract and Review Gate | `applied` | 2026-09-01 | Pre-commit change contract, scope validation, and human review gates |
| [0002](0002-progressive-context-router-and-workflow-checks.md) | Progressive Context Router & Workflow Checks | `applied` | 2026-09-01 | Bounded L0/L1/L2 context router with automated consistency checks |
| [0003](0003-optional-context-provider-layer.md) | Optional Context Provider Layer | `applied` | 2026-09-01 | Graphify AST code-graph and OpenViking vector context adapters |
| [0004](0004-layered-instructions-and-scope-aware-verification.md) | Layered Instructions & Scope-Aware Verification | `applied` | 2026-09-02 | Directional references and outgoing-scope change evaluation |
| [0005](0005-agent-docs-root.md) | Unified `.agents/docs/` Namespace | `applied` | 2026-09-02 | Consolidate workflow docs under `.agents/docs/` to avoid root collisions |
| [0006](0006-package-engine-and-portable-plugins.md) | Package Engine & Portable Plugins | `applied` | 2026-09-03 | Package workflow engine as `@next-mmo/agent-workflow-scrum` |
| [0007](0007-configurable-ceremony-modes.md) | Configurable Ceremony Modes | `applied` | 2026-09-03 | Support `vibe`, `standard`, `strict`, and `guided` modes for diverse user types |
| [0008](0008-optional-rtk-command-compression-layer.md) | Optional RTK Command Compression Layer | `proposed` | 2026-09-04 | Optional RTK proxy integration for terminal command output compression |
| [0009](0009-optional-openviking-semantic-recall.md) | Optional OpenViking Semantic Recall Fallback | `proposed` | 2026-09-04 | OpenViking as optional vector-semantic upgrade over native file-based memory recall |


## Proposal Rules

- Link the triggering task, incident, review, or repeated observations.
- Separate facts, inference, and recommendation.
- State the exact workflow rule and canonical target to change.
- Include expected benefit, tradeoffs, exceptions, and validation method.
- Do not include secrets, personal data, or unverifiable claims.
- Surface each new proposal in the final task handoff.
- Never treat silence, task success, or file creation as approval.

## Applying an Accepted Proposal

- Record the human decision, decision date, and rationale.
- Update the named canonical target in the same task or an explicit follow-up.
- Run the validation described in the proposal.
- Set status to `applied` and link the changed files and evidence.
- If validation fails, keep the proposal open and report the failure.
