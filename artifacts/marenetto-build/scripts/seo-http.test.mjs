import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { renderDocument } from './seo-document.mjs';
import { setWebSecurityHeaders } from './security-policy.mjs';

const root = path.resolve(import.meta.dirname, '..');
const reportDir = path.resolve(root, '../../generated-artifacts/seo-audit');
const manifest = JSON.parse(await readFile(path.join(root, 'dist/public/route-manifest.json'), 'utf8'));
test('HTML document direction follows the locale, including Arabic and Hebrew', () => {
  const template = '<html lang="it" dir="ltr"><head><title>Test</title></head><body><div id="root"></div></body></html>';
  for (const [locale, direction] of [['ar', 'rtl'], ['he', 'rtl'], ['it', 'ltr'], ['en', 'ltr'], ['unknown', 'ltr']]) {
    const html = renderDocument(template, { edition: { locale, path: '/' }, body: '<main>Test</main>' });
    assert.match(html, new RegExp(`<html lang="${locale === 'it' ? 'it-IT' : locale}" dir="${direction}"`));
  }
});

test('application HSTS is one day without subdomain coverage; production keeps edge ownership', () => {
  const headers = new Map();
  setWebSecurityHeaders({ setHeader: (name, value) => headers.set(name.toLowerCase(), value) });
  assert.equal(headers.get('strict-transport-security'), process.env.NODE_ENV === 'production' ? undefined : 'max-age=86400');
});

