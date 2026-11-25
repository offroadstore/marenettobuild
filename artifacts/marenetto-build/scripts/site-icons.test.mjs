import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { generateIcons, ORIGINAL_SVG_SHA256, pngIcons } from './generate-icons.mjs';
import { SITE_ICON_HEAD, siteIconResources } from './site-icons.mjs';
import { editorialUnavailableHTML } from './editorial-http.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { setWebSecurityHeaders } from './security-policy.mjs';

const root = new URL('../', import.meta.url);
const output = new URL('dist/public/', root);
const publicDir = new URL('public/', root);
const reports = new URL('../../../generated-artifacts/marenetto-icons/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('route-manifest.json', output)));
const locales = ['it','en','de','fr','nl','es','pt','ru','pl','sv','no','da','ar'];
export function assertIconHead(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, 'head exists');
  for (const tag of SITE_ICON_HEAD.split('\n')) {
    assert.equal(head.split(tag).length - 1, 1, `exactly one ${tag}`);
  }
  assert.equal((head.match(/<link\b[^>]*rel="icon"/g) ?? []).length, 4);
  assert.equal((head.match(/<link\b[^>]*rel="apple-touch-icon"/g) ?? []).length, 1);
  assert.equal((head.match(/<link\b[^>]*rel="manifest"/g) ?? []).length, 1);
  for (const name of ['theme-color', 'apple-mobile-web-app-title']) {
    assert.equal((head.match(new RegExp(`<meta\\b[^>]*name="${name}"`, 'g')) ?? []).length, 1);
  }
}
await mkdir(reports, { recursive: true });

test('original SVG, reproducible PNGs, opaque Apple and maskable safe circle, true ICO frames', async () => {
  const svg = await readFile(new URL('favicon.svg', publicDir));
  assert.equal(createHash('sha256').update(svg).digest('hex'), ORIGINAL_SVG_SHA256);
  const temp = await mkdtemp(path.join(tmpdir(), 'marenetto-icons-'));
  const generated = pathToFileURL(`${temp}/`);
  const geometry = [];
  try {
    await writeFile(new URL('favicon.svg', generated), svg);
    await generateIcons(generated);
    for (const [file, size, scale] of pngIcons) {
      const bytes = await readFile(new URL(file, publicDir));
      assert.deepEqual(bytes, await readFile(new URL(file, generated)), `${file} reproducible`);
      assert.deepEqual(bytes, await readFile(new URL(file, output)), `${file} built bytes`);
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.format, 'png');
      assert.equal(metadata.width, size);
      assert.equal(metadata.height, size);
      if (scale < 1) {
        const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        let minX = size, minY = size, maxX = 0, maxY = 0, radius = 0;
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const i = (y * size + x) * info.channels;
          assert.equal(data[i + 3], 255, `${file} fully opaque`);
          if (data[i] !== 35 || data[i + 1] !== 33 || data[i + 2] !== 31) {
            minX = Math.min(x, minX); maxX = Math.max(x, maxX);
            minY = Math.min(y, minY); maxY = Math.max(y, maxY);
            radius = Math.max(radius, Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2));
          }
        }
        // Integer centering of 151px in 180px gives 14/15px margins (not 14.4px).
        assert.ok(minX >= Math.floor(size * 0.08) && minY >= Math.floor(size * 0.08));
        assert.ok(maxX < size * 0.92 && maxY < size * 0.92);
        if (file.includes('maskable')) assert.ok(radius < size * 0.4, 'every non-background pixel, orange included, inside safe circle');
        geometry.push({ file, size, containerScale: scale, bounds: [minX,minY,maxX,maxY], maxDistinctiveRadius: radius, safeCircleRadius: size * 0.4, opaque: true });
      }
    }
    const ico = await readFile(new URL('favicon.ico', publicDir));
    assert.deepEqual(ico, await readFile(new URL('favicon.ico', generated)));
    assert.equal(ico.readUInt16LE(0), 0); assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 3);
    const frames = [];
    let end = 54;
    for (const [i, size] of [16,32,48].entries()) {
      const at = 6 + 16 * i;
      assert.equal(ico[at], size); assert.equal(ico[at+1], size);
      const length = ico.readUInt32LE(at+8), offset = ico.readUInt32LE(at+12);
      assert.equal(offset, end);
      const metadata = await sharp(ico.subarray(offset, offset+length)).metadata();
      assert.equal(metadata.format, 'png'); assert.equal(metadata.width, size); assert.equal(metadata.height, size);
      frames.push({ size, length, offset, format: metadata.format }); end = offset + length;
    }
    assert.equal(end, ico.length);
    await writeFile(new URL('geometry.json', reports), JSON.stringify({ svgSHA256: ORIGINAL_SVG_SHA256, geometry, frames }, null, 2));
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('manifest is same-origin, scoped and exact; all built page families retain one common icon head', async () => {
  const webmanifest = JSON.parse(await readFile(new URL('site.webmanifest', publicDir)));
  assert.equal(webmanifest.name, 'Marenetto Build'); assert.equal(webmanifest.short_name, 'Marenetto');
  for (const key of ['theme_color', 'background_color']) assert.equal(webmanifest[key], '#23211f');
  assert.equal(webmanifest.display, 'standalone');
  assert.equal(webmanifest.start_url, '/'); assert.equal(webmanifest.scope, '/');
  assert.deepEqual(webmanifest.icons, [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]);
  assertIconHead(await readFile(new URL('index.html', root), 'utf8'));
  assertIconHead(editorialUnavailableHTML);
  const files = new Set([...Object.values(manifest.pages), ...Object.values(manifest.heldPages), ...Object.values(manifest.errors), '404.html', '410.html', 'private-shell.html']);
  const coverage = Object.fromEntries(locales.map(locale => [locale, { documents: 0, error: false, families: [] }]));
  for (const file of files) {
    const html = await readFile(new URL(file, output), 'utf8');
    assertIconHead(html);
    const locale = html.match(/<html[^>]*lang="([^"]+)"/)?.[1].split('-')[0];
    if (coverage[locale]) { coverage[locale].documents++; if (file === manifest.errors[locale]) coverage[locale].error = true; }
  }
  for (const edition of Object.values(manifest.editions)) {
    if (coverage[edition.locale] && !coverage[edition.locale].families.includes(edition.kind)) coverage[edition.locale].families.push(edition.kind);
  }
  for (const locale of locales) { assert.ok(coverage[locale].documents > 0); assert.equal(coverage[locale].error, true); }
  await writeFile(new URL('head-coverage.json', reports), JSON.stringify({ totalDocuments: files.size, coverage }, null, 2));
});

