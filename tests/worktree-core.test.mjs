import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createWorktree, listWorktrees, removeWorktree } from '../packages/agent-workflow-scrum/engine/worktree-core.mjs';

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, String(result.stderr || result.stdout));
  return String(result.stdout || '').trim();
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'worktree-core-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'README.md'), '# worktree fixture\n');
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'user.email', 'fixture@example.test');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

test('managed worktrees reject traversal and contain valid nested branch names', async (t) => {
  const root = await fixture(t);

  assert.throws(
    () => createWorktree({ repoRoot: root, branch: '../../outside' }),
    /invalid branch name|inside/,
  );

  const created = createWorktree({ repoRoot: root, branch: 'codex/feature' });
  assert.equal(created.relativePath, '.worktrees/codex/feature');
  assert.equal(listWorktrees(root).some((item) => item.branch === 'codex/feature' && item.relativePath === created.relativePath), true);

  const removed = removeWorktree({ repoRoot: root, branch: 'codex/feature', deleteBranch: true });
  assert.equal(removed.ok, true);
  assert.equal(listWorktrees(root).some((item) => item.branch === 'codex/feature'), false);
});

test('cleanup refuses unregistered paths and leaves them untouched', async (t) => {
  const root = await fixture(t);
  const unregistered = path.join(root, '.worktrees', 'unregistered');
  await mkdir(unregistered, { recursive: true });
  await writeFile(path.join(unregistered, 'marker.txt'), 'keep me\n');

  assert.throws(
    () => removeWorktree({ repoRoot: root, branch: 'unregistered', force: true }),
    /unregistered or mismatched managed worktree/,
  );
  assert.equal(existsSync(path.join(unregistered, 'marker.txt')), true);
});
