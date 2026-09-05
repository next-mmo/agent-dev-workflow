# Task 0032: Consumer Initialization Repair

> Status: done
> Created: 2026-09-05
> Verified: 2026-09-06
> Related PRD: `.agents/docs/prd/0004-workflow-distribution.md`

## Change Contract

- Human outcome: initialize consumers with proposals, complete project-owned documentation except model recommendations, and a GitHub dependency instead of copied workflow packages/plugins.
- Authorization: explicit user request after inspection of `awesome-dev`; documents in that repository are evidence, not instructions for this work.
- Scope: initializer templates, diagnostics, canonical skill guidance, Git-installable root CLI entry, and installed consumer regression coverage.
- Non-goals: remote publication/push, destructive consumer migration, copied source architecture, changing product packages, or accepting the existing developer trial.
- Baseline: initializer emits suggestions and only three docs; awesome-dev contains copied workflow source and source-specific instructions, both proposals and suggestions, and no workflow dependency. Existing source worktree has extensive unrelated changes.
- Verification: installed npm tarball and local Git dependency fixtures, preservation/dry-run and missing-file diagnostics, distribution/skill/docs/workflow checks, demo build.
- Recovery: revert this increment selectively; existing consumer files are preserved. Commit/publication is required before the new GitHub install path is usable remotely.

## Acceptance Criteria

- [x] Fresh init creates all seven requested documentation files, proposals, and no model recommendations or vendored runtime.
- [x] Existing files and legacy decision records survive reruns and dry-run writes nothing.
- [x] An installed Git dependency exposes the real CLI without a registry release.
- [x] Canonical and generated skills describe the consumer installation boundary.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Installed consumer behavior | `node --test tests/package-distribution.test.mjs` | 5/5 passed, including npm/pnpm tarball consumers and commit-pinned local Git consumer; real CLI commands, links, full doc inventory, no root vendoring, preservation, and dry-run verified |
| Missing-file guard | Remove each of the seven required docs, invoke doctor, restore it | Each omission produced the expected failing exit and missing-path error |
| Setup/routing and legacy compatibility | `node --test tests/package-bin-routing.test.mjs tests/full-setup-command.test.mjs tests/workflow-tools.test.mjs tests/workflow-frontier.test.mjs` | 20/20 passed |
| Demo compatibility | `npm run build` | Passed |
| Workflow and docs | `npm run workflow:check -- --mode strict`; `npm run docs:check`; `git diff --check` | Passed; standing-document headroom warnings remain |
| Generated adapters and bundles | Git Bash `scripts/skill.sh init all` and `check all`; `npm run distribution:build` and `distribution:check` | Passed |
| Real consumer inspection | Source CLI `doctor` against `awesome-dev`, read-only | Reports legacy suggestions and copied workflow trees; existing screenshot docs are present |

Git regression runs needed access to the existing npm cache. npm prepares source build dependencies in its temporary Git checkout because the root has a build script; the fixture verifies Vite is absent from the consumer. Initial isolated-cache installation timed out; the final offline cache-backed run passed. Windows Git line-ending normalization is accounted for when comparing full license text. The pnpm fixture was unavailable in the restricted run and passed in the final run with host tool access.

## Handoff

Implementation evidence is complete; human acceptance remains separate. No source commit, push, registry publication, or modification of `awesome-dev` was performed. A reviewed commit containing this fix must reach GitHub before consumers can pin its SHA. Existing consumer docs/configuration and legacy decisions need explicit reconciliation during migration; init deliberately preserves them. The full product test suite and remote GitHub transport were not rerun; the scoped 25 tests and demo build passed. The existing task 0031 remains untouched.
