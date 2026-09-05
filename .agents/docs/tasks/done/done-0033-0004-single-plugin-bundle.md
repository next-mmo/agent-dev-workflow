# Task 0033: Single Package-Owned Plugin Bundle

> Status: done
> Created: 2026-09-06
> Related PRD: `.agents/docs/prd/0004-workflow-distribution.md`

## Change Contract

- Human outcome: keep only the plugin bundle inside `packages/`, eliminating the root duplicate.
- Authorization: explicit user request; proposal 0006 records the updated distribution decision.
- Scope: distribution builder, duplicate removal, ownership/onboarding docs, and regression coverage.
- Non-goals: changing skill semantics, consumer migration, remote publication, or accepting task 0031.
- Baseline: clean worktree; distribution check confirms identical plugin bundles.
- Verification: isolated build preservation and drift rejection, installed npm/pnpm tarball and Git fixtures, strict workflow/docs/distribution checks.
- Recovery: restore the deleted tracked root bundle and prior build script from Git; package manifests and commands remain intact.

## Acceptance

- [x] Root `plugins/` is absent and distribution build does not recreate it.
- [x] Package manifests and commands survive generation; canonical skill/license drift is detected.
- [x] Installed Git and tarball CLI/plugin artifacts remain usable.

## Evidence

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Single bundle, preserved owners, drift detection | `node --test tests/package-distribution.test.mjs` | 6/6 passed, including isolated build preservation, stale skill/license negative controls, npm/pnpm tarball consumers, and commit-pinned local Git consumer |
| Generated content | `npm run distribution:build`; `npm run distribution:check` | Passed; root `plugins/` remains absent |
| Workflow and documentation | `npm run workflow:check -- --mode strict`; `npm run docs:check`; `git diff --check` | Passed; existing document headroom warnings remain |

Package tests used host npm cache access. Full product tests/build and remote transport were not rerun because product code and installation transport are unchanged. Existing task 0031 and the installed `awesome-dev` revision are unchanged. No commit, push, or publication was performed. Historical proposal evidence and doctor detection retain references to the legacy directory intentionally.
