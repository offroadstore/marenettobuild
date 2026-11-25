import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const publicDir = new URL('../dist/public/', import.meta.url);
const manifestPath = new URL('route-manifest.json', publicDir);
const built = await access(manifestPath).then(() => true, () => false);
const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' };
const origin = 'https://www.marenettobuild.com';
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');

test('professional initial HTTP HTML: thirteen equivalent useful pages and thirteen noindex empty resource areas', {
  skip: !built && 'Build the site before running the HTTP audit',
}, async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const family = Object.values(manifest.editions).filter(e => e.id === 'professionals');
  const downloads = Object.values(manifest.editions).filter(e => e.id === 'professional-downloads');
  assert.equal(family.length, 13);
  assert.equal(downloads.length, 13);
  assert.equal(new Set(family.map(e => e.locale)).size, 13);
  assert.ok(family.some(e => e.locale === 'ar'));
  const topology = await editorialTopology({ publicIndexing: true });
  const report = { pages: [], resources: [], links: [], images: [] };
  try {
    const sitemap = await (await fetch(topology.origin + '/sitemap.xml', { headers })).text();
    const llms = await (await fetch(topology.origin + '/llms.txt', { headers })).text();
    const paths = new Set();
    const images = new Set();
    const titles = new Set(), descriptions = new Set();
    for (const edition of family) {
      const response = await fetch(topology.origin + edition.path, { headers });
      const html = await response.text();
      assert.equal(response.status, 200, edition.path);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1, edition.path);
      assert.ok(html.length > 15000, edition.path);
      assert.ok(html.includes(`lang="${edition.locale}"`), edition.path);
      if (edition.locale === 'ar') {
        assert.match(html, /<html[^>]*\bdir="rtl"/);
        assert.match(html, /[\u0600-\u06ff]/);
      }
      const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? '');
      const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
      assert.ok(title && description);
      assert.ok(!titles.has(title), edition.path); titles.add(title);
      assert.ok(!descriptions.has(description), edition.path); descriptions.add(description);
      assert.ok(html.includes(`rel="canonical" href="${origin}${edition.path}"`), edition.path);
      assert.ok(html.includes(`property="og:title" content="`), edition.path);
      assert.ok(html.includes(`property="og:description" content="`), edition.path);
      assert.ok(html.includes(`property="og:url" content="${origin}${edition.path}"`), edition.path);
      assert.ok(!/name="robots" content="[^"]*noindex/.test(html), edition.path);
      assert.ok(!response.headers.get('x-robots-tag')?.includes('noindex'), edition.path);
      for (const peer of family) {
        const alternate = [...html.matchAll(/<link[^>]+rel="alternate"[^>]*>/g)].map(m => m[0])
          .find(tag => tag.includes(`href="${origin}${peer.path}"`) &&
            tag.includes(`hreflang="${peer.locale === 'it' ? 'it-IT' : peer.locale}"`));
        assert.ok(alternate, `${edition.path} → ${peer.path}`);
      }
      const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .flatMap(m => JSON.parse(m[1])['@graph'] ?? []);
      const service = graph.find(item => item['@type'] === 'Service');
      assert.ok(service && service.provider?.['@id'] === origin + '/#organization', edition.path);
      assert.ok(service.areaServed, edition.path);
      assert.ok(graph.some(item => item['@type'] === 'WebPage'), edition.path);
      const crumbs = graph.find(item => item['@type'] === 'BreadcrumbList');
      assert.ok(crumbs?.itemListElement.length >= 2, edition.path);
      for (const item of crumbs.itemListElement) assert.ok(html.includes(decode(item.name)), `${edition.path}: visible breadcrumb ${item.name}`);
      const faq = graph.find(item => item['@type'] === 'FAQPage');
      assert.equal(faq?.mainEntity.length, 4, edition.path);
      for (const question of faq.mainEntity) {
        // Apostrophes and ampersands may be HTML-escaped in visible text.
        const body = decode(html);
        assert.ok(body.includes(question.name), edition.path);
        assert.ok(body.includes(question.acceptedAnswer.text), edition.path);
      }
      assert.ok(!graph.some(item => ['Product', 'Offer', 'Review', 'AggregateRating'].includes(item['@type'])), edition.path);
      assert.ok(sitemap.includes(`<loc>${origin}${edition.path}</loc>`), edition.path);
      assert.ok(llms.includes(origin + edition.path), edition.path);
      for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
        const href = decode(match[1]);
        if (href.startsWith('/') && !/^\/(?:internal|sign-in|sign-up|__)/.test(href)) paths.add(href.split(/[?#]/)[0]);
      }
      for (const match of html.matchAll(/<img\b[^>]*>/g)) {
        assert.match(match[0], /\balt="/, edition.path);
        const src = match[0].match(/\bsrc="([^"]+)"/)?.[1];
        if (src?.startsWith('/') && src.endsWith('.webp')) {
          assert.match(match[0], /\balt="[^"]+"/, edition.path);
          assert.match(match[0], /\bwidth="\d+"/, edition.path);
          assert.match(match[0], /\bheight="\d+"/, edition.path);
          images.add(src);
        }
      }
      report.pages.push({ path: edition.path, locale: edition.locale, status: response.status, title, description });
    }
    for (const edition of downloads) {
      const response = await fetch(topology.origin + edition.path, { headers });
      const html = await response.text();
      assert.equal(response.status, 200, edition.path);
      assert.match(html, /name="robots" content="[^"]*noindex/, edition.path);
      assert.ok(!sitemap.includes(`<loc>${origin}${edition.path}</loc>`), edition.path);
      assert.ok(!llms.includes(origin + edition.path), edition.path);
      assert.ok(!/<link[^>]+hreflang=/.test(html), edition.path);
      assert.ok(!/<a\b[^>]*\bdownload(?:=|\s|>)/.test(html), edition.path);
      assert.ok(!/<a\b[^>]*href="[^"]+\.(?:pdf|dwg|rvt|skp)(?:["?#])/i.test(html), edition.path);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1, edition.path);
      report.resources.push({ path: edition.path, locale: edition.locale, status: response.status, noindex: true });
    }
    for (const path of paths) {
      const response = await fetch(topology.origin + path, { headers, method: 'HEAD', redirect: 'manual' });
      assert.ok(response.status < 400, `${path}: ${response.status}`);
      report.links.push({ path, status: response.status });
    }
    for (const path of images) {
      // The isolated editorial fixture deliberately has no media service.
      // Check the actual read-only image route through the workspace gateway.
      const target = path.startsWith('/api/network-media/') ? 'http://localhost:80' + path : topology.origin + path;
      const response = await fetch(target, { headers, method: 'HEAD' });
      assert.equal(response.status, 200, path);
      report.images.push({ path, status: response.status });
    }
    console.log(JSON.stringify(report));
  } finally {
    await topology.close();
  }
});
