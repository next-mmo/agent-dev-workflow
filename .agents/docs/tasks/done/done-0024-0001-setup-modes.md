# Task 0024: Separate Required and Full Setup Modes

> **Status:** done
> **Scrum Artifact:** verified increment
> **Created:** 2026-09-02
> **Completed:** 2026-09-02
> **PRD:** No product PRD change required; developer setup guidance only.

## Outcome

Setup now has two explicit modes: `/kb:setup` installs and validates the required baseline, while `/kb:full-setup` completes all supported repository-local setup, including generated Claude and Cursor adapters. Graphify, OpenViking, and remote services remain explicit opt-in integrations.

## Change Contract

- **Human outcome:** developers can choose a minimal required setup or a complete local setup without confusing optional external providers with repository prerequisites.
- **Acceptance evidence:** both commands are discoverable, have distinct contracts, and document that external providers remain opt-in.
- **Non-goals:** do not install external provider services, configure credentials, contact remote systems, deploy, or change product behavior.
- **Affected layers:** canonical workflow skill, command reference, README/development onboarding, setup regression test.
- **Risk:** low; documentation and local adapter initialization guidance only.
- **Recovery:** revert the setup-mode documentation and command-contract test; generated adapter directories are ignored local artifacts.

## Acceptance Criteria

- [x] The canonical skill lists `/kb:setup` and `/kb:full-setup`.
- [x] `/kb:setup` means required prerequisites, locked dependencies, and required checks only.
- [x] `/kb:full-setup` includes all supported repository-local adapter setup and validation.
- [x] External Graphify/OpenViking setup remains explicitly optional.
- [x] README, development guidance, and regression tests describe both modes.
- [x] All relevant checks pass.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Command routing | `.agents/skills/agent-workflow-scrum/SKILL.md` and `references/commands.md` list both setup modes | Passed |
| Required baseline | `.agents/docs/development.md` documents prerequisites, `npm ci`, tests, build, workflow/docs checks, and the canonical skill audit | Passed |
| Full local setup | Git Bash `skill.sh init all` generated Claude/Cursor adapters; `skill.sh check all` passed | Passed |
| Command contract regression | `node --test tests/full-setup-command.test.mjs` | Passed |
| Workflow consistency | `npm run workflow:check -- --strict-budget` | Passed |
| Documentation checks | `npm run docs:check` | Passed; Scrum skill and development guide have low remaining budget headroom |
| Full automated suite | `npm test`: 42 passed, 0 failed | Passed |
| Production artifact | `npm run build`: Vite 8.2.2 build passed | Passed |
| Diff hygiene | `git diff --check` | Passed |

## Handoff

- `/kb:setup` is the required baseline.
- `/kb:full-setup` means all supported repository-local setup, including Claude/Cursor adapters.
- Graphify, OpenViking, remote services, and credentials remain outside both automatic setup modes and require explicit opt-in.
- On Windows, run adapter initialization and audit from Git Bash.
