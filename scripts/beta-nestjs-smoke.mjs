import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { appendFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const git = process.platform === "win32" ? "git.exe" : "git";
const pnpmVersion = "11.25.0";

function run(command, args, options = {}) {
  const cwd = options.cwd || repositoryRoot;
  process.stdout.write(`beta:nestjs $ ${command} ${args.join(" ")}\n`);
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: { ...process.env, CI: "1", ...options.env },
  });
}

function runPnpm(args, options = {}) {
  return run(npx, ["--yes", `pnpm@${pnpmVersion}`, ...args], options);
}

function runPnpmJson(args, cwd) {
  return JSON.parse(runPnpm(args, { cwd, capture: true }));
}

async function writeTodoApi(root) {
  const todos = path.join(root, "src/todos");
  await mkdir(todos, { recursive: true });
  await writeFile(path.join(todos, "todos.service.ts"), `import { Injectable, NotFoundException } from '@nestjs/common';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Injectable()
export class TodosService {
  private nextId = 1;
  private readonly todos: Todo[] = [];

  list(): Todo[] {
    return this.todos.map((todo) => ({ ...todo }));
  }

  create(title: string): Todo {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) throw new Error('title is required');
    const todo = { id: this.nextId++, title: cleanTitle, completed: false };
    this.todos.push(todo);
    return { ...todo };
  }

  toggle(id: number): Todo {
    const todo = this.todos.find((candidate) => candidate.id === id);
    if (!todo) throw new NotFoundException('todo not found');
    todo.completed = !todo.completed;
    return { ...todo };
  }
}
`, "utf8");

  await writeFile(path.join(todos, "todos.controller.ts"), `import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TodosService } from './todos.service.js';

@Controller('todos')
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  @Get()
  list() {
    return this.todos.list();
  }

  @Post()
  create(@Body() body: { title?: string }) {
    return this.todos.create(body?.title || '');
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.todos.toggle(id);
  }
}
`, "utf8");

  await writeFile(path.join(todos, "todos.module.ts"), `import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller.js';
import { TodosService } from './todos.service.js';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
`, "utf8");

  await writeFile(path.join(todos, "todos.service.spec.ts"), `import { TodosService } from './todos.service.js';

describe('TodosService', () => {
  it('creates, lists, and toggles a todo', () => {
    const service = new TodosService();
    const created = service.create('ship beta');
    expect(created).toEqual({ id: 1, title: 'ship beta', completed: false });
    expect(service.list()).toEqual([created]);
    expect(service.toggle(created.id).completed).toBe(true);
  });
});
`, "utf8");

  await writeFile(path.join(root, "src/app.module.ts"), `import { Module } from '@nestjs/common';
import { TodosModule } from './todos/todos.module.js';

@Module({
  imports: [TodosModule],
})
export class AppModule {}
`, "utf8");

  await writeFile(path.join(root, "src/main.ts"), `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestedPort = Number(process.env.PORT || 0);
  await app.listen(requestedPort, '127.0.0.1');
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') throw new Error('expected TCP server address');
  console.log(\`BETA_PORT=\${address.port}\`);
}
bootstrap();
`, "utf8");
}

async function waitForPort(child) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`NestJS server did not report readiness. Output:\n${output}`));
    }, 15000);

    const onData = (chunk) => {
      output += String(chunk);
      const match = output.match(/BETA_PORT=(\d+)/);
      if (!match) return;
      cleanup();
      resolve(Number(match[1]));
    };
    const onExit = (code) => {
      cleanup();
      reject(new Error(`NestJS server exited before readiness (code ${code}). Output:\n${output}`));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      child.stdout.off("data", onData);
      child.off("exit", onExit);
    };

    child.stdout.on("data", onData);
    child.once("exit", onExit);
  });
}

