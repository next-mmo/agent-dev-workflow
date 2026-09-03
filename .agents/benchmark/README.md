# Agent Workflow Benchmark Index

> Reference map of every measurement, proposal, and comparison related to **context-size reduction**, **context efficiency**, and **workflow intelligence** in this repository.
> Actual numbers are evidence snapshots; re-run the commands below for current values.

---

## Quick Commands

```bash
# Raw vs. bounded context comparison (human-readable)
npm run benchmark:context -- "<scope>" --provider local --level 0

# Bounded with budget + JSON output
npm run benchmark:context -- "<scope>" --provider local --level 0 --budget 1500 --json

# L1 (more detail) local benchmark
npm run benchmark:context -- "<scope>" --provider local --level 1 --budget 1500

# Compact test run (>95% token reduction on passing suites)
npm run test:compact

# Workflow health + strict budget check
npm run workflow:check -- --strict-budget --base origin/main
```

---

## Benchmarks and Evidence

### 1. Raw vs. Bounded Context — Task 0026

**Source:** [done-0026-0001-context-benchmark.md](../docs/tasks/done/done-0026-0001-context-benchmark.md)
**Proposal:** [0002-progressive-context-router-and-workflow-checks.md](../docs/proposals/0002-progressive-context-router-and-workflow-checks.md)

| Metric | Historical value |
|---|---|
| Raw baseline (all tracked UTF-8 files) | **102,978 tokens** across 98 files |
| Bounded context (L0, budget 1,500) | **639 tokens** |
| Context-size reduction | **99.38%** |
| Actual task token savings | **Not measured** |
| Budget exceeded | `false` |
| Test suite | 3 benchmark fixtures passed, 55 total passed |

**What it proves:** The progressive L0/L1/L2 context router produced a much smaller bounded context pack than the naive whole-repository text baseline in this historical fixture. It does not prove that an end-to-end task used 99.38% fewer tokens or that product behavior was unchanged.

**Interpretation note:** Raw = all tracked UTF-8 text files tokenised naively. Bounded = router's measured JSON pack. The current benchmark reports schema v2 `reduction` using a characters/4 estimator and leaves `actualTaskTokenSavings` null. End-to-end task savings require equivalent task runs that account for later reads, tool output, model output, caching, and outcome quality. Timings vary by machine/filesystem state.

---

### 2. Standing-Document Token Budgets — Proposals 0002 & 0004

**Sources:**
- [0002-progressive-context-router-and-workflow-checks.md](../docs/proposals/0002-progressive-context-router-and-workflow-checks.md)
- [0004-layered-instructions-and-scope-aware-verification.md](../docs/proposals/0004-layered-instructions-and-scope-aware-verification.md)

| Document | Budget | Measured at application |
|---|---|---|
| `AGENTS.md` | 800 heuristic tokens | ~609 / ~527 |
| `CONTEXT.md` | 1,400 heuristic tokens | ~1,199 / ~896 |
| Scrum `SKILL.md` | 900 heuristic tokens | ~821 |
| Prose `SKILL.md` | 1,000 heuristic tokens | ~878 |
| Architecture doc | 1,800 heuristic tokens | ~1,506 |
| L1 context fixture | 1,500 heuristic tokens | ~1,357 |

Pre-change canonical skill was **~9.9 KB (~2,500 heuristic tokens)**. After router split it became **~587 tokens** — a **77% reduction** in standing instruction size.

---

### 3. Terminal Output Compression — Proposal 0008

**Source:** [0008-optional-rtk-command-compression-layer.md](../docs/proposals/0008-optional-rtk-command-compression-layer.md)
**Status:** proposed (pending human decision)

| Command | Raw output | With RTK | Reduction |
|---|---|---|---|
| `npm test` (full suite) | >380 lines (incl. CRLF warnings + 69 pass lines) | TBD | 60-90% estimated |
| `npm run test:compact` (native) | >380 lines | dot-per-test | **>95%** on passing runs |

**What this proves:** Native zero-dependency optimisation (`test:compact`, `trimToBudget`) resolves the core context-flooding problem. Optional RTK proxy targets broader tool suites (Git, Docker, package managers).

---

### 4. Context Provider Layer — Proposal 0003

**Source:** [0003-optional-context-provider-layer.md](../docs/proposals/0003-optional-context-provider-layer.md)

| Provider | Default | When used |
|---|---|---|
| `local` | mandatory | Always |
| `graphify` | optional | When local graph snapshot exists |
| `openviking` | explicit opt-in | Only with --provider openviking or all |

- All providers share **one total token budget** with sub-budgets and hard trimming.
- Provider failures degrade gracefully to local context.
- 26/26 tests passed including provider success/missing/timeout/oversized-output paths.

---

### 5. Ceremony Mode vs. Token Cost — Proposal 0007

**Source:** [0007-configurable-ceremony-modes.md](../docs/proposals/0007-configurable-ceremony-modes.md)

| Mode | Task/PRD ceremony | Tests/Build | Token overhead |
|---|---|---|---|
| `vibe` | relaxed | required | Lowest |
| `standard` | required | required | Medium |
| `strict` | required + rollback/threat | required | Higher |
| `guided` | required with remediation hints | required | Medium + tips |

**Usability finding:** the original strict-only mode produced a **28:1 ratio** of workflow machinery to demo application code for a solo vibe coder.

---

## Model Cost Routing Reference

**Source:** [model-recommend.md](../docs/model-recommend.md)

| Task | Recommended model | Rationale |
|---|---|---|
| Understanding / Planning | GLM-5.3 Flash | Fast, cheap |
| Normal feature coding | GPT-5.6 Luna | 40% of requests |
| Larger / complex coding | GLM-5.3 | When Luna falls short |
| Tests and lint | DeepSeek V4 Flash | 20% of requests |
| Cheap subagent loops | Qwen3.8 Flash | 10% of requests |
| Difficult / stuck | GLM-5.3 / Grok 4.6 / Kimi K3 | 5% of requests |

**Watch:** Qwen3.8 Flash — DeepSWE 58.7, SWE-bench Pro 62.5, SWE-bench Multilingual 81.0 at ~27,000 req/month on Go plan.

---

## Benchmark Files

| File | Description |
|---|---|
| `tests/context-benchmark.test.mjs` | Deterministic fixture: bounded < raw and budget contract |
| `tests/verify-plan.test.mjs` | Benchmark regression selected for benchmark tooling changes |
| `scripts/context-benchmark.mjs` | Schema v2 context-size comparison CLI |
| `packages/agent-workflow-scrum/engine/context-core.mjs` | Core bounded retrieval engine |
| `packages/agent-workflow-scrum/engine/context/providers/common.mjs` | Provider normalisation, trimming, and redaction |

---

## How to Add a New Benchmark Result

1. Run `npm run benchmark:context -- "<scope>" --json > .agents/benchmark/results/<date>-<scope>.json`
2. Record `rawTokens`, `boundedTokens`, `reduction`, `actualTaskTokenSavings`, and `budgetExceeded` in the evidence tables above.
3. Note the level (`--level 0|1|2`), provider, and budget used.
4. Never paste the raw repository dump or full context pack into this file.
5. Do not describe context-size reduction as task token savings unless equivalent task runs provide that evidence.
