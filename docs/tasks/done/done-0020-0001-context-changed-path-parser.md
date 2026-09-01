# Task 0020: Preserve Context Changed Paths

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No product PRD change required; context tooling bug fix.  
> **Created:** 2026-09-02  
> **Completed:** 2026-09-02

## Goal

Ensure generated context packs report the exact paths returned by
`git status --short`, including the first character of the first path.

## Checklist

- [x] Preserve leading status-column whitespace while parsing Git output.
- [x] Keep normal branch and Git metadata parsing trimmed.
- [x] Add a regression test for the first changed path.
- [x] Re-run local context, provider, test, build, and workflow checks.

## Acceptance Criteria

- [x] Context output reports changed paths without dropping characters.
- [x] The regression test passes in an isolated Git fixture.
- [x] Provider failures remain non-blocking for local context.
- [x] Existing application and workflow checks remain green.

## Verification Evidence

- `npm run context -- "context path regression" --provider local --json`
  reported `docs/prd/0000-prd-index.md` exactly.
- `npm test` — 30 tests passed, including the changed-path regression and
  provider contract tests.
- `npm run build` and `npm run workflow:check` passed.
- Browser beta round verified counter actions, custom decimal steps, reset,
  undo, shortcuts, theme persistence, history cap, reload persistence, no
  horizontal overflow, and no console errors.
- Combined provider context preserved local results while reporting Graphify
  unavailable and OpenViking unconfigured/error.
