import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runStaticReview, formatReviewReport } from '../packages/agent-workflow-scrum/engine/review-core.mjs';
import { syncLivingPRDs } from '../packages/agent-workflow-scrum/engine/prd-sync-core.mjs';
import { buildCodebaseIndex } from '../packages/agent-workflow-scrum/engine/index-core.mjs';
import { buildNativeCodebaseGraph } from '../packages/agent-workflow-scrum/engine/codebase-graph-core.mjs';

const binary = fileURLToPath(new URL('../packages/agent-workflow-scrum/bin/agent-workflow.mjs', import.meta.url));
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'readiness-tools-'));
  t.after(async () => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('readiness-tools-'));
    await rm(root, { recursive: true, force: true });
  });
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const write = async (file, content) => {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  };
  return { root, git, write };
}

test('review inspects the first unstaged file and untracked JSX using actual scope', async (t) => {
  const { root, git, write } = await fixture(t);
  git('init', '-q');
  await write('app.js', 'export const value = 1;');
  git('add', '.');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'base');
  await write('app.js', 'eval(input);');
  await write('new folder/component.jsx', 'eval(other);');
  const review = await runStaticReview({ root });
  assert.equal(review.filesReviewed, 2);
  assert.deepEqual(review.findings.security.map((item) => item.file).sort(), ['app.js', 'new folder/component.jsx']);
  const based = await runStaticReview({ root, base: 'HEAD' });
  assert.equal(based.filesReviewed, 2, 'explicit base includes untracked files too');
  await assert.rejects(runStaticReview({ root, base: 'nonexistent-base' }), /does not resolve/);
  const invalid = spawnSync(process.execPath, [binary, 'review', '--root', root, '--base', 'nonexistent-base'], { encoding: 'utf8', windowsHide: true });
  assert.notEqual(invalid.status, 0);
  assert.doesNotMatch(invalid.stdout, /NO BLOCKING|PASS/);
  const missing = spawnSync(process.execPath, [binary, 'review', '--root', root, '--base'], { encoding: 'utf8', windowsHide: true });
  assert.notEqual(missing.status, 0);
});

test('review distinguishes deletions, unsupported files, and explicit inspection failures', async (t) => {
  const { root, git, write } = await fixture(t);
  git('init', '-q');
  await write('old.js', 'export const value = 1;');
  git('add', '.');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'base');
  await rm(path.join(root, 'old.js'));
  await write('asset.svg', '<svg/>');
  const review = await runStaticReview({ root });
  assert.equal(review.filesReviewed, 0);
  assert.equal(review.skippedFiles.length, 2);
  assert.match(formatReviewReport(review), /NO SUPPORTED FILES INSPECTED/);
  await assert.rejects(runStaticReview({ root, files: ['missing.js'] }), /cannot inspect/);
  await assert.rejects(runStaticReview({ root, files: ['../outside.js'] }), /outside the repository/);
});

test('PRD sync leaves requirements byte-identical and only points to possible task evidence', async (t) => {
  const { root, write } = await fixture(t);
  const file = '.agents/docs/prd/0001-theme.md';
  const source = '# Theme\r\n- [ ] Theme persists across reloads\r\n- [x] Accepted requirement\r\n';
  await write(file, source);
  await write('src/main.js', 'state.toggleTheme();');
  await write('.agents/docs/tasks/wip-0001-theme.md', `# Task\nPRD: ${file}\nEvidence: pending\n`);
  await write('.agents/docs/tasks/done/done-0002-other.md', '# Unrelated task');
  for (const dryRun of [false, true]) {
    const result = await syncLivingPRDs({ root, dryRun });
    assert.equal(result.schemaVersion, 2);
    assert.equal(result.advisory, true);
    assert.deepEqual(result.changedFiles, []);
    assert.deepEqual(result.reviews[0].criteria, [{ line: 2, criterion: 'Theme persists across reloads', status: 'unverified' }]);
    assert.deepEqual(result.reviews[0].evidenceCandidates, ['.agents/docs/tasks/wip-0001-theme.md']);
    assert.equal(await readFile(path.join(root, file), 'utf8'), source);
  }
});

test('both indexes honor custom product globs and ignore rules outside src', async (t) => {
  const { root, write } = await fixture(t);
  await write('.agents/config.json', JSON.stringify({ paths: { product: ['apps/**', 'packages/**', 'server/*.ts'] }, ignore: ['**/generated/**'] }));
  for (const file of ['apps/web/app.jsx', 'packages/domain/index.mjs', 'server/api.ts', 'src/excluded.js', 'apps/generated/ignored.js', 'packages/deep/node_modules/vendor/index.js']) {
    await write(file, 'export function sample() {}');
  }
  const expected = ['apps/web/app.jsx', 'packages/domain/index.mjs', 'server/api.ts'];
  const first = await buildCodebaseIndex({ root });
  const graph = JSON.parse(await readFile(path.join(root, first.outPath), 'utf8'));
  assert.deepEqual(graph.nodes.map((item) => item.file), expected);
  const native = await buildNativeCodebaseGraph({ root });
  assert.deepEqual(native.graph.files.map((item) => item.path), expected);
});
