# Workflow Suggestions

## Purpose

- Capture reusable, evidence-backed improvements to agent delivery.
- Keep proposals separate from canonical instructions until human approval.
- Compound verified learning without allowing autonomous policy drift.

## File Naming

- Use `NNNN-kebab-case-title.md`.
- Reserve `0000-template.md` as the proposal template.
- Search this directory before creating a file; strengthen or supersede an
  existing proposal instead of duplicating it.

## Status

<!-- markdownlint-disable MD013 -->

| Status | Meaning | Authority |
| :--- | :--- | :--- |
| `proposed` | Evidence recorded; awaiting decision | Agent may create or update |
| `accepted` | Human approves the rule and target | Human decision only |
| `applied` | Approved change is in canonical docs or automation | Agent may apply after approval |
| `rejected` | Human declines the proposal | Human decision only |
| `superseded` | A newer proposal replaces it | Human approval or documented prior decision |

<!-- markdownlint-enable MD013 -->

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
