import { TodoWorkspace } from './todo-workspace.js';
import { ServerWorkspace } from './server-workspace.js';

const serverMode = new URLSearchParams(location.search).get('storage') === 'server';
const workspace = serverMode ? new ServerWorkspace() : new TodoWorkspace();
const initialized = serverMode ? workspace.refresh() : Promise.resolve(true);
let editingId = null;
let state = workspace.state;
const taskForm = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const projectInput = document.querySelector('#task-project');
const priorityInput = document.querySelector('#task-priority');
const dueDateInput = document.querySelector('#task-due-date');
const formMessage = document.querySelector('#form-message');
const storageMessage = document.querySelector('#storage-message');
const taskList = document.querySelector('#task-list');
const summary = document.querySelector('#summary');
const searchInput = document.querySelector('#task-search');
const projectFilter = document.querySelector('#project-filter');
const statusButtons = [...document.querySelectorAll('[data-status]')];
const clearCompletedButton = document.querySelector('#clear-completed');
const themeButton = document.querySelector('#theme-toggle');
const saveButton = document.querySelector('#save-task');
const cancelEdit = document.querySelector('#cancel-edit');
const refreshButton = document.querySelector('#refresh-tasks');
document.querySelector('#workspace-mode').textContent = serverMode ? 'Server workspace · saved on this computer' : 'Browser workspace · saved in this browser';
const workspaceSwitch = document.querySelector('#workspace-switch');
workspaceSwitch.href = serverMode ? '?' : '?storage=server';
workspaceSwitch.textContent = serverMode ? 'Use browser workspace' : 'Use server workspace';
refreshButton.hidden = !serverMode;

function finishEdit() {
  editingId = null;
  taskForm.reset();
  saveButton.textContent = 'Add task';
  cancelEdit.hidden = true;
  titleInput.removeAttribute('aria-invalid');
}

cancelEdit.addEventListener('click', () => { finishEdit(); formMessage.textContent = ''; titleInput.focus(); });
refreshButton.addEventListener('click', async () => { await workspace.refresh(); render(); });

function formatDueDate(dueDate) {
  if (!dueDate) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${dueDate}T00:00:00Z`));
}

function renderProjects() {
  const selected = state.project;
  projectFilter.replaceChildren(new Option('All projects', 'all'));
  state.projects.forEach((project) => projectFilter.add(new Option(project, project)));
  projectFilter.value = [...projectFilter.options].some((option) => option.value === selected) ? selected : 'all';
}

function renderTasks() {
  const focused = document.activeElement;
  const focusedRow = focused?.closest('[data-task-id]');
  const previousIndex = focusedRow ? [...taskList.children].indexOf(focusedRow) : -1;
  const restoreFocus = () => {
    if (!focusedRow) return;
    const rows = [...taskList.querySelectorAll('[data-task-id]')];
    const row = rows.find((item) => item.dataset.taskId === focusedRow.dataset.taskId)
      ?? rows[Math.min(previousIndex, rows.length - 1)];
    const target = row?.querySelector(focused.tagName === 'BUTTON' ? `[data-action="${focused.dataset.action}"]` : 'input')
      ?? document.querySelector('#task-list-heading');
    target.focus();
  };
  taskList.replaceChildren();
  const tasks = state.visibleTasks;
  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = state.tasks.length === 0 ? 'Your list is clear. Add the first task above.' : 'No tasks match these filters.';
    taskList.append(empty);
    restoreFocus();
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.completed ? 'is-completed' : ''}`;
    item.dataset.taskId = task.id;
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.completed;
    check.setAttribute('aria-label', `${task.completed ? 'Reopen' : 'Complete'} ${task.title}`);
    check.addEventListener('change', () => update((current) => current.toggleTask(task.id)));

    const content = document.createElement('div');
    content.className = 'task-content';
    const title = document.createElement('p');
    title.className = 'task-title';
    title.textContent = task.title;
    const metadata = document.createElement('div');
    metadata.className = 'task-metadata';
    const project = document.createElement('span');
    project.textContent = task.project;
    const priority = document.createElement('span');
    priority.className = `priority priority-${task.priority}`;
    priority.textContent = task.priority;
    metadata.append(project, priority);
    if (task.dueDate) {
      const due = document.createElement('span');
      due.textContent = `Due ${formatDueDate(task.dueDate)}`;
      metadata.append(due);
    }
    content.append(title, metadata);

    const remove = document.createElement('button');
    remove.dataset.action = 'remove';
    remove.type = 'button';
    remove.className = 'remove-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${task.title}`);
    remove.addEventListener('click', () => update((current) => current.removeTask(task.id)));
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'quiet-button';
    edit.dataset.action = 'edit';
    edit.textContent = 'Edit';
    edit.setAttribute('aria-label', `Edit ${task.title}`);
    edit.addEventListener('click', () => {
      editingId = task.id;
      titleInput.value = task.title;
      projectInput.value = task.project;
      priorityInput.value = task.priority;
      dueDateInput.value = task.dueDate;
      saveButton.textContent = 'Save changes';
      cancelEdit.hidden = false;
      formMessage.textContent = 'Editing task.';
      titleInput.focus();
    });
    item.append(check, content, edit, remove);
    taskList.append(item);
  });
  restoreFocus();
}

