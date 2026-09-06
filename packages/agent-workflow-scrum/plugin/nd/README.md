# ND workflow plugin protocol

This bundle lets an ND host consume an Agent Workflow Scrum repository as an
external workflow plugin. It is a **read-only reporting contract**: the plugin
reports workflow state and renders bounded context; the ND host owns identity,
authorization, board projection, and any future transition actions.

- Manifest: [`nd-plugin.json`](nd-plugin.json)
- Protocol label: `nd.workflow/1`
- Upstream package: `@next-mmo/agent-workflow-scrum` (project-local dependency; never vendored or installed by the host)

## Transport

ND invokes the project-local CLI with fixed argv and `shell: false`:

```text
<packageManager> exec -- agent-workflow nd <method> --root <projectRoot> --json
```

| ND protocol method | CLI method | Purpose |
| :--- | :--- | :--- |
| `detect` | `detect` | Compatibility probe: is this project an Agent Workflow Scrum repository this plugin version understands? |
| `readSnapshot` | `snapshot` | Full read-only board snapshot (tasks, PRDs, git facts, diagnostics). |
| `buildContext` | `context` | Bounded context envelope for prompt injection. |

All output is UTF-8 JSON on stdout with a trailing newline. Human-readable
output is available without `--json`. Exit codes: `0` success (including
`"supported": false` results), `1` usage or runtime error. Errors are also
reported inside the JSON body as diagnostics; the process exit code alone is
not a workflow verdict.

## Result shapes

Common envelope fields on every result: `protocol`, `plugin`
(`{ id, version }`), `root`, `diagnostics`.

`detect` adds `supported` and `config`
(`{ schemaVersion, mode, packageManager }`). `supported` is false when
`.agents/config.json` is missing, malformed, or uses an unsupported
`schemaVersion`.

`snapshot` adds `snapshot`:

- `schemaVersion` (`1`), `scannedAt` (ISO timestamp), `git`
  (`{ available, branch, head, dirty }`), `stale`, `lastError`.
- `tasks[]`: `key` (canonical task number, null when unnumbered),
  `sourcePath`, `contentHash`, `title`, `lifecycle`
  (`todo|wip|blocked|done`), `state` (reported metadata), `displayStatus`
  (`ready|in_progress|blocked|completed`), `archived`, `legacyArchive`,
  `prdRefs[]`, `outcome`, `scope[]`, `criteria[{ text, checked }]`,
  `evidence`, `humanAcceptance`, `diagnostics[]`.
- `prds[]`: `key`, `sourcePath`, `contentHash`, `title`, `status`,
  `inIndex`, `indexStatus`, `summary`.
- `diagnostics[]`: `{ severity, code, message, sourcePath }`.

Task numbers come from filenames: `<lifecycle>-<ordinal>-<number>-<slug>` and
the early `<lifecycle>-<number>-<slug>` shape. Duplicate numbers are reported
as `duplicate_task_number` conflicts; ND must never collapse them.

`context` adds `context`: `budgetTokens`, `estimatedTokens`, `truncated`,
`envelope` (single escaped string), `activeTaskKeys`, `selectedTaskKeys`,
`diagnostics`. Sections are dropped lowest-value first (task scope, board
summary, outcome excerpt); plugin identity, capability limits, and diagnostics
are never truncated away. Envelope delimiters `{{` are escaped as `{ {`.

## Diagnostic codes

`workflow_not_initialized`, `config_malformed`, `config_unreadable`,
`config_schema_version_missing`, `unsupported_config_schema`,
`unrecognized_task_filename`, `legacy_archived_filename`, `unnumbered_task`,
`duplicate_task_number`, `multiple_active_tasks`, `prd_file_missing`,
`prd_missing_from_index`, `prd_status_draft`, `merge_conflict_markers`,
`file_oversized`, `scan_limit_exceeded`.

## Guarantees and limits

- The plugin never writes to the target repository, never installs packages,
  and never executes project commands (including configured checks).
- Completion and human acceptance are **source-reported facts**, not verdicts:
  checked criteria do not imply completion, and recorded evidence does not
  imply approval.
- The host is responsible for binding validation (company/project/root), scan
  freshness (`stale`), and for treating this plugin's data as project-owned
  metadata inside its own policy framing.
