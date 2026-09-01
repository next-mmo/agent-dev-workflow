# Development Guide

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm
- Git (workflow/context checks inspect repository state)

Vite 8 is a local development dependency. Prefer `npm ci` for the locked dependency set; use `npm install` only when intentionally updating the lockfile.

## Run locally

```bash
npm run dev
```

The app defaults to <http://localhost:5173>. Set `PORT` for another development port. On Windows PowerShell use `$env:PORT = 8080` before `npm run dev`.

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

## Smart context

Generate a compact L0 context pack before non-trivial agent work:

```bash
npm run context -- "session timeout"
```

Escalate only when needed:

```bash
npm run context -- "session timeout" --level 1
npm run context -- "deep recovery" --full --budget 5000
npm run context -- "api contract" --json
```

The default context budget is approximately 1,500 tokens. Estimates use characters/4 and are a regression signal, not model billing data. The pack is advisory; current code, active tasks, PRDs, tests, and human decisions stay canonical.

## Workflow consistency

Run mechanical lifecycle, link, suggestion-state, and context-budget checks:

```bash
npm run workflow:check
node scripts/workflow-check.mjs --strict-budget
```

The normal command treats token-budget overruns as warnings; `--strict-budget` fails them. Structural errors such as multiple active tasks, lifecycle/status mismatches, broken tracked Markdown links, or applied suggestions without a recorded decision always fail.

## Workflow report

```bash
npm run report
```

Open `report/index.html`. It is a generated, ignored convenience view of Git/task/PRD/workflow sources, not canonical evidence. `scripts/report.mjs` is self-contained and requires no network connection at runtime.

## Project entry point

The root `index.html` references `src/main.js`, which imports the counter state module. Vite processes these source references during development and bundles them into `dist/` for production.
