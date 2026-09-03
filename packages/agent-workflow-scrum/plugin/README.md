# Agent Workflow Scrum Plugin

This bundle provides Agent Workflow Scrum skills to Codex and Agent Plugin-compatible hosts such as Cursor. Cursor-specific installs also expose the `workflow-status` command.

The plugin contains guidance, not a second engine. Install and pin `@next-mmo/agent-workflow-scrum` in each project, then run its local `agent-workflow` binary. Project initialization keeps reusable skills, scripts, and benchmarks out of the consumer repository.

The root `plugin.json` follows the Agent Plugins 1.0 schema. `.cursor-plugin/plugin.json` adds Cursor command discovery. `.codex-plugin/plugin.json` provides Codex metadata. No marketplace entry is created by this repository.
