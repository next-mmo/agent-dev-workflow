# Workflow Documentation Instructions

Keep project-owned workflow documents under `.agents/docs/`. Humans own priority, acceptance, and policy decisions.

| Document | Owns |
| :--- | :--- |
| [agent-workflow.md](agent-workflow.md) | Delivery and risk gates |
| [architecture.md](architecture.md) | Product composition, ownership, and data flow |
| [development.md](development.md) | Setup and contributor commands |
| [testing.md](testing.md) | Verification strategy and evidence |
| [defensive-patterns.md](defensive-patterns.md) | Failure handling and resource safety |
| [prd/](prd/) | Current product requirements |
| [tasks/](tasks/) | Scoped work and verification evidence |
| [proposals/](proposals/) | Workflow rationale and human decisions |

Link to the owning document instead of duplicating policy. Preserve actors, conditions, failure behavior, and approval requirements when editing prose. Keep architecture and development guidance grounded in current product code; initialization cannot infer the product's design. Existing documents remain authoritative until reviewed. Respect `docBudgets` in `.agents/config.json`; move detail to its owner before expanding standing context.
