# Development

Use the package manager recorded in `.agents/config.json` and install the project's locked dependencies. For npm use `npm ci` when a lockfile exists. Git and a compatible Node.js version are required by the installed workflow package.

Install `@next-mmo/agent-workflow-scrum` as a project dependency from a pinned release artifact or Git commit. Follow the installed package README for the GitHub install command. Keep `package.json` and its lockfile together. Workflow runtime and plugin assets stay inside the installed dependency; do not copy source `packages/` or `plugins/` directories into this project.

```bash
npm exec -- agent-workflow init --existing
npm exec -- agent-workflow doctor
npm exec -- agent-workflow context -- "<scope>"
npm exec -- agent-workflow check
npm exec -- agent-workflow docs
```

Initialization adds missing project documents and preserves existing files. Review preserved instructions and `.agents/config.json` when adopting newer defaults; rerunning init does not migrate old content. Put new workflow proposals in `proposals/`; preserve and reconcile legacy `suggestions/` decisions explicitly.

Inspect the product's package scripts and fill in its start, test, build, environment, and data-recovery commands here. Configure actual checks and document budgets in `.agents/config.json`; absent test/build scripts are not inferred. Host plugin activation is separate from dependency installation. Consumers do not need the source repository's `scripts/skill.sh` or copied skills.
