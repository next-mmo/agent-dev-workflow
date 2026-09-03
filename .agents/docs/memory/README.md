# Agent Memory Store

> Status: institutional memory  
> Methodology: Compound Engineering (capture once, recall forever)  

The `.agents/docs/memory/` directory stores lightweight cross-session agent recall entries — learnings, patterns, decisions, and conventions discovered during development.

## Purpose

- **Cross-Session Recall**: The native memory provider scores entries against the current scope and surfaces relevant recall in the context pack.
- **Complement Solutions**: Solutions (`.agents/docs/solutions/`) capture bug fixes; memory captures broader learnings, architectural decisions, and conventions.
- **Zero-Dependency**: File-based Markdown with YAML frontmatter — no external services required.

## File Naming

- Use `NNNN-kebab-case-title.md` (e.g. `0001-esm-import-conventions.md`).
- Reserve `0000-template.md` as the template.

## Entry Format

Every memory file starts with structured YAML frontmatter:

```yaml
---
title: Descriptive Title
tags: [tag1, tag2, tag3]
scope: brief description of when this memory is relevant
created: YYYY-MM-DD
---
```

Followed by a concise body (aim for < 30 lines) explaining the learning, pattern, or decision.

## How Recall Works

The native memory provider (`memory.mjs`) loads all memory and solution entries, scores them against the current context scope using term overlap (tags weighted 2×, title 1.5×), and returns top matches within the allocated token budget.

Entries marked `status: draft`, `proposed`, or `template`, or containing an angle-bracket-only placeholder in title/problem/solution/scope, are excluded. Complete the content and remove the draft status before using an entry for recall. Inclusion means eligible for retrieval; it does not prove the entry is correct.

Explicit `--provider all` selection can supplement native recall with OpenViking search. Availability alone does not enable remote queries.
