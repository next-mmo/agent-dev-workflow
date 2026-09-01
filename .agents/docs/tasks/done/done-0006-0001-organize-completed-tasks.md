# Task 0006: Organize Completed Tasks

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No product PRD change required; Scrum task governance only.  
> **Created:** 2026-09-01  
> **Completed:** 2026-09-01  

## Goal

Keep only active Scrum work in `docs/tasks/` and store completed increments in
`docs/tasks/done/` before eventual archival.

## Checklist

- [x] Define root, done, and archived task locations.
- [x] Move all completed task records into `docs/tasks/done/`.
- [x] Update canonical workflow and PRD references.
- [x] Verify no `done-*` files remain in the task root.
- [x] Validate Markdown and local links.

## Acceptance Criteria

- [x] Active task discovery scans only the task root.
- [x] Completed tasks are discoverable under `docs/tasks/done/`.
- [x] Completed tasks older than 30 days have a documented archive path.
- [x] Existing task history and content are preserved.

## Verification Evidence

- Root completed-task count: 0 before closing this task.
- `docs/tasks/done/` contained all five previous completed records.
- This task became the sixth completed record in `docs/tasks/done/`.
- Updated `AGENTS.md`, workflow guide, task-board rules, and PRD references.
- Preserved task IDs and added completed-increment metadata during each move.
- Reformatted historical task and PRD Markdown exposed by the full validation.
- `markdownlint-cli2`: 0 issues across workflow, task, and PRD documents.
- Product tests and build were not rerun because only documentation paths,
  metadata, and formatting changed.
