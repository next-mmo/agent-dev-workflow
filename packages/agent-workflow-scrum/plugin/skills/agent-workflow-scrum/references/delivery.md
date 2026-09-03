# Risk-Scaled Delivery

## Fast Path

For an isolated typo, comment, tiny CSS change, or one-line defect: reproduce, make the smallest change, run the narrowest relevant check, and report it. Do not create ceremony that costs more than the risk.

## Standard / High-Risk Path

1. Inspect current Git state, affected code/dependencies, and baseline checks.
2. Keep exactly one active `wip-*` or `blocked-*` task.
3. Record a compact change contract:

```markdown
## Change Contract
- Human outcome:
- Acceptance evidence:
- Non-goals:
- Affected layers and owners:
- Risk level and required approvals:
- Baseline:
- Verification plan:
- Rollback or recovery:
```

4. Implement the smallest reviewable vertical slice; update affected PRD/index with behavior changes.
5. Verify at the real user boundary plus relevant automated layers.
6. Perform an independent final review against the contract.
7. Close only when all required evidence passes; otherwise keep active/blocked and name unverified criteria.

High-risk work includes auth/authorization, payments, destructive data migration, production infrastructure, secrets, and external side effects. Require explicit human scope, threat/risk review, rollback, staged operation, and observable success signals.
