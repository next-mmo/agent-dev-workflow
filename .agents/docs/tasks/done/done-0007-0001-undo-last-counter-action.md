# Task 0007: Add Undo for the Last Counter Action

> **Status:** done
> **Scrum Artifact:** completed increment
> **PRD:** `.agents/docs/prd/0001-counter-core-features.md`
> **Created:** 2026-09-01
> **Completed:** 2026-09-01

## 1. Goal

Let a user recover from the most recent count-changing action without losing
the current step or theme settings.

## 2. Scope and Non-Goals

- Keep one undo snapshot in memory and in `localStorage`.
- Include increment, decrement, and reset as undoable count actions.
- Keep step selection and theme changes outside the undo history.
- Clear the undo snapshot after it is used.
- Do not add multi-level history or redo in this task.

## 3. Implementation Checklist

- [x] Store the previous count before each count-changing action.
- [x] Add `undo()` and persist the undo snapshot with existing state.
- [x] Add an Undo button that is disabled when no undo is available.
- [x] Add `z` / `Z` keyboard shortcuts and update the shortcut hint.
- [x] Add state, storage, and UI acceptance tests.
- [x] Update the PRD, index, and completed task evidence.

## 4. Acceptance Criteria

- [x] After increment, decrement, or reset, Undo restores the prior count.
- [x] Undo is one-level and becomes unavailable after use.
- [x] Undo does not change the selected step or theme.
- [x] Reloading preserves an available undo and it can still be used.
- [x] `z` and `Z` trigger the same undo behavior as the button.
- [x] Existing counter, theme, keyboard, and persistence behavior remains intact.

## 5. Verification Plan

- `npm test`
- `npm run build`
- Visible browser checks for button, keyboard, disabled state, reload, and
  preservation of step/theme.

## 6. Verification Evidence

```text
✔ npm test: 9 tests passed, 0 failed
✔ npm run build: Vite production build succeeded
✔ Browser: Counter App rendered at http://localhost:5173/
✔ Button undo: increment, decrement, and reset each restored the prior count
✔ One-level behavior: Undo became disabled after use
✔ Keyboard: z and Z restored the prior count
✔ Reload: count, step, theme, and available undo survived reload
✔ Independence: undo restored count while retaining step 50 and dark theme
✔ Responsive: all controls remained visible and operable at 320x568
✔ Console: no warning or error entries observed
```
