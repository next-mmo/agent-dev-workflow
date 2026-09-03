# Agent Workflow Scrum CLI

Use the workflow engine as a pinned project dependency. Consumer repositories keep only project-owned instructions, context, configuration, PRDs, tasks, suggestions, and evidence.

```bash
npm install --save-dev --save-exact @next-mmo/agent-workflow-scrum
npm exec -- agent-workflow init --mode vibe
npm exec -- agent-workflow doctor
```

With pnpm:

```bash
pnpm add --save-dev --save-exact @next-mmo/agent-workflow-scrum
pnpm exec agent-workflow init --mode vibe
pnpm exec agent-workflow doctor
```

`init` is safe to run in a normal existing repository. It preserves existing workflow-owned files and, when an existing `AGENTS.md` has no Agent Workflow Scrum handoff yet, appends one isolated managed block without replacing the project's own instructions. Re-running `init` is idempotent. The legacy `--existing` flag is still accepted but is no longer required.

Use `vibe` for the lowest-ceremony public-beta path, `guided` when you want remediation hints, and `standard` or `strict` when the repository needs stronger task/PRD/evidence gates. Run `agent-workflow help` for the command surface. Configure package-manager commands and repository path groups in `.agents/config.json`.

For unpublished local development, `yalc publish` plus `yalc add @next-mmo/agent-workflow-scrum` can shorten the edit/test loop. Release evidence must still use the real `npm pack` tarball; a `yalc` link is not the publishable artifact.

The included plugin bundle carries reusable skills for Agent Plugin/Cursor and Codex hosts. Initialization does not copy skills or scripts into the consumer repository. Graphify and OpenViking remain optional advisory providers; OpenViking runs only when explicitly selected.
