# Plan 0003: ND Workflow Plugin Protocol

> **Status:** in-progress
> **Created:** 2026-09-06
> **PRD:** `.agents/docs/prd/0007-nd-workflow-plugin.md`

## Change Contract

- Human outcome: an ND host can consume an Agent Workflow Scrum repository as an external workflow plugin (detect, read-only board snapshot, bounded context) without this package knowing anything about ND's company domain.
- Acceptance: `agent-workflow nd <detect|snapshot|context>` returns the documented JSON contract with exit code `0` for supported and unsupported repositories; diagnostics cover the known real-world quirks (legacy archived filenames, draft/missing PRD records, duplicate/unnumbered tasks, conflict markers); context envelopes never drop identity, capability limits, or diagnostics and escape template delimiters.
- Non-goals: any repository mutation, executing project commands or configured checks, ND host implementation, transition actions (start/block/accept), marketplace or remote publishing.
- Ownership: `packages/agent-workflow-scrum/engine/nd-plugin*.mjs` own parsing and protocol; `packages/agent-workflow-scrum/plugin/nd/` owns the manifest and host-facing contract docs; `src/cli.mjs` and `src/run-engine.mjs` own command routing.
- Risk: low — additive read-only surface; existing commands untouched. Filename-number heuristics are documented and diagnostic-backed rather than silent.
- Baseline: the adopted `awesome-dev` checkout exhibits archived `wip-*` records under `done/`, a draft PRD absent from the index, and evidence/human-acceptance records; the protocol must report those facts, not normalize them away.
- Verification: new `tests/nd-plugin.test.mjs` contract suite; read-only `nd snapshot`/`nd context` runs against the real adopted checkout; `npm test`, `npm run build`, `npm run workflow:check`, `npm run docs:check`.
- Rollback: remove `engine/nd-plugin*.mjs`, `plugin/nd/`, the `nd` routing entries, and this increment's docs; no shared state is modified.

## Design

1. **Read-only reporter.** The plugin never writes to the target repository and never executes project commands. Completion and human acceptance are source-reported facts; the host decides what they mean.
2. **Task identity.** Numbers come from filenames with two supported shapes (`<lifecycle>-<ordinal>-<number>-<slug>` and the early `<lifecycle>-<number>-<slug>`); an ordinal is recognized only when the two segments after the prefix are both numeric, so slugs containing digits cannot hijack the number. Canonical keys strip leading zeros.
3. **Diagnostics over normalization.** Ambiguity (duplicate numbers, multiple active increments, unnumbered records, unrecognized filenames, oversized files, scan limits) surfaces as typed diagnostics; the scan still reports what it could parse. Merge-conflict markers are errors but never abort the scan.
4. **Bounded context.** Sections are dropped lowest-value first (task scope, board summary, outcome excerpt). Plugin identity, capability limits, and diagnostics are never dropped; `{{` sequences are escaped so host template engines cannot interpret envelope data.
5. **Host boundary.** `plugin/nd/nd-plugin.json` declares contributions (`workflow`, `context`, `command`), requested permissions, CLI transport requirements (fixed argv, `shell: false`, timeout, output cap, no install), and supported upstream config schemas. The manifest is the contract ND validates; this package stays ND-agnostic beyond the protocol label.

## Implementation

1. `engine/nd-plugin-core.mjs`: config loading, filename/number parsing, task/PRD record parsing, git facts, snapshot assembly, envelope rendering.
2. `engine/nd-plugin.mjs`: CLI entry (arg contract, `--json`, human summaries, exit codes).
3. Route `nd` through `src/cli.mjs` and `src/run-engine.mjs`; extend CLI help.
4. `plugin/nd/nd-plugin.json` + `plugin/nd/README.md`: manifest, method mapping, result shapes, diagnostic codes, guarantees.
5. `tests/nd-plugin.test.mjs`: contract tests with a realistic fixture mirroring the adopted checkout's quirks.

## Evidence

- `node --test tests/nd-plugin.test.mjs`: 13/13 passed (contract, diagnostics, git facts, budget floor, delimiter escaping, CLI argument enforcement).
- `node packages/agent-workflow-scrum/bin/agent-workflow.mjs nd snapshot --root <awesome-dev> --json`: reports Dark Mode in-progress (6/6 criteria checked, no acceptance record, draft PRD missing from index) and two source-reported completed legacy archives; read-only, clean checkout.
- Full-suite and check results recorded in the task's evidence ledger.