async function exerciseHttp(root) {
  const child = spawn(process.execPath, [path.join(root, "dist/main.js")], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: "0" },
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  try {
    const port = await waitForPort(child);
    const base = `http://127.0.0.1:${port}/todos`;
    const create = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "beta user todo" }),
    });
    assert.equal(create.status, 201);
    const created = await create.json();
    assert.equal(created.title, "beta user todo");
    assert.equal(created.completed, false);

    const toggle = await fetch(`${base}/${created.id}/toggle`, { method: "PATCH" });
    assert.equal(toggle.status, 200);
    const toggled = await toggle.json();
    assert.equal(toggled.completed, true);

    const list = await fetch(base);
    assert.equal(list.status, 200);
    const todos = await list.json();
    assert.equal(todos.length, 1);
    assert.equal(todos[0].completed, true);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 1500);
      child.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    if (child.exitCode && child.exitCode !== 0 && stderr) process.stderr.write(stderr);
  }
}

async function main() {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), "agent-beta-nestjs-"));
  try {
    run(npm, ["pack", "./packages/agent-workflow-scrum", "--pack-destination", sandbox], { cwd: repositoryRoot });
    const tarballs = (await readdir(sandbox)).filter((name) => name.endsWith(".tgz"));
    assert.equal(tarballs.length, 1, `expected exactly one packed workflow tarball, found: ${tarballs.join(", ") || "none"}`);
    const tarball = path.join(sandbox, tarballs[0]);

    run(npx, ["--yes", "@nestjs/cli@12.0.0", "new", "todo-api", "--package-manager", "pnpm", "--skip-git", "--skip-install", "--strict"], { cwd: sandbox });
    const appRoot = path.join(sandbox, "todo-api");
    runPnpm(["install"], { cwd: appRoot });
    run(git, ["init", "-q"], { cwd: appRoot });
    run(git, ["config", "user.email", "beta@example.invalid"], { cwd: appRoot });
    run(git, ["config", "user.name", "Agent Workflow Beta"], { cwd: appRoot });

    await writeFile(path.join(appRoot, "AGENTS.md"), "# Existing Team Instructions\n\n- Keep this user-owned rule.\n", "utf8");
    runPnpm(["add", "--save-dev", tarball], { cwd: appRoot });

    const initialized = runPnpmJson(["exec", "agent-workflow", "init", "--mode", "vibe", "--json"], appRoot);
    assert.equal(initialized.existingProject, true);
    assert.equal(initialized.mode, "vibe");
    assert.equal(initialized.packageManager, "pnpm");
    assert.ok(initialized.updated.includes("AGENTS.md"));

    const agents = await readFile(path.join(appRoot, "AGENTS.md"), "utf8");
    assert.match(agents, /Keep this user-owned rule/);
    assert.match(agents, /Agent Workflow Scrum/);

    const doctor = runPnpmJson(["exec", "agent-workflow", "doctor", "--json"], appRoot);
    assert.equal(doctor.ok, true, doctor.errors?.join("\n"));

    await writeTodoApi(appRoot);
    runPnpm(["test"], { cwd: appRoot });
    runPnpm(["build"], { cwd: appRoot });
    await exerciseHttp(appRoot);

    run(git, ["add", "-A"], { cwd: appRoot });
    run(git, ["commit", "-qm", "beta todo baseline"], { cwd: appRoot });
    await appendFile(path.join(appRoot, "src/todos/todos.service.ts"), "\n// beta workflow change\n", "utf8");

    const check = runPnpmJson(["exec", "agent-workflow", "check", "--mode", "vibe", "--json"], appRoot);
    assert.equal(check.ok, true, check.errors?.join("\n"));
    assert.ok(check.info.some((line) => line.includes("vibe mode active")), "vibe mode should relax task/PRD sync for a product edit");

    const context = runPnpm(["exec", "agent-workflow", "context", "todo service change", "--level", "0", "--budget", "1200", "--provider", "local"], {
      cwd: appRoot,
      capture: true,
    });
    assert.ok(context.trim().length > 0, "context command should return a compact context pack");

    process.stdout.write("beta:nestjs PASS real NestJS Todo public-beta smoke completed\n");
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`beta:nestjs FAIL ${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
});
