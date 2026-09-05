# Agent Workflow Scrum CLI

Use the workflow engine as a pinned project dependency. Requires Git and Node `^20.19.0 || >=22.12.0`. This package is not yet publicly published on npm. In the source checkout, run `npm ci` and `npm run distribution:pack`, then copy the resulting tarball into the target Git repository:

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

Keep the tarball at its recorded path with the lockfile for reproducible installs. Consumer repositories keep project-owned instructions, context, configuration, PRDs, tasks, suggestions, and evidence. Run `agent-workflow help` through your package manager for the command surface. Configure commands and path groups in `.agents/config.json`.

For local development, the source repository's `npm run local:check` runs the offline tests, build, strict workflow, documentation, and generated-bundle checks. Context output identifies linked PRDs and the reason each selected document was retained; the active task's linked PRD is prioritized over generic workflow history.

The CLI works without host plugins. To use `/kb:*` skill conventions, load this package's `plugin/` through your host's local plugin support, or its `plugin/skills/` through a supported skill loader. npm installation alone does not activate host skills. Package consumers need no `scripts/skill.sh`; that helper belongs to the source checkout.

Licensed under [MIT](LICENSE), copyright 2026 Next MMO.

`plan <title>` and `solve <title>` use bundled templates when no consumer `0000-template.md` exists. Existing templates take precedence; unreadable templates fail rather than being replaced. Solution drafts are excluded from recall until completed with evidence.

`review` scans staged, unstaged, and untracked files. Pass `--base <verified-ref>` to include committed changes from the merge base. Invalid refs or unreadable files fail; deleted, ignored, and unsupported files are listed separately from actual inspections. Review JSON schema v2 identifies a limited static pattern scan, not semantic acceptance or a security guarantee.

`prdsync` is read-only, including without `--dry-run`. JSON schema v2 lists unchecked criteria under `reviews`, possible task evidence under `evidenceCandidates`, and an empty `changedFiles` array. It replaces the former `syncedPRDs` result. Related task records may be incomplete; humans decide acceptance after inspecting evidence.

Both local indexes discover JavaScript/TypeScript files using configured `paths.product` and ignore rules, including monorepo layouts. They use heuristic symbol extraction; dynamic dependencies and semantic impact still require code inspection.

For unpublished local development, `yalc publish` plus `yalc add @next-mmo/agent-workflow-scrum` can shorten the edit/test loop. Release evidence must still use the real `npm pack` tarball; a `yalc` link is not the publishable artifact.

The included plugin bundle carries reusable skills for Agent Plugin/Cursor and Codex hosts. Initialization does not copy skills or scripts into the consumer repository. Graphify and OpenViking remain optional advisory providers; OpenViking runs only when explicitly selected.
