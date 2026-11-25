import { createServer } from 'vite';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
process.env.PORT ||= '4193';
process.env.BASE_PATH ||= '/';
if (!process.env.REPLIT_DEV_DOMAIN) throw new Error('Development preview domain required.');
const origin = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../../generated-artifacts/network');
await mkdir(out, { recursive: true });
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom' });
const results = process.argv.includes('--failed-only')
  ? JSON.parse(await readFile(path.join(out, 'http-audit.json'), 'utf8')).results : [];
const links = new Set(), failures = [];
const check = async (label, fn) => {
  const previous = results.findIndex(result => result.label === label);
  if (previous >= 0 && results[previous].passed) return;
  let result;
  try { const detail = await fn(); result = { label, passed: true, ...detail }; }
  catch (error) {
    const message = error.message.split('\n')[0].slice(0, 1000);
    failures.push({ label, error: message }); result = { label, passed: false, error: message };
  }
  if (previous >= 0) results[previous] = result; else results.push(result);
};
const get = async (url, method = 'GET') => fetch(url, { method, signal: AbortSignal.timeout(60000) });
try {
  const n = await vite.ssrLoadModule('/src/content/network/index.ts');
  for (const page of n.NETWORK_PAGES) {
    const candidate = n.networkPreviewPath(page.locale, page.id);
    await check(`${page.locale}/${page.id}: candidate HTML`, async () => {
      const res = await get(origin + candidate);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.match(html, new RegExp(`<html[^>]*lang="${page.locale === 'it' ? 'it(?:-IT)?' : page.locale}"`));
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.match(html, /<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/);
      assert.ok(html.includes(`rel="canonical" href="https://www.marenettobuild.com${page.path}"`), 'Prospective canonical must be absolute and use WWW.');
      const graphs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])['@graph'] ?? []);
      for (const type of ['Article', 'FAQPage', 'BreadcrumbList']) assert.ok(graphs.some(g => g['@type'] === type), type);
      assert.ok(!html.includes('hreflang='), 'Draft must not expose public equivalents.');
      const articleHtml = html.match(/<main\b(?=[^>]*\bclass="mbn")[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
      assert.ok(articleHtml, 'Full article SSR markup missing.');
      for (const match of articleHtml.matchAll(/\bhref="(\/[^"#]*)"/g)) {
        const href = match[1].replaceAll('&amp;', '&');
        if (!href.startsWith('/src/') && !href.startsWith('/@') && !href.startsWith('/node_modules/') && !/\.(?:css|woff2?)(?:\?|$)/.test(href)) links.add(href);
      }
      return { url: origin + candidate, status: res.status, nativeSSR: true, noindex: true };
    });
    await check(`${page.locale}/${page.id}: public draft exclusion`, async () => {
      const res = await get(origin + page.path, 'HEAD');
      assert.equal(res.status, 404);
      return { path: page.path, status: res.status };
    });
  }
  for (const locale of n.NETWORK_LOCALES) {
    await check(`${locale}: candidate service addition`, async () => {
      const res = await get(`${origin}/__network-services-review/${locale}`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.match(html, new RegExp(`<html[^>]*lang="${locale === 'it' ? 'it(?:-IT)?' : locale}"`));
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.ok(html.includes('data-testid="section-network-services"'));
      assert.match(html, /<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/);
      return { locale, status: res.status };
    });
  }
  const manifest = JSON.parse(await readFile(path.join(root, '../api-server/content/network-media.json'), 'utf8'));
  for (const asset of Object.keys(manifest.assets)) {
    await check(`WebP ${asset}`, async () => {
      const res = await get(`${origin}/api/network-media/${asset}`, 'HEAD');
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type'), /image\/webp/);
      return { status: res.status, contentType: res.headers.get('content-type') };
    });
  }
  for (const href of links) await check(`Internal link ${href}`, async () => {
    const res = await get(origin + href, 'HEAD');
    assert.equal(res.status, 200);
    return { path: href, status: res.status, resolvedPath: new URL(res.url).pathname, redirected: res.redirected };
  });
  for (const name of ['sitemap.xml', 'llms.txt']) await check(`${name}: no draft URLs`, async () => {
    const res = await get(`${origin}/${name}`); assert.equal(res.status, 200);
    const text = await res.text();
    for (const page of n.NETWORK_PAGES) assert.ok(!text.includes(`https://www.marenettobuild.com${page.path}`), page.path);
    assert.doesNotMatch(text, /__network-review|__network-services-review/);
    return { status: res.status };
  });
  console.log(`${results.length - failures.length}/${results.length} HTTP checks passed. ${failures.length} failures.`);
  if (failures.length) console.error(JSON.stringify(failures, null, 2));
} finally {
  await writeFile(path.join(out, 'http-audit.json'), JSON.stringify({ at: new Date().toISOString(), environment: 'development candidate; no JavaScript execution', results }, null, 2));
  await vite.close();
}
if (failures.length) process.exitCode = 1;
