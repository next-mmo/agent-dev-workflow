# PRD-0004: Workflow Distribution

> Status: done
> Created: 2026-09-03
> Updated: 2026-09-05
> Related Tasks: `.agents/docs/tasks/done/done-0028-0001-package-workflow-cli.md`, `.agents/docs/tasks/done/done-0029-0005-realistic-todo-workspace.md`
> Packaging follow-up: `.agents/docs/tasks/done/done-0030-0004-public-beta-packaging.md`
> Consumer initialization: `.agents/docs/tasks/done/done-0032-0004-consumer-initialization.md`
> Plugin consolidation: `.agents/docs/tasks/done/done-0033-0004-single-plugin-bundle.md`

## 1. Problem Statement

Teams need Agent Workflow Scrum's context, scope, verification, documentation, report, and diagnostic tools without copying reusable implementation or benchmark assets into each product repository. The installed version must be reproducible, consumer state must remain reviewable, and initialization must be safe for existing codebases.

## 2. Product Requirements

1. Distribute the workflow engine as a versioned npm package with a project-local `agent-workflow` binary.
2. Support `init`, `context`, `scope`, `verify`, `check`, `docs`, `report`, and `doctor` through one command surface.
3. Store consumer-specific package manager, paths, and check commands in `.agents/config.json`.
4. Initialize new or existing repositories without overwriting existing root instructions/context.
5. Keep `.agents/scripts/`, `.agents/skills/`, `.agents/benchmark/`, demo product code, and source history out of initialized repositories.
6. Provide portable Agent, ZCode, Cursor, and Codex plugin manifests with reusable skills generated from canonical sources.
7. Keep optional context providers advisory, local-first, and explicit where external recall is involved.
8. Verify the actual packed artifact in clean npm and pnpm fixtures before publication.
9. Planning and solution commands work after thin initialization, using package defaults with optional consumer template overrides.
10. Static review uses the shared Git scope collector, includes dirty and untracked files with an explicit base, fails on invalid refs/read errors, and reports actual inspections separately from skips. Its output must not imply semantic or security acceptance.
11. PRD sync lists outstanding criteria and related task records as read-only evidence pointers. It never accepts criteria or infers completion from source keywords.
12. Both local code indexes discover JS/TS files from configured product globs and ignore rules, including `apps/`, `packages/`, and custom roots.
13. Distribute the MIT license with both npm and portable plugin artifacts; bundled skill links resolve without source-only documents.
14. Before registry publication, document tarball installation and host skill activation separately. Consumer setup must not require source-only adapter scripts.
15. Initialize `proposals/` and project-owned workflow, documentation instructions, architecture, defensive patterns, development, testing, and budget files. Exclude model recommendations; preserve existing files and legacy decisions. Doctor reports missing scaffold documents.
16. Support a commit-pinned Git dependency from the repository root without registry publication or copying workflow `packages/` and `plugins/` into the consumer. The source root exposes the canonical CLI; installed runtime assets belong under `node_modules`.
17. Keep one portable plugin bundle at `packages/agent-workflow-scrum/plugin/`. Its manifests and commands are package-owned; the distribution build synchronizes only canonical skills and licenses and never creates a root `plugins/` copy.
18. Store consumer documentation budgets in `.agents/config.json` under `docBudgets`; initialization must not create `.agents/docs/doc-budgets.json`. The docs checker reads configured budgets by default and accepts `--budget-file` only as an explicit compatibility override.

## 3. Acceptance Criteria

- [x] The packed package contains only the declared runtime, templates, plugin bundle, metadata, license, and user documentation.
- [x] A clean fixture and a non-empty existing fixture initialize without destructive overwrite.
- [x] Consumer configuration changes path classification and emitted verification commands.
- [x] All public commands run from installed package binaries on Windows-compatible paths.
- [x] Plugin manifests validate and bundled skills match canonical sources.
- [x] Publication and migration remain explicit follow-up decisions.
- [x] Installed planning and solution commands create usable drafts without copied templates.
- [x] Negative review cases fail clearly; inspected and skipped file counts match the observed files.
- [x] PRD-sync output remains advisory and PRD bytes remain unchanged.
- [x] Both indexes include configured product files and exclude ignored/non-product files.
- [x] MIT terms and self-contained guidance ship in the tested artifact; unpublished onboarding uses a reproducible tarball path.
