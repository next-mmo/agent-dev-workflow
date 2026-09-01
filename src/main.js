import { CounterState } from './counter-state.js';

const state = CounterState.loadFromStorage();
const countDisplay = document.querySelector('#count-display');
const themeButton = document.querySelector('#btn-theme');
const undoButton = document.querySelector('#btn-undo');
const historyList = document.querySelector('#count-history');
const clearHistoryButton = document.querySelector('#btn-clear-history');
const stepButtons = [...document.querySelectorAll('[data-step]')];
const customStepForm = document.querySelector('#custom-step-form');
const customStepInput = document.querySelector('#custom-step');
const customStepError = document.querySelector('#custom-step-error');
let hasInitializedCustomStepInput = false;

function render({ count, step, theme, undoCount }) {
  countDisplay.textContent = count.toLocaleString();
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === 'dark' ? 'Light' : 'Dark';
  themeButton.setAttribute(
    'aria-label',
    `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
  );
  undoButton.disabled = undoCount === null;
  if (!hasInitializedCustomStepInput) {
    customStepInput.value = String(step);
    hasInitializedCustomStepInput = true;
  }
  stepButtons.forEach((button) => {
    const isActive = Number(button.dataset.step) === step;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
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

const actions = {
  increment: () => state.increment(),
  decrement: () => state.decrement(),
  reset: () => state.reset(),
  undo: () => state.undo(),
};

for (const [id, action] of [
  ['btn-inc', actions.increment],
  ['btn-dec', actions.decrement],
  ['btn-reset', actions.reset],
  ['btn-undo', actions.undo],
  ['btn-theme', () => state.toggleTheme()],
]) {
  document.querySelector(`#${id}`).addEventListener('click', action);
}

clearHistoryButton.addEventListener('click', () => state.clearHistory());

stepButtons.forEach((button) => {
  button.addEventListener('click', () => {
    customStepInput.value = button.dataset.step;
    customStepError.textContent = '';
    customStepInput.removeAttribute('aria-invalid');
    state.setStep(button.dataset.step);
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

const shortcuts = {
  '+': actions.increment,
  ArrowUp: actions.increment,
  '-': actions.decrement,
  ArrowDown: actions.decrement,
  r: actions.reset,
  R: actions.reset,
  z: actions.undo,
  Z: actions.undo,
};

window.addEventListener('keydown', (event) => {
  const action = shortcuts[event.key];
  if (!action || event.target.matches('input, textarea')) return;
  event.preventDefault();
  action();
});

state.subscribe((snapshot) => {
  render(snapshot);
  renderHistory(snapshot.history);
});
render(state.toJSON());
renderHistory(state.history);
