import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createRuntimeServer } from './server.mjs';
import { runtimePolicy, RUNTIME_PATH } from './policy.mjs';

const env = { NODE_ENV: 'production', MARENETTO_ANALYTICS_ORIGIN: 'https://www.example.com',
  MARENETTO_ANALYTICS_RUNTIME_ORIGIN: 'https://metrics.example.net', MARENETTO_ANALYTICS_RUNTIME_APPROVED: 'true',
  MARENETTO_ANALYTICS_RELEASE_APPROVED: 'true', MARENETTO_ANALYTICS_PRIVACY_APPROVED: 'true' };
test('runtime rejects preview, shared cookie domains, malformed origins and missing approvals', () => {
  assert.ok(runtimePolicy(env));
  for (const origin of ['https://www.example.com', 'https://tracking.example.com', 'https://any.replit.dev', 'http://metrics.example.net', 'https://metrics.example.net/path', 'https://127.0.0.1', 'https://metrics.example.net:444']) {
    assert.equal(runtimePolicy({ ...env, MARENETTO_ANALYTICS_RUNTIME_ORIGIN: origin }), null, origin);
  }
  for (const key of ['MARENETTO_ANALYTICS_RUNTIME_APPROVED', 'MARENETTO_ANALYTICS_RELEASE_APPROVED', 'MARENETTO_ANALYTICS_PRIVACY_APPROVED']) assert.equal(runtimePolicy({ ...env, [key]: '' }), null);
  assert.equal(runtimePolicy({ ...env, NODE_ENV: 'development' }), null);
  assert.equal(runtimePolicy({ ...env, MARENETTO_ANALYTICS_ORIGIN: 'https://www.example.co.uk', MARENETTO_ANALYTICS_RUNTIME_ORIGIN: 'https://metrics.example.co.uk' }), null);
});
test('dedicated server exposes only host-bound static resources, no auth or app API', async () => {
  const server = createRuntimeServer(env);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const request = (path, init = {}) => new Promise((resolve, reject) => {
    const req = httpRequest(url + path, { ...init, headers: { host: 'metrics.example.net', ...init.headers } }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })));
    });
    req.on('error', reject); req.end();
  });
  try {
    let response = await request(RUNTIME_PATH);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors https:\/\/www.example.com/);
    assert.match(response.headers.get('content-security-policy'), /frame-src 'none'/);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.match(await response.text(), /data-site-origin="https:\/\/www.example.com"/);
    response = await request(RUNTIME_PATH + 'runtime.js');
    assert.match(await response.text(), /event.source !== parent/);
    response = await request(RUNTIME_PATH + 'health');
    assert.deepEqual(await response.json(), { runtime: 'marenetto-ga4-v1', siteOrigin: env.MARENETTO_ANALYTICS_ORIGIN, runtimeOrigin: env.MARENETTO_ANALYTICS_RUNTIME_ORIGIN });
    for (const path of ['/api/internal/monitoring', '/sign-in', '/api/project-requests', '/', RUNTIME_PATH + '?token=secret']) assert.equal((await request(path)).status, 404);
    assert.equal((await request(RUNTIME_PATH, { method: 'POST' })).status, 404);
    assert.equal((await request(RUNTIME_PATH, { headers: { host: 'www.example.com' } })).status, 404);
    env.MARENETTO_ANALYTICS_RUNTIME_APPROVED = '';
    assert.equal((await request(RUNTIME_PATH)).status, 404);
  } finally {
    env.MARENETTO_ANALYTICS_RUNTIME_APPROVED = 'true';
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
});
