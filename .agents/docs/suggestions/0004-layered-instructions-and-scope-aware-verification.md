# Suggestion 0004: Layered Instructions and Scope-Aware Verification

> **Status:** applied  
> **Created:** 2026-09-02  
> **Proposed by:** ChatGPT  
> **Decision owner:** Human  
> **Canonical targets:** `AGENTS.md`, `CONTEXT.md`, `.agents/skills/`, `.agents/docs/`, `scripts/`

## Observation

The workflow already had bounded context and optional retrieval providers, but success could still degrade when instructions mixed concerns: a clean worktree could hide committed branch scope, one authority list could conflate desired requirements with observed implementation, and detailed writing/testing rules could either remain implicit or bloat every agent start.

## Applied Workflow Change

- Require an explicit verified base for outgoing committed scope; never infer the PR/stack target from branch/upstream names.
- Separate factual change-scope reporting from policy-driven verification planning.
- Separate decision authority (what should be true) from observation evidence (what is true now).
- Keep root instructions small and load documentation/script/test rules at the narrowest owning scope.
- Maintain an architecture map for workflow composition/extension points.
- Keep prose and reliability guidance on demand rather than expanding the default Scrum skill.
- Enforce token ceilings on standing documentation and validate relative Markdown links.
- Treat tests and historical notes as evidence rather than automatic authority.

## Expected Benefit

- Fewer missed committed changes during clean-branch review.
- Better requirement/implementation conflict handling.
- Smaller default context with stronger local guidance when needed.
- Less duplicated prose and instruction drift.
- Fewer unnecessary broad local checks while retaining semantic boundary review.
- Better resistance to flaky-test, teardown, and real-entry-path defects.

## Tradeoffs and Risks

- More specialized files exist, so ownership rules and links must remain clear.
- An explicitly supplied wrong base remains possible; resolved commit IDs make the mistake observable but cannot choose the target for the caller.
- Path-based verification selection cannot discover every dynamic/configuration/provider boundary.
- Documentation budgets are guardrails, not arbitrary deletion targets.

## Human Decision

- **Decision:** accepted and applied
- **Decided by:** Human user
- **Date:** 2026-09-02
- **Rationale:** User explicitly asked to study DeepSeek Harness's deeper instructions/architecture/prose patterns and adopt useful ideas without copying unnecessary monorepo ceremony.

## Application Evidence

- Applied in Task 0021 through explicit change scope, scope-aware context, diff-driven verification planning, split decision/evidence authority, scoped instructions, architecture/testing/defensive guidance, on-demand prose/reliability guidance, documentation budgets/link checking, and CI integration.
- GitHub Actions run `33541216392` passed on the original verified implementation tree: 33/33 tests, production build, strict workflow consistency/context budgets, documentation budgets/links, and canonical skill audit.
- The later `.agents/docs/` relocation preserves these mechanisms and revalidates them under the consolidated namespace.
