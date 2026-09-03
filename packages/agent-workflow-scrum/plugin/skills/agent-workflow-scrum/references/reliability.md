# CI and Test Reliability

Load this reference only when the change touches asynchronous/resource-owning tests, subprocesses, workers, sockets/ports, shared files, process-global state, timeouts, teardown, or CI concurrency.

## Reliability Rules

- Model every owned resource: who allocates it, how readiness is observed, how cleanup is registered, and what proves cleanup reached quiescence.
- Allocate atomically. Prefer OS-assigned ports, per-test temporary directories, unique namespaces, and exclusive creation over "check then claim" patterns.
- Treat `process.env`, cwd, timers, locale/timezone, global mocks/hooks, registries, and `globalThis` mutation as shared mutable resources. Restore the exact previous state in the smallest possible scope.
- Synchronize on events, state transitions, barriers, or owned promises. Fixed sleeps are not correctness evidence.
- `abort()`, `close()`, or `kill()` is not complete teardown until the owned completion/exit/close signal is awaited.
- A race test should deterministically prove overlap; repeated runs alone are only stress evidence.
- New guards/static rules should include a negative control that deliberately introduces the rejected case and proves the intended gate fails.
- Prefer observations that hold across supported platforms. Explicitly skip genuinely platform-specific semantics instead of weakening assertions everywhere.

## Flake Diagnosis

Do not call increased timeouts, retries, serialization, swallowed errors, weaker assertions, or sleeps a root-cause fix unless the boundary is explicitly transient/external. Identify the awaited state or shared resource first.

Report exact failing commands and observed evidence. A skipped, retried, timed-out, or pending check is not a pass.
