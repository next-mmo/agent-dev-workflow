# Agent Workflow Scrum CLI

Use the workflow engine as a pinned project dependency. Consumer repositories keep only project-owned instructions, context, configuration, PRDs, tasks, suggestions, and evidence.

```bash
npm install --save-dev --save-exact @next-mmo/agent-workflow-scrum
npm exec -- agent-workflow init --existing
```

With pnpm:

```bash
pnpm add --save-dev --save-exact @next-mmo/agent-workflow-scrum
pnpm exec agent-workflow init --existing
```

Run `agent-workflow help` for the command surface. Configure package-manager commands and repository path groups in `.agents/config.json`.

For unpublished local development, `yalc publish` plus `yalc add @next-mmo/agent-workflow-scrum` can shorten the edit/test loop. Release evidence must still use the real `npm pack` tarball; a `yalc` link is not the publishable artifact.

The included plugin bundle carries reusable skills for Agent Plugin/Cursor and Codex hosts. Initialization does not copy skills or scripts into the consumer repository. Graphify and OpenViking remain optional advisory providers; OpenViking runs only when explicitly selected.
