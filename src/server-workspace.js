import { TodoState } from './todo-state.js';

/** Server tasks use revision-checked saves; failed actions never replace visible saved state.
 * Filters/theme belong to this tab. Refresh is explicit so pending edit input stays intact.
 */
export class ServerWorkspace {
  constructor({ fetcher = (...args) => globalThis.fetch(...args) } = {}) {
    this.fetcher = fetcher;
    this.state = new TodoState();
    this.message = 'Loading server tasks…';
    this.revision = null;
    this.queue = Promise.resolve();
  }

  async request(options) {
    const response = await this.fetcher('/api/tasks', { ...options, signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server request failed.');
    return data;
  }

  refresh() {
    return this.enqueue(async () => {
      try {
        const saved = await this.request();
        this.state = new TodoState({ ...this.state.toJSON(), tasks: saved.tasks });
        this.state.reconcileProjectFilter();
        this.revision = saved.revision;
        this.message = '';
        return true;
      } catch { this.message = 'Server unavailable. Your saved tasks are unchanged. Use Refresh to reconnect.'; return false; }
    });
  }

  enqueue(action) {
    const operation = this.queue.then(action);
    this.queue = operation.catch(() => {});
    return operation;
  }

  update(action, { persist = true } = {}) {
    return this.enqueue(async () => {
      const draft = new TodoState(this.state.toJSON());
      const result = action(draft);
      if (result?.ok === false) return result;
      if (persist) {
        try {
          if (!this.revision) throw new Error('Refresh to load server tasks before saving.');
          const saved = await this.request({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: this.revision, tasks: draft.tasks }) });
          this.revision = saved.revision;
          draft.tasks = saved.tasks;
          this.message = '';
        } catch (error) {
          this.message = `${error.message} Your action was not confirmed. Refresh to check saved tasks before retrying.`;
          throw error;
        }
      }
      this.state = draft;
      return result;
    });
  }
}
