# Task 0038: Unified Institutional Memory, Compounding Loop & Enterprise Safety Defenses

> Status: done
> Completed: 2026-09-07
> Created: 2026-09-07
> Related PRD: `.agents/docs/prd/0004-workflow-distribution.md`
> Proposal: `.agents/docs/proposals/0013-unified-memory-and-compounding-loop.md`

## Change Contract

- Human outcome: consolidate `.agents/docs/memory/` into `.agents/docs/solutions/`, add proactive module-based recall via `git status`, add `agent-workflow compound` CLI command, incorporate enterprise environment (.env), database, and filesystem destruction defenses into docs, templates, and static reviewer, add 3 engine-backed enterprise operational skills (`agent-workflow-security`, `agent-workflow-release`, `agent-workflow-incident`), and ensure cross-platform CRLF compatibility in `scripts/skill.sh`.
- Scope: `packages/agent-workflow-scrum/engine/context/providers/memory.mjs`, `context-core.mjs`, `cli.mjs`, `scaffold.mjs`, `report.mjs`, `review-core.mjs`, `workflow-check-core.mjs`, `.agents/skills/`, `scripts/skill.sh`, `scripts/build-distribution.mjs`, templates, docs, and tests.
- Risk: clean break retires `.agents/docs/memory/`; ensure all existing tests pass with `.agents/docs/solutions/` as the single store; non-breaking additions for enterprise safety patterns and skills.
- Verification: unit tests for proactive path scoring, CLI command verification, static review `.env`/destructive command tests, skill check (`bash scripts/skill.sh check all`), full local checks (`npm run local:check`).

## Acceptance Criteria

- [x] `packages/agent-workflow-scrum/engine/context/providers/memory.mjs` scans `.agents/docs/solutions/` exclusively and supports proactive scoring matching working-tree `changedPaths`.
- [x] `context-core.mjs` passes `worktreeChangedPaths` to `retrieveNativeMemory`.
- [x] `packages/agent-workflow-scrum/src/cli.mjs` supports `compound` command (aliased with `solve`).
- [x] Scaffold, templates, and check scripts remove `.agents/docs/memory/` references.
- [x] Old `.agents/docs/memory/` directory removed from root and example.
- [x] Enterprise security, environment (.env), and AI trust boundaries codified in `defensive-patterns.md` and templates.
- [x] Catastrophic filesystem deletions (`rm -rf /`, `rm -rf ~`) and destructive database drops (`DROP TABLE/DATABASE`, `TRUNCATE`) barred in `CONTEXT.md`, `defensive-patterns.md`, and flagged by `review-core.mjs`.
- [x] `scripts/skill.sh` robustly strips `\r` carriage returns from file content and frontmatter checks.
- [x] Canonical enterprise skills authored in `.agents/skills/`: `agent-workflow-security`, `agent-workflow-release`, `agent-workflow-incident`.
- [x] Target adapters generated and verified for Claude (`.claude/skills/`), Cursor (`.cursor/rules/`), and ND plugin (`packages/agent-workflow-scrum/plugin/skills/`).
- [x] All automated tests pass (`npm run local:check` & `npm test`).

## Evidence Ledger

| Claim | Verification | Result |
| :--- | :--- | :--- |
| Native memory unit tests | `node --test tests/context-providers.test.mjs` | 16/16 passed (including proactive module matching and solutions-only scanning) |
| Package distribution & doctor tests | `node --test tests/package-distribution.test.mjs` | 6/6 passed (scaffold, tarball install, thin init, doctor validation, all 5 skills distributed) |
| Static review security & safety tests | `node --test tests/readiness-tools.test.mjs` | 6/6 passed (.env file detection, catastrophic recursive deletion, and destructive SQL drop) |
| Canonical skill frontmatter & adapter check | `bash scripts/skill.sh check all` | Passed (canonical source passed, Claude and Cursor adapters synced) |
| Package distribution check | `npm run distribution:check` | Passed (plugin skills and licenses match canonical sources) |
| Full regression test suite | `npm test` | 129/129 passed |
| Production client build | `npm run build` (Vite) | Passed (`dist/` generated) |
| Workflow ceremony check | `npm run workflow:check -- --mode strict` | Passed |
| Documentation budget headroom | `npm run docs:check` | Passed within token budget |

## Recovery

Revert changes to `packages/agent-workflow-scrum` and restore `.agents/docs/memory/` from Git history (`git checkout HEAD -- .agents/docs/memory packages/agent-workflow-scrum`).
