# Progressive Context Routing

Use context as a funnel, not a dump. Retrieve enough evidence to act safely without repeatedly loading the entire workflow history.

## Levels

| Level | Default use | Content |
| :--- | :--- | :--- |
| L0 | every non-trivial start | branch, changed paths, active task, ranked PRD/docs, rule hints, bounded provider evidence |
| L1 | implementation or ambiguity | bounded excerpts plus optional provider evidence |
| L2 | explicit deep review/recovery | larger repository source content, still under the requested total budget |

```bash
agent-workflow context -- "auth session timeout"
agent-workflow context -- "auth session timeout" --level 1
agent-workflow context -- "review auth" --base origin/main --level 1
agent-workflow context -- "release rollback" --level 1 --budget 2200
agent-workflow context -- "deep recovery" --full --budget 5000
agent-workflow context -- "api contract" --json
```

Run the binary through the package manager configured in `.agents/config.json`, such as `pnpm exec agent-workflow` or `npm exec -- agent-workflow`. The workflow source repository also provides npm aliases.

The default total budget is approximately 1,500 tokens. Estimates use characters/4 and are deliberately approximate. Local and optional provider content share this one budget; provider quotas cannot increase it. Final output is hard-capped; tight budgets compact summaries and low-priority path detail, while an impossible scope fails with an actionable narrowing message.

## Outgoing Scope

`git status` sees local dirty files but misses already-committed branch changes when the worktree is clean. Before PR review, pre-push verification, or handoff where committed scope matters:

1. Verify the live PR base or stack parent from current repository/forge state.
2. Run `agent-workflow scope --base <verified-ref>` through the configured package manager.
3. Pass the same `--base <verified-ref>` to `agent-workflow context` or `agent-workflow verify`.

The scope command resolves base/head and their unique merge base, then reports committed, staged, unstaged, and untracked paths separately. It never guesses or fetches a base. An explicit but wrong base remains visible in the report instead of being hidden behind inference.

## Retrieval Rules

1. Preserve the human's exact scope as the primary query.
2. Prefer the active task and affected PRD over historical material.
3. Use explicit outgoing scope when supplied; otherwise use current Git worktree changes as local relevance signals.
4. Route identity/session/login work to security; release/migration to release; tests/UI/bugs to verification; async/CI/race/timeout/subprocess work to reliability; implementation/API/data to delivery.
5. In `auto`, use Graphify only when its local graph exists. OpenViking requires explicit `--provider openviking` or `--provider all` because its server may be remote.
6. Read current code and tests directly before editing them. Context/provider output never proves runtime behavior.
7. If sources conflict, follow repository authority and load the smallest additional source needed to resolve it.

See [optional providers](providers.md) for provider contracts, setup boundaries, and precedence.

## Failure Modes

- No active task: use explicit human scope and changed paths; create/select a task when work is non-trivial.
- Wrong/missing review base: stop scope-based review and verify the live target; do not infer from branch names or upstream configuration.
- Weak ranking: narrow the scope or use L1 instead of loading the full repository.
- Provider unavailable/error/timeout: continue with local context and report provider status; never block safe work solely on an optional provider.
- Stale Graphify snapshot: inspect changed code directly and refresh the graph before relying on impact relationships.
- Budget exceeded: narrow scope or reduce level. Increase budget only when broader evidence is genuinely needed.
- Product synchronization failure: create/select one active task with a canonical affected PRD, acceptance criteria, and evidence ledger; keep the PRD index entry current.
- Missing router: fall back to `AGENTS.md`, `CONTEXT.md`, active task, affected PRD, and current code.
