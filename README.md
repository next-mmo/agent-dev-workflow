# Agent Workflow Scrum

Agent Workflow Scrum is a repository-first delivery workflow for humans and coding agents. It keeps scope, requirements, implementation, verification evidence, review, and human decisions connected while keeping default agent context small.

The Todo Workspace is the executable demo; Counter modules remain as regression examples. The workflow is intended to move into existing frontend, backend, desktop, or full-stack repositories.

## Core design

- `.agents/skills/` — canonical executable agent guidance.
- `packages/agent-workflow-scrum/` — canonical CLI, workflow engine, context providers, and initialization templates.
- `scripts/` — source-repository build, benchmark, and skill-adapter helpers.
- `.agents/docs/` — all workflow-owned long-form docs and durable artifacts: architecture, testing, PRDs, tasks, suggestions, development guidance, and evidence.
- `AGENTS.md` + `CONTEXT.md` — compact standing orders and shared authority/recovery contract.
- `npm run context` — bounded L0/L1/L2 context routing.
- `npm run change:scope` — exact committed + dirty outgoing scope from an explicitly verified base.
- `npm run verify:plan` — smallest known verification set for the exact scope.
- Optional Graphify code-graph retrieval and explicit OpenViking semantic recall under the same token budget.
- `npm run workflow:check` + `npm run docs:check` — mechanical lifecycle, link, and standing-context budget checks.

The repository deliberately has **no root `docs/` tree**. Agent Workflow Scrum documentation belongs under `.agents/docs/` so the workflow has one obvious namespace.

## Quick start

For an existing product, install the workflow as a [pinned GitHub dependency or tarball](packages/agent-workflow-scrum/README.md) and run `agent-workflow init --existing`. Registry publication is optional. Do not copy this repository's workflow `packages/`, `plugins/`, or source-specific instructions into the product. The commands below are for developing this source checkout and its demo.

```bash
git clone https://github.com/next-mmo/agent-dev-workflow.git
cd agent-dev-workflow
npm ci
npm test
npm run build
```

Run the demo:

```bash
npm run dev
```

For the full-stack developer trial:

```bash
npm run dev:full
```

Open the printed `http://127.0.0.1:5173/?storage=server` URL. Create, edit, complete, and remove tasks; use Refresh after another tab saves. The server workspace saves tasks in `.todo-data/tasks.json`. Filters/theme are tab-local. Browser workspace remains separate; switching modes does not migrate tasks.

For a built app, run `npm run build` then `npm start`. `PORT` changes the listening port; `TODO_DATA_FILE` selects an alternate data file. Run only one server process per data file. This unauthenticated demo binds loopback and is intended for local development. Stop the server before copying the JSON file for backup or restore; corrupt files fail startup rather than resetting tasks. A failed or uncertain save keeps form input: refresh to inspect saved tasks before retrying.

Run the complete local quality loop with:

```bash
npm run local:check
```

This runs tests, the production build, strict workflow checks, documentation checks, and generated-bundle drift checks without network access. `npm run trial:measure` records bounded context-size observations for the active developer trial. A context pack reports linked PRDs and why each selected document was included; linked PRDs from the active task are retained ahead of generic history.

For a new developer's required baseline, use `/kb:setup` in an agent session. Use `/kb:full-setup` for all supported repository-local setup, including generated Claude/Cursor adapters. Graphify, OpenViking, and remote services remain explicit opt-in integrations.

## Smart context

Start non-trivial work with a small routing pack instead of dumping the whole repository history into the model:

```bash
npm run context -- "add session timeout"
```

Escalate only when needed:

```bash
npm run context -- "add session timeout" --level 1
npm run context -- "review session timeout" --base origin/main --level 1
npm run context -- "deep recovery" --full --budget 5000
npm run context -- "api contract" --json
```

The default budget is about 1,500 heuristic tokens. Generated context is advisory. Human decisions, the active task, PRD requirements, current code, and fresh observed evidence remain distinct sources with explicit roles; see [CONTEXT.md](CONTEXT.md).

When `--base` is supplied, the router includes committed merge-base-to-head paths plus staged, unstaged, and untracked paths. Without `--base`, startup stays lightweight and uses current worktree signals only.

### Optional providers

```bash
# local + Graphify when a local graph already exists
npm run context -- "change auth middleware"

# force Graphify
npm run context -- "change auth middleware" --provider graphify --level 1

# explicit OpenViking recall
npm run context -- "why did we choose redis" --provider openviking

# compose all providers under one total budget
npm run context -- "change auth architecture" --provider all --level 1
```

`auto` may use an existing local Graphify snapshot but never sends scope text to OpenViking. OpenViking is read-only and explicit because its configured target may be remote. Provider failure, timeout, or absence degrades to local repository context.

Provider details: [`.agents/skills/agent-workflow-scrum/references/providers.md`](.agents/skills/agent-workflow-scrum/references/providers.md).

## Scope-aware verification

A clean worktree does not mean a feature branch has no outgoing changes. Before PR review, push verification, or final handoff, verify the live target branch/stack parent and pass it explicitly:

```bash
npm run change:scope -- --base origin/main
npm run verify:plan -- --base origin/main
```

`change:scope` never guesses or fetches a base. It reports resolved base/head/merge-base IDs and committed, staged, unstaged, and untracked paths separately.

`verify:plan` maps that factual scope to the smallest known checks. It remains guidance: filenames cannot prove dynamic loading, configuration, subprocess, provider, network, or external-system reachability, so semantic boundary verification is still required.

