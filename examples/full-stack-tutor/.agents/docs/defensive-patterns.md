# Defensive Patterns

- Validate untrusted input at the owning boundary. Reject invalid state without partial mutation or loss of prior valid data.
- Propagate actionable errors with the failing operation and recovery step. Never turn an unexpected failure into apparent success or log secrets.
- Keep writes atomic where the storage supports it. Define conflict behavior before permitting concurrent writers and retain a rollback or recovery path.
- Bound network calls and subprocesses with timeouts and cancellation. Retry only when safe and account for operations that may have succeeded before the response was lost.
- Give each resource one owner. Close workers, processes, files, and sockets on success and failure; await completion before reporting teardown finished.
- Keep domain rules testable independently of browser or server globals. Make ordering and persistence invariants explicit where they are enforced.
- Preserve unrelated work and existing user files during initialization and repair. Diagnose legacy state before migrating it.

Verify relevant failure paths using [the testing guide](testing.md). Record product-specific exceptions and recovery procedures in [architecture](architecture.md) and the owning task.
