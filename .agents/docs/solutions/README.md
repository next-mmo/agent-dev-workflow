# Compounding Solutions Knowledge Base

> Status: institutional memory  
> Methodology: Compound Engineering (capture once, compound forever)  

The `.agents/docs/solutions/` directory stores proven, reusable technical solutions to tricky bugs, browser quirks, performance bottlenecks, and architectural gotchas.

## Purpose

- **Prevent Repeated Mistakes**: Surface verified solutions before new work begins.
- **Compound Engineering**: Turn painful debugging sessions into permanent assets that make future tasks easier.
- **Cross-Agent Memory**: Agents search this knowledge base via `npm run context -- "<problem>"` to leverage past solutions.

## File Naming

- Use `NNNN-kebab-case-title.md` (e.g. `0001-web-audio-user-gesture.md`).
- Reserve `0000-template.md` as the template.

## Solution Format

Every solution file starts with structured YAML frontmatter:

```yaml
---
title: Descriptive Problem and Solution Title
module: src/audio.js
tags: [webaudio, autoplay, browser-compat]
problem: "Brief description of the observed failure or symptom"
solution: "Summary of the proven pattern or fix"
---
```

Followed by:
1. **Symptom & Root Cause**: Why the issue happens.
2. **The Proven Solution**: Code snippet and explanation.
3. **Prevention & Verification**: How to test and prevent regressions.
