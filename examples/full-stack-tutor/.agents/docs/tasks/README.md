# Agent Workflow Scrum Task Board

Task filenames control lifecycle state:

| Prefix and location | State |
| :--- | :--- |
| `todo-*` in this directory | Ready |
| `wip-*` in this directory | Active |
| `blocked-*` in this directory | Blocked |
| `done-*` in `done/` | Verified increment |

Keep at most one `wip-*` or `blocked-*` task. A task exists in one lifecycle location only. Completion requires acceptance criteria, fresh evidence, and human acceptance; do not treat a passing test as self-approval.
