import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { siteIconResources } from './site-icons.mjs';

// Explicit development URL only; never discover or contact the published site.
const origin = new URL(process.argv[2]);
if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('Supply a plain development origin');
const rows = [];
for (const [pathname, policy] of siteIconResources) for (const method of ['GET', 'HEAD']) {
  const response = await fetch(new URL(pathname, origin), { method, redirect: 'manual' });
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200, pathname);
  assert.equal(response.headers.get('content-type'), policy.type);
  assert.equal(response.headers.get('cache-control'), policy.cache);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
  if (method === 'GET') assert.deepEqual(bytes, await readFile(new URL(`../public${pathname}`, import.meta.url)));
  else assert.equal(bytes.length, 0);
  rows.push({ pathname, method, status: response.status, type: response.headers.get('content-type'), cache: response.headers.get('cache-control'), robots: response.headers.get('x-robots-tag'), correctBytes: true });
}
const reports = new URL('../../../generated-artifacts/marenetto-icons/', import.meta.url);
await mkdir(reports, { recursive: true });
await writeFile(new URL('shared-proxy-results.json', reports), JSON.stringify(rows, null, 2));
console.log(`Shared development proxy: ${rows.length} GET/HEAD checks passed; original bytes and noindex retained.`);
