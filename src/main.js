import { CounterState } from './counter-state.js';
import { sounds } from './audio.js';

const state = CounterState.loadFromStorage();
let totalActions = 0;
let peakCount = state.count;
let previousCount = state.count;
let goalCelebrated = false;

// DOM Elements
const countDisplay = document.querySelector('#count-display');
const themeButton = document.querySelector('#btn-theme');
const soundButton = document.querySelector('#btn-sound');
const undoButton = document.querySelector('#btn-undo');
const historyList = document.querySelector('#count-history');
const clearHistoryButton = document.querySelector('#btn-clear-history');
const stepButtons = [...document.querySelectorAll('[data-step]')];
const customStepForm = document.querySelector('#custom-step-form');
const customStepInput = document.querySelector('#custom-step');
const customStepError = document.querySelector('#custom-step-error');
const copyButton = document.querySelector('#btn-copy');
const copyText = document.querySelector('#copy-text');

// Target Goal Elements
const targetBadge = document.querySelector('#target-badge');
const progressContainer = document.querySelector('#progress-container');
const progressBar = document.querySelector('#progress-bar');
const progressLabel = document.querySelector('#progress-label');
const progressCounts = document.querySelector('#progress-counts');
const goalBanner = document.querySelector('#goal-banner');
const clearGoalButton = document.querySelector('#btn-clear-goal');
const goalPresets = [...document.querySelectorAll('[data-goal]')];

// Stats Elements
const statActions = document.querySelector('#stat-actions');
const statPeak = document.querySelector('#stat-peak');
const statStep = document.querySelector('#stat-step');

let hasInitializedCustomStepInput = false;

function triggerCountAnimation(isUp) {
  countDisplay.classList.remove('pop-up', 'pop-down');
  void countDisplay.offsetWidth; // Force reflow
  countDisplay.classList.add(isUp ? 'pop-up' : 'pop-down');
  setTimeout(() => countDisplay.classList.remove('pop-up', 'pop-down'), 180);
}

function updateSoundButton() {
  if (!soundButton) return;
  soundButton.textContent = sounds.enabled ? '🔊' : '🔇';
  soundButton.setAttribute('aria-label', sounds.enabled ? 'Mute Sound Effects' : 'Enable Sound Effects');
}

function renderGoal(count, target) {
  if (!target || target <= 0) {
    targetBadge.textContent = 'Free Counting';
    progressContainer.style.display = 'none';
    clearGoalButton.style.display = 'none';
    goalPresets.forEach((b) => b.classList.remove('active'));
    goalCelebrated = false;
    return;
  }

  targetBadge.textContent = `Goal: ${target.toLocaleString()}`;
  progressContainer.style.display = 'grid';
  clearGoalButton.style.display = 'inline';

  goalPresets.forEach((btn) => {
    const isGoalActive = Number(btn.dataset.goal) === target;
    btn.classList.toggle('active', isGoalActive);
  });

  const percent = Math.min(100, Math.max(0, Math.round((count / target) * 100)));
  progressBar.style.width = `${percent}%`;
  progressLabel.textContent = `${percent}% completed`;
  progressCounts.textContent = `${count.toLocaleString()} / ${target.toLocaleString()}`;

  const reached = count >= target;
  goalBanner.style.display = reached ? 'block' : 'none';

  if (reached && !goalCelebrated) {
    sounds.play('goal');
    goalCelebrated = true;
  } else if (!reached) {
    goalCelebrated = false;
  }
}

