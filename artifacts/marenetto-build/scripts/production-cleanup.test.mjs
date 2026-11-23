import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { checkProductionAssets } from './production-assets.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { validatePublicHosts } from './public-host-policy.mjs';

test('deployable HTML and bundles contain no tracker, dev tooling or maps', async () => {
  assert.ok(await checkProductionAssets(new URL('../dist/public/', import.meta.url)) > 300);
});

test('the production guard rejects trackers, development code and both map formats', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mb-production-'));
  try {
    for (const content of [
      '@import url("https://fonts.googleapis.com/css2?family=Barlow");',
      '<link rel="preconnect" href="https://fonts.gstatic.com">',
      '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
      '<script src="https://i.replit.com/script.js"></script>',
      'window.umami.track("example")',
      'window.umami?.track("example")',
      'window?.umami?.track("example")',
      'globalThis["umami"].track("example")',
      'globalThis?.["umami"]?.track("example")',
      'const provider = "repl.co"',
      'const provider = "REPLIT.APP"',
      '<meta name="generator" content="internal build tool">',
      'const path = "/home/runner/workspace/src/main.tsx"',
      'const missing = "MARENETTO_INTERNAL_SETTING"',
      'import "/@vite/client"',
      'import "@replit/vite-plugin-runtime-error-modal"',
      '//# sourceMappingURL=app.js.map',
      '/*# sourceMappingURL=data:application/json;base64,example */',
    ]) {
      await writeFile(path.join(directory, 'app.js'), content);
      await assert.rejects(checkProductionAssets(directory), /Unsafe production assets/);
    }
    await writeFile(path.join(directory, 'app.js'), 'console.log("Marenetto Build")');
    await writeFile(path.join(directory, 'app.js.map'), '{"sourcesContent":["private source"]}');
    await assert.rejects(checkProductionAssets(directory), /source map file/);
    await rm(path.join(directory, 'app.js.map'));
    assert.equal(await checkProductionAssets(directory), 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('host allowlists reject ambiguous names and same registrable-domain runtimes', () => {
  const siteHosts = ['www.example.com', 'example.com'];
  assert.doesNotThrow(() => validatePublicHosts({ siteHosts, analyticsRuntimeHosts: [] }));
  assert.doesNotThrow(() => validatePublicHosts({ siteHosts, analyticsRuntimeHosts: ['metrics.example.net'] }));
  for (const host of ['metrics.example.com', 'example.com', '*.example.net', 'https://example.net', 'example.net/path', 'example.net:443', 'localhost', '127.0.0.1']) {
    assert.throws(() => validatePublicHosts({ siteHosts, analyticsRuntimeHosts: [host] }), undefined, host);
  }
  assert.throws(() => validatePublicHosts({ siteHosts: [], analyticsRuntimeHosts: [] }));
});

test('the shipped browser policy rejects every unlisted host and unconfigured runtime', async () => {
  const bundled = await build({
    entryPoints: [new URL('../src/lib/analytics/runtime.ts', import.meta.url).pathname],
    bundle: true, write: false, platform: 'node', format: 'esm',
  });
  const module = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
  for (const origin of ['https://www.marenettobuild.com', 'https://marenettobuild.com']) assert.equal(module.isPreviewOrigin(origin), false);
  for (const origin of ['http://www.marenettobuild.com', 'https://www.marenettobuild.com.evil.example', 'https://www.marenettobuild.com:8443', 'https://www.marenettobuild.com/path', 'https://random.example', 'https://preview.replit.app', 'https://preview.replit.dev', 'http://localhost:3000']) {
    assert.equal(module.isPreviewOrigin(origin), true, origin);
  }
  const origin = 'https://www.marenettobuild.com';
  const now = Date.now();
  assert.equal(module.validConfig({ enabled: true, origin, runtimeOrigin: 'https://unconfigured.example.net', measurementId: 'G-TEST1234', privacyUrl: origin + '/privacy', privacyVersion: 'test', expiresAt: new Date(now + 60000).toISOString() }, origin, now), false);
});

test('analytics consent, revocation and event minimization still pass with an isolated host policy', async () => {
  const bundled = await build({
    entryPoints: [new URL('../tests/analytics.fixture.tsx', import.meta.url).pathname],
    bundle: true, write: false, platform: 'node', format: 'esm',
  });
  // This nested test process reports ordinary TAP, not the parent's private
  // node:test child-process serialization protocol.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['--input-type=module', '--test-reporter=tap'], { input: bundled.outputFiles[0].text, encoding: 'utf8', timeout: 15000, env });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /# pass 2\b/);
});

test('llms.txt is a real static public response, not an HTML or locale fallback', async () => {
  const topology = await editorialTopology({ publicIndexing: true });
  const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https', 'accept-language': 'de-DE' };
  try {
    topology.setMode('http_status');
    const response = await fetch(topology.origin + '/llms.txt', { headers, redirect: 'manual' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('location'), null);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.equal(response.headers.get('x-robots-tag'), null);
    assert.equal(response.headers.get('server'), null);
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(await response.text(), await readFile(new URL('../public/llms.txt', import.meta.url), 'utf8'));
    const head = await fetch(topology.origin + '/llms.txt', { headers, method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal(topology.requests, 0, 'static resource does not require editorial availability');
    const preview = await fetch(topology.origin + '/llms.txt', { headers: { ...headers, 'x-forwarded-host': 'preview.replit.dev' } });
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.get('x-robots-tag'), 'noindex, nofollow');
    topology.setMode('available');
    const sitemap = await (await fetch(topology.origin + '/sitemap.xml', { headers })).text();
    assert.ok(!sitemap.includes('/llms.txt'));
  } finally {
    await topology.close();
  }
});

test('the server refuses source maps even if one is accidentally deployed', async () => {
  const file = new URL('../dist/public/assets/cleanup-probe.js.map', import.meta.url);
  const topology = await editorialTopology({ publicIndexing: true });
  try {
    await writeFile(file, '{"sourcesContent":["private probe"]}');
    topology.setMode('http_status');
    for (const url of ['/assets/cleanup-probe.js.map', '/assets/cleanup-probe.js%2Emap?v=1', '/assets/missing.css.map', '/brand/README.md', '/media/home/README.md']) {
      const response = await fetch(topology.origin + url, { headers: { 'x-forwarded-host': 'www.marenettobuild.com' }, redirect: 'manual' });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.doesNotMatch(await response.text(), /private probe/);
    }
    const head = await fetch(topology.origin + '/assets/cleanup-probe.js.map', { method: 'HEAD' });
    assert.equal(head.status, 404);
    assert.equal(await head.text(), '');
    assert.equal(topology.requests, 0);
  } finally {
    await rm(file, { force: true });
    await topology.close();
  }
});
