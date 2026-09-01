# Task 0004: Audit and Propose Agent Workflow Improvements

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No product PRD change required; workflow governance only.  
> **Created:** 2026-09-01  
> **Completed:** 2026-09-01  

## Goal

Audit the universal agent workflow against current primary guidance and produce
an evidence-backed improvement proposal without self-approving canonical rules.

## Checklist

- [x] Review current agent, workflow, task, and suggestion documents.
- [x] Research current primary AI-agent and secure-development guidance.
- [x] Identify reusable gaps rather than preferences or one-off details.
- [x] Create one deduplicated proposal with exact rules and validation.
- [x] Run documentation lint and verify local targets.
- [x] Surface the proposal for explicit human approval.

## Acceptance Criteria

- [x] Current workflow gaps are separated into facts and inference.
- [x] Proposed rules are risk-scaled and do not bloat `AGENTS.md`.
- [x] The proposal defines measurable validation and retirement criteria.
- [x] Canonical workflow files remain unchanged until human approval.

## Verification Evidence

- Reviewed `AGENTS.md`, workflow guidance, suggestion governance, template, and
  existing task conventions.
- Used current primary guidance from OpenAI, NIST, and OWASP.
- Created suggestion `0001` with facts, inference, exact rules, tradeoffs,
  validation, review date, and pending human decision.
- `markdownlint-cli2`: 0 issues across all relevant workflow documents.
- Verified all local canonical targets and the proposal exist.
- Code tests and build were not rerun because no product or canonical workflow
  file changed; this task adds only a non-canonical proposal and evidence.
