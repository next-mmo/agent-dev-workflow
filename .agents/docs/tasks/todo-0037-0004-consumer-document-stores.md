# Task 0037: Consumer Document Stores

> Status: todo
> Created: 2026-09-06
> Related PRD: `.agents/docs/prd/0004-workflow-distribution.md`

## Change Contract

- Human outcome: fresh consumers receive the complete project-owned workflow document layout used by the ND example.
- Authorization: the human requested that the consumer example match the workflow source layout except for model recommendations.
- Scope: initializer templates, diagnostics, report sources, consumer example, documentation, and distribution tests.
- Non-goals: copying runtime packages, reusable skills, benchmarks, caches, source history, or model-specific recommendations.
- Risk: low; initialization is additive and preserves existing files.
- Verification: fresh/example initialization, doctor, distribution fixtures, full test suite, build, workflow, docs, and distribution checks.
- Recovery: revert this task's scaffold/template/docs changes; existing consumer files remain preserved by init semantics.

## Acceptance Criteria

- [ ] Fresh consumers contain README-backed `evidence`, `memory`, `plans`, `prd`, `proposals`, `solutions`, and `tasks` documentation stores.
- [ ] Fresh consumers do not receive `model-recommend.md`, benchmark/cache assets, skills, or workflow source packages.
- [ ] Existing consumers gain only missing scaffold files; existing documentation remains unchanged.
- [ ] The vanilla fullstack example and installed distribution fixtures pass `doctor` and workflow checks.

## Evidence Ledger

- `rtk node packages/agent-workflow-scrum/bin/agent-workflow.mjs init --root examples/vanilla-fullstack --existing --json` created the missing quickstart and evidence, memory, plans, and solutions README stores while preserving existing consumer files.
- `rtk node packages/agent-workflow-scrum/bin/agent-workflow.mjs doctor --root examples/vanilla-fullstack --json` passed with no errors or warnings.
- `rtk node --test tests/package-distribution.test.mjs` passed 6/6 distribution and consumer-initialization tests.
- `rtk npm test` passed 127/127 tests; `rtk npm run build`, `rtk npm run workflow:check -- --mode strict`, `rtk npm run docs:check`, `rtk npm run distribution:check`, and `rtk git diff --check` passed.
- Human acceptance remains pending for the requested consumer-layout change.
