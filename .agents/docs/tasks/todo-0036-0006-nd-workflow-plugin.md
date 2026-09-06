# Task 0006: ND Workflow Plugin

> State: todo
> Created: 2026-09-06
> **PRD:** `.agents/docs/prd/0007-nd-workflow-plugin.md`

## Outcome

Expose Agent Workflow Scrum repositories as read-only external workflow plugins for the ND host through `agent-workflow nd <detect|snapshot|context>`.

## Scope

- Add `engine/nd-plugin-core.mjs` (parsing, snapshot, envelope) and `engine/nd-plugin.mjs` (CLI contract).
- Route the `nd` command through `src/cli.mjs` and `src/run-engine.mjs`.
- Add `plugin/nd/nd-plugin.json` manifest and `plugin/nd/README.md` protocol documentation.
- Add `tests/nd-plugin.test.mjs` contract tests mirroring real adopted-repository quirks.
- Register the increment in the PRD index.

## Acceptance Criteria

- [x] `detect`/`snapshot`/`context` return the documented JSON contract with honest diagnostics.
- [x] Real-world quirks (legacy archived filenames, draft/missing PRDs, duplicate/unnumbered tasks, conflict markers) surface as diagnostics, never silent normalization.
- [x] Context envelopes keep identity, capability limits, and diagnostics under any budget and escape `{{`.
- [x] Contract tests pass (13/13) and the real adopted checkout reads back read-only with expected cards and warnings.
- [x] Full battery: `npm run workflow:check` passed; `npm run docs:check` passed (pre-existing headroom warnings only); `npm run build` passed; `npm run distribution:check` passed; `npm test` 126/127 — the one failure (`package-distribution.test.mjs` git-dependency install) is an offline npm cache miss (`ENOTCACHED` vite tarball) unrelated to this increment.
- [ ] Human acceptance of the protocol surface for external hosts.

## Evidence

- `node --test tests/nd-plugin.test.mjs`: 13/13 passed.
- `node packages/agent-workflow-scrum/bin/agent-workflow.mjs nd snapshot --root <awesome-dev> --json`: Dark Mode in-progress (6/6 criteria checked, no acceptance record, draft PRD missing from index), two source-reported completed legacy archives; clean checkout, read-only.
- `node packages/agent-workflow-scrum/bin/agent-workflow.mjs nd context --root <awesome-dev> --json`: ~468/1500 tokens, identity/limits/diagnostics/board/active task present.
- `npm run workflow:check -- --mode standard`: workflow consistency passed.
- `npm run docs:check`: passed; four pre-existing sub-5%-headroom warnings on unchanged files.
- `npm run build`: vite build passed; `npm run distribution:check`: package plugin skills and licenses match canonical sources.
- `npm test`: 126/127 passed; sole failure is the offline-cache `ENOTCACHED` vite fetch inside the git-dependency packaging test, unrelated to the `nd` surface.
