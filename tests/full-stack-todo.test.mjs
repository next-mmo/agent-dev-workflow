import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createTaskStore } from '../src/server/task-store.js';
import { taskApi } from '../src/server/task-api.js';
import { TodoState } from '../src/todo-state.js';
import { ServerWorkspace } from '../src/server-workspace.js';

function tasks(title = 'Ship release') {
  const state = new TodoState();
  state.createTask({ title, project: 'Release', dueDate: '2026-09-06' });
  return state.tasks;
}

async function fixture(t, options) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'full-stack-todo-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'tasks.json');
  const store = await createTaskStore(file, options);
  const server = http.createServer(taskApi(store));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}`;
  const fetcher = (route, options) => fetch(url + route, options);
  const put = (body, headers = {}) => fetcher('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { file, store, fetcher, put };
}

test('real HTTP saves survive store restart; stale revisions and invalid data leave disk unchanged', async (t) => {
  const { file, store, put } = await fixture(t);
  const original = store.read();
  const response = await put({ revision: original.revision, tasks: tasks() });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.deepEqual((await createTaskStore(file)).read(), saved);
  const disk = await readFile(file, 'utf8');
  assert.equal((await put({ revision: original.revision, tasks: [] })).status, 409);
  assert.equal((await put({ revision: saved.revision, tasks: [{ ...tasks()[0], dueDate: '2026-02-30' }] })).status, 400);
  assert.equal(await readFile(file, 'utf8'), disk);
});

test('overlapping saves serialize revision checks while the first disk write is blocked', async (t) => {
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { store } = await fixture(t, { persist: async () => { entered(); await gate; } });
  const revision = store.read().revision;
  const first = store.replace(revision, tasks('First'));
  await started;
  const second = store.replace(revision, tasks('Second'));
  const rejected = assert.rejects(second, (error) => error.status === 409);
  release();
  await first;
  await rejected;
  assert.equal(store.read().tasks[0].title, 'First');
});

test('failed persistence is not acknowledged and the next save can recover', async (t) => {
  let fail = true;
  const { store, put } = await fixture(t, { persist: async () => { if (fail) throw new Error('disk unavailable'); } });
  const original = store.read();
  assert.equal((await put({ revision: original.revision, tasks: tasks() })).status, 500);
  assert.deepEqual(store.read(), original);
  fail = false;
  assert.equal((await put({ revision: original.revision, tasks: tasks() })).status, 200);
});

test('HTTP rejects cross-origin writes, invalid JSON, oversized bodies and unsupported methods', async (t) => {
  const { store, fetcher, put } = await fixture(t);
  const input = { revision: store.read().revision, tasks: tasks() };
  assert.equal((await put(input, { Origin: 'https://example.com' })).status, 403);
  assert.equal((await put(input, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await fetcher('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await fetcher('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(1024 * 1024 + 1) })).status, 413);
  assert.equal((await fetcher('/api/tasks', { method: 'DELETE' })).status, 405);
  assert.equal(store.read().tasks.length, 0);
});

test('corrupt persisted data fails startup instead of resetting saved tasks', async (t) => {
  const { file } = await fixture(t);
  await writeFile(file, '{bad');
  await assert.rejects(createTaskStore(file), /Cannot load task data/);
  assert.equal(await readFile(file, 'utf8'), '{bad');
});

test('two browser clients preserve confirmed state on conflict and recover with explicit refresh', async (t) => {
  const { fetcher, store } = await fixture(t);
  const first = new ServerWorkspace({ fetcher });
  const second = new ServerWorkspace({ fetcher });
  await Promise.all([first.refresh(), second.refresh()]);
  await first.update((state) => state.createTask({ title: 'First' }));
  await assert.rejects(second.update((state) => state.createTask({ title: 'Second' })), /changed elsewhere/);
  assert.equal(second.state.tasks.length, 0);
  assert.match(second.message, /not confirmed/);
  await second.refresh();
  await second.update((state) => state.createTask({ title: 'Second' }));
  assert.deepEqual(store.read().tasks.map((task) => task.title), ['Second', 'First']);
  const revision = store.read().revision;
  await second.update((state) => state.setSearch('Second'), { persist: false });
  assert.equal(store.read().revision, revision);
});

test('offline client retains task snapshot and can change filters without sending writes', async (t) => {
  const { fetcher } = await fixture(t);
  const client = new ServerWorkspace({ fetcher });
  await client.refresh();
  await client.update((state) => state.createTask({ title: 'Keep me' }));
  client.fetcher = async () => { throw new Error('offline'); };
  await assert.rejects(client.update((state) => state.clearCompleted()), /offline/);
  assert.equal(client.state.tasks[0].title, 'Keep me');
  await client.update((state) => state.setSearch('Keep'), { persist: false });
  assert.equal(client.state.visibleTasks.length, 1);
  assert.equal(await client.refresh(), false);
});

test('editing preserves identity/completion and reconciles a removed project filter', () => {
  const state = new TodoState({ tasks: tasks() });
  const original = { ...state.tasks[0] };
  state.setProject('Release');
  state.toggleTask(original.id);
  assert.equal(state.editTask(original.id, { title: 'Updated', project: 'QA', priority: 'high' }).ok, true);
  assert.equal(state.tasks[0].id, original.id);
  assert.equal(state.tasks[0].createdAt, original.createdAt);
  assert.equal(state.tasks[0].completed, true);
  assert.equal(state.project, 'all');
  const saved = state.toJSON();
  assert.equal(state.editTask(original.id, { title: ' ' }).ok, false);
  assert.equal(state.editTask(original.id, { title: 'Bad date', dueDate: '2026-02-30' }).ok, false);
  assert.deepEqual(state.toJSON(), saved);
});

test('default browser transport retains the global fetch receiver', async (t) => {
  t.mock.method(globalThis, 'fetch', function () {
    assert.equal(this, globalThis, 'browser fetch requires its global receiver');
    return Promise.resolve({ ok: true, json: async () => ({ revision: 'test', tasks: [] }) });
  });
  assert.equal(await new ServerWorkspace().refresh(), true);
});
