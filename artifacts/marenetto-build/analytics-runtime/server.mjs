import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { runtimePolicy, runtimeDocument, RUNTIME_PATH } from './policy.mjs';

// Independently deploy this process, NOT the website/API process. It has only
// three fixed resources, no proxy, auth, storage or credential environment.
export function createRuntimeServer(env = process.env) {
  return createServer(async (req, res) => {
    const policy = runtimePolicy(env);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (!policy || req.headers.host !== policy.host || !['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Security-Policy', policy.csp);
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const routes = [RUNTIME_PATH, RUNTIME_PATH + 'runtime.js', RUNTIME_PATH + 'health'];
    if (!routes.includes(req.url)) { res.writeHead(404); res.end(); return; }
    try {
      let body, type;
      if (req.url.endsWith('/health')) {
        type = 'application/json';
        body = JSON.stringify({ runtime: 'marenetto-ga4-v1', siteOrigin: policy.siteOrigin, runtimeOrigin: policy.runtimeOrigin });
      } else if (req.url.endsWith('/runtime.js')) {
        type = 'application/javascript; charset=utf-8';
        body = await readFile(new URL('./client.js', import.meta.url), 'utf8');
      } else {
        type = 'text/html; charset=utf-8'; body = runtimeDocument(policy);
      }
      res.writeHead(200, { 'Content-Type': type });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(503); res.end(); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT is required for the dedicated analytics runtime.');
  createRuntimeServer().listen(port, '0.0.0.0');
}
