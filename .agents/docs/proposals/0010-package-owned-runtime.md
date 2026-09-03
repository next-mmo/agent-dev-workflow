# Proposal 0010: Package-Owned Runtime

> **Status:** accepted
> **Created:** 2026-09-04
> **Proposed by:** Human user
> **Decision owner:** Human
> **Canonical targets:** `packages/agent-workflow-scrum/`, root package scripts, development helpers, architecture

## Evidence and Change

Root aliases bypass the package CLI, while distribution builds copy `.agents/scripts/` into package `engine/`. Direct probes show package-only `--root` failures in `worktree` and `solve`, and ignored roots in `prdsync`.

Make the package runtime canonical. Root aliases invoke the local package binary, linked by npm from a local dependency. Keep project configuration/docs and canonical skills under `.agents/`; move development-only executable helpers to root `scripts/`. Generate only portable plugin copies, not a second engine implementation.

This narrows proposal 0006's source-repository exception: source skills, benchmark data, demo code, and history remain allowed; duplicated engine scripts do not.

## Benefit, Tradeoffs, and Validation

- One runtime and public command path eliminate generated-engine drift and local/package parser divergence.
- Legacy direct `.agents/scripts` paths are removed; root npm aliases remain stable. Contributors must install the locked local package to create npm's bin link.
- Verify root aliases, packed npm/pnpm commands, alternate target roots, non-mutating dry-runs, source retention during distribution builds, and plugin skill parity.
- Publication and other-repository migration remain out of scope. Recovery reverses the tracked refactor and reinstalls the prior lockfile.

## Human Decision

- **Decision:** accepted
- **Decided by:** Human user
- **Date:** 2026-09-04
- **Rationale:** The user requested direct package-bin commands without `.agents/scripts`, then requested npm-local bin linking for aliases such as `plan`.

## Application Evidence

Implementation and evidence: [plan 0002](../plans/0002-package-owned-cli.md). Automated verification is complete; human acceptance and publication remain separate.
