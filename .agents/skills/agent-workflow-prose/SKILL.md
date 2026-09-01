---
name: agent-workflow-prose
description: "Use when writing, reviewing, trimming, or restoring repository prose: Markdown, comments/JSDoc, prompts, diagnostics, CLI/UI strings, task/PRD wording, and agent instructions. Preserve complete contracts while removing duplication and reasoning narration."
---

# Agent Workflow Prose

Write enough to preserve the contract, then remove repetition, implementation narration, and decoration. This skill is editorial guidance, not an excuse to rewrite unrelated text.

## Scope

Work only inside the user/task-authorized scope. Read the applicable `AGENTS.md`, [`docs/AGENTS.md`](../../../docs/AGENTS.md), and the code/behavior that owns the prose before judging it. Generated artifacts are derivative: edit the owner first, then regenerate.

## Preserve the complete proposition

Before trimming or rewriting, preserve every relevant fact:

- actor and action;
- condition, timing, and ordering;
- must/may/never modality;
- negative guarantee and exception;
- ownership and side effect;
- failure mode and consequence.

Shorter text is not better if it loses one of these. Keep non-obvious rationale locally only when its absence could plausibly cause misuse; otherwise link to the rationale owner.

## One home per fact

Follow the documentation ownership table in `docs/AGENTS.md`. Keep standing instructions compact. Put architecture maps in `docs/architecture.md`, product requirements in PRDs, current increment/evidence in tasks, reusable workflow rationale in suggestions, and contributor commands in development docs. Link instead of copying substantial detail.

Durable docs describe current behavior. Put change history and rejected alternatives in suggestions/tasks/commits rather than scattering “previously/now/no longer” through current-state docs.

## Required coverage by location

- **Public API/JSDoc:** caller-visible returns, failures, side effects, ownership, timing/cancellation, and durability when non-obvious.
- **Internal comments:** invariants, race ordering, ownership, security boundaries, and surprising failure behavior; never narrate obvious control flow.
- **Tests:** explain only non-obvious fixture/observation/platform design, not an implementation walkthrough.
- **README/guides:** configuration, semantics, limitations, extension points, real entry path, and observable verification at the document's owning level.
- **Agent instructions/skills:** behavioral guardrails, scope limits, authority, and links to detailed owners; avoid giant universal checklists.
- **Prompts/tool schemas/visible strings:** wording is behavior. Keep only task-relevant concepts and verify affected user/model-visible output.
- **Diagnostics:** name the failing subject, violated rule, and correction when non-obvious; omit internal execution narration.

## Review method

1. Confirm scope and applicable subtree instructions.
2. Inspect the owning code/behavior and exact outgoing diff when reviewing a branch.
3. Classify prose as keep, add, trim, relocate, or defer.
4. Apply only clear authorized changes; do not manufacture edits to hit a word-count target.
5. Run the narrow documentation/workflow checks plus behavior tests for visible/model-facing wording.
6. Report changed/kept/deferred cases and exact checks actually run.

Prefer direct names for APIs, fields, operations, paths, and rules. Use abstract terms such as “contract”, “boundary”, or “seam” only when they name the actual technical concept rather than decorate the sentence.
