# Task 0034: Vanilla Fullstack Official Example

> Status: done
> Created: 2026-09-06
> Related PRD: `.agents/docs/prd/0006-official-examples.md`

## Change Contract

- Human outcome: provide a short official vanilla plus Express fullstack template.
- Scope: `examples/vanilla-fullstack/`, its lockfile, PRD, and task evidence.
- Non-goals: styling system, frontend framework, bundler, database, authentication, or shared demo code.
- Recovery: remove the example directory and its PRD if the template is retired.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Express serves the API and browser entry point | `npm test` in `examples/vanilla-fullstack` | 1/1 passed |
| Reproducible dependency install | `package.json` and `package-lock.json` | Express pinned by lockfile |
| Minimal implementation | Source inspection | One server, one browser module, one HTML page, no framework or build step |
