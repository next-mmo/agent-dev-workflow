import { ApiError } from './task-store.js';

function body(request) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > 1024 * 1024) { reject(new ApiError(413, 'Request is too large.')); return; }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new ApiError(400, 'Expected valid JSON.')); }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new ApiError(400, 'Request was interrupted.')));
  });
}

export function taskApi(store) {
  return async (request, response, next = () => { response.writeHead(404); response.end(); }) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/api/')) return next();
    const send = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(JSON.stringify(value));
    };
    try {
      const host = request.headers.host;
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host ?? '')) throw new ApiError(403, 'Local requests only.');
      if (request.headers.origin && request.headers.origin !== `http://${host}`) throw new ApiError(403, 'Origin is not allowed.');
      if (pathname === '/api/health' && request.method === 'GET') return send(200, { ok: true });
      if (pathname !== '/api/tasks') throw new ApiError(404, 'Unknown API route.');
      if (request.method === 'GET') return send(200, store.read());
      if (request.method !== 'PUT') throw new ApiError(405, 'Use GET or PUT.');
      if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, 'Use application/json.');
      const input = await body(request);
      if (!input || typeof input.revision !== 'string') throw new ApiError(400, 'A revision is required.');
      send(200, await store.replace(input.revision, input.tasks));
    } catch (error) { send(error.status ?? 500, { error: error.status ? error.message : 'Tasks could not be saved. Try again.' }); }
  };
}
