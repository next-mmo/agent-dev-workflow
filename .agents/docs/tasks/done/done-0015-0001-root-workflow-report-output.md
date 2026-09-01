# Task 0015: Keep Workflow Report Output at Repository Root

> **Status:** done
>
> **Scrum Artifact:** completed increment
>
> **Created:** 2026-09-01
>
> **Completed:** 2026-09-01

## 1. Goal

Keep generated workflow reports outside the tracked documentation tree so
`docs/` remains reserved for canonical project documentation.

## 2. Change Contract

- **Human outcome:** Running `npm run report` writes the HTML and JSON report
  under the repository-root `report/` directory.
- **Acceptance evidence:** The generator, instructions, workflow skill, and
  ignore rule consistently use `report/`; the old `docs/report/` artifacts are
  removed; the generated report remains local and ignored.
- **Non-goals:** Do not change report content, publish the report, or alter
  product behavior and PRDs.
- **Affected layers and owners:** Report script, ignore rules, workflow and
  development documentation, generated adapters, and task evidence; humans
  own any decision to publish or share the report.
- **Risk level and required approvals:** Fast, low-risk local tooling change;
  no production or external-system action.
- **Baseline:** Report output targeted `docs/report/`.
- **Verification plan:** Search for stale references, regenerate the report,
  validate HTML/JSON and root-relative links, verify root output is ignored and
  old output is absent, run the relevant checks, and review the final diff.
- **Rollback or recovery:** Restore the report directory constant, docs, ignore
  rule, and generated adapters; the generated report files are disposable.

## 3. Acceptance Criteria

- [x] `npm run report` creates `report/index.html` and `report/report.json`.
- [x] `report/` is ignored by Git and `docs/report/` is no longer generated.
- [x] Tracked docs and `/kb:report` describe the root `report/` location.
- [x] No stale `docs/report` references remain in current workflow guidance.
- [x] Existing tests, build, skill validation, and adapter checks pass.

## 4. Verification Evidence

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Root HTML and JSON are generated | `npm run report` generated `report/index.html` and `report/report.json` | Passed |
| Root report is usable | Node validation parsed JSON, found all required HTML sections, and confirmed links use `../AGENTS.md` and `../docs/...` from the root report directory | Passed |
| Root output is not tracked | `git check-ignore -q report/index.html` and `git check-ignore -q report/report.json` both returned 0 | Passed |
| Old output is removed | Exact generated `docs/report/index.html` and `docs/report/report.json` files were removed; `docs/report` is absent | Passed |
| Guidance is synchronized | `rg` found no `docs/report` references in `.agents`, README, workflow/development docs, scripts, package metadata, or `.gitignore` | Passed |
| Native adapters are synchronized | Git Bash `scripts/skill.sh init all` regenerated Claude and Cursor adapters; `scripts/skill.sh check all` passed | Passed |
| Canonical skill is valid | `python C:/Users/MT-Staff/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/agent-workflow-scrum` returned `Skill is valid!` | Passed |
| Existing application behavior remains healthy | `npm test`: 10 passed, 0 failed; `npm run build`: Vite production build passed | Passed |
| Final hygiene is clean | `node --check scripts/report.mjs` and `git diff --check` passed | Passed |

## 5. Handoff

- **Outcome:** `npm run report` now creates the local HTML/JSON snapshot in
  root `report/`, outside `docs/`; the generated output remains ignored.
- **Changed files:** `scripts/report.mjs`, `.gitignore`, workflow and
  development documentation, README, the canonical workflow skill, generated
  ignored adapters, and this completed task record.
- **Skipped:** No deployment, hosting, authentication, external-system write,
  or product PRD update applies to this output-location correction.
- **Residual risk:** The report is a point-in-time convenience view and does
  not run tests or replace tracked evidence; regenerate it after meaningful
  repository changes.
- **Human decision:** Human still owns whether to publish, host, or share a
  generated report outside the local workspace.
