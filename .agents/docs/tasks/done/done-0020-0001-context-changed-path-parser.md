# Task 0020: Preserve Context Changed Paths

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No product PRD change required; context tooling bug fix.  
> **Created:** 2026-09-02  
> **Completed:** 2026-09-02

## Goal

Ensure generated context packs report the exact paths returned by `git status --short`, including the first character of the first path.

## Acceptance Criteria

- [x] Preserve leading status-column whitespace while parsing Git output.
- [x] Keep normal branch and Git metadata parsing trimmed.
- [x] Add a regression test for the first changed path.
- [x] Context output reports changed paths without dropping characters.
- [x] Provider failures remain non-blocking for local context.

## Verification Evidence

- The regression test verifies the first changed path is preserved exactly.
- `npm test` passed for the original increment, including provider contract tests.
- `npm run build` and `npm run workflow:check` passed.
- Browser verification covered counter actions, custom decimal steps, reset, undo, shortcuts, theme/history persistence, layout, and console errors.
- The `.agents/docs/` relocation carries this parser fix forward and re-runs it in the final CI suite.
