import { CounterState } from './counter-state.js';

const state = CounterState.loadFromStorage();
const countDisplay = document.querySelector('#count-display');
const themeButton = document.querySelector('#btn-theme');
const stepButtons = [...document.querySelectorAll('[data-step]')];

function render({ count, step, theme }) {
  countDisplay.textContent = count.toLocaleString();
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === 'dark' ? 'Light' : 'Dark';
  themeButton.setAttribute(
    'aria-label',
    `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
  );
  stepButtons.forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.step) === step);
  });
  state.saveToStorage();
}

const actions = {
  increment: () => state.increment(),
  decrement: () => state.decrement(),
  reset: () => state.reset(),
};

for (const [id, action] of [
  ['btn-inc', actions.increment],
  ['btn-dec', actions.decrement],
  ['btn-reset', actions.reset],
  ['btn-theme', () => state.toggleTheme()],
]) {
  document.querySelector(`#${id}`).addEventListener('click', action);
}

stepButtons.forEach((button) => {
  button.addEventListener('click', () => state.setStep(button.dataset.step));
});

const shortcuts = {
  '+': actions.increment,
  ArrowUp: actions.increment,
  '-': actions.decrement,
  ArrowDown: actions.decrement,
  r: actions.reset,
  R: actions.reset,
};

window.addEventListener('keydown', (event) => {
  const action = shortcuts[event.key];
  if (!action || event.target.matches('input, textarea')) return;
  event.preventDefault();
  action();
});

state.subscribe(render);
render(state.toJSON());
