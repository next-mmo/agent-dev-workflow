# Task 0022: Relocate Workflow Documentation Under `.agents/docs`

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **Created:** 2026-09-02  
> **Completed:** 2026-09-02

## Outcome

Agent Workflow Scrum now uses `.agents/` as its reusable namespace: `.agents/skills/` owns executable agent guidance and `.agents/docs/` owns durable workflow documentation/artifacts. Legacy workflow paths under root `docs/` are removed and mechanically rejected without taking ownership of unrelated application documentation.

## Acceptance Criteria

- [x] Workflow-owned root `docs/` paths are removed and prior content exists under `.agents/docs/`.
- [x] Root README/instructions/shared context declare `.agents/docs/` canonical for workflow artifacts.
- [x] Context routing reads PRDs/tasks from `.agents/docs/` and exposes `docsRoot` in schema v5.
- [x] Change-scope and verification planning classify `.agents/docs/` changes correctly.
- [x] Workflow/doc checks and report generation read `.agents/docs/`.
- [x] Canonical skill/document links use the relocated paths.
- [x] Core regression fixtures work without a root workflow `docs/` tree.
- [x] Documentation governance rejects legacy workflow paths while allowing unrelated application docs.
- [x] Newer `main` Counter History and context changed-path work is preserved without task-ID collisions.
- [x] Fresh tests, build, workflow/docs checks, and skill audit pass.

## Reconciliation Notes

Current `main` advanced during this work. The feature branch explicitly preserved the newer Counter History product implementation/tests and the context changed-path parser fix. Durable records were reconciled as:

- task 0019 — scope-aware verification;
- task 0020 — context changed-path parser;
- task 0021 — Counter History (renumbered from the conflicting 0019 record only; behavior/evidence preserved);
- task 0022 — `.agents/docs/` relocation.

The changed-path regression was strengthened to modify already-tracked files, proving the leading-space `git status --short` case rather than only untracked `??` paths.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Namespace and links | `.agents/docs/` tree + `npm run docs:check` | Passed |
| Context routing and provider behavior | full Node test suite | Passed |
| Tracked changed-path parser | deterministic tracked-file regression | Passed |
| Legacy workflow path rejection | negative control rejects `docs/tasks/`; application `docs/product-guide.md` remains allowed | Passed |
| Product preservation | Counter History source/UI/state tests from latest `main` included | Passed |
| Full regression | GitHub Actions run `33545458510` | 39/39 passed, 0 failed/skipped |
| Production build | Vite 8.2.2 production build in run `33545458510` | Passed |
| Strict workflow budgets | `AGENTS` ~605/800, `CONTEXT` ~1387/1400 before final compaction, Scrum skill ~855/900 | Passed |
| Documentation checks | budgets, relative links, `.agents/docs` namespace | Passed; pre-compaction run warned only that CONTEXT had <5% headroom |
| Skill audit | `bash scripts/skill.sh check` | Passed |

After that green run, `CONTEXT.md` was compacted to restore budget headroom without changing its authority/startup/security contracts. The final lifecycle-only CI run validates that compacted context and this closed task state.