function render({ count, step, theme, undoCount, target }) {
  countDisplay.textContent = count.toLocaleString();
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === 'dark' ? 'Light' : 'Dark';
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  undoButton.disabled = undoCount === null;

  if (document.activeElement !== customStepInput) {
    customStepInput.value = String(step);
  }

  stepButtons.forEach((button) => {
    const isActive = Number(button.dataset.step) === step;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  // Track peak
  if (count > peakCount) peakCount = count;

  // Stats
  if (statActions) statActions.textContent = totalActions.toLocaleString();
  if (statPeak) statPeak.textContent = peakCount.toLocaleString();
  if (statStep) statStep.textContent = Number(step).toLocaleString();

  // Target Goal UI
  renderGoal(count, target);

  state.saveToStorage();
}

function formatCount(value) {
  return Number(value).toLocaleString();
}

function renderHistory(history) {
  historyList.replaceChildren();
  clearHistoryButton.disabled = history.length === 0;
  historyList.setAttribute('aria-label', history.length === 0 ? 'No count history' : 'Recent count history');

  if (history.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'history-empty';
    emptyItem.textContent = 'No count actions yet.';
    historyList.append(emptyItem);
    return;
  }

  history.forEach(({ action, before, after }) => {
    const item = document.createElement('li');
    item.className = 'history-item';
    const label = action.charAt(0).toUpperCase() + action.slice(1);
    item.textContent = `${label}: ${formatCount(before)} → ${formatCount(after)}`;
    historyList.append(item);
  });
}

function recordUserAction(actionName, soundName) {
  totalActions += 1;
  const before = state.count;
  const actionFn = actions[actionName];
  if (actionFn) actionFn();
  const after = state.count;
  if (soundName) sounds.play(soundName);
  if (after !== before) triggerCountAnimation(after > before);
}

const actions = {
  increment: () => state.increment(),
  decrement: () => state.decrement(),
  reset: () => state.reset(),
  undo: () => state.undo(),
};

// Core Button Listeners
document.querySelector('#btn-inc').addEventListener('click', () => {
  recordUserAction('increment', 'increment');
});

document.querySelector('#btn-dec').addEventListener('click', () => {
  recordUserAction('decrement', 'decrement');
});

document.querySelector('#btn-reset').addEventListener('click', () => {
  recordUserAction('reset', 'reset');
});

document.querySelector('#btn-undo').addEventListener('click', () => {
  recordUserAction('undo', 'undo');
});

document.querySelector('#btn-theme').addEventListener('click', () => {
  state.toggleTheme();
  sounds.play('multiplier');
});

// Sound Toggle Button
soundButton?.addEventListener('click', () => {
  sounds.toggle();
  updateSoundButton();
});

// Quick Boosts & Multipliers
document.querySelector('#btn-mult-2')?.addEventListener('click', () => {
  totalActions += 1;
  const before = state.count;
  state.multiply(2);
  sounds.play('multiplier');
  triggerCountAnimation(state.count > before);
});

document.querySelector('#btn-mult-half')?.addEventListener('click', () => {
  totalActions += 1;
  const before = state.count;
  state.multiply(0.5);
  sounds.play('multiplier');
  triggerCountAnimation(state.count > before);
});

document.querySelector('#btn-boost-100')?.addEventListener('click', () => {
  totalActions += 1;
  state.addAmount(100);
  sounds.play('increment');
  triggerCountAnimation(true);
});

document.querySelector('#btn-boost-minus-100')?.addEventListener('click', () => {
  totalActions += 1;
  state.addAmount(-100);
  sounds.play('decrement');
  triggerCountAnimation(false);
});

// Target Goal Preset Buttons
goalPresets.forEach((button) => {
  button.addEventListener('click', () => {
    const goalVal = Number(button.dataset.goal);
    state.setTarget(state.target === goalVal ? null : goalVal);
    sounds.play('multiplier');
  });
});

clearGoalButton?.addEventListener('click', () => {
  state.setTarget(null);
  sounds.play('reset');
});

// Copy Count to Clipboard
copyButton?.addEventListener('click', async () => {
  const textToCopy = `Count: ${state.count.toLocaleString()}${state.target ? ` (Goal: ${state.target.toLocaleString()})` : ''}`;
  try {
    await navigator.clipboard.writeText(textToCopy);
    copyText.textContent = 'Copied! ✓';
    sounds.play('increment');
    setTimeout(() => { copyText.textContent = 'Copy'; }, 1500);
  } catch {
    copyText.textContent = `${state.count}`;
    setTimeout(() => { copyText.textContent = 'Copy'; }, 1500);
  }
});

clearHistoryButton.addEventListener('click', () => {
  state.clearHistory();
  sounds.play('reset');
});

stepButtons.forEach((button) => {
  button.addEventListener('click', () => {
    customStepInput.value = button.dataset.step;
    customStepError.textContent = '';
    customStepInput.removeAttribute('aria-invalid');
    state.setStep(button.dataset.step);
    sounds.play('multiplier');
  });
});

function applyCustomStep() {
  const value = Number(customStepInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    customStepError.textContent = 'Enter a positive number for the step size.';
    customStepInput.setAttribute('aria-invalid', 'true');
    customStepInput.focus();
    return;
  }

  customStepError.textContent = '';
  customStepInput.removeAttribute('aria-invalid');
  state.setStep(value);
  sounds.play('multiplier');
}

customStepForm.addEventListener('submit', (event) => {
  event.preventDefault();
  applyCustomStep();
});

customStepInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  applyCustomStep();
});

// Keyboard Shortcuts
const shortcuts = {
  '+': () => recordUserAction('increment', 'increment'),
  ArrowUp: () => recordUserAction('increment', 'increment'),
  '-': () => recordUserAction('decrement', 'decrement'),
  ArrowDown: () => recordUserAction('decrement', 'decrement'),
  r: () => recordUserAction('reset', 'reset'),
  R: () => recordUserAction('reset', 'reset'),
  z: () => recordUserAction('undo', 'undo'),
  Z: () => recordUserAction('undo', 'undo'),
  m: () => { sounds.toggle(); updateSoundButton(); },
  M: () => { sounds.toggle(); updateSoundButton(); },
};

window.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea')) return;

  // Handle Ctrl+Z / Cmd+Z specifically for undo
  if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key === 'z' || event.key === 'Z')) {
    event.preventDefault();
    recordUserAction('undo', 'undo');
    return;
  }

  // Ignore any other single-key shortcut if Ctrl, Meta, or Alt is held
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const action = shortcuts[event.key];
  if (!action) return;
  event.preventDefault();
  action();
});

state.subscribe((snapshot) => {
  render(snapshot);
  renderHistory(snapshot.history);
});

// Initial Render
updateSoundButton();
render(state.toJSON());
renderHistory(state.history);
