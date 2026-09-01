# Progressive Context Routing

Use context as a funnel, not a dump. The goal is to retrieve enough evidence to act safely without repeatedly loading the entire workflow history.

## Levels

| Level | Default use | Content |
| :--- | :--- | :--- |
| L0 | every non-trivial start | branch, changed paths, active task, ranked PRD/docs, rule hints, compact summaries |
| L1 | implementation or ambiguity | bounded excerpts from the highest-ranked task/PRD/context sources |
| L2 | explicit deep review/recovery | larger source content, still bounded by the requested token budget |

Commands:

```bash
npm run context -- "auth session timeout"
npm run context -- "auth session timeout" --level 1
npm run context -- "release rollback" --level 1 --budget 2200
npm run context -- "deep recovery" --full --budget 5000
npm run context -- "api contract" --json
```

The default budget is approximately 1,500 tokens. Estimates use characters/4 and are deliberately approximate.

## Retrieval Rules

1. Preserve the human's exact scope as the primary query.
2. Prefer the active task and affected PRD over historical completed tasks.
3. Use current Git changes and file names as relevance signals.
4. Route identity/session/login work to security; release/migration to release; tests/UI/bugs to verification; implementation/API/data to delivery.
5. Read current code and tests directly before editing them. A context pack never proves runtime behavior.
6. If sources conflict, report the conflict and load the smallest additional source needed to resolve it.

## Failure Modes

- No active task: use explicit human scope and changed paths; create/select a task when the work is non-trivial.
- Weak ranking: narrow the scope phrase or use L1; do not jump to full-repo loading by default.
- Budget exceeded: narrow scope or reduce level. Increase the budget only when the task genuinely needs broader evidence.
- Missing script: fall back to `AGENTS.md`, `CONTEXT.md`, active task, affected PRD, and current code; do not block safe work solely on the router.