function render() {
  state = workspace.state;
  document.documentElement.dataset.theme = state.theme;
  themeButton.textContent = state.theme === 'dark' ? '☼' : '◐';
  themeButton.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`);
  const { total, active, completed } = state.summary;
  summary.textContent = total === 0 ? 'No tasks yet' : `${active} active · ${completed} completed`;
  statusButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.status === state.status)));
  if (document.activeElement !== searchInput && searchInput.value !== state.search) searchInput.value = state.search;
  clearCompletedButton.disabled = completed === 0;
  renderProjects();
  renderTasks();
  storageMessage.hidden = !workspace.message;
  storageMessage.textContent = workspace.message;
}

async function update(action, options) {
  try {
    await initialized;
    const result = await workspace.update(action, options);
    render();
    return result;
  } catch {
    formMessage.textContent = 'This change could not be applied. Please try again.';
    render();
    return { ok: false, error: formMessage.textContent };
  }
}

let submitting = false;
taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitting) return;
  submitting = true;
  saveButton.disabled = true;
  cancelEdit.disabled = true;
  const taskId = editingId;
  const details = {
    title: titleInput.value,
    project: projectInput.value,
    priority: priorityInput.value,
    dueDate: dueDateInput.value,
  };
  const result = await update((current) => taskId ? current.editTask(taskId, details) : current.createTask(details));
  submitting = false;
  saveButton.disabled = false;
  cancelEdit.disabled = false;
  formMessage.textContent = result.ok ? (taskId ? 'Task updated.' : 'Task added.') : result.error;
  if (!result.ok) {
    titleInput.setAttribute('aria-invalid', 'true');
    titleInput.focus();
    return;
  }
  if (titleInput.value === details.title && projectInput.value === details.project
    && priorityInput.value === details.priority && dueDateInput.value === details.dueDate) finishEdit();
  titleInput.removeAttribute('aria-invalid');
  titleInput.focus();
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value;
  update((current) => current.setSearch(query), { persist: false });
});
projectFilter.addEventListener('change', () => {
  const project = projectFilter.value;
  update((current) => current.setProject(project), { persist: false });
});
statusButtons.forEach((button) => button.addEventListener('click', () => update((current) => current.setStatus(button.dataset.status), { persist: false })));
clearCompletedButton.addEventListener('click', async () => {
  const removed = await update((current) => current.clearCompleted());
  if (typeof removed === 'number') formMessage.textContent = removed ? `${removed} completed task${removed === 1 ? '' : 's'} cleared.` : '';
});
themeButton.addEventListener('click', () => update((current) => current.toggleTheme(), { persist: false }));
window.addEventListener('storage', (event) => {
  if (!serverMode && (event.key === 'todo_workspace_state' || event.key === null) && workspace.refresh()) render();
});
render();
initialized.then(render);
