# AGENTS.md — Workflow Documentation

These rules apply under `.agents/docs/` and supplement the root standing orders. Use the prose skill for editorial judgment; keep this file as compact placement/ownership policy.

## One home per fact

Put each durable fact in the document whose job owns it; elsewhere, link rather than restate.

| Home | Owns | Does not own |
| :--- | :--- | :--- |
| `architecture.md` | composition, ownership, data/control flow, extension points | decision history, task checklists |
| `agent-workflow.md` | universal delivery/risk process | product requirements |
| `prd/` | current product requirements and precedence | implementation evidence |
| `tasks/` | current increment, acceptance, recovery state | reusable workflow policy |
| `tasks/done/` | completed evidence | current task authority |
| `suggestions/` | workflow rationale, alternatives, human decisions | product requirements |
| `development.md` | setup and daily contributor commands | architecture rationale |
| root `README.md` | onboarding and navigation | exhaustive copies of deeper rules |

## Current-state prose

- Durable docs describe current behavior. Put change history, rejected alternatives, and trade-offs in the owning suggestion/task/commit instead of narrating “previously/now/no longer” everywhere.
- Preserve complete propositions: actor, action, condition/timing, must/may/never, failure/exception, ownership, and consequence when relevant.
- Comments/JSDoc explain non-obvious contracts, invariants, ownership, timing, security, or failure behavior. Delete control-flow narration and code restatement.
- Tests may explain non-obvious fixture/observation design, not walk through the implementation.
- Prompts, diagnostics, CLI text, and UI copy are behavior; review wording with the same care as code when it changes user/model-visible meaning.

## Structure and links

- Prefer direct concrete terms over metaphorical framework language when an exact API, field, operation, path, or rule can be named.
- Keep root/subtree standing orders short and link to the owning detailed document.
- Use relative Markdown links for repository references so workflow/documentation checks can verify them.
- Do not hand-maintain an inventory when source or a generated report is the real authority.
- Do not recreate a root `docs/` directory for Agent Workflow Scrum artifacts; `.agents/docs/` is the canonical workflow-document root.

## Budget discipline

When a standing document grows, first relocate detail to its owner, then condense. Raise a budget only when the content genuinely belongs there. Token ceilings are regression guardrails, not deletion targets.
