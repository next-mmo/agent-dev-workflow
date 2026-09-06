# Proposal 0013: Unified Institutional Memory and Compounding Loop

> **Status:** applied  
> **Created:** 2026-09-07  
> **Proposed by:** Agent  
> **Decision owner:** Human  
> **Canonical target:** `.agents/docs/solutions/`, `packages/agent-workflow-scrum/engine/context/providers/memory.mjs`, `packages/agent-workflow-scrum/engine/context-core.mjs`, `packages/agent-workflow-scrum/src/cli.mjs`, `.agents/docs/AGENTS.md`  

## Observation

- Developers and agents currently face fragmented knowledge storage across `.agents/docs/memory/`, `.agents/docs/solutions/`, and `.agents/docs/defensive-patterns.md`.
- In practice, `.agents/docs/memory/` sits empty across almost all repositories, has no CLI scaffolding command, lacks a clear boundary with `solutions/`, and creates documentation bloat.
- Memory recall in `memory.mjs` is strictly passive and only scores against explicit words passed to `context -- "<scope>"`. If an agent modifies a file (e.g. `public/app.js`) but queries a general scope (e.g. `context -- "score fix"`), previous learnings for `public/app.js` are not retrieved.
- Industry-leading agent frameworks like Every Inc's Compound Engineering (`/ce-compound`) prove that consolidating all learnings into a single `solutions/` store and automatically grounding subsequent plans on those solutions avoids file fragmentation while achieving high compounding leverage.

## Evidence

- **Repository Audit**: In `examples/full-stack-tutor`, `.agents/docs/memory/` contains only a 6-line `README.md` and was never populated during real feature development.
- **Engine Implementation**: In `packages/agent-workflow-scrum/engine/context/providers/memory.mjs`, `retrieveNativeMemory` already loads from both `solutionsDir` and `memoryDir` using the exact same frontmatter parser and scoring mechanism:
  ```javascript
  const [solutions, memories] = await Promise.all([
    loadEntries(solutionsDir, "solution"),
    loadEntries(memoryDir, "memory"),
  ]);
  ```
- **Passive Query Misses**: Running `agent-workflow context -- "learner progress"` in `examples/full-stack-tutor` reported `No relevant native memory matches.` even though `0001-dom-replacechildren-over-innerhtml.md` existed in `solutions/`, because the query terms did not match the tags.
- **Industry Precedent**: Every Inc's Compound Engineering plugin (`EveryInc/compound-engineering-plugin`) exclusively writes to `docs/solutions/` via `/ce-compound`, citing: *"Run one teaches it. Run two remembers."*

## Proposed Workflow Change

1. **Consolidate Knowledge Stores**:
   - Deprecate `.agents/docs/memory/` as a separate directory for new projects.
   - Establish `.agents/docs/solutions/` as the single canonical store for both bug fixes and reusable technical learnings/conventions.
   - Retain backwards-compatible reading in `memory.mjs` so any legacy `memory/*.md` files continue to be indexed if present.
2. **Proactive Module-Aware Recall**:
   - Update `retrieveNativeMemory` to accept `changedPaths` (from `git status`) alongside `scope`.
   - If changed files match an entry's `module:` or path tags, automatically score and surface the solution into the context pack, even if the user or agent did not type those exact keywords in the scope string.
3. **Compounding CLI Command**:
   - Add `agent-workflow compound <title>` (or alias to `agent-workflow solve`) to allow rapid capture of non-obvious learnings (`--module <path>`, `--tags <t1,t2>`).
4. **Task Completion Ritual**:
   - Update the task template guidance so the definition of done includes a compounding prompt: *"Did this increment establish a reusable convention or resolve a subtle pitfall? If so, record it via `agent-workflow compound`."*

## Expected Benefit

- **Strict Adherence to "One Home Per Fact"**: Eliminates ambiguity over whether an insight is a "memory", a "solution", or a "defensive pattern".
- **Zero-Friction Proactive Safety**: Agents touching a module automatically see past pitfalls and conventions for that module without guessing search keywords.
- **Leaner Repositories**: Fewer empty directories and cleaner onboarding for human vibe coders.

## Scope and Exceptions

- **Applies to**: Agent Workflow Scrum core engine, context providers, project documentation guidelines, scaffolding templates.
- **Does not apply to**: Invariant project constraints, authority rules, and system boundaries, which remain in `CONTEXT.md` and `AGENTS.md`.

## Tradeoffs and Risks

- **Clean Break (No Backwards Compatibility Needed)**: Since the product is in pre-1.0 private beta / RC preparation with no external production users, we intentionally avoid carrying legacy migration baggage. `.agents/docs/memory/` will be completely removed and consolidated 100% into `.agents/docs/solutions/`.
- **Context Budget**: Auto-surfacing solutions by modified paths must strictly respect the configured `budgets.memory` ceiling (e.g. max 250 tokens) to prevent prompt bloat.

## Validation

1. Run `agent-workflow context` with modified files in the working tree and verify that relevant solutions for those files are surfaced in `[memory]` output automatically from `.agents/docs/solutions/`.
2. Verify all tests pass with `.agents/docs/memory/` retired.
3. Verify that `agent-workflow check` and `doctor` validate cleanly without `memory/`.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human (Repo Owner)
- **Date:** 2026-09-07
- **Rationale:** Product is pre-1.0 with no external consumers yet; clean break is preferred over carrying backwards compatibility baggage. Consolidate 100% into `.agents/docs/solutions/`.

## Application Evidence

- Changed canonical files:
  - `packages/agent-workflow-scrum/engine/context/providers/memory.mjs`: Consolidated store to `solutions/` only; added proactive module-matching bonus (+3.0 to +5.0) against `changedPaths`.
  - `packages/agent-workflow-scrum/engine/context-core.mjs`: Fed `worktreeChangedPaths` directly into `retrieveNativeMemory`.
  - `packages/agent-workflow-scrum/src/cli.mjs` & `packages/agent-workflow-scrum/src/run-engine.mjs`: Registered `compound` command mapping to `solve.mjs`.
  - `packages/agent-workflow-scrum/engine/solve.mjs`: Updated usage to `agent-workflow solve|compound <title>`.
  - `packages/agent-workflow-scrum/src/scaffold.mjs`, `templates/`: Retired `memory/README.md` and updated docs templates.
  - `.agents/docs/memory/`: Completely purged; single source of truth is now `.agents/docs/solutions/`.
  - `tests/context-providers.test.mjs` & `tests/package-distribution.test.mjs`: Updated test expectations for solutions-only store and proactive recall.
  - `.agents/docs/tasks/done/done-0038-0004-unified-memory-compounding.md`: Completed task contract.
- Verification results:
  - `npm test`: 127/127 tests passed.
  - `npm run local:check`: Full test suite, production build, strict workflow check, docs budget check, and distribution checks passed.
- Follow-up or superseding suggestion: None. Clean break successfully applied.
