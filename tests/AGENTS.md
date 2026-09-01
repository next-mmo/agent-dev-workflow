# AGENTS.md — Tests

These rules apply under `tests/` and supplement the root standing orders.

- Tests describe observable behavior and regression contracts; they do not become authority merely because they already exist.
- Prefer the real entry path and externally observable state over assertions on a component's own self-report.
- Mock only the expensive/nondeterministic boundary when practical; keep downstream workflow composition real.
- New guards, parsers, lifecycle checks, and policy validators need a negative control that proves the intended invalid case fails.
- For races/concurrency, use barriers, events, or owned promises to prove overlap. Repetition alone is stress evidence, not a deterministic race test.
- Allocate ports, temp roots, namespaces, and shared resources atomically. Do not check availability and claim later.
- Restore process-global state exactly and in `finally`; cleanup must await child exit/server close/worker termination when owned work can outlive the assertion.
- Fixed sleeps, blanket retries, global serialization, swallowed errors, and weakened assertions are not root-cause flake fixes.
- Preserve platform semantics. Explicitly skip a genuinely unsupported platform case with a reason instead of weakening the assertion for all platforms.
- Report skipped, timed-out, retried, or environment-blocked checks as such; never label them passed.

See [`../docs/testing.md`](../docs/testing.md) and the reliability reference for deeper guidance when the test owns async or host resources.
