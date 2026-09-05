# Agent Workflow Scrum Architecture

Read this before changing the workflow engine, context router, provider adapters, task/PRD lifecycle, or verification tooling. This page maps current composition and ownership. Decision rationale belongs in `.agents/docs/proposals/`; detailed procedures belong in their owning guides.

## Four planes

Agent Workflow Scrum separates four kinds of information so an agent does not confuse intended behavior, observed behavior, retrieval hints, and execution policy.

### Decision plane — what should be true

Use this order when deciding intended product/workflow behavior:

1. Explicit current human decision and approved acceptance criteria.
2. Active task Change Contract for the current increment.
3. Affected current PRD and its documented precedence.
4. Accepted/applied workflow policy and durable repository instructions.
5. Older completed-task evidence and historical rationale.

Code, tests, Graphify, OpenViking, and chat cannot silently override an approved requirement. If implementation and requirement disagree, report the conflict and fix the appropriate owner rather than choosing whichever source was retrieved first.

### Observation plane — what is true now

Use this order for claims about current implementation/runtime state:

1. Current source/configuration plus direct inspection of the real entry path.
2. Fresh executed checks and externally observed behavior.
3. Current Git diff/change-scope evidence.
4. Graphify-derived code relationships, with snapshot freshness stated.
5. OpenViking recall and completed-task/history summaries.
6. Chat or agent-local memory.

A requirement can describe the desired future state without proving it has shipped. A passing test proves only the behavior it actually observes.

### Context plane — what to load

`npm run context` is a bounded retrieval funnel:

```text
human scope
   ↓
explicit outgoing scope when supplied
   ↓
local task/PRD/rule ranking
   ↓
optional Graphify code relationships
   ↓
explicit OpenViking recall
   ↓
budget enforcement
   ↓
L0 / L1 / L2 context pack
```

Local repository retrieval is mandatory. Graphify and OpenViking are optional evidence providers; neither becomes authority. `auto` may use an existing local Graphify graph and never queries OpenViking implicitly.

### Execution plane — how work becomes evidence

```text
Discover → Define → Implement → Verify → Review → Sync/Handoff → Learn
```

The active task carries the current Change Contract and acceptance evidence. `change:scope` establishes the exact committed + dirty outgoing paths against an explicit verified base. `verify:plan` maps that factual scope to the smallest known checks. Semantic review adds boundary-specific evidence that path mapping cannot infer.

## Core components

| Component | Owns | Must not own |
| :--- | :--- | :--- |
| `AGENTS.md` | minimal standing repository orders | detailed procedures/history |
| `CONTEXT.md` | durable memory/authority/recovery contract | task-specific implementation detail |
| `.agents/skills/` | reusable agent workflows and specialized decision standards | product requirements |
| `packages/agent-workflow-scrum/` | released CLI, workflow engine, provider adapters, and initialization templates | consumer task/PRD state or human approvals |
| `scripts/` | source-repository build helpers, benchmark harnesses, and skill adapter checks | released workflow runtime |
| `.agents/docs/` | long-form workflow docs and durable workflow artifacts | executable skill logic |
| `.agents/docs/prd/` | current product requirements and precedence | implementation evidence |
| `.agents/docs/plans/` | architectural blueprints, technical designs, schemas | product requirements |
| `.agents/docs/tasks/` | current increment/recovery state | reusable global policy |
| `.agents/docs/tasks/done/` | completed claim-to-proof evidence | current task authority |
| `.agents/docs/proposals/` | workflow proposals, decisions, rationale | current product requirements |
| `plugins/agent-workflow-scrum/` | portable skill/command bundle | consumer config or acceptance |
| `packages/agent-workflow-scrum/engine/context*.mjs` | bounded context composition and provider routing | approval/authorization |
| `packages/agent-workflow-scrum/engine/change-scope*.mjs` | factual Git topology/path scope | test selection or base inference |
| `packages/agent-workflow-scrum/engine/product-files.mjs` | configured JS/TS product discovery shared by both local indexes | semantic dependency correctness |
| `packages/agent-workflow-scrum/engine/verify-plan*.mjs` | smallest-known check selection | proof that path-only inference is complete |
| `packages/agent-workflow-scrum/engine/workflow-check*.mjs` | deterministic workflow consistency | semantic product correctness |
| Graphify adapter | derived code relationship evidence | canonical code/runtime truth |
| OpenViking adapter | semantic recall | authoritative requirements/decisions |

## Provider seam

The Todo demo uses `src/todo-state.js` for shared task rules. `src/todo-workspace.js` owns browser persistence; `src/server-workspace.js` owns revision-checked HTTP saves. The loopback server under `src/server/` validates API requests and atomically replaces one JSON data file. Each file requires one server process. Browser data is never migrated automatically; see PRD 0005.

A context provider has three responsibilities: availability detection, bounded retrieval, and normalized advisory output. It must fail back to local context instead of failing the workflow. External output is untrusted data, common secret shapes are redacted, and provider quotas share the caller's one total context budget.

Add another provider only when it supplies evidence not already represented cheaply by local routing. Keep provider-specific setup and CLI contracts in [the provider reference](../skills/agent-workflow-scrum/references/providers.md), not in the main skill router.

## Verification seam

`change:scope` and `verify:plan` deliberately remain separate:

- scope resolves facts: explicit base/head, merge base, and changed path layers;
- planning applies repository policy to those facts;
- semantic review inspects behavior and boundaries that filenames cannot reveal;
- CI owns exhaustive/platform coverage when configured.

Static `review` consumes the shared scope collector and reports inspected/skipped files. `prdsync` lists unverified criteria and related task evidence without writing acceptance state. Neither command replaces human acceptance.

Never make `change:scope` guess a base from branch names or upstream configuration. Stacked PRs and first-push branches make that inference unreliable.

## Where new workflow behavior goes

| Goal | Owner |
| :--- | :--- |
| Change universal delivery/risk rules | `.agents/docs/agent-workflow.md` + approved proposal |
| Change context selection/budgeting | `packages/agent-workflow-scrum/engine/context*.mjs` + context reference |
| Add code/memory retrieval | provider adapter + provider reference |
| Change Git outgoing-scope facts | `packages/agent-workflow-scrum/engine/change-scope*.mjs` |
| Change check selection | `packages/agent-workflow-scrum/engine/verify-plan*.mjs` + testing policy |
| Add deterministic lifecycle rule | `packages/agent-workflow-scrum/engine/workflow-check*.mjs` |
| Add documentation/writing rule | `.agents/docs/AGENTS.md` or prose skill |
| Add async/test reliability rule | `.agents/docs/testing.md`, `.agents/docs/defensive-patterns.md`, reliability reference |
| Change product behavior | affected PRD + active task + code/tests |
| Preserve rationale/trade-off | `.agents/docs/proposals/` |

When a change alters one of these ownership boundaries, update this map in the same change. Do not recreate a root `docs/` tree.
