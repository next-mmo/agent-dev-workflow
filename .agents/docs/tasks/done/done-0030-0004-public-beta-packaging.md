# Task 0030: Repair Public Beta Packaging

> Status: done
> Completed: 2026-09-05
> Created: 2026-09-05
> Related PRD: `.agents/docs/prd/0004-workflow-distribution.md`

## Change Contract

- Human outcome: users can install a local release tarball with MIT terms and self-contained plugin guidance.
- Authority: user requested "fix it and license MIT" after the public-readiness review; extends proposal 0006 for these repairs.
- Scope: license distribution, portable skill references/setup, installation docs, package regression coverage.
- Non-goals: npm publication, remote writes, or committing unrelated existing changes.
- Risk: low; preserve existing working-copy edits.
- Verification: packed npm/pnpm fixtures, missing-link negative control, full tests, build, strict workflow/docs, bundle and skill checks.
- Recovery: revert only this task's changes and regenerate bundles; no consumer data migration.

## Acceptance Criteria

- [x] Root, package, and portable plugin contain matching MIT license text.
- [x] Bundled Markdown references resolve without source repository docs; setup requires only available tooling.
- [x] Onboarding documents the unpublished tarball path and host skill activation.
- [x] Relevant checks pass with fresh evidence.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Regression suite | `npm test` | 100/100 passed; pnpm fixture skipped by automatic discovery |
| Installed npm artifact | `node --test tests/package-distribution.test.mjs` | npm fixture passed; installed license equality and bundled links verified; missing-link negative control passed |
| Production build | `npm run build` | Passed |
| Workflow and docs | `npm run workflow:check -- --mode strict`; `npm run docs:check` | Passed; documentation headroom warnings only |
| Bundles and adapters | `npm run distribution:check`; Git Bash `scripts/skill.sh init all` and `check all` | Passed |
| Release tarball | `npm run distribution:pack` with temporary npm cache | Created `next-mmo-agent-workflow-scrum-0.1.0.tgz` |

## Handoff

The human accepted the MIT licensing and packaging fixes and authorized task closure with "yes" on 2026-09-05. This resolves the earlier acceptance gate. Implementation is verified for npm; pnpm verification was skipped and remains required before publication. No registry publication, remote CI run, or commit was performed. Existing unrelated edits remain intact. The default WSL Bash failed; Git Bash succeeded. Restricted npm cache writes were resolved with a temporary cache.

## Closure Verification

After human-authorized closure, documentation and `git diff --check` passed. Strict workflow verification reports multiple changed completed tasks (0029 and 0030) in the shared uncommitted working copy. Its single-increment gate requires separating these increments for delivery; closure does not authorize committing or altering the earlier task. This supersedes the pre-closure strict-check pass for the current combined working copy.

## Recovery

Revert only this task's edits and regenerate bundles. Preserve pre-existing changes and consumer state.
