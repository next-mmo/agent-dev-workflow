# Task 0005: Clarify Agent Workflow Scrum Identity

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No demo-product PRD change required; repository identity only.  
> **Created:** 2026-09-01  
> **Completed:** 2026-09-01  

## Goal

Make Agent Workflow Scrum the explicit repository product and position Counter
App only as an executable demo used to validate the workflow.

## Checklist

- [x] Correct product identity in `AGENTS.md`.
- [x] Define human and agent authority in the Scrum operating model.
- [x] Map Scrum concepts to repository artifacts and task states.
- [x] Label Counter App as a demo in the detailed workflow guide.
- [x] Preserve historical counter-app implementation records.
- [x] Validate formatting and links.

## Acceptance Criteria

- [x] Agents cannot mistake Counter App for the repository product.
- [x] The human retains product, priority, acceptance, and policy authority.
- [x] The agent's delivery role and Scrum artifacts are discoverable.
- [x] Counter App remains available as the current workflow testbed.

## Verification Evidence

- `AGENTS.md` names Agent Workflow Scrum as the product and Counter App as demo.
- The detailed workflow maps Scrum concepts to repository artifacts and human
  authority.
- The task-board guide maps backlog, active work, impediments, increments, and
  retrospective learning.
- Historical Counter App PRDs and completed implementation tasks were preserved.
- `markdownlint-cli2`: 0 issues across all changed documents.
- All referenced local workflow, suggestion, task-board, and demo targets exist.
- Product tests and build were not rerun because only agent documentation and
  workflow identity changed.
