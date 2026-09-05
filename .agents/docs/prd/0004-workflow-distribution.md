# PRD-0004: Workflow Distribution

> Status: done
> Created: 2026-09-03
> Updated: 2026-09-05
> Related Tasks: `.agents/docs/tasks/done/done-0028-0001-package-workflow-cli.md`, `.agents/docs/tasks/done/done-0029-0005-realistic-todo-workspace.md`
> Packaging follow-up: `.agents/docs/tasks/done/done-0030-0004-public-beta-packaging.md`

## 1. Problem Statement

Teams need Agent Workflow Scrum's context, scope, verification, documentation, report, and diagnostic tools without copying reusable implementation or benchmark assets into each product repository. The installed version must be reproducible, consumer state must remain reviewable, and initialization must be safe for existing codebases.

## 2. Product Requirements

1. Distribute the workflow engine as a versioned npm package with a project-local `agent-workflow` binary.
2. Support `init`, `context`, `scope`, `verify`, `check`, `docs`, `report`, and `doctor` through one command surface.
3. Store consumer-specific package manager, paths, and check commands in `.agents/config.json`.
4. Initialize new or existing repositories without overwriting existing root instructions/context.
5. Keep `.agents/scripts/`, `.agents/skills/`, `.agents/benchmark/`, demo product code, and source history out of initialized repositories.
6. Provide portable Agent/Cursor and Codex plugin manifests with reusable skills generated from canonical sources.
7. Keep optional context providers advisory, local-first, and explicit where external recall is involved.
8. Verify the actual packed artifact in clean npm and pnpm fixtures before publication.
9. Planning and solution commands work after thin initialization, using package defaults with optional consumer template overrides.
10. Static review uses the shared Git scope collector, includes dirty and untracked files with an explicit base, fails on invalid refs/read errors, and reports actual inspections separately from skips. Its output must not imply semantic or security acceptance.
11. PRD sync lists outstanding criteria and related task records as read-only evidence pointers. It never accepts criteria or infers completion from source keywords.
12. Both local code indexes discover JS/TS files from configured product globs and ignore rules, including `apps/`, `packages/`, and custom roots.
13. Distribute the MIT license with both npm and portable plugin artifacts; bundled skill links resolve without source-only documents.
14. Before registry publication, document tarball installation and host skill activation separately. Consumer setup must not require source-only adapter scripts.

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
