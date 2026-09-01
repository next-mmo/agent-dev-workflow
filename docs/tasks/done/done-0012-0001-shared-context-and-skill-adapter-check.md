# Task 0012: Add Shared Context and Skill Adapter Check

> **Status:** done
>
> **Scrum Artifact:** completed increment
>
> **Created:** 2026-09-01
>
> **Completed:** 2026-09-01

## 1. Goal

Give Codex, ChatGPT, Claude, and Cursor a shared repository memory contract and
make generated skill adapters auditable without making agent-local memory
authoritative.

## 2. Change Contract

- **Human outcome:** An agent starting in a new session or a different supported
  tool can discover the same project context, workflow authority, task state,
  and verification expectations.
- **Acceptance evidence:** `CONTEXT.md` is linked from `AGENTS.md`; README and
  workflow documentation explain the memory bridge; `scripts/skill.sh check`
  validates canonical skill frontmatter and detects generated Claude/Cursor
  adapter drift or missing requested adapters.
- **Non-goals:** Do not add a database or remote memory service, make personal
  agent memory cross-tool, change product behavior, install external plugins,
  or make generated adapters tracked canonical sources.
- **Affected layers and owners:** Repository instructions, onboarding docs,
  skill initialization script, and task evidence; humans own workflow policy
  and external agent configuration.
- **Risk level and required approvals:** Standard documentation/tooling change;
  no production or external-system write. Human approval remains required for
  future canonical workflow policy changes.
- **Baseline:** `.agents/skills/` is canonical; `scripts/skill.sh init` creates
  ignored adapters but had no drift audit; the repository had no shared
  `CONTEXT.md` memory contract.
- **Verification plan:** Run Bash syntax validation, canonical and strict
  adapter checks, skill validation, npm tests, production build, Markdown
  hygiene, and Git diff checks.
- **Rollback or recovery:** Revert the tracked `CONTEXT.md`, `AGENTS.md`,
  README, script, and task changes. Generated adapters are ignored and can be
  regenerated from `.agents/skills/`.

## 3. Acceptance Criteria

- [x] `CONTEXT.md` defines shared terms, authority, startup/completion memory,
  target surfaces, recovery, and security boundaries.
- [x] `AGENTS.md` directs agents to the shared context and distinguishes
  tracked memory from private or temporary agent memory.
- [x] README explains the cross-agent memory model and `check` usage.
- [x] `scripts/skill.sh check` validates canonical skill frontmatter.
- [x] Strict Claude and Cursor checks detect missing, stale, or changed
  generated adapters.
- [x] Existing app behavior and build remain passing.

## 4. Verification Evidence

- `bash -n scripts/skill.sh`: passed.
- `bash scripts/skill.sh check`: canonical source and present adapters passed.
- `bash scripts/skill.sh init all`: Codex/ChatGPT source validation and Claude
  and Cursor adapter generation passed.
- `bash scripts/skill.sh check all`: strict Claude and Cursor drift audit passed.
- The strict audit caught expected Claude/Cursor drift after the canonical skill
  documentation changed; rerunning `init all` repaired the adapters and the
  subsequent audit passed.
- Skill validator: `Skill is valid!`.
- `npm test`: 9 passed, 0 failed.
- `npm run build`: Vite production build passed.
- Markdown trailing-whitespace scan for changed files: passed.
- `git diff --check`: passed.

## Handoff

- **Outcome:** Codex, ChatGPT, Claude, and Cursor now have a documented shared
  memory contract, and generated skill adapters can be checked for drift.
- **Skipped:** No UI acceptance round was needed; this task changes workflow
  documentation and tooling only.
- **Residual risk:** Cursor/Claude generated adapters remain ignored and must be
  initialized per workspace after clone. Native UI recognition still requires
  testing in each host product.
- **Human decision:** Future changes to canonical workflow policy still require
  explicit human approval.
