# Task 0016: Make the Workflow Report Navigable and Render Markdown

> **Status:** done
>
> **Scrum Artifact:** completed increment
>
> **Created:** 2026-09-01
>
> **Completed:** 2026-09-01

## 1. Goal

Turn the generated workflow report from a dashboard that links out to raw
`.md` files into a single-page, navigable viewer where a human can read any
tracked workflow document rendered in place.

## 2. Change Contract

- **Human outcome:** Opening `report/index.html` shows a sidebar navigation,
  a dashboard summary, and the ability to click any source, PRD, or task to read
  its rendered markdown without leaving the report or needing a dev server.
- **Acceptance evidence:** The report is a single HTML document with no external
  assets; it renders markdown (headings, tables, lists, fenced code, inline
  code, links, blockquotes) in-page; sidebar and table links navigate via hash
  routing; the report output stays git-ignored; existing checks still pass.
- **Non-goals:** Do not publish, host, or collect secrets; do not replace
  canonical PRDs/tasks; do not add a runtime or report-generation dependency
  (a self-contained markdown renderer keeps the copy-into-a-project story).
- **Affected layers and owners:** Report script, navigation and routing,
  README, workflow/development docs, canonical skill, generated adapters, and
  task evidence; humans own any decision to publish or share the report.
- **Risk level and required approvals:** Standard low-risk local tooling; no
  production or external-system action.
- **Baseline:** The report was a dashboard with relative links to raw `.md`
  files; markdown was not rendered and there was no in-report navigation.
- **Verification plan:** Generate the report, validate no control bytes leak
  into the HTML, verify every nav/table link resolves to a rendered section,
  confirm non-dashboard views are hidden by default, run application tests and
  build, regenerate and check skill adapters, and review the final diff.
- **Rollback or recovery:** Revert the report script and documentation to the
  previous dashboard version; generated `report/` output is disposable and
  ignored.

## 3. Acceptance Criteria

- [x] `npm run report` writes a single-page `report/index.html` plus
  `report/report.json`.
- [x] The report has a navigation sidebar and renders tracked markdown
  documents in place (no raw-file links, no external assets or network calls).
- [x] Sidebar links and dashboard table links navigate to the correct section;
  every internal `#doc-*` link resolves and section ids are unique.
- [x] The dashboard is the default view; all other document views start hidden.
- [x] Report output is git-ignored and absent from the tracked diff.
- [x] Markdown rendering handles headings, tables, ordered/unordered lists,
  nested lists, fenced code, inline code, links, and blockquotes.
- [x] Existing application tests, build, skill validation, adapter generation,
  and adapter checks pass.

## 4. Verification Evidence

| Claim | Evidence | Result |
| :--- | :--- | :--- |
| HTML and JSON are generated | `npm run report` generated `report/index.html` and `report/report.json` | Passed |
| Output is pure text, not binary | `tr -cd '\000' < report/index.html \| wc -c` returned 0; `file report/index.html` reports HTML document | Passed |
| Navigation integrity | Node validation: 29 sections matched 29 internal `#doc-*` links and 29 nav `data-target`s; 0 broken links, 0 missing targets, 0 duplicate ids | Passed |
| Default view is the dashboard | Dashboard section has no `hidden` attribute; all 28 document sections have `hidden` | Passed |
| Routing script is valid | Extracted routing script passed `node --check`; report contains a `hashchange` listener | Passed |
| Markdown renders in place | Rendered docs contain 15 `<table>`, 29 `<pre><code>` blocks; AGENTS.md and a task record rendered readable content | Passed |
| Report output is not tracked | `git check-ignore report/ report/index.html report/report.json` all returned 0 | Passed |
| Workflow command is available to agents | `scripts/skill.sh init all` regenerated Claude and Cursor adapters; `scripts/skill.sh check` and `check claude cursor` passed | Passed |
| Canonical skill is valid | `bash scripts/skill.sh check` reported the canonical `.agents/skills` source passed | Passed |
| Existing application behavior remains healthy | `npm test`: 10 passed, 0 failed; `npm run build`: Vite production build passed | Passed |
| Final diff has no whitespace errors | `git diff --check` passed | Passed |

## 5. Handoff

- **Outcome:** `report/index.html` is now a navigable single-page report. The
  sidebar and dashboard let a reader browse and read rendered workflow sources
  in place, and `report/report.json` exposes a `documents` index for tooling.
- **Changed files:** `.agents/scripts/report.mjs`, `README.md`, `.agents/docs/development.md`,
  `.agents/docs/agent-workflow.md`, the canonical workflow skill, generated ignored
  adapters, and this completed task record.
- **Skipped:** A visual browser click-through was not captured as a screenshot.
  Navigation correctness was verified structurally (every link resolves to a
  rendered section, default state is correct, routing script is valid) plus the
  report renders in a browser without a dev server.
- **Residual risk:** The markdown renderer is self-contained and covers the
  constructs used by these documents; unusual markdown in future files may
  render imperfectly without affecting the canonical source.
- **Human decision:** Human still owns whether to publish, host, or share a
  generated report outside the local workspace.
