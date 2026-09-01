# PRD-0001: Counter Core Features

> Status: done  
> Created: 2026-09-01  
> Related Tasks: `docs/tasks/done/done-0001-0001-counter-state-and-ui.md`

## 1. Problem Statement

Users need a clean, responsive utility to count items, track repetitions, and
preserve their progress between browser sessions without unnecessary server
dependencies.

## 2. Product Requirements & Rules

1. **Count State:** Display current count (initial value: `0`).
2. **Actions:** Increment (`+`), Decrement (`-`), and Reset (`0`).
3. **Custom Step:** Allow changing step size (e.g. 1, 5, 10, 50).
4. **Persistence:** Automatically save count, step, and theme preference to
   `localStorage`.
5. **Theme Support:** Dark and Light mode toggle with smooth visual transitions.
6. **Keyboard Shortcuts:**
   - `ArrowUp` / `+` : Increment
   - `ArrowDown` / `-` : Decrement
   - `r` / `R` : Reset

## 3. Acceptance Criteria

- [x] Increment increases count by step size.
- [x] Decrement decreases count by step size.
- [x] Reset sets count back to 0.
- [x] Reloading the browser preserves the last count and step.
- [x] Dark/Light mode persists in `localStorage`.
- [x] Keyboard shortcuts trigger the expected actions.
- [x] Unit tests pass for all state transitions and storage sync.
