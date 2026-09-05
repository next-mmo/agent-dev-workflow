import { mkdir, readFile, open, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function validateTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length > 2000) throw new ApiError(400, 'Expected up to 2000 tasks.');
  const ids = new Set();
  for (const task of tasks) {
    if (!task || typeof task !== 'object'
      || typeof task.id !== 'string' || !task.id || task.id.length > 80 || ids.has(task.id)
      || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 160
      || typeof task.project !== 'string' || !task.project.trim() || task.project.length > 40
      || !['low', 'medium', 'high'].includes(task.priority)
      || typeof task.completed !== 'boolean' || typeof task.createdAt !== 'string'
      || !Number.isFinite(Date.parse(task.createdAt))
      || typeof task.dueDate !== 'string'
      || (task.dueDate !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)
        || !Number.isFinite(Date.parse(`${task.dueDate}T00:00:00Z`))
        || new Date(`${task.dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== task.dueDate))) {
      throw new ApiError(400, 'Invalid task fields or duplicate task ID.');
    }
    ids.add(task.id);
  }
  return tasks.map(({ id, title, project, priority, completed, createdAt, dueDate }) =>
    ({ id, title: title.trim(), project: project.trim(), priority, completed, createdAt, dueDate }));
}

/** One store owns one data file. Mutations serialize revision checks and atomic replacement.
 * A failed write leaves the acknowledged snapshot unchanged. Corrupt data fails startup.
 */
export async function createTaskStore(file, { persist } = {}) {
  let snapshot = { revision: randomUUID(), tasks: [] };
  try {
    const saved = JSON.parse(await readFile(file, 'utf8'));
    if (typeof saved.revision !== 'string' || !saved.revision) throw new Error('Missing revision');
    snapshot = { revision: saved.revision, tasks: validateTasks(saved.tasks) };
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Cannot load task data: ${error.message}`);
  }
  const write = persist ?? (async (value) => {
    await mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temp, 'wx');
      try { await handle.writeFile(JSON.stringify(value)); await handle.sync(); }
      finally { await handle.close(); }
      await rename(temp, file);
    } finally { await unlink(temp).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
  });
  let queue = Promise.resolve();
  return {
    read: () => structuredClone(snapshot),
    replace(revision, tasks) {
      const operation = queue.then(async () => {
        if (revision !== snapshot.revision) throw new ApiError(409, 'Tasks changed elsewhere. Refresh before trying again.');
        const next = { revision: randomUUID(), tasks: validateTasks(tasks) };
        await write(next);
        snapshot = next;
        return structuredClone(snapshot);
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}
