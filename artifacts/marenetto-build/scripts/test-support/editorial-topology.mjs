import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}
async function close(server) {
  const ended = new Promise(resolve => server.close(resolve));
  server.closeAllConnections();
  await ended;
}

// Real TCP transport: a synthetic API, a path-routing gateway and the actual
// production HTML process. No fetch monkeypatches or database changes.
export async function editorialTopology({ snapshot = [], viaProxy = false, publicIndexing = false } = {}) {
  let mode = 'available';
  let webOrigin;
  let requests = 0;
  const api = createServer((req, res) => {
    if (req.url === '/api/healthz') { res.writeHead(200); res.end('{"status":"ok"}'); return; }
    if (req.url !== '/api/editorial/active') { res.writeHead(404); res.end(); return; }
    requests++;
    if (mode === 'connection') { req.socket.destroy(); return; }
    if (mode === 'timeout') return;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (mode === 'http_status') { res.writeHead(503); res.end('{"error":"synthetic database unavailable"}'); return; }
    if (mode === 'invalid_json') { res.end('not-json synthetic private detail'); return; }
    res.end(JSON.stringify(mode === 'invalid_snapshot' ? {} : snapshot));
  });
  const apiOrigin = await listen(api);
  const gateway = createServer((req, res) => {
    const target = req.url.startsWith('/api/') ? apiOrigin : webOrigin;
    if (!target) { res.writeHead(503); res.end(); return; }
    const upstream = request(new URL(req.url, target), { method: req.method, headers: req.headers }, response => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });
    upstream.on('error', () => { res.writeHead(502); res.end(); });
    req.pipe(upstream);
  });
  const origin = await listen(gateway);
  const logs = [];
  let child;
  async function stopWeb() {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const ended = once(child, 'exit');
    child.kill();
    await ended;
  }
  async function startWeb() {
    // PORT=0 lets the OS allocate a free port; print it only after listening.
    const entry = `import {once} from 'node:events'; const {server}=await import('./scripts/serve-seo.mjs'); if(!server.listening)await once(server,'listening'); console.log('TEST_PORT='+server.address().port);`;
    child = spawn(process.execPath, ['--input-type=module', '-e', entry], {
      cwd: root,
      env: { ...process.env, NODE_ENV: 'production', MARENETTO_PUBLIC_INDEXING: String(publicIndexing), PORT: '0', EDITORIAL_API_ORIGIN: viaProxy ? origin : apiOrigin },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stderr.on('data', chunk => { if (logs.length < 30) logs.push(chunk.toString()); });
    webOrigin = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Production test process did not listen')), 15_000);
      let stdout = '';
      child.stdout.on('data', chunk => {
        stdout += chunk;
        const match = stdout.match(/TEST_PORT=(\d+)/);
        if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
      });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', () => { clearTimeout(timer); reject(new Error('Production test process exited')); });
    });
  }
  try { await startWeb(); }
  catch (error) { await stopWeb(); await close(gateway); await close(api); throw error; }
  return {
    origin, apiOrigin, logs,
    get requests() { return requests; },
    setMode(value) { mode = value; },
    async restart() { await stopWeb(); await startWeb(); },
    async close() { await stopWeb(); await close(gateway); await close(api); },
  };
}
