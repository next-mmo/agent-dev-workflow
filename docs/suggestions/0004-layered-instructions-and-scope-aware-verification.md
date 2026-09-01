# Suggestion 0004: Layered Instructions and Scope-Aware Verification

> **Status:** applied  
> **Created:** 2026-09-02  
> **Proposed by:** ChatGPT  
> **Decision owner:** Human  
> **Canonical targets:** `AGENTS.md`, `CONTEXT.md`, `.agents/skills/`, `docs/`, `scripts/`

## Observation

The workflow already has bounded context and optional retrieval providers, but success can still degrade when instructions mix several concerns: a clean worktree can hide committed branch scope, one authority list can conflate desired requirements with observed implementation, and detailed writing/testing rules can either remain implicit or bloat every agent start.

A mature agent-oriented repository demonstrates useful patterns here: explicit change-scope facts, narrow pre-push evidence selection, subtree-specific standing orders, one-home documentation ownership, architecture maps, specialized prose/reliability skills, and budgets that keep standing context from growing silently.

## Proposed Workflow Change

- Require an explicit verified base for outgoing committed scope; never infer the PR/stack target from branch/upstream names.
- Separate factual change-scope reporting from policy-driven verification planning.
- Separate decision authority (what should be true) from observation evidence (what is true now).
- Keep root instructions small and put docs/script/test rules in subtree `AGENTS.md` files.
- Add an architecture map that owns workflow composition/extension points without duplicating decision history.
- Add specialized on-demand prose and reliability guidance rather than expanding the default Scrum skill.
- Enforce token ceilings on standing documentation and validate relative Markdown links.
- Treat tests and historical notes as evidence rather than automatic authority.

## Expected Benefit

- Fewer missed committed changes during clean-branch review.
- Better requirement/implementation conflict handling.
- Smaller default context with stronger local guidance when entering specialized areas.
- Less duplicated prose and instruction drift.
- Fewer unnecessary full test/build runs while retaining semantic boundary review.
- Better resistance to flaky-test, teardown, and real-entry-path defects.

## Tradeoffs and Risks

- More files exist, so ownership rules and links must stay clear.
- An explicitly supplied wrong base remains possible; resolved commit IDs make the mistake observable but cannot choose the correct target for the human/forge caller.
- Path-based verification selection cannot discover every dynamic/configuration/provider boundary, so it remains guidance rather than proof.
- Documentation budgets can become harmful if treated as arbitrary reduction targets; raise a ceiling when content genuinely belongs in that owner.

## Alternatives Considered

- **Put all guidance in root `AGENTS.md`.** Simpler file layout but every task pays the context cost and unrelated rules compete for attention.
- **Copy the full external Agent Note/i18n/package policy.** Powerful for a very large monorepo but excessive for a portable workflow template; tasks/PRDs/suggestions already cover our durable state/rationale needs.
- **Keep `git status` as the only change signal.** Cheap but incorrect for committed clean feature branches.
- **Always run the full test/build suite.** Simple but slower and encourages agents to spend time/tokens on checks that do not prove the affected behavior.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human user
- **Date:** 2026-09-02
- **Rationale:** User explicitly asked to study DeepSeek Harness's deeper instructions/architecture/prose patterns and improve this workflow with the useful ideas.

## Application Evidence

- Applied in task 0019 through explicit change scope, scope-aware context, diff-driven verification planning, split decision/evidence authority, subtree `AGENTS.md` instructions, architecture/testing/defensive documentation, an on-demand prose skill, documentation budgets/link checking, and CI integration.
- GitHub Actions run `33541216392` passed on the final implementation tree: 33/33 tests, Vite production build, strict workflow consistency/context budgets, documentation budgets/links, and canonical skill audit.
- Standing-document signals at application: `AGENTS.md` ~609/800, `CONTEXT.md` ~1199/1400, Scrum `SKILL.md` ~821/900, prose `SKILL.md` ~878/1000, architecture ~1506/1800 heuristic tokens.
- CI uses current `actions/checkout@v7` and `actions/setup-node@v7`; the prior Node-runtime deprecation warning is removed.
- Follow-up: measure whether scope-aware verification reduces unnecessary local checks and whether budgets remain comfortable on larger migrated repositories.
