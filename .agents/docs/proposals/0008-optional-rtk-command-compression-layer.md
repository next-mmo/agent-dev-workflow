# Suggestion 0008: Optional RTK Command Compression Layer

> **Status:** proposed  
> **Created:** 2026-09-04  
> **Proposed by:** Agent  
> **Decision owner:** Human  
> **Canonical target:** `.agents/docs/architecture.md`, `.agents/config.json`, `.agents/docs/agent-workflow.md`  

## Observation

- While progressive context routing (L0/L1/L2) effectively constrains initial prompt overhead to ~1k bounded tokens, the execution plane remains vulnerable to terminal output flooding.
- Standard developer commands (`npm test`, `git status`, `git diff`, `docker`, build tools) frequently dump 300 to 1,000+ lines of raw console logs, repeated Git CRLF warnings, and passing test assertions into the agent conversation context.
- External proxy tools like RTK (Rust Token Killer) achieve 60%–90% token reduction across terminal commands via smart boilerplate stripping, deduplication, and failure isolation.

## Evidence

- Facts:
  - Running a clean `npm test` across the full test suite produces over 380 lines of output, including dozens of identical Windows CRLF warnings and 69 passing test lines.
  - Slicing context text blindly by characters previously severed words mid-token, triggering potential agent confusion or re-reads.
  - Native Node `--test --test-reporter=dot` (`npm run test:compact`) reduces test output tokens by >95% on passing runs while preserving failure assertions and stack traces.
- Inference:
  - Native optimizations (semantic truncation, compact test reporters) resolve core repository needs with zero dependencies.
  - For broad developer tool suites (Git, Docker, Kubernetes, package managers), an optional integration with RTK provides high-leverage terminal compression when installed, without violating the zero-dependency promise of `@next-mmo/agent-workflow-scrum`.

## Proposed Workflow Change

1. Keep native zero-dependency optimizations as the core baseline:
   - Boundary-aware truncation (`trimToBudget`) in context routing.
   - Built-in compact test reporter (`test:compact`).
2. Add optional RTK proxy awareness to `.agents/config.json`:
   ```json
   {
     "outputCompression": "auto"
   }
   ```
3. When `outputCompression` is enabled and `rtk` binary is present on system `PATH`:
   - Verification planning and CLI command suggestions can route arbitrary terminal operations through `rtk <command>`.
   - `doctor.mjs` reports `rtk detected: terminal output compression active`.
4. If `rtk` is not available, the workflow cleanly falls back to native compact command variants without warnings or errors.

## Expected Benefit

- Prevents context window exhaustion during multi-step development loops.
- Avoids agent distraction from voluminous passing test logs and platform warnings.
- Preserves 100% portability: consumer projects without Rust/RTK still experience native token savings.

## Scope and Exceptions

- Applies to:
  - Agent terminal execution, test reporting, and command suggestions.
- Does not apply to:
  - Authoritative context documents, PRDs, or Change Contracts.
  - Raw error debugging when full uncompressed output is explicitly demanded by the user (`--full-output` or `rtk tee`).

## Tradeoffs and Risks

- External binary dependency: RTK must remain strictly optional to preserve npm package portability.
- Aggressive filter risk: If RTK filters output too aggressively, an agent could miss non-standard diagnostics; the fallback path must remain accessible.

## Validation

- A subsequent task will add detection in `doctor.mjs` and benchmark token usage of `rtk git status` / `rtk npm test` versus native baselines in a test worktree.

## Human Decision

- **Decision:** pending
- **Decided by:**
- **Date:**
- **Rationale:**

## Application Evidence

- Changed canonical files:
- Verification results:
- Follow-up or superseding suggestion:
