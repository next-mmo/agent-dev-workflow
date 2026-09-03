# Task 0028: Package the Workflow CLI and Portable Plugins

> **Status:** done
> **Scrum Artifact:** active increment
> **Created:** 2026-09-03
> **PRD:** `.agents/docs/prd/0004-workflow-distribution.md`
> **Suggestion:** `.agents/docs/suggestions/0006-package-engine-and-portable-plugins.md`

## Change Contract

- **Human outcome:** teams can initialize and run Agent Workflow Scrum in new or existing repositories without committing reusable scripts, skills, benchmarks, demo code, or source-repository history.
- **Acceptance evidence:** a real packed npm artifact installs and runs in temporary npm and pnpm fixtures; all public commands work at the consumer boundary; forbidden directories are absent; plugin manifests and canonical-skill mirrors validate.
- **Non-goals:** publish a registry release, install a personal marketplace entry, migrate/remove the Tauri repository's current vendored files, modify Counter App behavior, or merge the separate benchmark work.
- **Affected layers and owners:** npm engine package, initialization templates, plugin bundles, source-to-plugin generation, workflow architecture/onboarding, and distribution tests.
- **Risk level and required approvals:** medium workflow/distribution change; the human approved the plan on 2026-09-03. Publishing and consumer cleanup require later explicit scope.
- **Baseline:** `npm ci`, the existing 55 tests, and the Vite build pass. The implementation now passes the full 59-test suite and the documentation budget check; the development guide was trimmed within its existing budget.
- **Verification plan:** focused CLI/config/init tests, real `npm pack`, npm and pnpm fixture installs, all public command smoke tests, forbidden-content inspection, manifest validation, full suite/build/workflow/docs/skill checks, and diff hygiene.
- **Rollback or recovery:** remove the new package/plugin/config sources and restore edited workflow docs/scripts; no registry, marketplace, or consumer cleanup is performed in this task.

## Acceptance Criteria

- [x] `@next-mmo/agent-workflow-scrum` exposes a project-local `agent-workflow` binary with `init`, `context`, `scope`, `verify`, `check`, `docs`, `report`, and `doctor` commands.
- [x] `.agents/config.json` controls package manager, project path classification, and selected check commands with safe defaults.
- [x] `init` supports new and existing repositories, preserves existing files, and writes no `.agents/scripts/`, `.agents/skills/`, or `.agents/benchmark/` content.
- [x] The npm tarball excludes benchmarks, Counter App code, completed source history, and other repository-only assets.
- [x] Portable Agent/Cursor and Codex manifests bundle generated canonical skills without requiring copies in the consumer repository.
- [x] Real npm and pnpm fixture installations exercise the published surface and prove excluded paths stay absent.
- [x] Documentation explains project-local installation, `yalc` development use, optional providers, limitations, and the deferred publish/migration boundary.
- [x] Focused and broad verification passes, with any baseline-only failure reported separately.
- [x] Human reviews the publishable artifact and decides whether to publish and migrate the Tauri repository.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Clean isolated implementation | `codex/package-workflow-cli` worktree from `origin/main` | Passed |
| Baseline tests and build | `npm test`; `npm run build`; `npm run workflow:check` | Passed; 59/59 tests |
| Documentation budget and links | `npm run docs:check` | Passed; warnings only for low headroom |
| Package/consumer/plugin behavior | `tests/package-distribution.test.mjs`; npm and pnpm packed fixtures | Passed; installed binary exercised all public commands and excluded paths stayed absent |
| Distribution drift and manifests | `npm run distribution:check`; plugin validator; `skill.sh check`; skill quick validation | Passed |
| Full regression and hygiene | `npm test`; build; strict workflow/docs checks; `git diff --check` | Passed |

## Handoff

- Human accepted the publishable artifact on 2026-09-03. All 9 acceptance criteria passed.
- Publication, marketplace entry, and Tauri migration remain deferred follow-up actions requiring separate authorization.
