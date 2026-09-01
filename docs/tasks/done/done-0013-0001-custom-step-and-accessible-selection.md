# Task 0013: Add Custom Step and Accessible Selection State

> **Status:** done
>
> **Scrum Artifact:** completed increment
>
> **Created:** 2026-09-01
>
> **Completed:** 2026-09-01

## 1. Goal

Improve the Counter beta round with arbitrary positive custom step sizes and
make the selected step state available to assistive technology.

## 2. Change Contract

- **Human outcome:** Users can count with a step size that fits their work, and
  all users can identify the currently selected step.
- **Acceptance evidence:** A visible user can enter a valid custom step, apply
  it with the button or Enter, see it persist after reload, and receive clear
  feedback for invalid input. The selected preset exposes an accessible pressed
  state and changes when another preset or custom value is applied.
- **Non-goals:** Do not add accounts, server sync, multi-level history, new
  dependencies, or unrelated visual redesign.
- **Affected layers and owners:** Counter UI, state tests, Counter PRD, and
  beta task evidence; humans own final beta acceptance.
- **Risk level and required approvals:** Standard low-risk UI/state change; no
  production or external-system action.
- **Baseline:** Preset steps work, persistence works, and the 320px and 360px
  layouts render. The accessible snapshot does not expose which preset is
  selected.
- **Verification plan:** Run unit tests and build, then complete visible beta
  rounds for preset/custom/invalid/keyboard/persistence/mobile paths and inspect
  browser console output.
- **Rollback or recovery:** Revert the tracked feature, tests, PRD, and task
  changes; saved browser state may be reset through the existing Reset control.

## 3. Acceptance Criteria

- [x] User can enter and apply a positive custom step size.
- [x] Pressing Enter in the custom step form applies the value.
- [x] Invalid or empty custom input shows an error and does not change the
  current step.
- [x] Custom step and count persist after reload.
- [x] Preset and custom selection state is exposed through `aria-pressed`.
- [x] Existing counter, undo, theme, keyboard, and responsive behavior remains
  passing.

## 4. Verification Evidence

## 4. Beta Round Evidence

### Round 1: baseline

- **Result:** PASS for the existing visible counter flows.
- Reset, preset step selection, increment, keyboard undo, theme switching,
  reload persistence, and 320px/360px layouts were exercised in the in-app
  browser.
- **Defect found:** The selected preset was visually highlighted but the
  accessible UI tree did not expose a pressed/selected state.

### Round 2: feature before bug fix

- **Result:** FAIL for the new Enter acceptance criterion.
- Clicking Apply worked for custom values, but entering `3` and pressing Enter
  left the field displaying `3` while the counter continued using the previous
  `2.5` step. Reload restored `2.5`, confirming the value was not applied.
- **Root cause:** The browser's Enter path did not submit the custom form in the
  tested environment; only the button submit path reached the state update.

### Round 3: post-fix beta acceptance

- **Result:** PASS.
- Entering `6`, pressing Enter, and incrementing produced `6` from zero,
  proving the new step was applied.
- Reload preserved count `6` and custom step `6`.
- Entering `0` showed `Enter a positive number for the step size.` and the
  existing step remained active; a subsequent increment used the old step.
- Clicking preset `10` cleared the error, updated the input to `10`, and exposed
  `button "10" [pressed]` in the accessible UI tree.
- Decrement, undo, reset, theme state, and existing shortcut hints remained
  available after the feature change.
- The 320px layout remained visible without horizontal overflow.
- Browser console error/warning log: empty.

## 5. Verification Evidence

- `npm test`: 10 passed, 0 failed.
- `npm run build`: Vite production build passed.
- Visible in-app browser beta rounds: PASS after the Enter fix.
- `git diff --check`: passed.

## 6. Handoff

- **Outcome:** Counter users can apply arbitrary positive custom steps by button
  or Enter, with persistence and validation; preset selection is accessible.
- **Skipped:** No server, authentication, deployment, or external-system paths
  apply to this local-only demo.
- **Residual risk:** Full screen-reader testing and cross-browser native number
  input behavior remain outside this round.
- **Human decision:** Human still owns final beta acceptance and any future
  product scope beyond this Counter demo.