test('real HTTP delivery: every edition, redirects, errors, indexing and canonical', { timeout: 120000 }, async () => {
  const topology = await editorialTopology({ viaProxy: true });
  const { origin } = topology;
  try {
    const results = [];
    for (const pathname of Object.keys(manifest.pages)) {
      const response = await fetch(`${origin}${pathname}`);
      const html = await response.text();
      assert.equal(response.status, 200, pathname);
      assert.match(html, /<div id="root"><(?:link|div|main|section)/, pathname);
      assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, pathname);
      assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1, pathname);
      assert.match(html, /name="robots" content="noindex, nofollow"/, pathname);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.doesNotMatch(html, /maximum-scale|user-scalable=no|data-replit-metadata/, pathname);
      if (pathname.startsWith('/__localization-review/')) assert.doesNotMatch(html, /hreflang=/, pathname);
      if (/^\/(?:ar|he)\//.test(pathname)) assert.match(html, /dir="rtl"/, pathname);
      const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
      const alternates = [...html.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(m => ({ locale: m[1], href: m[2] }));
      assert.equal(new Set(alternates.map(a => a.locale)).size, alternates.length, pathname);
      results.push({ path: pathname, status: response.status, h1: true, body: true, canonical, alternates });
    }
    for (const [pathname, label] of [['/', 'Scrivici su WhatsApp'], ['/en/', 'Write to us on WhatsApp'], ['/__localization-review/ar/home', 'راسلنا على واتساب']]) {
      const html = await (await fetch(`${origin}${pathname}`)).text();
      const widget = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).find(tag => tag.includes('data-testid="whatsapp-float-link"'));
      assert.ok(widget, `Initial WhatsApp link at ${pathname}`);
      assert.ok(widget.includes(`aria-label="${label}"`), `Localized WhatsApp action at ${pathname}`);
      if (pathname === '/') assert.equal(new URL(widget.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&')).searchParams.get('text'), 'Buongiorno, vorrei informazioni per un lavoro.');
    }
    const document = await fetch(`${origin}/documents/promemoria-acquisto.txt`);
    assert.equal(document.status, 200);
    assert.match(document.headers.get('content-type'), /text\/plain/);
    assert.ok((await document.text()).length > 100);
    for (const [source, target] of Object.entries(manifest.redirects)) {
      const response = await fetch(`${origin}${source}/?utm_campaign=synthetic&email=private%40example.test`, { redirect: 'manual' });
      assert.equal(response.status, 308, source);
      assert.equal(response.headers.get('location'), `${target}?utm_campaign=synthetic`, source);
      const destination = await fetch(`${origin}${response.headers.get('location')}`, { redirect: 'manual' });
      assert.equal(destination.status, manifest.heldPages[target.replace(/\/+$/, '')] ? 503 : 200, `${source} -> ${target}`);
    }
    for (const pathname of ['/translation-ok', '/translation-ok/']) {
      const response = await fetch(`${origin}${pathname}`);
      assert.equal(response.status, 410);
      assert.match(await response.text(), /410/);
    }
    const locales = JSON.parse(await readFile(path.join(root, 'src/localization/locales.json'), 'utf8'));
    const blockedPaths = locales.filter(locale => locale.publication === 'blocked').flatMap(({ code }) => [`/${code}/`, `/${code}/services`, `/content/${code}/test`]);
    for (const pathname of ['/random-nonexistent-20261110', '/en/random-invalid', '/content/it/nonexistent', ...blockedPaths]) {
      const response = await fetch(`${origin}${pathname}`);
      assert.equal(response.status, 404, pathname);
      assert.doesNotMatch(await response.text(), /rel="canonical"/);
    }
    const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
    const eligible = Object.values(manifest.editions).filter(edition => edition.state === 'published' && edition.approval && edition.sitemap);
    assert.equal((sitemap.match(/<url>/g) ?? []).length, eligible.length);
    assert.doesNotMatch(sitemap, /\/(?:ricerca|search|internal|__localization-review)(?:<|\/)/);
    // The translated replacement can be approved without approving the exact
    // historical copy. Check the actual held URLs, not a shared article slug.
    const sitemapUrls = new Set([...sitemap.matchAll(/(?:<loc>|hreflang="[^"]+" href=")([^<"]+)/g)].map(match => match[1]));
    for (const pathname of Object.keys(manifest.unreviewedArticles ?? {})) {
      assert.equal(sitemapUrls.has(new URL(pathname, manifest.origin).href), false, pathname);
      assert.equal(sitemapUrls.has(new URL(`${pathname}/`, manifest.origin).href), false, `${pathname}/`);
    }
    for (const pathname of Object.keys(manifest.heldPages)) {
      const response = await fetch(`${origin}${pathname}`);
      const html = await response.text();
      assert.equal(response.status, 503, pathname);
      assert.equal(response.headers.get('retry-after'), '86400', pathname);
      assert.doesNotMatch(html, /data-historical-body|rel="canonical"/, pathname);
      assert.match(html, /role="status"/, pathname);
    }
    for (const [pathname, file] of Object.entries(manifest.unreviewedArticles ?? {})) {
      const original = manifest.editions[Object.keys(manifest.editions).find(route => route.replace(/\/+$/, '') === pathname)];
      assert.ok(original, `Historical article edition exists: ${pathname}`);
      assert.equal(original.state, original.translationRevision ? 'reviewed' : 'draft', pathname);
      if (original.translationRevision) {
        assert.equal(original.translationApprovalRevision, undefined, 'automated comparison must not approve publication');
        assert.equal(original.sitemap, false);
      }
      assert.equal(original.approval, null, pathname);
      assert.equal(original.sitemap, false, pathname);
      const response = await fetch(`${origin}${original.path}`);
      const html = await response.text();
      assert.equal(response.status, 200, pathname);
      assert.match(html, /<article[^>]*data-editorial-state="review-pending"/, pathname);
      assert.match(html, /<article[^>]*data-historical-body=""/, pathname);
      assert.match(html, /<link rel="canonical" href="[^"]+"/, pathname);
      assert.match(html, /name="robots" content="noindex, nofollow"/, pathname);
      assert.doesNotMatch(html, /hreflang=/, pathname);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.ok(!html.includes('<h1 class="display-title">in attesa'), pathname);
      assert.ok(file.endsWith('/index.html'), pathname);
    }
    // Five already-reviewed English editions now have the owner's explicit
    // public indexing authorization. Unreleased originals remain fail-closed.
    assert.equal(Object.keys(manifest.unreviewedArticles ?? {}).length, 40, 'unreleased historical originals remain served only as noindex review documents');
    const robots = await (await fetch(`${origin}/robots.txt`)).text();
    assert.match(robots, /Disallow: \//);
    const malformed = await fetch(`${origin}/%ZZ`);
    assert.equal(malformed.status, 400, 'malformed percent encoding is a client error, not a hidden server failure');
    await mkdir(reportDir, { recursive: true });
    await writeFile(path.join(reportDir, 'http-results.json'), JSON.stringify({ pagesChecked: results.length, redirectsChecked: Object.keys(manifest.redirects).length, errorsChecked: 5, results }, null, 2));
  } finally { await topology.close(); }
});
