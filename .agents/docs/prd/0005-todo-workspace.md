# PRD-0005: Todo Workspace

> Status: active  
> Created: 2026-09-04  
> Updated: 2026-09-04  
> Related Task: `.agents/docs/tasks/wip-0029-0005-realistic-todo-workspace.md`

## Problem Statement

The executable demo should exercise a realistic local workflow: people need to capture work, distinguish urgency and context, find active work quickly, and retain progress across browser sessions.

## Product Requirements

1. Create a task from non-empty text, with a project, priority, and optional local due date.
2. List tasks with a completion control and an explicit individual remove action.
3. Filter tasks by all, active, and completed status; optionally narrow by project and case-insensitive text search.
4. Preserve task data, the selected filters, and the color theme in localStorage. Recover missing/stale ID counters without collisions. If storage is blocked or full, keep the session usable and indicate that changes are not saved.
5. Show counts and useful empty states. Clearing completed tasks must be an explicit separate action.
6. Support keyboard task capture through the form and provide accessible labels, status feedback, and visible focus states.

## Acceptance Criteria

- [ ] Valid tasks persist with project, priority, due date, completion status, and creation order.
- [ ] Empty or whitespace-only task titles are rejected without changing the list.
- [ ] Completion can be toggled, and individual removal affects only the chosen task.
- [ ] Search, status, and project filters compose correctly.
- [ ] Typing a multiword search preserves spaces and matches the full phrase.
- [ ] Clearing completed tasks leaves active tasks unchanged.
- [ ] Invalid saved state fails safely to valid defaults.
- [ ] Restored tasks survive subsequent creation and reload even with missing/stale ID counters.
- [ ] Denied storage access does not prevent task creation; unsuccessful saves show session-only status.
- [ ] The browser UI exposes all supported local task-management actions and remains responsive on narrow screens.
