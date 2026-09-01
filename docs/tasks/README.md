# Agent Workflow Scrum Task Board

Task files implement the Agent Workflow Scrum backlog and delivery states.
The filename prefix and directory control the board column:

<!-- markdownlint-disable MD013 -->

| Prefix | Location | Column | Meaning |
| :--- | :--- | :--- | :--- |
| `todo-` | `docs/tasks/` | TODO | Ready for implementation |
| `wip-` | `docs/tasks/` | WIP | Actively in progress |
| `blocked-` | `docs/tasks/` | BLOCKED | Waiting on an external dependency or decision |
| `done-` | `docs/tasks/done/` | DONE | Implemented, verified, and retained as increment evidence |

<!-- markdownlint-enable MD013 -->

## Scrum Mapping

| Scrum concept | Repository artifact |
| :--- | :--- |
| Product Backlog | PRDs and `todo-*` tasks |
| Sprint Backlog | Current `wip-*` task and checklist |
| Impediment | `blocked-*` task with evidence |
| Increment | `docs/tasks/done/done-*` record with verification results |
| Retrospective learning | [`docs/suggestions/`](../suggestions/) proposal |

## Rules

1. **Active root:** Keep only `todo-*`, `wip-*`, and `blocked-*` tasks directly
   in `docs/tasks/`.
2. **Completion:** Move a verified task to `docs/tasks/done/done-*.md`; preserve
   its task ID and evidence.
3. **Archival:** Move completed records older than 30 days from `done/` to
   `docs/tasks/archived/YYYY/`.
4. **No duplication:** A task record exists in exactly one lifecycle directory.
