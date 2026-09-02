# Task 0026: Benchmark Raw Versus Bounded Context

> **Status:** wip
> **Scrum Artifact:** active increment
> **Created:** 2026-09-02
> **PRD:** No product PRD change required; context tooling only.

## Change Contract

- **Human outcome:** contributors can measure how much the bounded context router reduces a naive whole-repository text prompt without depending on optional providers.
- **Acceptance evidence:** a read-only benchmark reports raw tokens, bounded tokens, savings, reduction percentage, and timing; a fixture regression proves meaningful reduction and the budget contract.
- **Non-goals:** do not change product behavior, send repository content to external services, install providers, or treat benchmark output as acceptance authority.
- **Affected layers:** context tooling, package scripts, development guidance, and dependency-free tests.
- **Risk:** low; filesystem/Git text classification and timing are local benchmark concerns, not product correctness gates.
- **Recovery:** revert the benchmark script, package command, documentation, test, and this task.

## Acceptance Criteria

- [ ] The benchmark compares a documented naive raw repository text baseline with the real bounded context entry path.
- [ ] The benchmark uses local retrieval by default, supports an explicit scope/level/budget, and reports context budget status without printing the full pack.
- [ ] A deterministic fixture proves the bounded pack is smaller than the raw baseline and remains within budget.
- [ ] Benchmark output is machine-readable with a versioned schema and human-readable by default.
- [ ] Usage and interpretation are documented without claiming timing results are stable across machines.
- [ ] Focused and full verification checks pass.

## Evidence Ledger

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| Raw versus bounded measurement | Benchmark CLI output on the repository and deterministic fixture | Pending |
| Budget/provider boundary | Local-provider benchmark regression | Pending |
| Usage documentation | Development guide and command reference | Pending |
| Full regression | `npm test`, build, strict workflow/docs checks, and skill audit | Pending |
