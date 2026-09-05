import test from 'node:test';
import assert from 'node:assert/strict';
import { TodoWorkspace } from '../src/todo-workspace.js';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture() {
  let raw = null;
  let tail = Promise.resolve();
  const requested = [];
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const locks = {
    request(name, action) {
      requested.push(name);
      const operation = tail.then(action);
      tail = operation.catch(() => {});
      return operation;
    },
  };
  const workspace = () => new TodoWorkspace({ storage: () => storage, locks });
  return { storage, locks, requested, workspace, saved: () => JSON.parse(raw) };
}

test('overlapping tabs serialize updates and preserve tasks when another tab searches', async () => {
  const f = fixture();
  const a = f.workspace();
  const b = f.workspace();
  const entered = deferred();
  const release = deferred();
  const held = f.locks.request('todo_workspace_state', async () => { entered.resolve(); await release.promise; });
  await entered.promise;
  const first = a.update((state) => state.createTask({ title: 'From tab A' }));
  const second = b.update((state) => state.setSearch('tab'));
  await Promise.resolve();
  assert.equal(f.requested.length, 3, 'both tabs requested the held lock before either saved');
  assert.equal(f.saved(), null);
  release.resolve();
  await Promise.all([held, first, second]);
  assert.deepEqual(f.saved().tasks.map((task) => task.title), ['From tab A']);
  assert.equal(f.saved().search, 'tab');
  await Promise.all([
    a.update((state) => state.createTask({ title: 'Second' })),
    b.update((state) => state.createTask({ title: 'Third' })),
  ]);
  assert.equal(f.saved().tasks.length, 3);
  assert.equal(new Set(f.saved().tasks.map((task) => task.id)).size, 3);
});

test('failed saves retain the session and retry only without a conflicting snapshot', async () => {
  const f = fixture();
  const a = f.workspace();
  const b = f.workspace();
  const save = f.storage.setItem;
  f.storage.setItem = () => { throw new Error('quota'); };
  await a.update((state) => state.createTask({ title: 'Unsaved' }));
  assert.equal(a.unsaved, true);
  assert.match(a.message, /only in this tab/);
  f.storage.setItem = save;
  await b.update((state) => state.createTask({ title: 'Other tab saved' }));
  assert.equal(a.refresh(), false, 'storage events cannot discard unsaved work');
  await a.update((state) => state.setSearch('Unsaved'));
  assert.equal(a.state.tasks[0].title, 'Unsaved');
  assert.match(a.message, /Another tab/);
  assert.equal(f.saved().tasks[0].title, 'Other tab saved');
});

test('quota recovery saves the existing unsaved session when storage is unchanged', async () => {
  const f = fixture();
  const a = f.workspace();
  const save = f.storage.setItem;
  f.storage.setItem = () => { throw new Error('quota'); };
  await a.update((state) => state.createTask({ title: 'Keep me' }));
  f.storage.setItem = save;
  await a.update((state) => state.setSearch('Keep'));
  assert.equal(a.unsaved, false);
  assert.equal(f.saved().tasks[0].title, 'Keep me');
  assert.equal(a.message, '');
});

test('initially denied storage can recover without discarding session tasks', async () => {
  const f = fixture();
  let denied = true;
  const a = new TodoWorkspace({ storage: () => { if (denied) throw new Error('denied'); return f.storage; }, locks: f.locks });
  await a.update((state) => state.createTask({ title: 'Keep during denial' }));
  denied = false;
  await a.update((state) => state.setSearch('Keep'));
  assert.equal(f.saved().tasks[0].title, 'Keep during denial');
});

test('without shared locks, existing data is readable and session changes never overwrite it', async () => {
  const f = fixture();
  await f.workspace().update((state) => state.createTask({ title: 'Saved' }));
  const a = new TodoWorkspace({ storage: () => f.storage, locks: null });
  await a.update((state) => state.createTask({ title: 'Session only' }));
  assert.equal(a.state.tasks.length, 2);
  assert.equal(f.saved().tasks.length, 1);
  assert.match(a.message, /only in this tab/);
});

test('storage refresh is read-only and queued phrase input retains the final query', async () => {
  const f = fixture();
  const a = f.workspace();
  assert.equal(f.saved(), null, 'initial rendering must not write storage');
  await Promise.all(['release', 'release ', 'release notes'].map((query) => a.update((state) => state.setSearch(query))));
  const b = f.workspace();
  assert.equal(b.state.search, 'release notes');
  await a.update((state) => state.createTask({ title: 'New task' }));
  assert.equal(b.refresh(), true);
  assert.equal(b.state.tasks[0].title, 'New task');
});
