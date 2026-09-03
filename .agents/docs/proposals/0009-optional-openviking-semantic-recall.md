# Suggestion 0009: Optional OpenViking Semantic Recall Fallback

> **Status:** proposed  
> **Created:** 2026-09-04  
> **Proposed by:** Agent  
> **Decision owner:** Human  
> **Canonical target:** `.agents/docs/architecture.md`, `.agents/config.json`, `.agents/docs/agent-workflow.md`  

## Observation

- The native memory provider (`memory.mjs`) delivers zero-dependency, file-based recall by scoring `solutions/` and `memory/` entries against scope terms using weighted term overlap.
- This works well for explicit keyword matches but lacks vector-semantic similarity (e.g. "login timeout" matching a solution tagged "session expiry") because it depends on surface-level string matching.
- OpenViking provides vector-semantic retrieval over memories, resources, and skills via a local or remote index — significantly richer matching at the cost of an external binary dependency.

## Evidence

- Facts:
  - Native memory recall handles 100% of the existing solution files with zero-dependency overhead and sub-5ms latency.
  - OpenViking queries require the `ov` binary on PATH and a configured index, with 100–500ms typical latency.
  - The existing `retrieveOpenViking` provider (`openviking.mjs`) is fully implemented, tested, and produces compact budget-constrained output.
- Inference:
  - Native recall is sufficient for small-to-medium knowledge bases (< 50 entries) with explicit tagging discipline.
  - For larger knowledge bases or cross-repository recall where semantic proximity matters, OpenViking's vector search provides meaningful uplift beyond keyword matching.

## Proposed Workflow Change

1. **Native memory is the default recall provider** — always active in `native`, `graphify`, `auto`, and `all` modes.
2. **OpenViking becomes an optional upgrade** detected via PATH:
   - When `ov` is available and `--provider openviking` or `--provider all` is specified, OpenViking supplements native recall with vector-semantic results.
   - Falls back cleanly to native-only recall when `ov` is absent.
3. Update `doctor.mjs` to report OpenViking availability as an optional enhancement rather than a required tool.
4. Document the native-first / OpenViking-fallback architecture in `.agents/docs/architecture.md`.

## Expected Benefit

- Preserves zero-dependency portability for all consumer projects.
- Enables deeper semantic matching for teams with established OpenViking infrastructure.
- Clear upgrade path: start with native recall, add OpenViking when the knowledge base outgrows keyword matching.

## Scope and Exceptions

- Applies to:
  - Context provider routing (`context-core.mjs`, `providerNames()`, `allocateProviderBudgets()`)
  - Documentation and architecture docs.
- Does not apply to:
  - Authoritative context documents, PRDs, or Change Contracts.
  - Local context ranking (always repository-first, regardless of provider).

## Tradeoffs and Risks

- External binary dependency: OpenViking must remain strictly optional; no workflow path should require it.
- Index freshness: OpenViking results depend on index update cadence; stale indexes can surface outdated recall.
- Network risk: if OpenViking is configured with a remote server, query latency and availability introduce external failure modes.

## Validation

- `npm run context -- "audio autoplay" --provider native` returns native memory recall from solutions.
- `npm run context -- "audio autoplay" --provider openviking` only works when `ov` binary is present, degrades cleanly otherwise.
- `npm run context -- "audio autoplay" --provider all` includes both native and OpenViking results when available.

## Human Decision

- **Decision:** pending
- **Decided by:**
- **Date:**
- **Rationale:**

## Application Evidence

- Changed canonical files:
- Verification results:
- Follow-up or superseding suggestion:
