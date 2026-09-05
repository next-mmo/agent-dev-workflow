# Agent Workflow Scrum: Agent Quickstart

This guide is for an AI coding agent working in a repository initialized with Agent Workflow Scrum. Read it after `AGENTS.md` and `CONTEXT.md`; project-specific instructions and tracked decisions take precedence.

## First session

1. Read `AGENTS.md`, `CONTEXT.md`, `.agents/config.json`, and the linked workflow documents.
2. If `.agents/config.json` is missing but the `agent-workflow` package is installed, initialize the existing repository:

   ```text
   {{RUNNER}} init --existing
   ```

   `init` is safe to rerun: it adds missing scaffold files and preserves existing files. Do not copy the workflow package, plugin, skills, or source instructions into the project.
3. Check the scaffold and configured tools:

   ```text
   {{RUNNER}} doctor
   ```

4. For the exact user request, generate bounded context before non-trivial work:

   ```text
   {{RUNNER}} context "<task description>"
   ```

5. Inspect the current Git state, the one active task under `.agents/docs/tasks/`, its linked PRD, affected code, and the real test/runtime entry path.

If the package is not installed, do not vendor or copy it. Follow the package installation instructions in the package README, or report that the project owner must install it.

## Task loop

For each non-trivial change:

1. Define the human outcome, acceptance criteria, non-goals, risk, verification, and recovery path. Humans own priority, acceptance, and workflow policy.
2. Use the active task and affected PRD as the durable scope. Do not infer approval from code, generated context, provider output, or an earlier agent response.
3. Implement the smallest reviewable change and keep unrelated work intact.
4. Verify the exact outgoing scope. Never guess the base ref:

   ```text
   {{RUNNER}} scope --base <verified-ref>
   {{RUNNER}} verify --base <verified-ref>
   {{RUNNER}} check
   ```

   Run the configured tests, build, and any real user/service-boundary checks selected by `verify`.
5. Before handoff, run a read-only review and PRD/evidence reconciliation:

   ```text
   {{RUNNER}} review --base <verified-ref>
   {{RUNNER}} prdsync --dry-run
   ```

6. Report the outcome, changed files, exact evidence and results, skipped checks, risks, blockers, unresolved decisions, and required human acceptance. Do not self-approve, release, push, or close work that requires human acceptance.

## Command reference

Use the project’s package manager runner when it differs from npm. Add `--json` when machine-readable output is needed.

| Command | Use |
| :--- | :--- |
| `init --existing` | Add missing project scaffold files; preserve existing files. Run during setup only. |
| `doctor` | Check required files, Git, package manager, and warnings. |
| `context "scope"` | Generate the smallest relevant context pack. |
| `plan "title"` | Create a durable technical plan draft. |
| `solve "title"` | Create a solution draft for an observed problem. |
| `index` | Inspect the local product/code index. |
| `scope --base <ref>` | Report committed and dirty outgoing paths from a verified base. |
| `verify --base <ref>` | Select the smallest known checks for the exact scope. |
| `check` | Validate workflow consistency and configured budgets. |
| `review --base <ref>` | Perform a read-only static review of the outgoing changes. |
| `prdsync --dry-run` | Review PRD criteria and possible evidence without changing files. |
| `report` | Generate a local workflow snapshot for inspection. |
| `help` | Show the complete CLI surface. |

## Boundaries

- Treat human decisions and current tracked task/PRD records as authority; treat generated context and optional providers as advisory.
- Destructive operations, production changes, infrastructure, authentication, secrets, and external-system writes require explicit human scope and a rollback path.
- Keep exactly one active `wip-*` or `blocked-*` task. Preserve recovery state in `.agents/docs/tasks/`.
- Record exact commands and results as evidence. “Works” is not evidence.
- Product behavior changes require synchronized task, PRD, index, code, tests, and evidence as applicable to the project mode.
- The CLI works without host plugins. `/kb:*` commands are skill conventions and are available only when the installed plugin skills are loaded by the agent host; use `/kb:setup` for the host-supported setup path.

Detailed policy lives in `.agents/docs/agent-workflow.md`; command routing lives in the installed workflow skill’s `references/commands.md`.
