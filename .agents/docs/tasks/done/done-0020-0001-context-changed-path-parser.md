# Task 0020: Preserve Context Changed Paths

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No product PRD change required; context tooling bug fix.  
> **Created:** 2026-09-02  
> **Completed:** 2026-09-02

## Goal

Ensure generated context packs report the exact paths returned by `git status --short`, including the first character of tracked paths whose status begins with a leading space.

## Checklist

- [x] Preserve leading status-column whitespace while parsing Git output.
- [x] Keep normal branch and Git metadata parsing trimmed.
- [x] Add a regression test for the first changed path.
- [x] Re-run local context, provider, test, build, and workflow checks in the original increment.

## Acceptance Criteria

- [x] Context output reports changed paths without dropping characters.
- [x] The regression test passes in an isolated Git fixture.
- [x] Provider failures remain non-blocking for local context.
- [x] Existing application and workflow checks remain green.

## Verification Evidence

- Original context verification reported the affected PRD path exactly.
- Original `npm test` passed 30 tests including the changed-path and provider contract regressions.
- Original `npm run build` and `npm run workflow:check` passed.
- Browser beta round verified counter actions, custom decimal steps, reset, undo, shortcuts, theme persistence, history cap, reload persistence, no horizontal overflow, and no console errors.
- Combined provider context preserved local results while reporting unavailable/unconfigured optional providers.

The regression is revalidated as part of task 0022 after migrating the workflow artifact namespace to `.agents/docs/`.
