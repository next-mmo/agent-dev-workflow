# Agent Workflow Scrum Task Board

Task files implement the Agent Workflow Scrum backlog and delivery states. The filename prefix and directory control the board column.

| Prefix | Location | Column | Meaning |
| :--- | :--- | :--- | :--- |
| `todo-` | `.agents/docs/tasks/` | TODO | Ready for implementation |
| `wip-` | `.agents/docs/tasks/` | WIP | Actively in progress |
| `blocked-` | `.agents/docs/tasks/` | BLOCKED | Waiting on an external dependency or decision |
| `done-` | `.agents/docs/tasks/done/` | DONE | Implemented, verified, and retained as increment evidence |

## Scrum Mapping

| Scrum concept | Repository artifact |
| :--- | :--- |
| Product Backlog | PRDs and `todo-*` tasks |
| Sprint Backlog | Current `wip-*` task and checklist |
| Impediment | `blocked-*` task with evidence |
| Increment | `.agents/docs/tasks/done/done-*` record with verification results |
| Retrospective learning | [`../proposals/`](../proposals/) proposal |

## Rules

1. **Active root:** Keep only `todo-*`, `wip-*`, and `blocked-*` tasks directly in `.agents/docs/tasks/`.
2. **Completion:** Move a verified task to `.agents/docs/tasks/done/done-*.md`; preserve its task ID and evidence.
3. **Archival:** Move completed records older than 30 days from `done/` to `.agents/docs/tasks/archived/YYYY/` when archival is enabled.
4. **No duplication:** A task record exists in exactly one lifecycle directory.
5. **Namespace:** Do not create workflow task records under a root `docs/` tree; `.agents/docs/tasks/` is canonical.
