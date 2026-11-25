import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { withFontPreload } from './font-preloads.mjs';
import { setWebSecurityHeaders } from './security-policy.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import fonts from '../src/config/font-preloads.json' with { type: 'json' };
import inventory from '../font-licenses/inventory.json' with { type: 'json' };
import locales from '../src/localization/locales.json' with { type: 'json' };

const root = new URL('../', import.meta.url);
const remote = /fonts\.(?:googleapis|gstatic)\.com/i;
test('active sources cannot introduce Google Fonts imports, links or hints', async () => {
  for (const dir of ['src/', 'public/']) {
    const files = await readdir(new URL(dir, root), { recursive: true });
    for (const file of files.filter(file => /\.(css|html|tsx?|jsx?|mjs|json|xml|svg|txt)$/.test(file))) {
      assert.doesNotMatch(await readFile(new URL(dir + file, root), 'utf8'), remote, dir + file);
    }
  }
  for (const file of ['index.html', 'scripts/security-policy.mjs', '../api-server/src/app.ts']) {
    assert.doesNotMatch(await readFile(new URL(file, root), 'utf8'), remote, file);
  }
});

test('unmodified WOFF2 files have licenses, hashes, unicode subsets and swap', async () => {
  const css = await readFile(new URL('src/styles/fonts.css', root), 'utf8');
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)];
  assert.equal(faces.length, inventory.length);
  assert.equal(new Set(inventory.map(font => font.family)).size, 10);
  assert.deepEqual((await readdir(new URL('public/assets/fonts/', root))).sort(), inventory.map(font => font.file).sort());
  for (const font of inventory) {
    const bytes = await readFile(new URL(`public/assets/fonts/${font.file}`, root));
    assert.equal(bytes.toString('ascii', 0, 4), 'wOF2');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), font.sha256);
    const face = faces.find(face => face[1].includes(font.file))?.[1];
    assert.ok(face, font.file);
    assert.match(face, /font-display: swap/);
    assert.match(face, /unicode-range: U\+/);
    const license = await readFile(new URL(`font-licenses/${font.family.toLowerCase().replaceAll(' ', '-')}-OFL.txt`, root), 'utf8');
    assert.match(license, /SIL OPEN FONT LICENSE/);
  }
  for (const subset of ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'arabic', 'hebrew']) {
    assert.ok(inventory.some(font => font.subset === subset), subset);
  }
  assert.ok(inventory.some(font => font.family === 'Newsreader' && font.source.includes('opsz,wght@6..72,400..500')));
});

test('one targeted preload respects locale, private routes and artifact base', () => {
  for (const base of ['/', '/site/']) {
    const template = `<head><link data-site-font rel="preload" href="${base}assets/fonts/${fonts.latin}" as="font" type="font/woff2" crossorigin="anonymous" /></head>`;
    for (const [locale, pathname, key] of [
      ['it', '/', 'latin'], ['pl', '/pl/', 'latin'], ['ru', '/ru/', 'cyrillic'],
      ['ar', '/__localization-review/ar/home', 'ar'], ['he', '/__localization-review/he/home', 'he'],
      ['el', '/__localization-review/el/home', 'greek'], ['it', '/internal/editorial', 'internal'],
      ['it', '/sign-in', 'internal'], ['it', '/owner-demo', 'latin'],
    ]) {
      const html = withFontPreload(template, locale, pathname);
      assert.ok(html.includes(`${base}assets/fonts/${fonts[key]}`), `${locale} ${pathname}`);
      assert.equal((html.match(/rel="preload"/g) ?? []).length, 1);
      assert.equal(withFontPreload(html, locale, pathname), html);
    }
  }
});

test('CSP removes only font providers without changing mode or other services', () => {
  const headers = new Map();
  setWebSecurityHeaders({ setHeader: (name, value) => headers.set(name, value) });
  const name = process.env.MARENETTO_CSP_MODE === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
  assert.ok(headers.has(name));
  assert.doesNotMatch(headers.get(name), remote);
  assert.ok(headers.get(name).includes("font-src 'self';"));
  assert.ok(headers.get(name).includes("style-src 'self' 'unsafe-inline';"));
  assert.ok(headers.get(name).includes('https://storage.googleapis.com'));
  assert.ok(headers.get(name).includes('https://*.client.protect.clerk.com'));
});

test('production HTTP serves every WOFF2 with correct MIME and localized initial preload', { timeout: 60000 }, async () => {
  const topology = await editorialTopology();
  try {
    for (const font of inventory) {
      const response = await fetch(`${topology.origin}/assets/fonts/${font.file}`);
      assert.equal(response.status, 200, font.file);
      assert.match(response.headers.get('content-type'), /^font\/woff2/);
      assert.match(response.headers.get('cache-control'), /immutable/);
      assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), font.sha256);
      const head = await fetch(`${topology.origin}/assets/fonts/${font.file}`, { method: 'HEAD' });
      assert.equal(head.status, 200);
      assert.equal((await head.arrayBuffer()).byteLength, 0);
    }
    for (const locale of locales.filter(locale => locale.publication === 'published')) {
      const pathname = locale.code === 'it' ? '/' : `/${locale.code}/`;
      const response = await fetch(topology.origin + pathname);
      assert.equal(response.status, 200, pathname);
      const html = await response.text();
      assert.doesNotMatch(html, remote);
      assert.equal((html.match(/data-site-font/g) ?? []).length, 1, pathname);
      assert.ok(html.includes(fonts[locale.code === 'ar' ? 'ar' : locale.script === 'cyrillic' ? 'cyrillic' : 'latin']), pathname);
    }
    for (const [pathname, key] of [
      ['/internal', 'internal'], ['/sign-in', 'internal'], ['/owner-demo', 'latin'],
      ['/__localization-review/ar/home', 'ar'], ['/__localization-review/he/home', 'he'],
      ['/__localization-review/el/home', 'greek'],
    ]) {
      const response = await fetch(topology.origin + pathname);
      assert.equal(response.status, 200, pathname);
      const html = await response.text();
      assert.ok(html.includes(fonts[key]), pathname);
      assert.doesNotMatch(html, remote);
    }
  } finally { await topology.close(); }
});
