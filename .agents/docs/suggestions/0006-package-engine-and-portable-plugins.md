# Suggestion 0006: Package the Workflow Engine and Keep Consumer Repositories Thin

> **Status:** applied  
> **Created:** 2026-09-03  
> **Proposed by:** Human user  
> **Decision owner:** Human  
> **Canonical targets:** `packages/agent-workflow-scrum/`, `plugins/agent-workflow-scrum/`, workflow architecture and onboarding

## Observation

Copying `.agents/scripts/`, `.agents/skills/`, and `.agents/benchmark/` into every adopting repository mixes reusable engine code and evaluation assets with company product code. Consumers then own duplicated updates, larger diffs, and policy files they may not want to expose.

## Evidence

- The existing Tauri adoption copied reusable scripts and skills into the application repository.
- npm project-local binaries can expose one versioned command without requiring a global installation.
- Agent plugins can carry reusable skills and commands outside the consumer repository.
- `yalc` is useful for local package iteration but does not provide a reproducible release contract.

## Workflow Change

- Publish the reusable engine as `@next-mmo/agent-workflow-scrum` with the local `agent-workflow` binary.
- Keep consumer-owned state limited to root instructions/context, `.agents/config.json`, and `.agents/docs/` PRD, task, suggestion, and evidence records.
- `init` must never copy `.agents/scripts/`, `.agents/skills/`, `.agents/benchmark/`, Counter App code, or this repository's history.
- Provide portable Agent/Cursor and Codex plugin manifests whose bundled skills call the local engine.
- Recommend a project-local pinned dependency. Use `yalc` only while developing the package before publication.
- Keep optional Graphify and OpenViking providers advisory and disabled unless explicitly selected.

## Expected Benefit

- Smaller, auditable consumer diffs and fewer duplicated workflow updates.
- Reproducible engine versions per repository without a required global install.
- Agent guidance remains available through editor/runtime plugins while company repositories retain only project-specific workflow state.
- Tarball-level fixture tests can prove what is shipped and what `init` writes.

## Scope and Exceptions

- Applies to new and existing repositories adopting Agent Workflow Scrum.
- The workflow's own source repository may retain canonical scripts, skills, benchmarks, demo code, and historical evidence.
- A consumer may intentionally vendor additional assets under an explicit local policy, but `init` does not do so.

## Tradeoffs and Risks

- Consumers need Node.js and a supported package manager to run the engine.
- Plugin and npm package releases must stay compatible; tests must detect drift.
- Existing vendored installations require a deliberate migration after a package version is available.
- Publishing is an external write and remains a separate human-authorized action.

## Validation

- Pack the real npm tarball and install it into temporary npm and pnpm repositories.
- Exercise `init`, context routing, scope, verification planning, workflow/doc checks, report generation, and diagnostics through the installed binary.
- Assert that initialized repositories contain none of the excluded reusable or benchmark directories.
- Validate the Codex manifest and check generated plugin skills against their canonical sources.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human user
- **Date:** 2026-09-03
- **Rationale:** The user approved the isolated package-engine and portable-plugin plan, with publication and Tauri cleanup deferred until the package is proven publishable.

## Application Evidence

- Changed canonical files: `packages/agent-workflow-scrum/`, `plugins/agent-workflow-scrum/`, `scripts/build-distribution.mjs`, configured workflow engines, and onboarding/architecture docs; tracked by task 0028.
- Verification results: 59/59 tests, Vite build, strict workflow/docs checks, distribution drift check, real npm/pnpm packed-fixture command smoke tests, plugin manifest validation, canonical-skill audit, and skill quick validation passed.
- Follow-up: publish and migrate the Tauri repository only after separate authorization.
