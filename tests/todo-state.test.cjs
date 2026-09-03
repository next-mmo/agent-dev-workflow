const { test } = require('node:test');
const assert = require('node:assert/strict');

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
}

test('TodoState creates a complete task record and rejects blank titles', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const state = new TodoState({}, { now: () => '2026-09-04T08:00:00.000Z' });

  assert.deepEqual(state.createTask({ title: '   ' }), { ok: false, error: 'Enter a task before adding it.' });
  const result = state.createTask({ title: 'Ship release notes', project: 'Launch', priority: 'high', dueDate: '2026-09-10' });

  assert.equal(result.ok, true);
  assert.deepEqual(state.tasks, [{
    id: 'task-1', title: 'Ship release notes', project: 'Launch', priority: 'high',
    dueDate: '2026-09-10', completed: false, createdAt: '2026-09-04T08:00:00.000Z',
  }]);
});

test('TodoState composes completion, project, status, and text filters', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const state = new TodoState({}, { now: () => '2026-09-04T08:00:00.000Z' });
  const release = state.createTask({ title: 'Review launch copy', project: 'Launch', priority: 'high' }).task;
  state.createTask({ title: 'Book dental visit', project: 'Personal', priority: 'low' });
  state.toggleTask(release.id);

  state.setStatus('completed');
  state.setProject('Launch');
  state.setSearch('copy');
  assert.deepEqual(state.visibleTasks.map((task) => task.title), ['Review launch copy']);

  state.setSearch('dental');
  assert.equal(state.visibleTasks.length, 0);
  state.setStatus('invalid');
  assert.equal(state.status, 'all');
});

test('TodoState clears only completed tasks and preserves active work', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const state = new TodoState();
  const done = state.createTask({ title: 'Completed task' }).task;
  state.createTask({ title: 'Keep this task' });
  state.toggleTask(done.id);

  assert.equal(state.clearCompleted(), 1);
  assert.deepEqual(state.tasks.map((task) => task.title), ['Keep this task']);
  assert.equal(state.clearCompleted(), 0);
});

test('TodoState resets a project filter when its final task is removed', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const state = new TodoState();
  const task = state.createTask({ title: 'Single project task', project: 'Launch' }).task;
  state.setProject('Launch');

  assert.equal(state.removeTask(task.id), true);
  assert.equal(state.project, 'all');
});

test('TodoState persists workspace preferences and safely normalizes malformed stored tasks', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const storage = new MockLocalStorage();
  const state = new TodoState({}, { now: () => '2026-09-04T08:00:00.000Z' });
  state.createTask({ title: 'Prepare demo', project: 'Launch', priority: 'medium', dueDate: '2026-09-09' });
  state.setStatus('active');
  state.setProject('Launch');
  state.setSearch('demo');
  state.toggleTheme();
  state.saveToStorage(storage);

  const restored = TodoState.loadFromStorage(storage);
  assert.equal(restored.tasks[0].title, 'Prepare demo');
  assert.equal(restored.status, 'active');
  assert.equal(restored.project, 'Launch');
  assert.equal(restored.search, 'demo');
  assert.equal(restored.theme, 'light');

  storage.setItem('todo_workspace_state', JSON.stringify({ tasks: [{ id: 'ok', title: 'Good', dueDate: 'not-a-date' }, { id: 'bad', title: '   ' }, { id: 'ok', title: 'Duplicate' }] }));
  const normalized = TodoState.loadFromStorage(storage);
  assert.deepEqual(normalized.tasks, [{ id: 'ok', title: 'Good', project: 'Inbox', priority: 'medium', dueDate: '', completed: false, createdAt: 'legacy-0' }]);
});

test('TodoState returns valid defaults when storage is unreadable', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const state = TodoState.loadFromStorage({ getItem: () => '{not json' });
  assert.deepEqual(state.toJSON(), { tasks: [], theme: 'dark', status: 'all', project: 'all', search: '', nextId: 1 });
});

test('restored task IDs remain unique through create, reload, and removal', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  for (const nextId of [undefined, 2, 0, 'bad', Number.MAX_SAFE_INTEGER]) {
    const state = new TodoState({ nextId, tasks: [
      { id: 'task-2', title: 'Existing task' },
      { id: `task-${Number.MAX_SAFE_INTEGER}`, title: 'High ID task' },
    ] });
    const added = state.createTask({ title: 'New task' }).task;
    state.createTask({ title: 'Another task' });
    assert.equal(new Set(state.tasks.map((task) => task.id)).size, 4);
    const restored = new TodoState(state.toJSON());
    assert.equal(restored.tasks.length, 4);
    restored.removeTask(added.id);
    assert.ok(restored.tasks.some((task) => task.title === 'Existing task'));
    assert.ok(restored.tasks.some((task) => task.title === 'High ID task'));
  }
});

test('search preserves spaces during incremental input and normalizes only matching', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const state = new TodoState();
  state.createTask({ title: 'Release notes' });
  let input = '';
  const unsubscribe = state.subscribe(({ search }) => { input = search; });
  try {
    for (const character of 'release notes') state.setSearch(input + character);
    assert.equal(input, 'release notes');
    assert.equal(state.visibleTasks.length, 1);
    state.setSearch(' Release notes ');
    assert.equal(new TodoState(state.toJSON()).search, ' Release notes ');
    assert.equal(state.visibleTasks.length, 1);
  } finally {
    unsubscribe();
  }
});

test('denied browser storage access does not prevent task use', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError: storage denied'); },
    });
    const state = TodoState.loadFromStorage();
    assert.equal(state.createTask({ title: 'In-memory task' }).ok, true);
    assert.equal(state.saveToStorage(), false);
    assert.equal(state.tasks[0].title, 'In-memory task');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});

test('storage failures are reported and a later successful save is recoverable', async () => {
  const { TodoState } = await import('../src/todo-state.js');
  const state = new TodoState();
  state.createTask({ title: 'Keep during quota failure' });
  assert.equal(state.saveToStorage({ setItem() { throw new Error('QuotaExceededError'); } }), false);
  assert.equal(state.saveToStorage(null), false);
  const storage = new MockLocalStorage();
  assert.equal(state.saveToStorage(storage), true);
  assert.equal(TodoState.loadFromStorage(storage).tasks[0].title, 'Keep during quota failure');
});
