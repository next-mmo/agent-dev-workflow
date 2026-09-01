# Task 0014: Generate a Local HTML Workflow Report

> **Status:** done
>
> **Scrum Artifact:** completed increment
>
> **Created:** 2026-09-01
>
> **Completed:** 2026-09-01

## 1. Goal

Give a human or developer one local report they can open in a browser to
understand the current Agent Workflow Scrum state without asking an agent to
summarize it from memory.

## 2. Change Contract

- **Human outcome:** Running one script produces a readable HTML report and a
  machine-readable JSON snapshot under `report/`.
- **Acceptance evidence:** The script creates both report files, includes Git,
  task, and PRD summaries, escapes document text safely, and leaves generated
  output ignored by Git.
- **Non-goals:** Do not deploy or publish the report, replace canonical task or
  PRD documents, collect secrets, or add a runtime dependency.
- **Affected layers and owners:** Node report script, npm command, workflow
  skill command, README, Git ignore rules, and task evidence; humans own any
  decision to publish or share the report.
- **Risk level and required approvals:** Standard low-risk local tooling; no
  production or external-system action.
- **Baseline:** No report generator or ignored `report/` output exists.
- **Verification plan:** Run the report generator, validate the JSON and
  expected HTML sections, verify Git ignores the output, run application tests
  and build, regenerate/check skill adapters, and review the final diff.
- **Rollback or recovery:** Remove the report script, npm entry, documentation,
  task record, and ignore rule; generated output is disposable and ignored.

## 3. Acceptance Criteria

- [x] `node scripts/report.mjs` creates `report/index.html`.
- [x] The same command creates `report/report.json`.
- [x] The HTML report summarizes Git state, active/completed tasks, PRDs, and
  source documents with links that work from the generated report directory.
- [x] Report text is HTML-escaped and the report uses only embedded CSS and
  local links.
- [x] `report/` is ignored and remains absent from the tracked diff.
- [x] The report workflow is documented and available through `/kb:report`.
- [x] Existing application tests, build, skill validation, adapter generation,
  and adapter checks pass.

## 4. Verification Evidence

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| HTML and JSON files are generated | `npm run report` generated `report/index.html` and `report/report.json` | Passed |
| Report contents are usable | Node validation parsed JSON and found the report title, active/completed task sections, PRD index, and shared workflow sources in HTML | Passed |
| Report output is not tracked | `git check-ignore -q report/index.html` and `git check-ignore -q report/report.json` both returned 0 | Passed |
| Report is safe and local | The generator uses HTML escaping, embedded CSS, and controlled relative links; no external assets or secret sources are read | Passed |
| Workflow command is available to agents | Git Bash `scripts/skill.sh init all` regenerated Claude and Cursor adapters; `scripts/skill.sh check all` passed and included `/kb:report` | Passed |
| Canonical skill is valid | `python C:/Users/MT-Staff/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/agent-workflow-scrum` returned `Skill is valid!` | Passed |
| Existing application behavior remains healthy | `npm test`: 10 passed, 0 failed; `npm run build`: Vite production build passed | Passed |
| Final diff has no whitespace errors | `git diff --check` passed | Passed |

## 5. Handoff

- **Outcome:** Humans and developers can run `npm run report` and open a
  standalone local HTML snapshot, while automation can consume the matching
  JSON file. `/kb:report` documents the same workflow entry point.
- **Changed files:** `scripts/report.mjs`, `package.json`, `.gitignore`,
  `README.md`, `docs/development.md`, `docs/agent-workflow.md`, the canonical
  workflow skill, generated ignored adapters, and this completed task record.
- **Skipped:** No deployment, hosting, authentication, external-system write,
  or cross-browser screen-reader round applies to this local static report.
- **Residual risk:** The report is a point-in-time convenience view and does
  not run tests or replace tracked evidence; regenerate it after meaningful
  repository changes.
- **Human decision:** Human still owns whether to publish, host, or share a
  generated report outside the local workspace.
