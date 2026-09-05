import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'packages/agent-workflow-scrum/bin/agent-workflow.mjs');
const relevantFiles = [
  '.agents/docs/tasks/wip-0031-0005-full-stack-developer-trial.md',
  '.agents/docs/prd/0005-todo-workspace.md',
  '.agents/skills/agent-workflow-scrum/SKILL.md',
  '.agents/skills/agent-workflow-scrum/references/verification.md',
  'src/todo-state.js', 'src/main.js', 'src/server-workspace.js',
  'src/server/task-store.js', 'src/server/task-api.js', 'tests/full-stack-todo.test.mjs',
];
const relevantTokens = Math.ceil(relevantFiles.reduce((n, file) => n + readFileSync(path.join(root, file), 'utf8').length, 0) / 4);
function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'Measurement failed');
  return JSON.parse(result.stdout);
}
const scopes = ['full-stack Todo API persistence editing', 'task 0031 Todo API revision conflict editing', 'task 0031 browser fetch receiver bug verification'];
const measurements = scopes.map((scope) => {
  const pack = run(cli, ['context', scope, '--provider', 'local', '--json']);
  return {
    scope, budget: pack.budgetTokens, packEstimatedTokens: pack.estimatedTokens,
    selectedPaths: pack.selected.map((item) => item.path),
    activeTaskIncluded: pack.activeTasks.some((task) => task.path.includes('0031')),
    todoPrdIncluded: pack.selected.some((item) => item.path.endsWith('0005-todo-workspace.md')),
    reductionVersusRelevantFilesPercent: Number((100 * (1 - pack.estimatedTokens / relevantTokens)).toFixed(2)),
  };
});
const corpusBenchmark = run(path.join(root, 'scripts/context-benchmark.mjs'), [scopes[0], '--provider', 'local', '--json']);
const result = {
  measuredAt: new Date().toISOString(), kind: 'context-size observation',
  limitations: 'Characters/4 estimates; routing packs omit implementation detail. Relevant-file selection is subjective. Raw corpus includes irrelevant files and excludes untracked files. No controlled A/B run, billing usage, cache accounting, or actual task-token savings measured.',
  relevantFiles, relevantTokens, measurements, corpusBenchmark,
};
const directory = path.join(root, '.agents/docs/evidence');
mkdirSync(directory, { recursive: true });
writeFileSync(path.join(directory, '0031-context-measurement.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ relevantTokens, measurements, corpusBenchmark }, null, 2));
