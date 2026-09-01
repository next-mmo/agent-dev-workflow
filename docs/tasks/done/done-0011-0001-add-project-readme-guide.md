# Task 0011: Add Project README Guide

> **Status:** done
> **Scrum Artifact:** completed increment
> **Created:** 2026-09-01
> **Completed:** 2026-09-01

## 1. Goal

Give humans and developers a step-by-step guide for using this repository as a
Counter starter, migrating the workflow into an existing project, or starting a
new frontend or full-stack project while keeping `.agents/skills` canonical.

## 2. Change Contract

- **Human outcome:** A reader can choose a starter, migration, or new-project
  path and initialize supported agent targets without rediscovering the workflow.
- **Acceptance evidence:** Root `README.md` documents prerequisites, Counter
  usage, skip/replace options, migration, new React/Vite and full-stack paths,
  skill creation, target initialization, testing, and handoff rules.
- **Non-goals:** Do not change product behavior, add framework dependencies,
  publish external agents, or claim that a local copy automatically installs a
  skill into a third-party product.
- **Affected layers and owners:** Project documentation and onboarding; humans
  own framework selection, product requirements, and external installation.
- **Risk level and required approvals:** Fast documentation change; no PRD or
  production impact.
- **Baseline:** The repository has development/workflow docs but no root README.
- **Verification plan:** Validate referenced local paths, inspect commands
  against package/script definitions, run Markdown hygiene and existing checks.
- **Rollback or recovery:** Remove the new README and task record.

## 3. Acceptance Criteria

- [x] Root README explains the default Counter starter.
- [x] Root README provides skip, existing-project migration, and new-project
  paths.
- [x] Root README covers React/Vite and generic full-stack targets.
- [x] Root README explains `.agents/skills` and `scripts/skill.sh` target init.
- [x] Root README lists workflow commands, validation, testing, and release
  boundaries.
- [x] Links, commands, and Markdown hygiene checks pass.

## 4. Verification Evidence

```text
✔ Root README created with 578 lines of onboarding, migration, skill, target,
  workflow, verification, troubleshooting, and release guidance
✔ Local paths referenced by README exist
✔ README commands match package.json, docs/development.md, and scripts/skill.sh
✔ React/Vite bootstrap uses npm create vite@latest with the react-ts template
✔ Generated-adapter .gitignore merge instructions included for migrations
✔ README whitespace scan: passed; task metadata preserves the repository's
  existing two-space line-break convention
✔ Skill validator: Skill is valid!
✔ Automated tests: 9 passed, 0 failed
✔ Production build: Vite build passed
✔ Target initialization: scripts/skill.sh init all passed
✔ Git diff check: passed
```
