import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTaskStore } from './task-store.js';
import { taskApi } from './task-api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const store = await createTaskStore(path.resolve(process.env.TODO_DATA_FILE || path.join(root, '.todo-data/tasks.json')));
const dev = process.argv.includes('--dev');
const vite = dev ? await (await import('vite')).createServer({ root, server: { middlewareMode: true }, appType: 'spa' }) : null;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const api = taskApi(store);
const server = http.createServer((request, response) => api(request, response, async () => {
  if (vite) return vite.middlewares(request, response);
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); return response.end(); }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, 'dist', `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) { response.writeHead(403); return response.end(); }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404); response.end('Not found. Run npm run build before npm start.'); }
}));
const port = Number(process.env.PORT || 5173);
server.listen(port, '127.0.0.1', () => console.log(`Focus Todo: http://127.0.0.1:${server.address().port}/?storage=server`));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await vite?.close();
});
