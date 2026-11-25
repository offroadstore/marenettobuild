import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadPhase5 } from '../../../docs/editorial/phase5/package.mjs';
import { PHASE5_LOCALES } from '../../../docs/editorial/phase5/locales.mjs';
import { normalizeDevelopmentSSR } from './test-support/ssr-fingerprint.mjs';

// Read-only check through the same artifact gateway as the preview. It never
// activates a fixture or serves manuscripts through a temporary public route.
const origin = 'http://localhost:80';
const directory = new URL('../../../generated-artifacts/editorial/phase5/', import.meta.url);
const pack = await loadPhase5({ locales: PHASE5_LOCALES });
const capture = process.argv.includes('--capture');
const baselineName = process.argv.find(arg => arg.startsWith('--baseline='))?.slice('--baseline='.length) ?? 'multilingual-before';
assert.match(baselineName, /^[a-z0-9-]+$/, 'Invalid private baseline name');
const rows = [];
for (const record of pack.records.filter(r => r.mode === 'revise-existing')) {
  const response = await fetch(origin + record.path);
  const html = await response.text();
  assert.equal(response.status, 200, record.path);
  for (const draft of pack.records.filter(r => r.mode === 'create')) {
    assert.ok(!html.includes(`href="${draft.path}"`), `Draft link/hreflang in historical SSR: ${draft.path}`);
  }
  rows.push({ path: record.path, status: response.status, sha256: createHash('sha256').update(html).digest('hex'), contentSHA256: createHash('sha256').update(normalizeDevelopmentSSR(html)).digest('hex') });
}
const active = await fetch(origin + '/api/editorial/active');
assert.equal(active.status, 200);
const snapshot = await active.json();
await mkdir(directory, { recursive: true });
if (capture) {
  await writeFile(new URL(`${baselineName}.json`, directory), JSON.stringify({ capturedAt: new Date().toISOString(), rows, snapshot }, null, 2));
  process.stdout.write('Baseline: twelve historical SSR documents and active editorial snapshot.\n');
} else {
  const before = JSON.parse(await readFile(new URL(`${baselineName}.json`, directory), 'utf8'));
  assert.deepEqual(rows.map(({ sha256, ...row }) => row), before.rows.map(({ sha256, ...row }) => row), 'Historical SSR changed (excluding only Vite module timestamp tokens)');
  assert.deepEqual(snapshot, before.snapshot, 'Public active snapshot changed');
  const results = [];
  for (const record of pack.records.filter(r => r.mode === 'create')) {
    const response = await fetch(origin + record.path);
    const html = await response.text();
    assert.equal(response.status, 404, record.path);
    assert.ok(!html.includes(record.content.title), `Draft title exposed at ${record.path}`);
    assert.ok(!html.includes('[DA CONFERMARE'), `Private placeholder exposed at ${record.path}`);
    results.push({ path: record.path, status: response.status });
  }
  const servicePaths = new Set(pack.records.flatMap(r => [...r.content.body.matchAll(/href="(\/[^"]+)"/g)].map(m => m[1])));
  for (const path of servicePaths) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, `Internal service link: ${path}`);
    await response.arrayBuffer();
  }
  const sitemap = await fetch(origin + '/sitemap.xml');
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  for (const record of pack.records.filter(r => r.mode === 'create')) assert.ok(!xml.includes(record.path), `Draft in sitemap: ${record.path}`);
  const privatePaths = [
    '/docs/editorial/phase5/it/04-distanza.md',
    '/docs/editorial/phase5/adaptations/en/04-distanza.json',
    '/generated-artifacts/editorial/phase5/sei-guide-primary-revisione.html',
    '/generated-artifacts/editorial/phase5/sei-guide-remaining-revisione.html',
  ];
  const privateFileResults = [];
  for (const path of privatePaths) {
    const response = await fetch(origin + path);
    const text = await response.text();
    // Vite's fallback can answer an unknown .json URL with the ordinary home
    // document. That is not serving the manuscript; report it accurately.
    assert.ok([200, 404].includes(response.status), path);
    assert.ok(!text.includes('[DA CONFERMARE'));
    assert.ok(!text.includes('sourceManuscriptSHA256'));
    assert.ok(!text.includes('Sei guide — dossier'));
    if (response.status === 200) {
      assert.match(response.headers.get('content-type') ?? '', /text\/html/);
      assert.match(text, /<html lang=/);
    }
    privateFileResults.push({ path, status: response.status, manuscriptExposed: false });
  }
  const report = {
    checkedAt: new Date().toISOString(), scope: 'Development gateway, not a production release',
    baselineName,
    comparison: 'Full SSR excluding only numeric Vite development-module timestamp tokens; raw fingerprints retained in the baseline.',
    historicalSSREditionsUnchanged: rows.length, activeSnapshotUnchanged: true,
    newDraftPaths: results, publicServiceLinksWorking: [...servicePaths],
    sitemapExcludesDrafts: true, privateFilesExcluded: privateFileResults,
    note: 'No approval, publication, email or IndexNow operation was invoked.',
  };
  await writeFile(new URL('multilingual-http-checks.json', directory), JSON.stringify(report, null, 2));
  process.stdout.write(`Isolation passed: ${rows.length} historical SSR documents unchanged; ${results.length} private new paths return 404; ${servicePaths.size} existing service links return 200.\n`);
}
