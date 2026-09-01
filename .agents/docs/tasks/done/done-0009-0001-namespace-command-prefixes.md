# Task 0009: Namespace Agent Workflow Commands

> **Status:** done
> **Scrum Artifact:** completed increment
> **Created:** 2026-09-01
> **Completed:** 2026-09-01

## 1. Goal

Prevent the project command-style router from claiming generic prefixes that
may belong to the host IDE or another agent.

## 2. Change Contract

- **Human outcome:** Users can invoke workflow commands with an unambiguous
  `/kb:<command>` namespace.
- **Acceptance evidence:** The skill documents `/kb:<command>` commands, leaves bare
  commands unclaimed, and validates successfully.
- **Non-goals:** Do not add native composer commands, remove host commands,
  change product behavior, or authorize external actions.
- **Affected layers and owners:** Project skill and task documentation; human
  owns host-level command policy.
- **Risk level and required approvals:** Fast, local skill-routing change; no
  production or external-system action.
- **Baseline:** The skill claims bare `/plan`, `/todo`, and other generic
  prefixes.
- **Verification plan:** Validate the skill, check command namespace coverage,
  run `git diff --check`, and review the task/skill diff.
- **Rollback or recovery:** Revert the skill and task files only.

## 3. Acceptance Criteria

- [x] Every primary command uses `/kb:<command>`.
- [x] Bare generic prefixes are explicitly left to the host or another agent.
- [x] The help and default invocation examples use the namespaced form.
- [x] No product code, PRD, or canonical workflow file changes.
- [x] Skill validation and diff hygiene checks pass.

## 4. Verification Plan

- `quick_validate.py .agents/skills/agent-workflow-scrum`
- `git diff --check`
- Inspect all command rows and safety aliases for the namespace.

## 5. Verification Evidence

```text
✔ Skill validator: Skill is valid!
✔ Git diff check: passed
✔ Command rows: 22 primary commands use the /kb: namespace
✔ Collision boundary: bare /plan, /todo, and other generic forms remain unclaimed
✔ No product, PRD, or canonical workflow files changed
```
