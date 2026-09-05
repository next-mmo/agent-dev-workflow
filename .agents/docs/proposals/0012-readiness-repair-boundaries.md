# Proposal 0012: Make Readiness Tools Report Observed Evidence

> Status: accepted
> Created: 2026-09-05
> Decision owner: Human
> Canonical targets: package review, initialization, indexing, PRD-sync tools and distribution requirements

## Human Decision

- **Decision:** The user requested “continue” after the review recommended these specific repairs on 2026-09-05. Apply those local corrections; publication and unrelated workflow policy changes remain outside scope.

## Evidence and Changes

The [completed task](../tasks/done/done-0029-0005-realistic-todo-workspace.md) records the reproduced failures. Use the shared Git scope collector for review, distinguish failed/skipped inspection from success, provide package fallback templates, and share product-path discovery across indexes.

PRD sync becomes a read-only list of outstanding criteria and related tracked task records. These are evidence pointers for human assessment, never proof of acceptance. Remove Counter-specific keyword acceptance and report the changed JSON semantics with schema version 2. Existing `--dry-run` callers remain supported; all invocations are advisory.

## Tradeoffs and Validation

Static review remains a limited pattern scan, not independent agent review or a security guarantee. PRD-sync consumers must adopt the advisory result schema. Verify failure controls, installed commands, custom product paths, unchanged PRD bytes, full tests and repository checks before marking the repair applied.
