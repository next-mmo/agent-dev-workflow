# Task 0008: Add Command-Style Routing to the Agent Skill

> **Status:** done
> **Scrum Artifact:** completed increment
> **Created:** 2026-09-01
> **Completed:** 2026-09-01

## 1. Goal

Give agents a consistent set of command-style prefixes for common workflow
modes while preserving the host client's native commands and approval rules.

## 2. Change Contract

- **Human outcome:** Users can ask the reusable project skill to plan, track,
  implement, verify, review, and hand off work with short command prefixes.
- **Acceptance evidence:** The skill documents each prefix, its scope, safety
  boundary, and expected output; the skill validator passes.
- **Non-goals:** Do not create native Codex composer commands, alter product
  behavior, accept Suggestion 0001, or authorize external actions.
- **Affected layers and owners:** Project skill and task documentation; human
  owns future policy decisions.
- **Risk level and required approvals:** Standard documentation/agent behavior;
  human approval remains required for destructive, external, or canonical policy
  changes.
- **Baseline:** `.agents/skills/agent-workflow-scrum/SKILL.md` has no command
  router; the repository has existing uncommitted feature changes.
- **Verification plan:** Run `quick_validate.py`, inspect command coverage and
  safety boundaries, run `git diff --check`, and verify no product files change.
- **Rollback or recovery:** Revert the skill and task files only; no runtime or
  external state is changed.

## 3. Acceptance Criteria

- [x] The skill explains that routing is project-level convention, not native UI.
- [x] Planning, delivery, verification, review, release, and handoff modes are
  covered by named prefixes.
- [x] Task states, PRD sync, suggestions, and Git actions have clear boundaries.
- [x] Safety-sensitive commands require explicit approval and do not imply it.
- [x] Skill validation and diff hygiene checks pass.

## 4. Documentation Impact

- **PRD impact:** None; this changes agent routing, not product behavior.
- **Canonical workflow impact:** None; `AGENTS.md`, `docs/agent-workflow.md`,
  and Suggestion 0001 remain unchanged and human-controlled.
- **New reusable asset:** `.agents/skills/agent-workflow-scrum/SKILL.md` with
  project-level command-style routing.

## 5. Verification Plan

- `quick_validate.py .agents/skills/agent-workflow-scrum`
- `git diff --check`
- Review the final skill as a user issuing each command prefix.

## 6. Verification Evidence

```text
✔ Skill validator: Skill is valid!
✔ Git diff check: passed
✔ Command coverage: 22 primary workflow prefixes plus 5 guarded aliases
✔ Safety boundaries: /commit, /push, /rollback, /release, and destructive-looking aliases addressed
✔ This task changed only skill/task files; pre-existing product changes were preserved
```
