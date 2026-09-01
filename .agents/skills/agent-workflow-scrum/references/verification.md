# Verification and Evidence

Use the narrowest checks that can actually prove the changed behavior, then add broader checks when the affected boundary requires them.

- Frontend: normal/loading/empty/error/offline states as relevant; keyboard/accessibility/responsive behavior; browser console; build.
- API: contract, validation, authorization, negative paths, retries/idempotency/concurrency as relevant.
- Domain: deterministic unit/boundary/property tests where useful.
- Data: constraints, migration compatibility, rollback/restore evidence.
- Security: denial paths, dependency/secret review, trust boundaries.
- Operations/release: config, health/metrics/logs, staged rollout and rollback trigger.

For completed multi-step tasks record compact claim-to-proof evidence:

```markdown
## Evidence Ledger
| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Criterion | command, artifact, or visible flow | Passed/failed/skipped |
```

Never call skipped/unverified work passed. Separate baseline/environment failures from regressions caused by the change. Before handoff run `npm run workflow:check` plus relevant tests/build and `scripts/skill.sh check` when skills changed.
