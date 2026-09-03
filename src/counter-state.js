const STORAGE_KEY = 'counter_app_state';
const MAX_HISTORY_ENTRIES = 10;

function validHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((entry) => (
      entry
      && typeof entry.action === 'string'
      && Number.isFinite(entry.before)
      && Number.isFinite(entry.after)
    ))
    .slice(0, MAX_HISTORY_ENTRIES)
    .map(({ action, before, after }) => ({ action, before, after }));
}

export class CounterState {
  constructor(initial = {}) {
    const {
      count = 0,
      step = 1,
      theme = 'dark',
      undoCount = null,
      history = [],
      target = null,
    } = initial ?? {};
    this.count = Number.isFinite(count) ? count : 0;
    this.step = Number.isFinite(step) && step > 0 ? step : 1;
    this.theme = theme === 'light' ? 'light' : 'dark';
    this.undoCount = Number.isFinite(undoCount) ? undoCount : null;
    this.history = validHistory(history);
    this.target = Number.isFinite(target) && target > 0 ? target : null;
    this.listeners = new Set();
  }

  recordHistory(action, before, after) {
    this.history = [{ action, before, after }, ...this.history].slice(0, MAX_HISTORY_ENTRIES);
  }

  increment() {
    const before = this.count;
    this.undoCount = this.count;
    this.count += this.step;
    this.recordHistory('increment', before, this.count);
    this.notify();
    return this.count;
  }

  decrement() {
    const before = this.count;
    this.undoCount = this.count;
    this.count -= this.step;
    this.recordHistory('decrement', before, this.count);
    this.notify();
    return this.count;
  }

  reset() {
    if (this.count === 0) return this.count;
    const before = this.count;
    this.undoCount = this.count;
    this.count = 0;
    this.recordHistory('reset', before, this.count);
    this.notify();
    return this.count;
  }

  undo() {
    if (this.undoCount === null) return this.count;
    const before = this.count;
    this.count = this.undoCount;
    this.undoCount = null;
    this.recordHistory('undo', before, this.count);
    this.notify();
    return this.count;
  }

  clearHistory() {
    if (this.history.length === 0) return this.history;
    this.history = [];
    this.notify();
    return this.history;
  }

  setStep(value) {
    const step = Number(value);
    if (!Number.isFinite(step) || step <= 0) return this.step;
    this.step = step;
    this.notify();
    return this.step;
  }

  setTarget(value) {
    if (value === null || value === '' || value === undefined) {
      this.target = null;
    } else {
      const num = Number(value);
      this.target = Number.isFinite(num) && num > 0 ? num : null;
    }
    this.notify();
    return this.target;
  }

  multiply(factor) {
    const num = Number(factor);
    if (!Number.isFinite(num) || num <= 0) return this.count;
    const before = this.count;
    this.undoCount = this.count;
    this.count = Math.round(this.count * num);
    this.recordHistory(`×${factor}`, before, this.count);
    this.notify();
    return this.count;
  }

  addAmount(amount) {
    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta === 0) return this.count;
    const before = this.count;
    this.undoCount = this.count;
    this.count += delta;
    this.recordHistory(delta > 0 ? `+${delta}` : `${delta}`, before, this.count);
    this.notify();
    return this.count;
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.notify();
    return this.theme;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.toJSON();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  toJSON() {
    const data = {
      count: this.count,
      step: this.step,
      theme: this.theme,
      undoCount: this.undoCount,
      history: this.history,
    };
    if (this.target !== null && this.target !== undefined) {
      data.target = this.target;
    }
    return data;
  }

  saveToStorage(storage = globalThis.localStorage, key = STORAGE_KEY) {
    try {
      storage?.setItem?.(key, JSON.stringify(this.toJSON()));
    } catch {
      // Storage can be unavailable or full.
    }
  }

  static loadFromStorage(storage = globalThis.localStorage, key = STORAGE_KEY) {
    try {
      const value = storage?.getItem?.(key);
      return new CounterState(value ? JSON.parse(value) : undefined);
    } catch {
      return new CounterState();
    }
  }
}
