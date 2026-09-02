# Task 0023: Add a Full Required Setup Command

> **Status:** done
> **Scrum Artifact:** verified increment
> **Created:** 2026-09-02
> **Completed:** 2026-09-02
> **PRD:** No product PRD change required; developer setup guidance only.

## Outcome

New developers now have a discoverable `/kb:full-setup` route for verifying Node.js, npm, and Git, installing locked project dependencies, and running required repository checks without installing optional context providers or integrations.

## Change Contract

- **Human outcome:** a new developer can complete the required repository setup without guessing what is optional.
- **Acceptance evidence:** `/kb:full-setup` is discoverable and routes to prerequisite checks, locked dependency installation, required validation, and explicit optional exclusions.
- **Non-goals:** do not install Node.js/Git automatically, install Graphify/OpenViking, configure remote services, deploy, or change product behavior.
- **Affected layers:** canonical workflow skill, command reference, README/development onboarding, documentation tests.
- **Risk:** low; documentation and routing only.
- **Recovery:** revert the setup command and onboarding documentation; no runtime state is changed.

## Acceptance Criteria

- [x] The canonical skill lists `/kb:full-setup`.
- [x] The command explains required prerequisites, `npm ci`, validation checks, and optional exclusions.
- [x] README and development guidance point new developers to the command.
- [x] The command contract has a regression test.
- [x] Documentation, workflow, skill, test, and build checks pass.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Command routing | `.agents/skills/agent-workflow-scrum/SKILL.md` and `references/commands.md` list `/kb:full-setup` | Passed |
| Required setup is documented | `.agents/docs/development.md` and `README.md` cover prerequisites, `npm ci`, required checks, and optional exclusions | Passed |
| Command contract regression | `node --test tests/full-setup-command.test.mjs` | Passed |
| Workflow consistency | `npm run workflow:check -- --strict-budget` | Passed |
| Documentation checks | `npm run docs:check` | Passed; Scrum skill headroom warning remains at 861/900 tokens |
| Skill source audit | Git Bash `bash .agents/scripts/skill.sh check` | Passed |
| Full automated suite | `npm test`: 42 passed, 0 failed | Passed |
| Production artifact | `npm run build`: Vite 8.2.2 build passed | Passed |
| Explicit outgoing scope and plan | `npm run change:scope -- --base origin/main` and `npm run verify:plan -- --base origin/main` | Passed |

## Handoff

- **Use:** invoke `/kb:full-setup` in an agent session; the terminal equivalent is documented in `.agents/docs/development.md`.
- **Required:** Node.js `^20.19.0 || >=22.12.0`, npm, Git, locked dependency installation, and repository validation.
- **Excluded:** Graphify, OpenViking, remote services, and generated Claude/Cursor adapters remain optional.
- **Platform note:** on Windows, the skill audit requires Git Bash. The native `bash` command mapped to unavailable WSL in this environment, but the installed Git Bash executable passed the audit.
