# Agent Workflow Scrum

Agent Workflow Scrum is a reusable delivery workflow for humans and coding
agents. It keeps requirements, tasks, implementation, verification evidence,
PRDs, reviews, and human decisions connected.

This repository includes a small Counter App as an executable starter and
demonstration. The workflow is intentionally broader than the demo: it can be
copied into an existing project or used when starting a new frontend, backend,
or full-stack application.

## Key features

- A canonical, reusable skill pack in .agents/skills/.
- A tracked CONTEXT.md memory contract shared across supported agents.
- Namespaced /kb:<command> workflow commands that avoid collisions with host IDE
  commands or other agents.
- A target initializer for ChatGPT, Codex, Claude, and Cursor.
- Risk-scaled task records with acceptance criteria and evidence ledgers.
- PRD and task synchronization for product behavior changes.
- A runnable Counter App demonstrating state, persistence, custom step sizes,
  accessible selection, theme switching, and one-level undo.

## Table of contents

- [Choose your path](#choose-your-path)
- [Understand agent memory](#understand-agent-memory)
- [Quick start: use the Counter starter](#quick-start-use-the-counter-starter)
- [Skip or replace the Counter demo](#skip-or-replace-the-counter-demo)
- [Migrate an existing project](#migrate-an-existing-project)
- [Start a new project](#start-a-new-project)
- [Create or update a skill](#create-or-update-a-skill)
- [Initialize agent targets](#initialize-agent-targets)
- [Use the workflow commands](#use-the-workflow-commands)
- [Development commands](#development-commands)
- [Verification checklist](#verification-checklist)
- [Release and deployment boundary](#release-and-deployment-boundary)
- [Troubleshooting](#troubleshooting)
- [Repository map](#repository-map)

## Choose your path

| Situation | Recommended path | Keep the Counter App? |
| --- | --- | --- |
| You want to learn the workflow | [Quick start](#quick-start-use-the-counter-starter) | Yes |
| You want a ready-made starter | Clone or copy this repository | Optional |
| You already have an application | [Migrate an existing project](#migrate-an-existing-project) | No |
| You are starting a React/Vite frontend | [Start a new project](#start-a-new-project) | No |
| You are starting a full-stack application | Use the workflow pack, then define backend/data/auth tasks | No |

The important choice is the workflow pack, not the demo UI. Keep the
.agents/skills/ directory as the source of truth and adapt the surrounding
application to your chosen stack.

## Understand agent memory

The repository is the shared memory layer between Codex, ChatGPT, Claude, and
Cursor. Agent conversations and personal memories are private or temporary and
must not be the only place for requirements, decisions, progress, or evidence.

Start non-trivial work by reading:

1. `AGENTS.md` for repository instructions and safety boundaries.
2. `CONTEXT.md` for shared terminology, authority, recovery, and handoff rules.
3. The relevant PRD and active task for product scope and acceptance.
4. The code, tests, and current Git state for fresh repository evidence.

The target surfaces differ by agent, but their durable source is the same:

| Target | Project context | Skill surface |
| --- | --- | --- |
| Codex / ChatGPT | `AGENTS.md`, `CONTEXT.md`, tracked docs | `.agents/skills/` |
| Claude | `AGENTS.md`, `CONTEXT.md`, tracked docs | Generated `.claude/skills/` |
| Cursor | `AGENTS.md`, `CONTEXT.md`, tracked docs | Generated `.cursor/rules/` and `.cursor/commands/` |

After a clone or skill change, initialize the target adapter and run its check.
Important decisions still belong in tracked files, not in agent-local memory.

## Quick start: use the Counter starter

### 1. Clone the repository

~~~bash
git clone https://github.com/next-mmo/agent-dev-workflow.git
cd agent-dev-workflow
~~~

You can also download or copy the folder if you are not using Git yet.

### 2. Check your runtime

The demo uses Node.js ^20.19.0 || >=22.12.0 and npm.

~~~bash
node --version
npm --version
~~~

### 3. Install dependencies

~~~bash
npm ci
~~~

Use npm install instead if you are intentionally updating the lockfile.

### 4. Run the demo

~~~bash
npm run dev
~~~

Open http://localhost:5173.

The Counter App demonstrates:

- Increment and decrement using buttons or keyboard shortcuts.
- Configurable step sizes.
- Preset or arbitrary positive custom step sizes, including Enter-to-apply.
- Reset and one-level undo.
- Light/dark theme switching.
- Local persistence through localStorage.

### 5. Verify the starter

Run the automated checks and production build:

~~~bash
npm test
npm run build
~~~

The development server is useful for visible acceptance checks. Verify the
normal interaction path, keyboard shortcuts, reload persistence, responsive
layout, and browser console before treating a UI task as accepted.

## Skip or replace the Counter demo

The Counter App is optional. You have two safe choices.

### Option A: Keep the demo as a smoke-test surface

Keep the Counter App and build your product beside it. This gives every agent a
small executable surface for checking whether the workflow and local setup are
working.

### Option B: Replace the demo with your product

Keep the workflow files and replace the demo application:

1. Preserve .agents/skills/, AGENTS.md, CLAUDE.md, docs/agent-workflow.md, and
   the task/suggestion templates.
2. Replace index.html, src/, tests/, and the demo-specific PRDs only after
   deciding which product artifacts belong in the new project.
3. Remove or archive Counter-specific task records and PRDs rather than
   presenting them as requirements for the new product.
4. Update package.json, docs/development.md, and AGENTS.md for the new runtime,
   package manager, framework, and test commands.
5. Create the first product PRD and a human-ordered backlog task.
6. Run the initializer again:

   ~~~bash
   bash scripts/skill.sh init all
   ~~~

Do not edit generated .claude/ or .cursor/ files directly. Change the canonical
skill under .agents/skills/ and regenerate the adapters.

## Migrate an existing project

Migration is usually the best option when your application already has code,
users, deployment, or a technology decision.

### 1. Create a safe migration branch

~~~bash
git switch -c adopt-agent-workflow
~~~

Record the current test/build state before moving files. Existing failures are
baseline evidence, not evidence caused by the workflow migration.

### 2. Copy the workflow pack

Copy these items from this repository into the existing project:

~~~text
.agents/
scripts/skill.sh
AGENTS.md
CONTEXT.md
CLAUDE.md
docs/agent-workflow.md
docs/tasks/README.md
docs/suggestions/README.md
docs/suggestions/0000-template.md
~~~

On macOS, Linux, Git Bash, or WSL, an example is:

~~~bash
cp -R /path/to/agent-dev-workflow/.agents .
mkdir -p scripts docs/tasks docs/suggestions
cp /path/to/agent-dev-workflow/scripts/skill.sh scripts/
cp /path/to/agent-dev-workflow/AGENTS.md .
cp /path/to/agent-dev-workflow/CONTEXT.md .
cp /path/to/agent-dev-workflow/CLAUDE.md .
cp /path/to/agent-dev-workflow/docs/agent-workflow.md docs/
cp /path/to/agent-dev-workflow/docs/tasks/README.md docs/tasks/
cp /path/to/agent-dev-workflow/docs/suggestions/README.md docs/suggestions/
cp /path/to/agent-dev-workflow/docs/suggestions/0000-template.md docs/suggestions/
~~~

On Windows PowerShell, use equivalent commands such as:

~~~powershell
Copy-Item -Recurse -Force C:\path\to\agent-dev-workflow\.agents .
New-Item -ItemType Directory -Force scripts, docs\tasks, docs\suggestions
Copy-Item C:\path\to\agent-dev-workflow\scripts\skill.sh scripts\
Copy-Item C:\path\to\agent-dev-workflow\AGENTS.md .
Copy-Item C:\path\to\agent-dev-workflow\CONTEXT.md .
Copy-Item C:\path\to\agent-dev-workflow\CLAUDE.md .
Copy-Item C:\path\to\agent-dev-workflow\docs\agent-workflow.md docs\
Copy-Item C:\path\to\agent-dev-workflow\docs\tasks\README.md docs\tasks\
Copy-Item C:\path\to\agent-dev-workflow\docs\suggestions\README.md docs\suggestions\
Copy-Item C:\path\to\agent-dev-workflow\docs\suggestions\0000-template.md docs\suggestions\
~~~

These examples copy the workflow foundation, not the Counter product PRDs.
Avoid overwriting an existing AGENTS.md or CLAUDE.md without merging the
project-specific instructions first. Also merge the generated-adapter rules
from this repository's .gitignore instead of replacing the existing file:

~~~gitignore
.claude/skills/
.cursor/rules/*.generated.mdc
.cursor/commands/*.generated.md
~~~

### 3. Adapt repository instructions

Edit AGENTS.md so it accurately names:

- The actual product and repository boundary.
- The package manager and runtime.
- The commands for development, tests, build, and preview/deployment.
- The locations of the project's PRDs, tasks, suggestions, and environment docs.

Keep it concise. Put detailed policy in linked documents so agents can discover
the right context without loading an oversized instruction file.

### 4. Initialize supported agent targets

From the migrated project root:

~~~bash
bash scripts/skill.sh list
bash scripts/skill.sh init all
bash scripts/skill.sh check
~~~

Start with all for local development. Use a narrower target when you only need
one adapter, for example bash scripts/skill.sh init cursor.

Use `bash scripts/skill.sh check` for a non-strict audit of the canonical source
and adapters already present. Use `bash scripts/skill.sh check claude cursor`
or `bash scripts/skill.sh check all` when those generated adapters must exist
and match the canonical skills.

### 5. Create the migration task

For a non-trivial migration, create one active wip-*.md task under docs/tasks/
containing:

- Human outcome and acceptance evidence.
- Baseline test/build results.
- Non-goals and rollback/recovery.
- Affected layers and required human decisions.
- Verification at the real user boundary.

Move it to docs/tasks/done/done-*.md only when the evidence is complete.

## Start a new project

You can start with the Counter repository as a template or bootstrap the
application separately and then copy only the workflow foundation.

### New React/Vite frontend

Create the application with Vite, then add the workflow pack:

~~~bash
npm create vite@latest my-frontend -- --template react-ts
cd my-frontend
npm install
~~~

Copy .agents/, scripts/skill.sh, AGENTS.md, CLAUDE.md, and the workflow
documents as described in Migrate an existing project. Do not copy the Counter
PRDs unless the Counter is actually your product.

Then initialize the agent targets and verify the new app:

~~~bash
bash scripts/skill.sh init all
npm run dev
npm test
npm run build
~~~

If the Vite starter does not yet have a test command, add one to the project
before claiming automated verification. Replace the sample command with the
actual test runner in AGENTS.md and docs/development.md.

The Vite scaffold convention uses npm run dev, npm run build, and npm run
preview. See the [Vite guide](https://vite.dev/guide/) for current scaffolding
options.

### Full-stack project

For a full-stack target, bootstrap or retain the application stack that fits
your product. The workflow does not require a specific backend, database, or
deployment provider.

After copying the workflow foundation:

1. Define the product outcome and first PRD.
2. Record frontend, API, domain, data, authentication/security, and operations
   boundaries in the change contract.
3. Create one ordered task for the smallest vertical slice.
4. Include contracts, validation, error paths, authorization, migrations,
   compatibility, observability, and rollback where relevant.
5. Verify the real user path as well as unit, integration, build, and security
   checks.
6. Keep deployment and external-system actions behind explicit human scope and
   a rollback path.

A useful full-stack shape might look like this, but your existing architecture
remains authoritative:

~~~text
project/
├── .agents/skills/             # canonical agent skills
├── docs/                       # PRDs, tasks, suggestions, development docs
├── frontend/                   # browser or client application
├── server/                     # API and application services
├── db/                         # migrations, schema, seeds, or data contracts
├── tests/                      # unit, integration, contract, and E2E checks
└── scripts/skill.sh            # target adapter initializer
~~~

Do not mark a backend feature done because a unit test passes if authorization,
integration, migration, rollback, or visible user behavior remains unverified.

## Create or update a skill

Each reusable skill lives under .agents/skills/<skill-name>/ and must include
SKILL.md:

~~~text
.agents/skills/my-skill/
├── SKILL.md                    # required instructions and YAML frontmatter
├── agents/openai.yaml          # optional UI metadata
├── scripts/                    # optional deterministic helpers
├── references/                 # optional focused supporting docs
└── assets/                     # optional files used in generated output
~~~

Use lowercase kebab-case for skill names. Keep SKILL.md focused on the
decisions and constraints that change agent behavior. Put large schemas or
mode-specific details in references/ and link them from the skill.

Minimal example:

~~~markdown
---
name: api-contract-review
description: Review API changes for contract, validation, authorization, and rollback gaps.
---

# API Contract Review

Review the requested API change against its contract, success and failure
paths, authorization boundary, compatibility, tests, and recovery plan.
Report findings without changing files unless the user explicitly requests a
fix.
~~~

After adding or changing a skill:

~~~bash
bash scripts/skill.sh list
bash scripts/skill.sh init all
python C:/Users/your-user/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/my-skill
~~~

Use the validator path provided by your local Codex installation when it differs
from the example. Do not put secrets, credentials, or copied third-party
instructions into a skill without reviewing them.

## Initialize agent targets

The initializer is scripts/skill.sh. It reads every skill with a SKILL.md under
.agents/skills/.

~~~bash
# List canonical skills
bash scripts/skill.sh list

# Initialize every supported target
bash scripts/skill.sh init all

# Initialize selected targets
bash scripts/skill.sh init chatgpt codex claude cursor

# Show usage
bash scripts/skill.sh help
~~~

### Target behavior

| Target | Result | Canonical source |
| --- | --- | --- |
| chatgpt | Validates the source; no local adapter copy | .agents/skills/ |
| codex | Validates the source; no local adapter copy | .agents/skills/ |
| openai | Alias for chatgpt and codex | .agents/skills/ |
| claude | Copies skills to .claude/skills/ | .agents/skills/ |
| cursor | Generates .cursor/rules/ MDC rules and .cursor/commands/ files | .agents/skills/ |
| all | Runs every supported target | .agents/skills/ |

Generated adapters are intentionally ignored by Git:

~~~text
.claude/skills/
.cursor/rules/*.generated.mdc
.cursor/commands/*.generated.md
~~~

The initializer does not delete stale generated files and does not overwrite
tracked AGENTS.md or CLAUDE.md. The human still owns any upload, install,
account connection, plugin configuration, or external product setup.

OpenAI describes Skills as following the open Agent Skills standard, while
Cursor documents project rules in .cursor/rules and custom commands in
.cursor/commands. See [Skills in ChatGPT](https://help.openai.com/en/articles/20001066),
[Cursor Rules](https://docs.cursor.com/context/rules), and
[Cursor Commands](https://docs.cursor.com/en/agent/chat/commands).

## Use the workflow commands

Only the /kb: namespace belongs to this project skill. Bare /plan, /todo,
/help, and similar commands remain available to the host IDE or another agent.

| Command | Use it for |
| --- | --- |
| /kb:help | Show the namespaced workflow commands |
| /kb:status | Report task, PRD, branch, checks, blockers, and uncommitted changes |
| /kb:todo | Create or refine a backlog task without implementing it |
| /kb:plan | Define outcome, acceptance, non-goals, risk, verification, and recovery |
| /kb:define | Clarify the change contract and acceptance criteria |
| /kb:baseline | Inspect current state without fixing findings |
| /kb:design | Propose the smallest safe design and rollback |
| /kb:start | Select an approved task and make it the active WIP task |
| /kb:implement | Implement the approved active task |
| /kb:sync | Reconcile behavior, evidence, affected PRD, and PRD index |
| /kb:test | Run relevant automated checks and report exact results |
| /kb:accept | Run user-boundary acceptance checks without fixing during the round |
| /kb:review | Perform a read-only diff, contract, evidence, and security-boundary review |
| /kb:security | Perform a read-only security, dependency, and secret review |
| /kb:suggest | Create or refine a reusable workflow suggestion |
| /kb:release | Prepare rollout, health, and rollback inputs without deploying |
| /kb:handoff | Produce outcome, files, evidence, risks, and human decisions |
| /kb:done | Close a task only after its evidence passes |
| /kb:block | Record an external blocker and unverified criteria |
| /kb:commit | Create a local commit only when requested |
| /kb:push | Perform an explicitly scoped external Git write |
| /kb:rollback | Explain or execute recovery with an exact authorized target |

The guarded aliases /kb:reset, /kb:clean, /kb:delete, /kb:deploy, and
/kb:publish never grant permission to discard data, change production, or affect
an external system. Route them through the relevant safety gate.

## Development commands

These commands apply to this Counter/Vite demo. A migrated project must replace
them with its own commands and update AGENTS.md.

| Command | Purpose |
| --- | --- |
| npm ci | Install the locked dependency set |
| npm run dev | Start the Vite development server on port 5173 |
| npm test | Run Node's built-in counter state tests |
| npm run build | Create the production bundle in dist/ |
| npm run preview | Preview the production bundle locally on port 4173 |
| bash scripts/skill.sh init all | Generate supported local agent adapters |
| bash scripts/skill.sh check | Audit canonical skills and present adapters |

See [docs/development.md](docs/development.md) for setup and preview details.

## Verification checklist

Use the smallest checklist that matches the change risk.

### Every change

- Read the repository instructions and current task state.
- Keep the change within the human-approved scope.
- Run the relevant automated checks.
- Record exact commands and outcomes.
- Name skipped checks, risks, and human decisions in the handoff.

### Product behavior change

- Update the affected PRD and docs/prd/0000-prd-index.md.
- Add or update one task with acceptance criteria and a rollback path.
- Verify normal, error, keyboard, responsive, persistence, authorization, or
  rollback paths as applicable.
- Use visible user-boundary evidence for UI work.

### New or changed skill

- Keep .agents/skills/ canonical.
- Run the skill validator.
- Run bash scripts/skill.sh init all.
- Run bash scripts/skill.sh check all after initializing generated adapters.
- Confirm generated adapter paths are ignored.
- Review the generated output for unsupported claims or permission expansion.

### Full-stack change

- Check API contracts and invalid input paths.
- Check domain invariants independently of framework I/O.
- Check migrations, compatibility, privacy, and rollback.
- Check authentication and authorization denial paths.
- Check build, observability, deployment health, and recovery where relevant.

## Release and deployment boundary

This repository has no selected production hosting provider. The Counter demo
is a static Vite application; npm run build produces dist/, which can be served
by a static host chosen by the human owner.

Before a real release, define:

1. The deployment target and exact environment configuration.
2. Health signals and the person responsible for watching them.
3. A staged rollout or preview path.
4. A rollback trigger and tested recovery procedure.
5. Any required human approval for production, credentials, authentication, or
   external-system changes.

Agents may prepare release inputs and evidence. They do not self-approve a
release or silently publish to an external service.

## Troubleshooting

### scripts/skill.sh does not run on Windows

Run it from Git Bash or WSL:

~~~bash
bash scripts/skill.sh init all
~~~

PowerShell does not execute Bash scripts natively.

### A target adapter looks stale

Edit the canonical skill, then regenerate:

~~~bash
bash scripts/skill.sh init claude cursor
bash scripts/skill.sh check claude cursor
~~~

The script updates generated files but intentionally does not delete stale
files. Remove stale ignored adapters manually only after confirming the exact
target and recovery path.

### No skills are found

Confirm that each skill has this exact path shape:

~~~text
.agents/skills/<skill-name>/SKILL.md
~~~

Then run:

~~~bash
bash scripts/skill.sh list
~~~

### Tests or build fail after migration

First rerun the baseline command from before migration. Separate pre-existing
failures from failures introduced by the workflow files, then record both in the
active task. Do not mark a criterion passed because the failure is unrelated.

## Repository map

~~~text
.
├── .agents/skills/             # canonical reusable agent skills
├── scripts/skill.sh            # ChatGPT/Codex/Claude/Cursor initializer
├── AGENTS.md                   # concise repository instruction map
├── CONTEXT.md                  # tracked cross-agent memory contract
├── CLAUDE.md                   # Claude-compatible instruction shim
├── docs/
│   ├── agent-workflow.md       # universal delivery loop and quality matrix
│   ├── development.md          # Counter/Vite setup and commands
│   ├── model-recommend.md      # user-provided model-routing notes
│   ├── prd/                    # product requirements and PRD index
│   ├── suggestions/            # proposed workflow improvements
│   └── tasks/                  # TODO, WIP, blocked, and done evidence
├── src/                        # Counter App state and UI
├── tests/                      # deterministic state tests
├── index.html                  # Vite HTML entry point
└── package.json                # npm scripts and dependencies
~~~

## License

This project is released under the MIT license.
