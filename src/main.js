import { TodoState } from './todo-state.js';

const state = TodoState.loadFromStorage();
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
  taskList.replaceChildren();
  const tasks = state.visibleTasks;
  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = state.tasks.length === 0 ? 'Your list is clear. Add the first task above.' : 'No tasks match these filters.';
    taskList.append(empty);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.completed ? 'is-completed' : ''}`;
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.completed;
    check.setAttribute('aria-label', `${task.completed ? 'Reopen' : 'Complete'} ${task.title}`);
    check.addEventListener('change', () => state.toggleTask(task.id));

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
    remove.type = 'button';
    remove.className = 'remove-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${task.title}`);
    remove.addEventListener('click', () => state.removeTask(task.id));
    item.append(check, content, remove);
    taskList.append(item);
  });
}

function render() {
  document.documentElement.dataset.theme = state.theme;
  themeButton.textContent = state.theme === 'dark' ? '☼' : '◐';
  themeButton.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`);
  const { total, active, completed } = state.summary;
  summary.textContent = total === 0 ? 'No tasks yet' : `${active} active · ${completed} completed`;
  statusButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.status === state.status)));
  if (searchInput.value !== state.search) searchInput.value = state.search;
  clearCompletedButton.disabled = completed === 0;
  renderProjects();
  renderTasks();
  const saved = state.saveToStorage();
  storageMessage.hidden = saved;
  storageMessage.textContent = saved ? '' : 'Changes are kept only in this tab. Browser storage is unavailable.';
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = state.createTask({
    title: titleInput.value,
    project: projectInput.value,
    priority: priorityInput.value,
    dueDate: dueDateInput.value,
  });
  formMessage.textContent = result.ok ? 'Task added.' : result.error;
  if (!result.ok) {
    titleInput.setAttribute('aria-invalid', 'true');
    titleInput.focus();
    return;
  }
  taskForm.reset();
  titleInput.removeAttribute('aria-invalid');
  titleInput.focus();
});

searchInput.addEventListener('input', () => state.setSearch(searchInput.value));
projectFilter.addEventListener('change', () => state.setProject(projectFilter.value));
statusButtons.forEach((button) => button.addEventListener('click', () => state.setStatus(button.dataset.status)));
clearCompletedButton.addEventListener('click', () => {
  const removed = state.clearCompleted();
  formMessage.textContent = removed ? `${removed} completed task${removed === 1 ? '' : 's'} cleared.` : '';
});
themeButton.addEventListener('click', () => state.toggleTheme());
state.subscribe(render);
render();
