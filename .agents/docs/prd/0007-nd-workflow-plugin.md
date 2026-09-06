# PRD-0007: ND Workflow Plugin

> Status: in-progress
> Created: 2026-09-06
> Related Task: `.agents/docs/tasks/todo-0036-0006-nd-workflow-plugin.md`

## Product Requirement

Expose Agent Workflow Scrum repositories as external workflow plugins for the
ND host (ND-DSH) through a versioned, read-only protocol. A host can detect a
compatible repository, read a normalized board snapshot, and render a bounded
context envelope for its agents. The host owns identity, authorization,
bindings, and any board projection; this package owns its own file parsing and
workflow rules and never mutates the target repository from the protocol
surface.

## Acceptance Criteria

- [ ] `agent-workflow nd <detect|snapshot|context>` runs as a project-local CLI with fixed argv, `shell: false` friendly JSON output, and exit code `0` on supported and unsupported repositories alike.
- [ ] `detect` reports config schema/mode/package-manager compatibility and fails closed (supported: false) for missing, malformed, or unsupported configurations.
- [ ] `snapshot` reports tasks (lifecycle from filenames, criteria checkboxes, PRD links, evidence, human-acceptance records), PRDs with index membership, git branch/head/dirty facts, and diagnostics for legacy archives, duplicate numbers, multiple active tasks, unnumbered records, draft/missing PRD records, conflict markers, and scan limits.
- [ ] Duplicate task numbers and unnumbered records are reported as diagnostics and never silently collapsed or invented.
- [ ] `context` renders a single bounded envelope with plugin identity, capability limits, and diagnostics that are never truncated away, escaping template delimiters, and reporting truncation honestly.
- [ ] The protocol, result shapes, diagnostic codes, and guarantees are documented in `packages/agent-workflow-scrum/plugin/nd/` with a manifest ND can validate.
- [ ] Regression tests cover the documented contract, including a realistic fixture with the known legacy quirks of real adopted repositories.

## Non-Goals

- Writing to the target repository, executing project commands (including configured checks), installing or updating packages, or any ND-side host implementation.
- Marketplace, remote publishing, or compatibility claims for other agent frameworks.
- Transition actions (start/block/accept) — a separate, later increment behind explicit human acceptance rules.

## Risk

Low: additive CLI surface and new read-only engine modules; no changes to existing command behavior.
