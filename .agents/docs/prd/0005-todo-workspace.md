# PRD-0005: Todo Workspace

> Status: in-progress
> Created: 2026-09-04  
> Updated: 2026-09-05
> Related Task: `.agents/docs/tasks/done/done-0029-0005-realistic-todo-workspace.md`
> Full-stack trial: `.agents/docs/tasks/wip-0031-0005-full-stack-developer-trial.md`

## Problem Statement

The executable demo should exercise a realistic local workflow: people need to capture work, distinguish urgency and context, find active work quickly, and retain progress across browser sessions.

## Product Requirements

1. Create a task from non-empty text, with a project, priority, and optional local due date.
2. List tasks with a completion control and an explicit individual remove action.
3. Filter tasks by all, active, and completed status; optionally narrow by project and case-insensitive text search.
4. Preserve task data, the selected filters, and the color theme in localStorage. Recover missing/stale ID counters without collisions. If storage is blocked or full, keep the session usable and indicate that changes are not saved.
5. Show counts and useful empty states. Clearing completed tasks must be an explicit separate action.
6. Support keyboard task capture through the form and provide accessible labels, status feedback, and visible focus states.
7. Coordinate browser writes with a shared Web Lock and reload saved state inside the lock before applying an action. Rendering must not write storage. Other tabs refresh saved changes without replacing unsaved session work.
8. Retain failed saves in the current tab. Retry an unsaved snapshot only if saved data is unchanged; otherwise explain the conflict without overwriting either version. Without Web Locks, allow reading saved data and show that changes remain session-only. Durable shared writes require a browser with Web Locks on HTTPS or localhost; all open tabs must run this version.
9. Completing or removing a focused task retains focus on the surviving control, a neighboring task, or the Tasks heading when none remain.

## Acceptance Criteria

### Full-stack trial (human acceptance pending)

- [ ] Optional `?storage=server` workspace uses a loopback Node API and disk persistence; browser tasks are separate and never automatically migrated.
- [ ] Task editing preserves identity, creation time, and completion; invalid edits retain the draft and saved task.
- [ ] Revision checks reject stale writes; failed saves retain confirmed state and draft input, with explicit refresh/retry guidance.
- [ ] API validation, body limits, same-origin checks, and atomic file replacement protect local data. One server process owns each data file; hosted/multi-user operation is outside scope.
- [ ] Server-mode filters and theme stay in the tab; browser mode retains its existing persistence rules. Restart, conflict, offline, and browser flows have recorded evidence.

### Browser workspace

- [x] Valid tasks persist with project, priority, due date, completion status, and creation order.
- [x] Empty or whitespace-only task titles are rejected without changing the list.
- [x] Completion can be toggled, and individual removal affects only the chosen task.
- [x] Search, status, and project filters compose correctly.
- [x] Typing a multiword search preserves spaces and matches the full phrase.
- [x] Clearing completed tasks leaves active tasks unchanged.
- [x] Invalid saved state fails safely to valid defaults.
- [x] Restored tasks survive subsequent creation and reload even with missing/stale ID counters.
- [x] Denied storage access does not prevent task creation; unsuccessful saves show session-only status.
- [x] The browser UI exposes all supported local task-management actions and remains responsive on narrow screens.
- [x] Overlapping tab actions preserve distinct task additions and do not overwrite tasks when filters change.
- [x] Quota failure, recovery, conflicting saved changes, and missing Web Locks preserve data with explicit status.
- [x] Keyboard completion retains useful focus, including when filtering removes the completed row.
