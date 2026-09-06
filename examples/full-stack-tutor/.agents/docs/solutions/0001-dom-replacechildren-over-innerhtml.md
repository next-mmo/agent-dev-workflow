---
status: completed
title: DOM replaceChildren over innerHTML
module: public/app.js
tags: [security, dom, xss]
problem: "Static pattern reviewer flags raw innerHTML assignment as an unsafe dynamic execution/DOM injection pattern."
solution: "Use Element.replaceChildren() instead of innerHTML = '' to clear container child nodes cleanly and safely."
---

# DOM replaceChildren over innerHTML

> **Module:** `public/app.js`
> **Tags:** `security`, `dom`, `xss`, `learnings`

## Reproduction and Root Cause

Assigning to `element.innerHTML` triggers static security pattern rules (`Unsafe dynamic execution or DOM injection pattern`). Even when clearing empty strings, string assignments to the property bypass modern DOM node APIs.

## Fix and Verification

Use `element.replaceChildren()`:
```javascript
// Avoid raw property assignment:
// optionsContainerEl["innerHTML"] = ...

// Recommended (clean, safe, standard):
optionsContainerEl.replaceChildren();
```

Ran `npm exec -- agent-workflow review`. Findings reduced from 2 to 0.

## Recovery

`Element.replaceChildren()` is supported across all modern evergreen browsers (Chrome 86+, Safari 14+, Firefox 78+, Node DOM).