test('real production GET/HEAD through gateway: bytes, MIME, cache, indexing, errors and runtime head', { timeout: 120000 }, async () => {
  const rows = [];
  for (const publicIndexing of [false, true]) {
    const topology = await editorialTopology({ viaProxy: true, publicIndexing });
    try {
      const headers = publicIndexing ? { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' } : {};
      for (const [url, policy] of siteIconResources) {
        for (const method of ['GET', 'HEAD']) {
          const response = await fetch(topology.origin + url, { method, headers });
          const body = Buffer.from(await response.arrayBuffer());
          assert.equal(response.status, 200, url);
          assert.equal(response.headers.get('content-type'), policy.type);
          assert.equal(response.headers.get('cache-control'), policy.cache);
          assert.equal(response.headers.get('x-robots-tag'), publicIndexing ? null : 'noindex, nofollow');
          assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
          const expected = await readFile(new URL(url.slice(1), output));
          assert.equal(Number(response.headers.get('content-length')), expected.length);
          if (method === 'GET') assert.deepEqual(body, expected); else assert.equal(body.length, 0);
          rows.push({ url, method, releasedHost: publicIndexing, status: response.status, type: policy.type, cache: policy.cache });
        }
      }
      for (const locale of locales) {
        const editions = Object.values(manifest.editions).filter(e => e.locale === locale);
        const paths = new Set(editions.map(e => e.kind).map(kind => editions.find(e => e.kind === kind).path));
        paths.add(locale === 'it' ? '/nonexistent-icons-test' : `/${locale}/nonexistent-icons-test`);
        for (const pathname of paths) {
          const response = await fetch(topology.origin + pathname, { headers });
          assertIconHead(await response.text());
          assert.doesNotMatch(response.headers.get('cache-control') ?? '', /31536000|immutable/);
        }
      }
      for (const pathname of ['/internal', '/sign-in', '/sign-up', '/owner-demo', '/translation-ok', '/favicon-missing.ico', '/missing.webmanifest', '/%ZZ']) {
        const response = await fetch(topology.origin + pathname, { headers });
        const html = await response.text();
        assert.doesNotMatch(response.headers.get('cache-control') ?? '', /31536000|immutable/);
        if (pathname !== '/%ZZ') assertIconHead(html);
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      }
      topology.setMode('http_status');
      const outage = await fetch(topology.origin + '/');
      assert.equal(outage.status, 503);
      assertIconHead(await outage.text());
      assert.equal(outage.headers.get('cache-control'), 'no-store');
    } finally { await topology.close(); }
  }
  const live = {
    identity: 'icons-synthetic', locale: 'it', path: '/icons-synthetic', kind: 'article', revisionId: 'icons-active',
    content: { title: 'Titolo sintetico', summary: 'Sommario sintetico', body: '<p>Corpo sintetico di collaudo.</p>', category: 'Test', tags: [], image: '', imageAlt: '', sources: [], seoTitle: 'Titolo sintetico', seoDescription: 'Descrizione sintetica', contentLanguage: 'it' },
  };
  const dynamic = await editorialTopology({ snapshot: [live], viaProxy: true });
  try {
    const response = await fetch(dynamic.origin + live.path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /data-active-revision="icons-active"/);
    assertIconHead(html);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { await dynamic.close(); }
  const security = {};
  setWebSecurityHeaders({ setHeader: (key, value) => security[key] = value });
  const csp = security['Content-Security-Policy'] ?? security['Content-Security-Policy-Report-Only'];
  assert.ok(csp.startsWith("default-src 'self';"));
  await writeFile(new URL('http-results.json', reports), JSON.stringify(rows, null, 2));
});
