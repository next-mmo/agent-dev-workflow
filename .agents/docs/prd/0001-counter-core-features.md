# PRD-0001: Counter Core Features

> Status: done  
> Created: 2026-09-01  
> Updated: 2026-09-01
> Related Tasks: `.agents/docs/tasks/done/done-0001-0001-counter-state-and-ui.md`,
> `.agents/docs/tasks/done/done-0007-0001-undo-last-counter-action.md`,
> `.agents/docs/tasks/done/done-0013-0001-custom-step-and-accessible-selection.md`

## 1. Problem Statement

Users need a clean, responsive utility to count items, track repetitions, and
preserve their progress between browser sessions without unnecessary server
dependencies.

## 2. Product Requirements & Rules

1. **Count State:** Display current count (initial value: `0`).
2. **Actions:** Increment (`+`), Decrement (`-`), and Reset (`0`).
3. **Custom Step:** Allow choosing a preset or applying any positive finite
   custom step size, including decimal values.
4. **Persistence:** Automatically save count, step, and theme preference to
   `localStorage`.
5. **Theme Support:** Dark and Light mode toggle with smooth visual transitions.
6. **Keyboard Shortcuts:**
   - `ArrowUp` / `+` : Increment
   - `ArrowDown` / `-` : Decrement
   - `r` / `R` : Reset
7. **Undo:** Restore the previous count after the most recent count-changing
   action, with a one-level undo button and `z` / `Z` keyboard shortcut.
8. **Accessible Selection:** Expose the currently selected preset step through
   `aria-pressed`; custom values make all presets unselected.

## 3. Acceptance Criteria

- [x] Increment increases count by step size.
- [x] Decrement decreases count by step size.
- [x] Reset sets count back to 0.
- [x] Reloading the browser preserves the last count and step.
- [x] Dark/Light mode persists in `localStorage`.
- [x] Keyboard shortcuts trigger the expected actions.
- [x] Undo restores the previous count and persists across reloads.
- [x] Applying a positive custom step changes the increment/decrement amount,
  including when submitted with Enter.
- [x] Invalid custom step input shows feedback and keeps the current step.
- [x] The selected preset exposes its pressed state to assistive technology.
- [x] Unit tests pass for all state transitions and storage sync.
