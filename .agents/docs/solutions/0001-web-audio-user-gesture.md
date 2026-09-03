---
title: Web Audio Autoplay Policy and AudioContext Resumption
module: src/audio.js
tags: [audio, webaudio, autoplay, browser-compat]
problem: "AudioContext is initialized in 'suspended' state on page load, causing audio to be silently dropped"
solution: "Call audioContext.resume() inside user click or keydown handlers before playing tones"
---

# Web Audio Autoplay Policy and AudioContext Resumption

> **Module:** `src/audio.js`  
> **Tags:** `audio`, `webaudio`, `autoplay`, `browser-compat`  

---

## 1. Problem & Root Cause

Modern web browsers (Chrome, Safari, Firefox, Edge) enforce an autoplay policy that prevents web applications from making sound automatically without user interaction.
When an `AudioContext` is instantiated on page load:
- The context state is immediately set to `"suspended"`.
- If an oscillator is scheduled to play while suspended, no sound plays, or the browser logs:
  `The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.`

---

## 2. Proven Solution

In `src/audio.js`, defer audio context initialization or explicitly invoke `.resume()` on any user gesture (such as clicking the counter increment button or pressing `+` / `Space`):

```javascript
function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioContext = new AudioCtx();
  }
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}
```

---

## 3. Prevention & Testing

- Never play sound in top-level module code or on DOMContentLoaded.
- Always trigger audio inside direct event listeners (`click`, `keydown`, `touchstart`).
- In automated unit tests running under Node.js (without browser globals), ensure audio synthesis gracefully falls back to a no-op when `window.AudioContext` is undefined.
