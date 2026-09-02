# Development Guide

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm
- Git (workflow/context/scope checks inspect repository state)

Vite 8 is a local development dependency. Prefer `npm ci` for the locked dependency set; use `npm install` only when intentionally updating the lockfile.

## Repository documentation layout

Agent Workflow Scrum keeps its reusable material under `.agents/`:

- `.agents/skills/` — executable/reusable agent guidance;
- `.agents/scripts/` — dependency-light workflow tooling and optional provider adapters;
- `.agents/docs/` — architecture, delivery/testing guidance, PRDs, tasks, suggestions, and evidence.

Do not create Agent Workflow Scrum artifacts under a root `docs/` tree. A repository adopting this workflow may still keep its own application/product documentation in `docs/`; only workflow-owned artifacts are reserved for `.agents/docs/`.

## Run locally

```bash
npm run dev
```

The app defaults to <http://localhost:5173>. Set `PORT` for another development port. On Windows PowerShell use `$env:PORT = 8080` before `npm run dev`.

## Setup modes

Use `/kb:setup` in an agent session for the required baseline. It verifies Node.js, npm, and Git; installs locked project dependencies; and runs the required repository checks.

Use `/kb:full-setup` for all supported repository-local setup. It runs `/kb:setup`, initializes the Claude and Cursor adapters, and validates every generated adapter. Full setup does not install or configure external Graphify/OpenViking providers or remote services; those remain explicit opt-in integrations.

The required baseline terminal sequence is:

```bash
npm ci
npm test
npm run build
npm run workflow:check -- --strict-budget
npm run docs:check
bash .agents/scripts/skill.sh check
```

To complete full local setup, run these additional commands:

```bash
bash .agents/scripts/skill.sh init all
bash .agents/scripts/skill.sh check all
```

The skill audit and adapter initialization require a POSIX shell; on Windows, run them from Git Bash.

## Build and preview

```bash
npm run build
npm run preview
```

Preview defaults to port `4173`; set `PREVIEW_PORT` to override it. Production hosting should serve `dist/` rather than use `vite preview`.

## Test

```bash
npm test
```

Tests use Node's built-in runner. Workflow-tool tests create temporary fixture repositories and require no dev server.

For raw-versus-bounded context measurement, see [`testing.md`](testing.md).

## Smart context

Generate a compact L0 context pack before non-trivial agent work:

```bash
npm run context -- "session timeout"
```

Escalate only when needed:

```bash
npm run context -- "session timeout" --level 1
npm run context -- "review session timeout" --base origin/main --level 1
npm run context -- "deep recovery" --full --budget 5000
npm run context -- "api contract" --json
```

The default total context budget is approximately 1,500 tokens. Estimates use characters/4 and are a regression signal, not model billing data. The pack is advisory; current code, active tasks, PRDs, tests, and human decisions stay canonical.

Without `--base`, context uses current worktree changes. With an explicitly verified `--base`, it includes committed merge-base-to-head paths plus staged, unstaged, and untracked paths. Do not infer the PR base from the local branch/upstream when reviewing outgoing committed work.

### Optional context providers

Local retrieval is mandatory. Graphify and OpenViking are optional CLI integrations that share the same total budget:

```bash
npm run context -- "code impact" --provider graphify --level 1
npm run context -- "prior decision" --provider openviking
npm run context -- "architecture" --provider all --level 1
```

`auto` can use Graphify only when `graphify-out/graph.json` already exists; it never builds the graph. OpenViking is explicit because its configured target may be remote; the adapter performs only `ov find` reads. Provider errors/timeouts return advisory status and preserve local context.

Custom/wrapped CLI locations can use `GRAPHIFY_BIN`, `GRAPHIFY_BIN_ARGS`, `GRAPHIFY_GRAPH`, `OPENVIKING_BIN`, and `OPENVIKING_BIN_ARGS`. `*_BIN_ARGS` values are JSON string arrays. Do not put secrets or API keys in command arguments.

## Outgoing change scope

Before PR review, push verification, or handoff, verify the current PR base/stack parent and run:

```bash
npm run change:scope -- --base <verified-ref>
```

The JSON report contains the resolved base/head/merge-base commits and separate committed, staged, unstaged, and untracked path sets. The command is read-only and intentionally never guesses or fetches a base.

Use the same base to select the smallest known checks:

```bash
npm run verify:plan -- --base <verified-ref>
npm run verify:plan -- --base <verified-ref> --json
```

The plan is a routing aid. File paths cannot prove behavior reached only through dynamic loading, configuration, subprocesses, workers, providers, or external systems; add the narrowest owning check for those boundaries.

For async/resource-owning tests or CI, use `.agents/skills/agent-workflow-scrum/references/reliability.md`: allocate resources atomically, synchronize on observable state rather than sleeps, restore global state exactly, and await teardown to quiescence.

## Workflow and documentation consistency

Run workflow, documentation, and adapter checks:

```bash
npm run workflow:check
node .agents/scripts/workflow-check.mjs --strict-budget
npm run docs:check
bash .agents/scripts/skill.sh check
```

`workflow:check` validates lifecycle, product task/PRD/evidence synchronization, and context budgets; add `--base <verified-ref>` for committed scope. `docs:check` validates budgets/links, stale inline paths, and the root `docs/` namespace while allowing application docs.

## Workflow report

```bash
npm run report
```

Open `report/index.html`. It is a generated, ignored convenience view of Git/task/PRD/workflow sources, not canonical evidence. `.agents/scripts/report.mjs` is self-contained and requires no network connection at runtime.

## Project entry point

The root `index.html` references `src/main.js`, which imports the counter state module. Vite processes these source references during development and bundles them into `dist/` for production.
