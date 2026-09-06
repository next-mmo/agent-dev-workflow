# Testing and Evidence

Run the configured checks in `.agents/config.json`. Add product-specific test commands and coverage boundaries here after inspecting the application. A missing configured test or build command is a coverage gap, not a pass.

- Verify observable behavior through the real user or installed CLI entry point, plus focused domain tests where useful.
- Cover normal and relevant failure cases: invalid input, failed persistence, denied access, stale state, unavailable integrations, and recovery as applicable.
- For a new guard or validator, deliberately supply an invalid case and prove that it fails for the intended reason.
- For asynchronous tests, synchronize with events or state signals. Allocate isolated temporary directories and OS-assigned ports, restore changed globals, and await resource cleanup. Fixed sleeps and blanket retries do not prove correctness.
- Use explicit, verified Git bases when selecting outgoing checks: `npm exec -- agent-workflow verify --base <verified-ref>`. Add semantic checks that path selection cannot infer.
- Before handoff run `npm exec -- agent-workflow check` and `npm exec -- agent-workflow docs` alongside relevant product checks.

Record the claim, exact command or observed interaction, and result in the owning [task](tasks/README.md). Report skips, timeouts, environment blockers, and unverified criteria separately from passes. Human acceptance remains distinct from automated evidence. Consult [defensive patterns](defensive-patterns.md) for resource and failure invariants.
