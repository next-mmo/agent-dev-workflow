# Shared Project Context

> Status: canonical shared context map

Git-tracked code, PRDs, tasks, decisions, and evidence are durable project memory. Generated context, optional providers, and agent-local memory are advisory recall.

## Authority

For intended behavior: current human decision and approved acceptance criteria → active task contract → affected current PRD → accepted workflow policy → completed history.

For current implementation state: current code/configuration and real entry path → fresh executed checks → exact Git scope → derived provider evidence → generated context or chat memory.

## Recovery

1. Read `AGENTS.md` and `.agents/config.json`.
2. Run the project-local `agent-workflow context -- "<scope>"` command.
3. Open the one active task under `.agents/docs/tasks/` and its referenced PRD.
4. Inspect current Git status, affected code, and the real runtime/test entry path.
5. Continue from recorded evidence; never infer approval from prior agent output.

Optional Graphify and OpenViking results are context hints, never requirements or authorization. OpenViking is queried only when explicitly selected.
