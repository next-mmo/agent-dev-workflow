# PRD-0004: Workflow Distribution

> Status: active beta
> Created: 2026-09-03
> Updated: 2026-09-03
> Related Tasks: `.agents/docs/tasks/wip-0028-0001-package-workflow-cli.md`

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

## 3. Acceptance Criteria

- [ ] The packed package contains only the declared runtime, templates, plugin bundle, metadata, license, and user documentation.
- [ ] A clean fixture and a non-empty existing fixture initialize without destructive overwrite.
- [ ] Consumer configuration changes path classification and emitted verification commands.
- [ ] All public commands run from installed package binaries on Windows-compatible paths.
- [ ] Plugin manifests validate and bundled skills match canonical sources.
- [ ] Publication and migration remain explicit follow-up decisions.
