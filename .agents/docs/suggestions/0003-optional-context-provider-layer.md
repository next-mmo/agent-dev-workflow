# Suggestion 0003: Optional Context Provider Layer

> **Status:** applied  
> **Created:** 2026-09-01  
> **Proposed by:** ChatGPT  
> **Decision owner:** Human  
> **Canonical targets:** `CONTEXT.md`, `.agents/skills/agent-workflow-scrum/`, `scripts/context.mjs`

## Observation

The progressive local router reduces default context cost, but large repositories still benefit from code-relationship retrieval and long-lived semantic recall. Making either service mandatory would reduce portability and create new privacy/availability failure modes.

## Evidence

- Graphify supports bounded `graphify query` output over an existing local `graphify-out/graph.json` and exposes code relationships for impact analysis.
- OpenViking supports semantic `find` over memory/resource/skill contexts and returns URI, level, score, and abstract/overview metadata.
- Both are optional accelerators; current code, fresh checks, task/PRD state, and explicit human decisions remain stronger evidence.

## Applied Workflow Change

- Local repository retrieval remains mandatory and authoritative.
- Graphify is an optional local code-impact provider; `auto` uses it only when a local graph snapshot exists and marks graph evidence possibly stale when the working tree has changes.
- OpenViking is optional read-only recall and is queried only after explicit provider selection because the configured server may be remote.
- Provider results share the router's total token budget, use timeouts/failure isolation, are normalized and hard-trimmed, and redact common credential shapes before context injection.
- `/kb:impact` is a Graphify-first read-only impact mode with local fallback.
- Provider output is explicitly untrusted/advisory and never overrides code, fresh checks, active task/human decisions, or PRDs.

## Expected Benefit

- Fewer source files loaded solely to discover dependencies.
- Better recovery of relevant historical/organizational knowledge without bloating Git instructions.
- Higher task success on large repositories while preserving deterministic local fallback and token budgets.

## Tradeoffs and Risks

- Graph snapshots can be stale; changed files must be inspected directly and the graph refreshed when necessary.
- OpenViking queries may leave the machine; it therefore cannot run implicitly.
- Provider CLIs evolve; adapters fail closed to local context rather than breaking the workflow.
- Provider usefulness still needs measurement on larger production repositories before increasing automation.

## Validation

- Fresh combined dependency-free verification: 26/26 tests passed.
- Coverage includes local routing, strict workflow fixtures, Graphify success/missing/timeout/oversized-output paths, OpenViking explicit opt-in and current CLI argument ordering, provider composition, credential redaction, and the 500-token minimum/hard-cap contract.
- The existing strict canonical context-budget check passed before the final provider hardening; later code/test/CI changes do not increase `AGENTS.md`, `CONTEXT.md`, or canonical `SKILL.md`.
- Vite production build remains skipped in this execution environment because installed dependencies are unavailable; application source and dependency versions were not changed by this provider task.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human user
- **Date:** 2026-09-01
- **Rationale:** User explicitly requested finishing local + Graphify + OpenViking with both external providers optional.

## Application Evidence

- **Changed canonical files:** `CONTEXT.md`, README/development guidance, canonical skill/router references, `/kb:` command reference, provider modules, `.gitignore`, tests, and CI workflow.
- **Provider behavior:** `--provider auto|local|graphify|openviking|all`; `auto` never queries OpenViking; all provider failures degrade to local context.
- **Token safety:** one total context budget, provider sub-budgets, hard output trimming, and a tested minimum viable budget of 500 heuristic tokens.
- **Security/privacy:** provider evidence is untrusted data, common secret shapes are redacted, and OpenViking remains explicit opt-in.
- **Verification:** 26/26 fresh tests passed on the final code surface; GitHub CI is added for future PR/main verification but cannot run on this PR until the workflow exists on the base branch.
- **Follow-up:** measure provider hit quality, files avoided, and token savings on larger repositories before changing provider defaults.
