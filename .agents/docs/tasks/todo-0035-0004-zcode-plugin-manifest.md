# Task 0035: ZCode Plugin Manifest

> Status: todo
> Created: 2026-09-06
> Related PRD: `.agents/docs/prd/0004-workflow-distribution.md`

## Change Contract

- Human outcome: ZCode recognizes the portable plugin bundle natively (skills and `workflow-status` command) when a consumer points the host at the installed package's `plugin/` directory.
- Authorization: explicit user request while wiring `awesome-dev`; proposal 0006 records the distribution decision.
- Scope: one additional package-owned manifest `.zcode-plugin/plugin.json`, distribution ownership test, plugin README, PRD 0004 requirement 6, and proposal 0006 decision entry.
- Non-goals: marketplace publication, consumer skill copies, changes to skill semantics, or accepting task 0031.
- Risk: none at runtime; a stale or malformed manifest would only affect host discovery, detected by fixture tests.
- Baseline: working copy contains accepted-but-uncommitted increments and the skills discovery command; prior suite 109/109.
- Verification: full `npm run local:check` (tests, build, strict workflow/docs checks, distribution drift check) plus tarball pack and consumer reinstall smoke.
- Recovery: delete `.zcode-plugin/plugin.json` and revert the doc/test edits from Git; no generated path is affected.

## Acceptance Criteria

- [x] `plugin/.zcode-plugin/plugin.json` declares skills and commands and matches the other host manifests' metadata.
- [x] The distribution build preserves the manifest as an owned file and drift check still passes.
- [x] Packed tarball installs into a consumer and `agent-workflow skills --json` reports the bundle.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Full local gate | `npm run local:check` (test, build, strict workflow/docs, distribution drift) | Passed; docs headroom warnings pre-existing |
| Regression suite | `node --test --test-reporter=tap tests/*.test.cjs tests/*.test.mjs` | 114/114 passed (owned-file fixture extended with `.zcode-plugin/plugin.json`) |
| Tarball ships manifest | `npm pack ./packages/agent-workflow-scrum --dry-run` | 76 files including `plugin/.zcode-plugin/plugin.json` (402B) |
| Consumer install smoke | Tarball copied to `awesome-dev`, `npm install --save-dev --save-exact --force`, then `npm exec -- agent-workflow skills --json` | `skillsAvailable: true`, both skills listed, `.zcode-plugin/plugin.json` present under consumer `node_modules` |

## Handoff

Implementation and verification complete; awaiting human acceptance and board promotion (working copy also carries prior uncommitted increments). ZCode plugin registration in the consumer host is a separate one-time user action via Settings → Plugin Management.
