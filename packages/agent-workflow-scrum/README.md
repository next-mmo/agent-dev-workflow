# Agent Workflow Scrum CLI

Use the workflow engine as a pinned project dependency. Requires Git and Node `^20.19.0 || >=22.12.0`. Registry publication is not required. The current reviewed commit is `318b0aa47bf74c58b11da468219e2fe6e828ea47`:

```bash
npm install --save-dev "@next-mmo/agent-workflow-scrum@git+https://github.com/next-mmo/agent-dev-workflow.git#318b0aa47bf74c58b11da468219e2fe6e828ea47"
npm exec -- agent-workflow init --existing
npm exec -- agent-workflow doctor
```

Commit `package.json` and the lockfile in the consumer repository. npm installs the Git repository's root package under the requested dependency name; the root exposes the nested canonical CLI. The root retains the demo package metadata, while `agent-workflow version` reports the workflow package version. Git installation uses npm as the package manager but does not require publishing to the npm registry. npm may install the source's build dependencies in a temporary Git checkout because the root has a build script; they are not consumer dependencies. A Git URL cannot select this repository's nested package via `repository.directory`.

For an uncommitted checkout or a smaller release artifact, run `npm ci` and `npm run distribution:pack` in the source, then copy the resulting tarball into the target Git repository:

```bash
npm install --save-dev --save-exact ./next-mmo-agent-workflow-scrum-0.1.0.tgz
npm exec -- agent-workflow init --existing
npm exec -- agent-workflow doctor
```

With pnpm:

```bash
pnpm add --save-dev --save-exact ./next-mmo-agent-workflow-scrum-0.1.0.tgz
pnpm exec agent-workflow init --existing
pnpm exec agent-workflow doctor
```

Keep the tarball at its recorded path with the lockfile for reproducible installs. Consumer repositories keep project-owned instructions, context, configuration, PRDs, tasks, proposals, and evidence. Run `agent-workflow help` through your package manager for the command surface. Configure commands and path groups in `.agents/config.json`.

Init seeds `AGENT-QUICKSTART.md`, `.agents/docs/AGENTS.md`, `agent-workflow.md`, `architecture.md`, `defensive-patterns.md`, `development.md`, and `testing.md`, plus task/proposal guidance, the PRD index, and `docBudgets` in `.agents/config.json`. `AGENT-QUICKSTART.md` is the first-session guide for AI coding agents; architecture and contributor guidance must be filled in from the consumer's actual product. Source demo details and `model-recommend.md` are not copied. `--dry-run` makes no writes; `--existing` only adds missing files and preserves existing docs/configuration. Doctor reports missing scaffold documents and warns about legacy suggestions and vendored workflow trees. Legacy decision records are never automatically moved or deleted.

For local development, the source repository's `npm run local:check` runs the offline tests, build, strict workflow, documentation, and generated-bundle checks. Context output identifies linked PRDs and the reason each selected document was retained; the active task's linked PRD is prioritized over generic workflow history.

The CLI works without host plugins. Run `npm exec -- agent-workflow skills --json` to discover the installed plugin root and `plugin/skills/` path, then load one through your host's local plugin support or supported skill loader. In a Git install those paths are under `node_modules/@next-mmo/agent-workflow-scrum/packages/agent-workflow-scrum/`; in a tarball install they are directly under `node_modules/@next-mmo/agent-workflow-scrum/`. npm installation alone does not activate host skills. Never copy workflow `packages/`, `plugins/`, or skills into a consumer. Package consumers need no `scripts/skill.sh`; that helper belongs to the source checkout.

Licensed under [MIT](LICENSE), copyright 2026 Next MMO.

`plan <title>` and `solve <title>` use bundled templates when no consumer `0000-template.md` exists. Existing templates take precedence; unreadable templates fail rather than being replaced. Solution drafts are excluded from recall until completed with evidence.

`review` scans staged, unstaged, and untracked files. Pass `--base <verified-ref>` to include committed changes from the merge base. Invalid refs or unreadable files fail; deleted, ignored, and unsupported files are listed separately from actual inspections. Review JSON schema v2 identifies a limited static pattern scan, not semantic acceptance or a security guarantee.

`prdsync` is read-only, including without `--dry-run`. JSON schema v2 lists unchecked criteria under `reviews`, possible task evidence under `evidenceCandidates`, and an empty `changedFiles` array. It replaces the former `syncedPRDs` result. Related task records may be incomplete; humans decide acceptance after inspecting evidence.

Both local indexes discover JavaScript/TypeScript files using configured `paths.product` and ignore rules, including monorepo layouts. They use heuristic symbol extraction; dynamic dependencies and semantic impact still require code inspection.

For unpublished local development, `yalc publish` plus `yalc add @next-mmo/agent-workflow-scrum` can shorten the edit/test loop. Release evidence must still use the real `npm pack` tarball; a `yalc` link is not the publishable artifact.

The included plugin bundle carries reusable skills for Agent Plugin/Cursor and Codex hosts. Initialization does not copy skills or scripts into the consumer repository. Graphify and OpenViking remain optional advisory providers; OpenViking runs only when explicitly selected.
