import { TodoState } from './todo-state.js';

const STORAGE_KEY = 'todo_workspace_state';

/** Serialize tab updates, reloading saved state inside the shared browser lock.
 * Failed saves keep the session intact. Conflicting saved data is never overwritten
 * by retrying an unsaved snapshot. Without Web Locks, changes remain session-only.
 */
export class TodoWorkspace {
  constructor({ storage = () => globalThis.localStorage, locks = globalThis.navigator?.locks } = {}) {
    this.storage = storage;
    this.locks = locks;
    this.state = new TodoState();
    this.baseRaw = undefined;
    this.unsaved = false;
    this.message = '';
    this.queue = Promise.resolve();
    this.refresh();
  }

  read() {
    const storage = this.storage();
    if (typeof storage?.getItem !== 'function') throw new Error('Storage unavailable');
    return { storage, raw: storage.getItem(STORAGE_KEY) };
  }

  restore(raw) {
    try { this.state = new TodoState(raw ? JSON.parse(raw) : undefined); }
    catch { this.state = new TodoState(); }
    this.baseRaw = raw;
  }

  refresh() {
    if (this.unsaved) return false;
    try {
      this.restore(this.read().raw);
      this.message = this.locks?.request ? '' : 'Changes will stay in this tab. Shared browser storage is unavailable.';
      return true;
    } catch {
      this.message = 'Changes are kept only in this tab. Browser storage is unavailable.';
      return false;
    }
  }

  update(action) {
    const operation = this.queue.then(() => this.commit(action));
    // An action failure is returned to its caller but must not poison later updates.
    this.queue = operation.catch(() => {});
    return operation;
  }

  async commit(action) {
    let applied = false;
    let result;
    const apply = () => {
      applied = true;
      result = action(this.state);
      this.unsaved = true;
    };
    if (!this.locks?.request) {
      apply();
      this.message = 'Changes are kept only in this tab. Shared browser storage is unavailable.';
      return result;
    }
    try {
      await this.locks.request(STORAGE_KEY, () => {
        let snapshot;
        try { snapshot = this.read(); }
        catch {
          apply();
          this.message = 'Changes are kept only in this tab. Browser storage is unavailable.';
          return;
        }
        if (!this.unsaved) this.restore(snapshot.raw);
        const conflict = this.baseRaw !== snapshot.raw && !(this.baseRaw === undefined && snapshot.raw === null);
        apply();
        if (conflict) {
          this.message = 'Another tab saved different tasks. Your unsaved changes remain here. Copy them before reloading.';
          return;
        }
        if (this.state.saveToStorage(snapshot.storage)) {
          this.baseRaw = JSON.stringify(this.state.toJSON());
          this.unsaved = false;
          this.message = '';
        } else {
          this.message = 'Changes are kept only in this tab. Browser storage is unavailable.';
        }
      });
    } catch (error) {
      if (applied) throw error;
      apply();
      this.message = 'Changes are kept only in this tab. Shared browser storage is unavailable.';
    }
    return result;
  }
}
