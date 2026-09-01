# Progressive Context Routing

Use context as a funnel, not a dump. Retrieve enough evidence to act safely without repeatedly loading the entire workflow history.

## Levels

| Level | Default use | Content |
| :--- | :--- | :--- |
| L0 | every non-trivial start | branch, changed paths, active task, ranked PRD/docs, rule hints, bounded provider evidence |
| L1 | implementation or ambiguity | bounded excerpts plus optional provider evidence |
| L2 | explicit deep review/recovery | larger repository source content, still under the requested total budget |

```bash
npm run context -- "auth session timeout"
npm run context -- "auth session timeout" --level 1
npm run context -- "release rollback" --level 1 --budget 2200
npm run context -- "deep recovery" --full --budget 5000
npm run context -- "api contract" --json
```

The default total budget is approximately 1,500 tokens. Estimates use characters/4 and are deliberately approximate. Local and optional provider content share this one budget; provider quotas cannot increase it.

## Retrieval Rules

1. Preserve the human's exact scope as the primary query.
2. Prefer the active task and affected PRD over historical material.
3. Use current Git changes and file names as local relevance signals.
4. Route identity/session/login work to security; release/migration to release; tests/UI/bugs to verification; implementation/API/data to delivery.
5. In `auto`, use Graphify only when its local graph exists. OpenViking requires explicit `--provider openviking` or `--provider all` because its server may be remote.
6. Read current code and tests directly before editing them. Context/provider output never proves runtime behavior.
7. If sources conflict, follow repository authority and load the smallest additional source needed to resolve it.

See [optional providers](providers.md) for provider contracts, setup boundaries, and precedence.

## Failure Modes

- No active task: use explicit human scope and changed paths; create/select a task when work is non-trivial.
- Weak ranking: narrow the scope or use L1 instead of loading the full repository.
- Provider unavailable/error/timeout: continue with local context and report provider status; never block safe work solely on an optional provider.
- Stale Graphify snapshot: inspect changed code directly and refresh the graph before relying on impact relationships.
- Budget exceeded: narrow scope or reduce level. Increase budget only when broader evidence is genuinely needed.
- Missing router: fall back to `AGENTS.md`, `CONTEXT.md`, active task, affected PRD, and current code.
