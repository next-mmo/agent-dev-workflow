# Proposal 0011: Correct Beta Measurement and Memory Claims

> Status: accepted  
> Created: 2026-09-04  
> Decision owner: Human  
> Canonical targets: `scripts/context-benchmark.mjs`, `packages/agent-workflow-scrum/engine/context/providers/memory.mjs`, `.agents/docs/testing.md`, `.agents/docs/memory/README.md`

## Evidence and Scope

Beta review reproduced recall of an unfinished Vite solution and established that the benchmark compares all tracked text with one context pack. It contains no equivalent-task token accounting. See [task 0029](../tasks/done/done-0029-0005-realistic-todo-workspace.md).

## Human Decision

- **Decision:** Accepted by the user on 2026-09-04: “fix it”, followed by “continue.”

The user requested “fix it” after the review on 2026-09-04, then “continue.” This authorizes the reviewed corrections: exclude draft/placeholder memory, narrow measurement claims, and repair the Todo regressions. It does not authorize unrelated changes to workflow ceremony defaults or remote providers.

## Changes and Tradeoffs

- Emit benchmark schema v2 with `reduction` and `actualTaskTokenSavings: null`. Human output describes context-size reduction and unmeasured task savings. Consumers of the former `savings` field must update.
- Exclude explicit draft/proposed/template entries and angle-bracket-only summary placeholders from native recall. Completed legacy entries remain eligible without adding a status. Drafts remain on disk for authors to finish.
- Eligibility is a content filter, not a correctness guarantee; current code and fresh evidence remain necessary.

## Validation

Focused Todo, memory, and benchmark regressions pass **29/29**. The production fixture query excludes the draft/placeholder entries; the package-owned build, distribution drift check, strict workflow check, full **89/89** test suite, and documentation check pass. The benchmark reports context-pack reduction separately and leaves actual task token savings unmeasured.
