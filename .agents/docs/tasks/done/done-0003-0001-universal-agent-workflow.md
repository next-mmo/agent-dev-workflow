# Task 0003: Establish Universal Full-Stack Agent Workflow

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No product PRD change required; agent-workflow documentation only.  
> **Created:** 2026-09-01  
> **Completed:** 2026-09-01  

## Goal

Make this counter app a reference implementation for a reusable, real-world
full-stack AI-agent delivery workflow with an evidence-backed, human-approved
improvement loop.

## Checklist

- [x] Keep root `AGENTS.md` concise and canonical.
- [x] Define the universal delivery loop and scope-specific quality gates.
- [x] Add a counter-app full-stack worked example.
- [x] Add `docs/suggestions/` governance and a reusable proposal template.
- [x] Require human approval before suggestions become canonical workflow rules.
- [x] Validate commands, links, formatting, tests, and build.

## Acceptance Criteria

- [x] Agents can identify the required workflow and relevant quality gates from
  `AGENTS.md`.
- [x] Detailed guidance is linked rather than duplicated in `AGENTS.md`.
- [x] Reusable learnings are deduplicated, evidence-backed, and recorded under
  `docs/suggestions/`.
- [x] Workflow changes cannot self-approve; a human decision is required.
- [x] The counter app demonstrates how the workflow extends from frontend-only
  work to a realistic full-stack feature.

## Verification Evidence

- `npm test`: 7 passed, 0 failed.
- `npm run build`: Vite 8.2.2 production build completed successfully.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `markdownlint-cli2`: 0 issues across the changed workflow documents.
- Internal targets for workflow, development, suggestions, template, agent, and
  compatibility documents all exist.
- `CLAUDE.md` uses an `@AGENTS.md` reference shim because Windows denied
  non-elevated symbolic-link creation.
- No product PRD was changed because product behavior is unchanged.
- No workflow suggestion was created because this canonical change was an
  explicit human request rather than an autonomous agent proposal.
