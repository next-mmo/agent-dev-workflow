# Plan 0002: Package-Owned CLI

> **Status:** in-progress
> **Created:** 2026-09-04
> **PRD:** `.agents/docs/prd/0004-workflow-distribution.md`
> **Decision:** `.agents/docs/proposals/0010-package-owned-runtime.md`

## Change Contract

- Human outcome: one package implementation, exposed through npm's local `agent-workflow` binary; no runtime copy in `.agents/scripts/`.
- Acceptance: root npm aliases and installed tarballs use the same CLI; root targeting and dry-run guarantees hold; package output and canonical skills validate.
- Non-goals: Todo UI/state changes, publishing, other-repository migration, changing PRD acceptance policy, or moving canonical skills.
- Ownership: package `bin/`, `src/`, `engine/`, and templates own runtime; root `scripts/` owns build, benchmark, and skill adapters; `.agents/` retains config, docs, skills, and benchmark data.
- Risk: medium source-layout refactor, approved by the user's package/bin request. No production or external writes.
- Baseline: distribution copies match. Package `worktree list` and `solve` reject injected `--root`; `prdsync` ignores it; `init --dry-run` creates its root. Earlier full tests had 80/83 passes, with three filesystem-permission failures.
- Verification: installed-bin and root-alias regressions; npm/pnpm tarball fixtures; full tests/build; workflow/docs/distribution checks; skill adapter generation/audit; final diff review.
- Rollback: reverse only this refactor's tracked diff and reinstall the previous lockfile; preserve the unrelated Todo increment and existing workflow records.

## Implementation

1. Retain package engine files as canonical source; remove source-copy generation and duplicate `.agents/scripts` runtime.
2. Link the local package through `devDependencies`; let npm generate `node_modules/.bin/agent-workflow` and route root aliases through it.
3. Relocate development-only helpers, update imports/classification/docs, and preserve canonical skill generation.
4. Repair dispatcher/root parsing and non-mutating initialization preview; validate through the binary.

## Evidence

- `node --test tests/package-bin-routing.test.mjs`: passed; explicit-root routing covers dry-run, plan, PRD sync, and worktree commands.
- `node --test tests/package-distribution.test.mjs`: passed; the real npm tarball installed and all public npm commands ran. pnpm was unavailable and skipped.
- `npm test`: 89/89 passed.
- `npm run build`, `npm run workflow:check -- --strict-budget`, `npm run docs:check`, `npm run distribution:check`, and the canonical skill audit passed.

This plan tracks the refactor in configured `vibe` mode; the existing Todo task remains separate. Human acceptance and any merge/publication remain separate.
