# Vanilla Fullstack

Small vanilla browser plus Express server example.

```bash
npm install
npm test
npm run dev
```

Open <http://localhost:3000>.

The example includes the full project-owned Agent Workflow scaffold under `.agents/`. From the repository root, run `node packages/agent-workflow-scrum/bin/agent-workflow.mjs docs --root examples/vanilla-fullstack` to check its documentation.

The CLI is installed from the pinned GitHub dependency:

```bash
npm exec -- agent-workflow version
npm exec -- agent-workflow doctor
```
