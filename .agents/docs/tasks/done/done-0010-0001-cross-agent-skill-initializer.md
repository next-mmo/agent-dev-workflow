# Task 0010: Cross-Agent Skill Initializer

> **Status:** done
> **Scrum Artifact:** completed increment
> **Created:** 2026-09-01
> **Completed:** 2026-09-01

## 1. Goal

Provide one repeatable initializer for adapting the canonical `.agents/skills`
directory to supported agent environments without creating competing sources of
truth.

## 2. Change Contract

- **Human outcome:** A maintainer can run `scripts/skill.sh init` for ChatGPT,
  Codex, Claude, Cursor, or all supported targets after changing a skill.
- **Acceptance evidence:** The script validates the canonical source, supports
  each target, generates Claude and Cursor adapters, and leaves generated output
  ignored by Git.
- **Non-goals:** Do not overwrite tracked `AGENTS.md` or `CLAUDE.md`, add
  external plugins, publish skills, or claim platform-specific permissions.
- **Affected layers and owners:** Repository skill tooling, local adapter
  configuration, and task evidence; the human owns any installation or upload
  into external agent products.
- **Risk level and required approvals:** Standard local tooling change; no
  production or external-system write.
- **Baseline:** `.agents/skills/agent-workflow-scrum` is the only canonical skill
  source and no initializer exists.
- **Verification plan:** Run shell help/list/init flows, validate generated
  target files and Git ignore behavior, run the skill validator, and check the
  final diff for whitespace or unrelated changes.
- **Rollback or recovery:** Remove `scripts/skill.sh`, generated adapter ignore
  rules, and the skill documentation/task changes; generated adapters are
  disposable and ignored.

## 3. Acceptance Criteria

- [x] `scripts/skill.sh init` initializes all supported targets.
- [x] ChatGPT and Codex retain `.agents/skills` as the canonical source.
- [x] Claude receives skills under `.claude/skills/`.
- [x] Cursor receives generated MDC rules and portable native command files.
- [x] Generated adapter paths are ignored while `.agents/` remains trackable.
- [x] Tracked `AGENTS.md` and `CLAUDE.md` are preserved.
- [x] Validation and diff hygiene checks pass.

## 4. Verification Evidence

```text
✔ Shell syntax: bash -n scripts/skill.sh
✔ Help/list flows: scripts/skill.sh help and scripts/skill.sh list
✔ Full initialization: scripts/skill.sh init chatgpt codex claude cursor
✔ Default initialization: scripts/skill.sh init all
✔ Invalid target boundary: unsupported target exits with status 1
✔ ChatGPT/Codex: retain the canonical .agents/skills source; no adapter generated
✔ Claude: generated .claude/skills/agent-workflow-scrum adapter
✔ Cursor: generated .cursor/rules/*.generated.mdc and .cursor/commands/*.generated.md
✔ Git ignore: generated .claude/ and .cursor/paths are ignored
✔ Preservation: tracked AGENTS.md and CLAUDE.md remain unchanged
✔ Skill validator: Skill is valid!
✔ Automated tests: 9 passed, 0 failed
✔ Production build: Vite build passed
✔ Git diff check: passed
```
