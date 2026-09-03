# Proposal 0007: Configurable Ceremony Modes for Diverse User Types

> **Status:** applied
> **Created:** 2026-09-03
> **Proposed by:** Human user & Agent
> **Decision owner:** Human
> **Canonical targets:** `packages/agent-workflow-scrum/engine/workflow-config.mjs`, `packages/agent-workflow-scrum/engine/workflow-check-core.mjs`, `packages/agent-workflow-scrum/`, `.agents/skills/agent-workflow-scrum/`

## Observation

Agent Workflow Scrum strictly enforces full Scrum ceremony—requiring active tasks, PRD linking, PRD indexing, and evidence ledgers for every product file modification. While appropriate for multi-engineer and enterprise settings, this creates high friction for solo vibe coders who prioritize rapid prototyping and for learners encountering steep cognitive overload.

## Evidence

- Vibe coder usability analysis documented a 28:1 ratio of workflow machinery to demo application code.
- Editing a single product file fails `workflow:check` unless multiple markdown documentation files are created and synchronized.
- Users want to choose their preferred ceremony level (`vibe`, `standard`, `strict`, `guided`) to fit their workflow persona.

## Proposed Workflow Change

- Introduce `mode` in `.agents/config.json` with supported values: `vibe`, `standard`, `strict`, `guided` (default: `standard`).
- In `vibe` mode: `workflow:check` relaxes mandatory task/PRD synchronization for product code changes, while still running tests and build checks.
- In `strict` mode: enforce strict token budgets and require rollback/threat sections in tasks.
- In `guided` mode: provide friendly remediation tips and `/kb:` command suggestions upon check failure.
- Provide CLI command `agent-workflow mode [mode]` and agent command `/kb:mode` to inspect and switch modes dynamically.
- Update agent skill instructions to adapt behavioral ceremony according to the active mode.

## Expected Benefit

- Solo vibe coders can build and iterate with zero task/PRD ceremony without breaking repository health checks.
- Teams and enterprise users retain full Scrum tracking and compliance guarantees.
- Learners receive helpful scaffolding and guidance.
- One unified toolchain scales smoothly across all 5 user archetypes.

## Scope and Exceptions

- Applies to repositories governed by Agent Workflow Scrum.
- In all modes, code correctness (tests and build) remains non-negotiable.
- In `vibe` mode, broken markdown links in existing documentation still fail checks.

## Tradeoffs and Risks

- In `vibe` mode, product changes lack durable PRD/task tracking; switching back to `standard` later will require establishing a baseline.
- Added configuration and branching in the workflow checker.

## Validation

- Automated tests verifying mode parsing, validation, and checker execution under each mode.
- Fixture test proving product edits pass in `vibe` mode and fail in `standard` mode without task metadata.
- End-to-end CLI mode switching test.

## Human Decision

- **Decision:** applied
- **Decided by:** Human user
- **Date:** 2026-09-04
- **Rationale:** Approved via implementation plan to enable multi-persona adoption from solo vibe coding to enterprise delivery.

## Application Evidence

- Changed canonical files: `packages/agent-workflow-scrum/engine/workflow-config.mjs`, `packages/agent-workflow-scrum/engine/workflow-check-core.mjs`, `packages/agent-workflow-scrum/engine/mode-core.mjs`, `packages/agent-workflow-scrum/engine/mode.mjs`, `packages/agent-workflow-scrum/src/cli.mjs`, `packages/agent-workflow-scrum/src/run-engine.mjs`, `.agents/skills/agent-workflow-scrum/SKILL.md`, `.agents/skills/agent-workflow-scrum/references/commands.md`
- Verification results: All unit and end-to-end tests pass in `tests/workflow-config.test.mjs` and `tests/workflow-tools.test.mjs`; verified CLI mode switching (`npm run workflow:mode`), fast path style bypass, and vibe mode relaxed checks.