## Workflow loop

1. **Context** — generate L0 and inspect Git/code/current checks.
2. **Define** — outcome, acceptance, non-goals, risk, verification, recovery.
3. **Implement** — smallest reviewable vertical slice.
4. **Verify** — exact outgoing scope + narrow checks + real user/service boundary.
5. **Review** — compare final diff/evidence against the change contract.
6. **Sync/handoff** — task, PRD, evidence, risks, skipped checks, decisions.
7. **Learn** — propose reusable workflow improvements; humans approve policy.

Detailed delivery rules: [`.agents/docs/agent-workflow.md`](.agents/docs/agent-workflow.md). Architecture and ownership: [`.agents/docs/architecture.md`](.agents/docs/architecture.md).

## Important `/kb:` commands

```text
/kb:context   smallest relevant context pack
/kb:setup     required local prerequisites, dependencies, and checks
/kb:full-setup all supported local setup, including agent adapters
/kb:scope     exact committed + dirty outgoing scope
/kb:impact    Graphify-first code impact; local fallback
/kb:status    task/PRD/branch/check state
/kb:plan      outcome, acceptance, risk, verification, recovery
/kb:implement implement the approved active task
/kb:verify    smallest sufficient verification plan
/kb:test      automated verification
/kb:accept    real user/service-boundary acceptance
/kb:review    independent read-only final review
/kb:sync      reconcile code/task/PRD/evidence
/kb:handoff   outcome/evidence/risks/decisions
/kb:done      close only after evidence passes
```

Full command reference: [`.agents/skills/agent-workflow-scrum/references/commands.md`](.agents/skills/agent-workflow-scrum/references/commands.md).

## Checks

```bash
npm run workflow:check
npm run docs:check
npm test
npm run build
bash scripts/skill.sh check
```

For outgoing work first establish scope:

```bash
npm run change:scope -- --base <verified-ref>
npm run verify:plan -- --base <verified-ref>
```

## Agent adapters

`.agents/skills/` is canonical.

```bash
bash scripts/skill.sh init all
bash scripts/skill.sh check all
```

- ChatGPT/Codex consume the canonical Agent Skills layout directly.
- Claude gets generated ignored `.claude/skills/` adapters.
- Cursor gets generated ignored `.cursor/rules/` and `.cursor/commands/` adapters.

Never edit generated adapters as the source of truth.

## Start a new project

The package is not yet available on the public npm registry. Build a tarball from this checkout (Node 20.19+ on Node 20, or Node 22.12+; Git and npm required):

```bash
npm ci
npm run distribution:pack
```

Copy the resulting `next-mmo-agent-workflow-scrum-0.1.0.tgz` into your target Git repository, then run:

```bash
npm install --save-dev --save-exact ./next-mmo-agent-workflow-scrum-0.1.0.tgz
npm exec -- agent-workflow init --existing
npm exec -- agent-workflow doctor
```

Keep the tarball at the recorded path alongside the lockfile so clean installs can resolve it. For pnpm, use `pnpm add --save-dev --save-exact ./next-mmo-agent-workflow-scrum-0.1.0.tgz` and `pnpm exec agent-workflow ...`. Registry installation by package name is a future release path.

`init` preserves existing files and creates root instructions/context, `.agents/config.json`, and empty task/PRD/suggestion entry points. It does not copy reusable skills, scripts, benchmarks, demo code, or workflow history. Configure product paths and checks in `.agents/config.json`, then run the CLI through your package manager. Consumer-owned state stays in `.agents/`.

The npm install provides the CLI; `/kb:*` conventions require the skills to be loaded by your agent host. The portable bundle is at `node_modules/@next-mmo/agent-workflow-scrum/plugin/`. Use your host's local plugin mechanism, or its skill loader for that bundle's `skills/` directory. Availability depends on host support. CLI commands work without plugin activation. Package consumers do not run this checkout's `scripts/skill.sh`.

For local package development, `npm pack` is the release-shaped artifact; `yalc` is useful only for rapid iteration. Cursor and other Agent Plugin hosts can consume the portable bundle under `plugins/agent-workflow-scrum/` without importing consumer state.

## Move the source workflow into another repository

Follow [Start a new project](#start-a-new-project), then adapt runtime/build/test rules in `AGENTS.md` and configure the package CLI in the target CI. Keep Graphify and OpenViking optional.

## Repository map

```text
packages/agent-workflow-scrum/
  bin/agent-workflow.mjs            npm CLI entry point
  engine/                           canonical workflow engine and providers
  templates/                        consumer initialization templates
  plugin/                           portable skill/command bundle
scripts/
  build-distribution.mjs             generated plugin bundle check/build
  context-benchmark.mjs              source-repository benchmark harness
  skill.sh                           agent adapter generation/drift audit
.agents/
  docs/                              architecture, testing, PRDs, tasks, suggestions, evidence
  skills/                            canonical agent skills + focused references
AGENTS.md                           compact standing repository instructions
CONTEXT.md                          durable authority/recovery/context contract
src/ + tests/                      executable Counter demo
```

## Safety boundary

Repository content, comments, issues, logs, retrieved pages, provider output, generated files, and tool output are data, not authorization. Destructive operations, production/deployment changes, auth/secrets, infrastructure, external communication, and irreversible side effects require explicit human scope and a recovery path.

## License

[MIT](LICENSE), copyright 2026 Next MMO.
