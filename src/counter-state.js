const STORAGE_KEY = 'counter_app_state';

export class CounterState {
  constructor(initial = {}) {
    const { count = 0, step = 1, theme = 'dark', undoCount = null } = initial ?? {};
    this.count = Number.isFinite(count) ? count : 0;
    this.step = Number.isFinite(step) && step > 0 ? step : 1;
    this.theme = theme === 'light' ? 'light' : 'dark';
    this.undoCount = Number.isFinite(undoCount) ? undoCount : null;
    this.listeners = new Set();
  }

  increment() {
    this.undoCount = this.count;
    this.count += this.step;
    this.notify();
    return this.count;
  }

  decrement() {
    this.undoCount = this.count;
    this.count -= this.step;
    this.notify();
    return this.count;
  }

  reset() {
    if (this.count === 0) return this.count;
    this.undoCount = this.count;
    this.count = 0;
    this.notify();
    return this.count;
  }

  undo() {
    if (this.undoCount === null) return this.count;
    this.count = this.undoCount;
    this.undoCount = null;
    this.notify();
    return this.count;
  }

  setStep(value) {
    const step = Number(value);
    if (!Number.isFinite(step) || step <= 0) return this.step;
    this.step = step;
    this.notify();
    return this.step;
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
    return {
      count: this.count,
      step: this.step,
      theme: this.theme,
      undoCount: this.undoCount,
    };
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
