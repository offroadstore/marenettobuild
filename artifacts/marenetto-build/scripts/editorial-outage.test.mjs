import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { editorialOrigin } from './editorial-http.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(root, 'dist/public/route-manifest.json'), 'utf8'));
const existing = Object.values(manifest.editions).find(e => e.kind === 'article' && e.locale === 'it');
assert.ok(existing);
const tombstone = { identity: existing.id, locale: 'it', path: existing.path, kind: 'article', revisionId: 'withdrawn', content: { title: 'Contenuto ritirato', summary: '', body: '', category: '', tags: [], image: '', imageAlt: '', sources: [], seoTitle: '', seoDescription: '', contentLanguage: 'it' } };

async function assertUnavailable(origin, pathname = existing.path, method = 'GET') {
  const response = await fetch(`${origin}${pathname}`, { method });
  const html = await response.text();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('retry-after'), '30');
  if (method !== 'HEAD') assert.match(html, /Non possiamo verificare/);
  assert.ok(!html.includes(existing.title), 'the original article must not be republished');
  assert.ok(!html.includes('data-historical-key'));
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
}

test('server origin is environment-aware and never guesses a deployment proxy port or public domain', async () => {
  assert.equal(editorialOrigin({}), 'http://localhost');
  assert.equal(editorialOrigin({ NODE_ENV: 'development' }), 'http://localhost');
  assert.throws(() => editorialOrigin({ NODE_ENV: 'production', REPLIT_DOMAINS: 'previous.example.test' }));
  for (const value of ['', 'file:///tmp/a', 'http://user:secret@localhost', 'http://localhost/path', 'http://localhost?token=private']) {
    assert.throws(() => editorialOrigin({ EDITORIAL_API_ORIGIN: value }));
  }
  assert.equal(editorialOrigin({ NODE_ENV: 'production', EDITORIAL_API_ORIGIN: 'http://127.0.0.1:9876' }), 'http://127.0.0.1:9876');
  const webConfig = await readFile(path.join(root, '.replit-artifact/artifact.toml'), 'utf8');
  const apiConfig = await readFile(path.join(root, '../api-server/.replit-artifact/artifact.toml'), 'utf8');
  const apiPort = apiConfig.match(/localPort\s*=\s*(\d+)/)[1];
  assert.ok(webConfig.includes(`EDITORIAL_API_ORIGIN = "http://127.0.0.1:${apiPort}"`), 'origin tracks the declared API service listener');
  assert.match(webConfig, /\[services.production.health.startup\]\s+path = "\/__release-readiness"/);
  const handler = await readFile(path.join(root,'scripts/serve-seo.mjs'),'utf8');
  assert.ok(handler.includes("await render('/', 'it', active)"), 'readiness still renders the real homepage using the verified same-deployment snapshot');
});

for (const viaProxy of [false, true]) {
  test(`production cold start serves actual homepage with verified empty snapshot via ${viaProxy ? 'shared proxy' : 'API service'}`, async () => {
    const topology = await editorialTopology({ viaProxy });
    try {
      assert.ok(!manifest.heldPages['/']);
      const response = await fetch(topology.origin);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /<h1[\s>]/);
      assert.match(html, /id="editorial-active">\[\]<\/script>/);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.equal(topology.requests, 1, 'cold startup checks editorial storage, not only API health');
      assert.deepEqual(await (await fetch(`${topology.origin}/api/editorial/active`)).json(), []);
    } finally { await topology.close(); }
  });
}

test('withdrawal stays closed after restart and outage; requests recover when API returns', async () => {
  const topology = await editorialTopology({ snapshot: [tombstone] });
  try {
    assert.equal((await fetch(`${topology.origin}${existing.path}`)).status, 404);
    topology.setMode('connection');
    await assertUnavailable(topology.origin);
    await topology.restart();
    await assertUnavailable(topology.origin);
    await assertUnavailable(topology.origin, '/');
    await assertUnavailable(topology.origin, '/', 'HEAD');
    topology.setMode('available');
    assert.equal((await fetch(`${topology.origin}${existing.path}`)).status, 404);
    assert.equal((await fetch(topology.origin)).status, 200);
  } finally { await topology.close(); }
});

test('real upstream failures are classified and rate-limited without leaking response details', { timeout: 30_000 }, async () => {
  const topology = await editorialTopology();
  try {
    for (const mode of ['http_status', 'invalid_json', 'invalid_snapshot', 'connection', 'timeout']) {
      topology.setMode(mode);
      await topology.restart(); // reset per-process diagnostic limit
      const before = topology.logs.length;
      assert.equal((await fetch(`${topology.origin}/api/healthz`)).status, 200);
      await assertUnavailable(topology.origin, '/');
      // A second failure is not a second log line.
      await assertUnavailable(topology.origin, '/');
      const diagnostic = topology.logs.slice(before).join('');
      assert.match(diagnostic, new RegExp(`reason: '${mode}'`));
      if (mode === 'http_status') assert.match(diagnostic, /status: 503/);
      assert.equal((diagnostic.match(/Editorial upstream unavailable/g) ?? []).length, 1);
      assert.doesNotMatch(diagnostic, /synthetic|private|http:\/\/|headers|secret/);
    }
  } finally { await topology.close(); }
});
