# Testing Policy

This page owns the repository's testing principles. Exact commands live in the root/package scripts; verification selection lives in the workflow skill.

## Evidence tiers

Use the lowest-cost tier that proves the changed contract, then add a higher tier only when the real boundary requires it.

- **Unit/domain tests:** deterministic logic, edge cases, error paths, state transitions, parsing, budgeting, ranking, and policy rules.
- **Integration/real-composition tests:** interactions among real local components where mocks could hide wiring, lifecycle, registration, configuration, or serialization defects.
- **Built/real-entry-path smoke:** the executable or artifact users/agents actually run when source-mode tooling can mask module/build/package failures.
- **User/API/data acceptance:** externally observable behavior at the product boundary; verify files, responses, events, UI, or persisted state rather than trusting a component's own success message.
- **External-provider e2e:** only when credentials/environment are available and the provider behavior itself matters. Keep secretless contributors unblocked and report skips honestly.

Coverage is useful for finding unexecuted code, but a covered line does not prove the feature works. An uncovered branch may be dead code to remove rather than a requirement to add a meaningless assertion.

## Select from exact outgoing scope

For PR/push/handoff work, first verify the live base and run `change:scope`, then `verify:plan`. The planner may select focused workflow tests, product tests, build, adapter checks, or workflow consistency based on affected paths.

Changed paths are incomplete evidence for configuration, dynamic loading, workers, subprocesses, generated artifacts, providers, and external systems. Add the owning test for those boundaries explicitly.

## Test the regression, not the implementation

- Observe the intended failure before the fix when practical.
- New static/workflow guards include a negative control that deliberately introduces the rejected state.
- Race tests deterministically establish overlap with barriers/events/promises.
- Assertions observe outputs, durable state, files, logs, events, process exits, or cleanup state; avoid restating private implementation steps.
- A test that only passes when run alone is defective when CI legitimately runs it concurrently.

## Real entry path

If users run a built CLI, browser bundle, worker, subprocess, plugin loader, generated adapter, or packaged artifact, at least one relevant check should exercise that shipped entry path when the change can break it. Source-level tests can miss exports, module resolution, generation, packaging, or process-launch defects.

## Resource ownership and reliability

Tests owning ports, temporary paths, subprocesses, workers, timers, globals, environment variables, or external namespaces follow [`defensive-patterns.md`](defensive-patterns.md) and the reliability skill reference. Allocate atomically, synchronize on observable state, restore globals exactly, and await teardown to quiescence.

Retries and broader timeouts may bound documented transient external boundaries. They are not a substitute for identifying a deterministic local race or leaked resource.

## Reporting

Record the exact command/scenario and observed result. Keep these states distinct: passed, failed, skipped, timed out, blocked by environment, and pending CI. Never upgrade one into another for a cleaner handoff.

## Context benchmark

Run `npm run benchmark:context -- "<scope>" --provider local --level 1 --budget 1500` to compare a naive raw baseline with the real bounded context entry path. Raw means all tracked UTF-8 text; bounded output is the context router's measured pack. Token savings are comparable, while timings are local measurements rather than stable performance claims.
