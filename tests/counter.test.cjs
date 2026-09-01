const { test } = require('node:test');
const assert = require('node:assert');

// Mock localStorage for isolated Node test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  clear() {
    this.store = {};
  }
}

test('CounterState initializes with default values', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState();
  assert.strictEqual(state.count, 0);
  assert.strictEqual(state.step, 1);
  assert.strictEqual(state.theme, 'dark');
});

test('CounterState increments by step', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState({ count: 10, step: 5 });
  assert.strictEqual(state.increment(), 15);
  assert.strictEqual(state.increment(), 20);
});

test('CounterState decrements by step', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState({ count: 10, step: 2 });
  assert.strictEqual(state.decrement(), 8);
  assert.strictEqual(state.decrement(), 6);
});

test('CounterState sets custom step', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState();
  state.setStep(10);
  assert.strictEqual(state.step, 10);
  state.increment();
  assert.strictEqual(state.count, 10);
});

test('CounterState supports decimal custom steps and rejects invalid values', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState();
  assert.strictEqual(state.setStep('2.5'), 2.5);
  assert.strictEqual(state.increment(), 2.5);
  assert.strictEqual(state.setStep(0), 2.5);
  assert.strictEqual(state.setStep('not-a-number'), 2.5);
});

test('CounterState resets to zero', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState({ count: 42 });
  assert.strictEqual(state.reset(), 0);
  assert.strictEqual(state.count, 0);
});

test('CounterState undoes the most recent count action once', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState({ count: 10, step: 5 });
  assert.strictEqual(state.increment(), 15);
  assert.strictEqual(state.undo(), 10);
  assert.strictEqual(state.undo(), 10);
  assert.strictEqual(state.undoCount, null);
});

test('CounterState undoes reset without changing step or theme', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState({ count: 42, step: 10, theme: 'light' });
  assert.strictEqual(state.reset(), 0);
  assert.strictEqual(state.undo(), 42);
  assert.strictEqual(state.step, 10);
  assert.strictEqual(state.theme, 'light');
});

test('CounterState saves and loads from storage', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const mockStorage = new MockLocalStorage();
  const state1 = new CounterState({ count: 100, step: 10, theme: 'light' });
  state1.increment();
  state1.saveToStorage(mockStorage);

  const state2 = CounterState.loadFromStorage(mockStorage);
  assert.strictEqual(state2.count, 110);
  assert.strictEqual(state2.step, 10);
  assert.strictEqual(state2.theme, 'light');
  assert.strictEqual(state2.undo(), 100);
});

test('CounterState toggles theme mode', async () => {
  const { CounterState } = await import('../src/counter-state.js');
  const state = new CounterState({ theme: 'dark' });
  assert.strictEqual(state.toggleTheme(), 'light');
  assert.strictEqual(state.toggleTheme(), 'dark');
});
