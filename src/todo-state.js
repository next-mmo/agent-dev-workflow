const STORAGE_KEY = 'todo_workspace_state';
const PRIORITIES = new Set(['low', 'medium', 'high']);
const STATUSES = new Set(['all', 'active', 'completed']);
const MAX_TITLE_LENGTH = 160;
const MAX_PROJECT_LENGTH = 40;

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validDate(value) {
  if (value === '') return '';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : '';
}

function normalizeTask(task, index) {
  if (!task || typeof task !== 'object') return null;
  const title = cleanText(task.title, MAX_TITLE_LENGTH);
  const id = cleanText(task.id, 80);
  if (!title || !id) return null;
  return {
    id,
    title,
    project: cleanText(task.project, MAX_PROJECT_LENGTH) || 'Inbox',
    priority: PRIORITIES.has(task.priority) ? task.priority : 'medium',
    dueDate: validDate(task.dueDate),
    completed: Boolean(task.completed),
    createdAt: typeof task.createdAt === 'string' && task.createdAt ? task.createdAt : `legacy-${index}`,
  };
}

function uniqueTasks(tasks) {
  const ids = new Set();
  return (Array.isArray(tasks) ? tasks : []).reduce((valid, task, index) => {
    const normalized = normalizeTask(task, index);
    if (normalized && !ids.has(normalized.id)) {
      ids.add(normalized.id);
      valid.push(normalized);
    }
    return valid;
  }, []);
}

export class TodoState {
  constructor(initial = {}, options = {}) {
    const source = initial && typeof initial === 'object' ? initial : {};
    this.tasks = uniqueTasks(source.tasks);
    this.theme = source.theme === 'light' ? 'light' : 'dark';
    this.status = STATUSES.has(source.status) ? source.status : 'all';
    this.project = typeof source.project === 'string' ? source.project : 'all';
    this.search = typeof source.search === 'string' ? source.search.slice(0, MAX_TITLE_LENGTH) : '';
    this.nextId = Number.isSafeInteger(source.nextId) && source.nextId > 0 ? source.nextId : this.tasks.length + 1;
    this.now = options.now ?? (() => new Date().toISOString());
    this.listeners = new Set();
  }

  createTask(details = {}) {
    const title = cleanText(details.title, MAX_TITLE_LENGTH);
    if (!title) return { ok: false, error: 'Enter a task before adding it.' };
    // Stored counters can be missing or stale; never reuse an existing task ID.
    const ids = new Set(this.tasks.map((task) => task.id));
    while (ids.has(`task-${this.nextId}`)) this.advanceId();
    const task = {
      id: `task-${this.nextId}`,
      title,
      project: cleanText(details.project, MAX_PROJECT_LENGTH) || 'Inbox',
      priority: PRIORITIES.has(details.priority) ? details.priority : 'medium',
      dueDate: validDate(details.dueDate),
      completed: false,
      createdAt: this.now(),
    };
    this.advanceId();
    this.tasks.unshift(task);
    this.notify();
    return { ok: true, task };
  }

  advanceId() {
    this.nextId = this.nextId >= Number.MAX_SAFE_INTEGER ? 1 : this.nextId + 1;
  }

  toggleTask(id) {
    const task = this.tasks.find((entry) => entry.id === id);
    if (!task) return false;
    task.completed = !task.completed;
    this.notify();
    return true;
  }

  removeTask(id) {
    const previousLength = this.tasks.length;
    this.tasks = this.tasks.filter((task) => task.id !== id);
    if (this.tasks.length === previousLength) return false;
    this.reconcileProjectFilter();
    this.notify();
    return true;
  }

  clearCompleted() {
    const previousLength = this.tasks.length;
    this.tasks = this.tasks.filter((task) => !task.completed);
    if (this.tasks.length === previousLength) return 0;
    const removed = previousLength - this.tasks.length;
    this.reconcileProjectFilter();
    this.notify();
    return removed;
  }

  setStatus(status) {
    this.status = STATUSES.has(status) ? status : 'all';
    this.notify();
  }

  setProject(project) {
    this.project = typeof project === 'string' && project ? project : 'all';
    this.notify();
  }

  setSearch(search) {
    this.search = typeof search === 'string' ? search.slice(0, MAX_TITLE_LENGTH) : '';
    this.notify();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.notify();
    return this.theme;
  }

  get projects() {
    return [...new Set(this.tasks.map((task) => task.project))].sort((a, b) => a.localeCompare(b));
  }

  reconcileProjectFilter() {
    if (this.project !== 'all' && !this.projects.includes(this.project)) this.project = 'all';
  }

  get visibleTasks() {
    const query = this.search.trim().toLocaleLowerCase();
    return this.tasks.filter((task) => (
      (this.status === 'all' || (this.status === 'completed' ? task.completed : !task.completed))
      && (this.project === 'all' || task.project === this.project)
      && (!query || `${task.title} ${task.project}`.toLocaleLowerCase().includes(query))
    ));
  }

  get summary() {
    const completed = this.tasks.filter((task) => task.completed).length;
    return { total: this.tasks.length, completed, active: this.tasks.length - completed };
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
    return { tasks: this.tasks.map((task) => ({ ...task })), theme: this.theme, status: this.status, project: this.project, search: this.search, nextId: this.nextId };
  }

  saveToStorage(storage, key = STORAGE_KEY) {
    try {
      const target = storage === undefined ? globalThis.localStorage : storage;
      if (typeof target?.setItem !== 'function') return false;
      target.setItem(key, JSON.stringify(this.toJSON()));
      return true;
    } catch {
      return false;
    }
  }

  static loadFromStorage(storage, key = STORAGE_KEY) {
    try {
      const target = storage === undefined ? globalThis.localStorage : storage;
      const raw = target?.getItem?.(key);
      return new TodoState(raw ? JSON.parse(raw) : undefined);
    } catch {
      return new TodoState();
    }
  }
}
