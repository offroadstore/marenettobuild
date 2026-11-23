import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { checkProductionAssets } from './production-assets.mjs';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('src/content/legal.ts', root), 'utf8');
const proof = JSON.parse(await readFile(new URL('src/content/legal-source.json', root), 'utf8'));
const compiled = await build({ entryPoints: [new URL('src/content/legal.ts', root).pathname], bundle: true, write: false, format: 'esm' });
const { legalPages, LEGAL_VERSION, AI_NOTICE } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const policy = JSON.parse(await readFile(new URL('../../lib/legal-policy/analytics.json', root), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('dist/public/route-manifest.json', root), 'utf8'));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

test('supplied legal file is byte-identical to the recorded revision; analytics version is unchanged', () => {
  assert.equal(createHash('sha256').update(source).digest('hex'), proof.sha256);
  assert.equal(LEGAL_VERSION, '2026-11-23');
  assert.equal(policy.privacyVersion, LEGAL_VERSION);
  assert.equal(policy.privacyUrl, 'https://www.marenettobuild.com/cookie');
  assert.equal(AI_NOTICE, 'Il sito utilizza contenuti generati tramite intelligenza artificiale.');
  for (const legal of legalPages) {
    const editions = Object.values(manifest.editions).filter(e => e.id === legal.path.slice(1));
    assert.equal(editions.length, 1);
    assert.equal(editions[0].locale, 'it');
    assert.equal(editions[0].sitemap, true);
  }
});

test('production and preview deliver every original block, correct metadata and Italian-only routes', async () => {
  const topology = await editorialTopology({ publicIndexing: true, viaProxy: true });
  const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https', 'accept-language': 'en-US' };
  try {
    const sitemap = await (await fetch(topology.origin + '/sitemap.xml', { headers })).text();
    for (const legal of legalPages) {
      const response = await fetch(topology.origin + legal.path, { headers, redirect: 'manual' });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('location'), null);
      assert.equal(response.headers.get('x-robots-tag'), null);
      const html = await response.text();
      assert.match(html, /<html[^>]*lang="it-IT"[^>]*dir="ltr"/);
      assert.match(html, /name="robots" content="index, follow"/);
      assert.ok(html.includes(`rel="canonical" href="https://www.marenettobuild.com${legal.path}"`));
      assert.ok(html.includes(`name="description" content="${escape(legal.description)}"`));
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes(`<h1>${escape(legal.title)}</h1>`));
      assert.ok(html.includes(escape(legal.intro)));
      for (const block of legal.blocks) {
        assert.ok(html.includes(`<h2>${escape(block.h)}</h2>`), block.h);
        for (const p of block.p ?? []) assert.ok(html.includes(`<p>${escape(p)}</p>`), p);
        for (const li of block.ul ?? []) assert.ok(html.includes(`<li>${escape(li)}</li>`), li);
      }
      assert.ok(html.includes(AI_NOTICE));
      assert.ok(sitemap.includes(`<loc>https://www.marenettobuild.com${legal.path}</loc>`));
      for (const link of html.matchAll(/hreflang="([^"]+)"/g)) assert.ok(['it-IT', 'x-default'].includes(link[1]));
      const preview = await fetch(topology.origin + legal.path, { headers: { ...headers, 'x-forwarded-host': 'preview.replit.dev' } });
      assert.equal(preview.status, 200);
      assert.equal(preview.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.match(await preview.text(), /name="robots" content="noindex, nofollow"/);
      for (const locale of ['en', 'de', 'ar']) {
        const missing = await fetch(topology.origin + `/${locale}${legal.path}`, { headers, redirect: 'manual' });
        assert.equal(missing.status, 404);
      }
    }
    const request = await (await fetch(topology.origin + '/richiesta', { headers })).text();
    assert.match(request, /href="\/privacy" target="_blank" rel="noopener noreferrer"[^>]*data-testid="request-privacy-link"/);
  } finally { await topology.close(); }
});

test('browser rejects stale notice metadata and never starts disabled analytics', async () => {
  const compiled = await build({
    stdin: {
      contents: `import hosts from './src/config/public-hosts.json';
        hosts.analyticsRuntimeHosts.push('metrics.example.net');
        export * from './src/lib/analytics/runtime.ts';`,
      resolveDir: root.pathname, loader: 'ts',
    }, bundle: true, write: false, platform: 'node', format: 'esm',
  });
  const { validConfig, AnalyticsRuntime, ANALYTICS_LEGAL_POLICY } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
  assert.deepEqual(ANALYTICS_LEGAL_POLICY, policy);
  const config = { enabled: true, origin: 'https://www.marenettobuild.com', runtimeOrigin: 'https://metrics.example.net', measurementId: 'G-TEST1234', ...policy, expiresAt: new Date(Date.now() + 60000).toISOString() };
  assert.equal(validConfig(config, config.origin), true);
  for (const changed of [{ privacyUrl: config.origin + '/privacy' }, { privacyVersion: 'obsolete' }, { enabled: false }]) {
    assert.equal(validConfig({ ...config, ...changed }, config.origin), false);
  }
  const direct = { ...config, mode: 'direct', runtimeOrigin: '', measurementId: 'G-D0QJL17CVC' };
  assert.equal(validConfig(direct, config.origin), true, 'Approved direct mode needs no dedicated runtime');
  for (const changed of [{ measurementId: 'G-OTHER123' }, { runtimeOrigin: 'https://metrics.example.net' }, { origin: 'https://preview.invalid' }, { enabled: false }]) {
    assert.equal(validConfig({ ...direct, ...changed }, config.origin), false);
  }
  const events = [];
  const runtime = new AnalyticsRuntime({ start: () => events.push('start'), send: () => events.push('send'), stop: () => {}, clearCookies: () => {} }, config.origin);
  runtime.configure({ ...config, enabled: false }); runtime.navigate('/cookie'); runtime.consent('accepted');
  assert.deepEqual(events, []);
});

test('production guard rejects the original platform mention without any legal exception', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'legal-guard-'));
  const phrase = 'hosting e infrastruttura cloud del sito e del database;';
  const original = 'hosting e infrastruttura del sito e del database (Replit);';
  try {
    for (const content of [`<li>${phrase}</li>`, JSON.stringify([phrase]), `const suppliers=['${phrase}'];`]) {
      await writeFile(path.join(dir, 'app.js'), content);
      assert.equal(await checkProductionAssets(dir), 1);
      for (const extra of ['Replit', 'https://i.replit.com/script.js', 'cartographer', 'repl.co', 'window.umami.track("x")', '/@vite/client']) {
        await writeFile(path.join(dir, 'app.js'), content + extra);
        await assert.rejects(checkProductionAssets(dir), /Unsafe production assets/);
      }
    }
    for (const content of [`<li>${original}</li>`, JSON.stringify([original]), `const suppliers=['${original}'];`, original, `"${original.toUpperCase()}"`]) {
      await writeFile(path.join(dir, 'app.js'), content);
      await assert.rejects(checkProductionAssets(dir), /Unsafe production assets/);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
