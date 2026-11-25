import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { llmsDocument } from './llms-document.mjs';
import { releaseSitemap } from './public-release.mjs';

process.env.PORT ||= '4193';
process.env.BASE_PATH ||= '/';
const root = path.resolve(import.meta.dirname, '..');
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
after(() => vite.close());
const network = await vite.ssrLoadModule('/src/content/network/index.ts');
const { networkStructuredData, networkServiceCatalog } = await vite.ssrLoadModule('/src/content/network/schema.ts');
const { networkCMSRecord } = await vite.ssrLoadModule('/src/content/network/cms.ts');
const { editions, equivalentEditions } = await vite.ssrLoadModule('/src/localization/edition-inventory.ts');
const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
const { regulatoryNotice } = await vite.ssrLoadModule('/src/content/network/regulatory-notice.ts');
const origin = 'https://www.marenettobuild.com';

test('twelve complete native catalogs, twelve distinct articles and unique routes/metadata per locale', () => {
  assert.equal(network.NETWORK_LOCALES.length, 12);
  assert.equal(network.NETWORK_PAGES.length, 144);
  assert.equal(new Set(network.NETWORK_PAGES.map(p => p.path)).size, 144);
  for (const locale of network.NETWORK_LOCALES) {
    const copy = network.networkCopy(locale);
    const pages = network.NETWORK_PAGES.filter(p => p.locale === locale);
    assert.equal(new Set(pages.map(p => p.title)).size, 12, locale);
    assert.equal(new Set(pages.map(p => p.description)).size, 12, locale);
    assert.match(copy.scope, /60/, locale);
    for (const p of pages) {
      const a = copy.articles[p.id];
      assert.ok(a.title && a.seoTitle && a.description && a.lead && a.nextStep);
      assert.equal(a.sections.length, 3);
      assert.ok(a.sections.every(s => s.heading && s.paragraphs.length === 2 && s.paragraphs.every(Boolean)), p.path);
      assert.equal(a.faq.length, 3);
      assert.ok(a.faq.every(([q, answer]) => q && answer), p.path);
      assert.equal(a.imageAlts.length, 3);
      assert.equal(a.checklist.length, 3);
      if (locale !== 'it') {
        const original = network.networkCopy('it').articles[p.id];
        assert.notEqual(a.lead, original.lead, p.path);
        for (let i = 0; i < a.sections.length; i++) {
          assert.notEqual(a.sections[i].heading, original.sections[i].heading, p.path);
          for (let j = 0; j < a.sections[i].paragraphs.length; j++) assert.notEqual(a.sections[i].paragraphs[j], original.sections[i].paragraphs[j], p.path);
        }
        assert.notEqual(copy.direct, network.networkCopy('it').direct, locale);
        assert.notEqual(copy.illustration, network.networkCopy('it').illustration, locale);
      }
    }
  }
});

test('AI checks are revision-specific evidence, never professional certification or a release approval', async () => {
  const evidence = JSON.parse(await readFile(path.join(root, 'src/content/network/ai-checks.json'), 'utf8'));
  assert.equal(evidence.mode, 'ai-assisted-documentary-linguistic');
  assert.equal(evidence.professionalSignOff, false);
  assert.equal(evidence.nativeSpeakerCertification, false);
  assert.equal(evidence.publicationApproval, false);
  assert.equal(evidence.editions.length, 144);
  const banned = /fastighetsmäkl|eiendomsmeg|ejendomsmægl|estate\s+(?:agent|agenc)|immobilienmakl|makelaar|agenc(?:e|es)\s+immobili|agenz(?:ia|ie)\s+immobili|agenc(?:ia|ias)\s+inmobili|agênc(?:ia|ias)\s+imobili|ри[еэ]лт|agencj[aei]\s+nieruchomo|pośredni(?:k|ctw)/iu;
  assert.equal(JSON.stringify(network.NETWORK_COPY).match(banned)?.[0], undefined, 'Excluded occupation/agency reference in candidate text');
  for (const page of network.NETWORK_PAGES) {
    const record = evidence.editions.find(e => e.id === page.id && e.locale === page.locale);
    assert.equal(record?.contentSHA256, createHash('sha256').update(network.networkRevisionPayload(page)).digest('hex'), page.path);
    assert.equal(network.networkPublic(page), false);
  }
});

test('existing service locales outside the twelve network editions keep rendering without a network fallback', async () => {
  const otherLocales = [...new Set(editions.filter(e => e.id === 'services').map(e => e.locale))]
    .filter(locale => !network.NETWORK_LOCALES.includes(locale));
  assert.ok(otherLocales.includes('ro'));
  for (const locale of otherLocales) assert.deepEqual(networkServiceCatalog(locale, origin).itemListElement, [], locale);
  const { body } = await render('/__localization-review/ro/services', 'ro');
  assert.match(body, /Construiește, renovează, întreține\./);
  assert.doesNotMatch(body, /Something went wrong|hasOfferCatalog/);
});

test('all 144 CMS records are native drafts with FAQ, sources, captions and exact revision fingerprints', () => {
  for (const page of network.NETWORK_PAGES) {
    const record = networkCMSRecord(page);
    assert.equal(record.content.contentLanguage, page.locale);
    assert.equal(record.releaseReady, false, page.path);
    assert.ok(record.content.sources.length, page.path);
    assert.doesNotMatch(record.content.body, /<h1\b/, page.path);
    assert.match(record.content.body, /<figcaption>/, page.path);
    assert.equal(createHash('sha256').update(record.reviewPayload).digest('hex').length, 64);
    assert.equal(network.networkPublic(page), false);
  }
});

test('all 144 initial HTML bodies have one H1, complete text, working anchors and existing native service destinations', async () => {
  const knownPaths = new Set(editions.map(e => e.path.replace(/\/+$/, '') || '/'));
  const previews = new Set(network.NETWORK_PAGES.map(p => network.networkPreviewPath(p.locale, p.id)));
  const decode = value => value.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&quot;', '"');
  for (const page of network.NETWORK_PAGES) {
    const { body } = await render(network.networkPreviewPath(page.locale, page.id), page.locale);
    assert.ok(body.includes(regulatoryNotice(page.locale).body), page.path);
    assert.match(regulatoryNotice(page.locale).body, /2025/);
    assert.equal((body.match(/<h1\b/g) ?? []).length, 1, page.path);
    assert.match(body, new RegExp(`lang="${page.locale}"`), page.path);
    assert.match(body, /data-testid="status-network-draft"/, page.path);
    assert.equal((body.match(/<figcaption\b/g) ?? []).length, page.id === 'network' ? 1 : 3, page.path);
    const articleHtml = body.match(/<main\b(?=[^>]*\bclass="mbn")[^>]*>([\s\S]*?)<\/main>/)?.[1];
    assert.ok(articleHtml, page.path);
    const ids = new Set([...articleHtml.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const match of articleHtml.matchAll(/\bhref="([^"]+)"/g)) {
      const href = decode(match[1]);
      if (href.startsWith('#')) { assert.ok(ids.has(href.slice(1)), `${page.path}: ${href}`); continue; }
      if (!href.startsWith('/')) continue;
      const target = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
      assert.ok(knownPaths.has(target) || previews.has(target), `${page.path}: nonexistent ${href}`);
    }
    // Complete source paragraphs survive SSR, not just a title and summary.
    const text = decode(body.replace(/<[^>]*>/g, ' '));
    for (const section of network.networkCopy(page.locale).articles[page.id].sections) {
      for (const paragraph of section.paragraphs) assert.ok(text.includes(paragraph), `Missing paragraph in ${page.path}`);
    }
  }
});

test('drafts never join public inventory, equivalents, sitemap or AI links', () => {
  assert.equal(network.NETWORK_PUBLIC_PAGES.length, 0);
  assert.ok(!editions.some(e => e.source.startsWith('network:')));
  for (const page of network.NETWORK_PAGES) assert.deepEqual(equivalentEditions(`network-${page.id}`), []);
  const sitemap = releaseSitemap(editions.filter(e => e.state === 'published' && e.sitemap));
  const llms = llmsDocument({ name: 'Marenetto Build', address: {} }, editions, origin);
  assert.doesNotMatch(sitemap, /__network-review|professional-network|rete-professionisti/);
  assert.doesNotMatch(llms, /__network-review|## Professional network/);
});

test('schema matches actual local FAQ and breadcrumbs, no invented dates, reviews or aggregate ratings', () => {
  for (const page of network.NETWORK_PAGES) {
    const graph = networkStructuredData(page, origin);
    const c = network.networkCopy(page.locale);
    assert.deepEqual(graph.map(g => g['@type']), ['Article', 'FAQPage', 'BreadcrumbList']);
    assert.equal(graph[0].author.name, 'Marenetto Build');
    assert.equal(graph[0].datePublished, undefined);
    assert.equal(graph[1].mainEntity.length, c.articles[page.id].faq.length);
    graph[1].mainEntity.forEach((question, n) => {
      assert.equal(question.name, c.articles[page.id].faq[n][0]);
      assert.equal(question.acceptedAnswer.text, c.articles[page.id].faq[n][1]);
    });
    assert.ok(graph[2].itemListElement.every(e => e.item.startsWith(origin)));
    assert.doesNotMatch(JSON.stringify(graph), /AggregateRating|"Review"/);
  }
});

test('34 distinct illustrative scenes, 102 allowlisted WebP variants and localized alternative text', async () => {
  const plan = JSON.parse(await readFile(path.join(root, 'src/content/network/image-plan.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(root, '../api-server/content/network-media.json'), 'utf8'));
  assert.equal(plan.scenes.length, 34);
  assert.equal(network.networkImageInventory.length, 34);
  assert.equal(Object.keys(manifest.assets).length, 102);
  assert.equal(new Set(network.networkImageInventory.map(i => i.sha256)).size, 34);
  for (const image of network.networkImageInventory) {
    assert.ok(image.width > 0 && image.height > 0);
    assert.equal(image.srcSet.split(', ').length, 3);
    assert.match(image.src, /^\/api\/network-media\/[a-z]+-[0-2]-[a-f0-9]{16}-(1024|1280)\.webp$/);
    assert.match(image.prompt, /fictional illustrative/);
    for (const locale of network.NETWORK_LOCALES) assert.ok(network.networkCopy(locale).articles[image.id].imageAlts[image.n]);
    for (const variant of image.srcSet.split(', ')) assert.ok(manifest.assets[variant.split(' ')[0].split('/').at(-1)]);
  }
  const restricted = plan.scenes.filter(s => ['comfort', 'glazing'].includes(s.id));
  assert.equal(restricted.length, 6);
  assert.ok(restricted.every(s => /finish|completed/.test(s.scene)));
});

test('synthetic in-memory approvals only release a complete locale; any changed dependency revokes it', () => {
  const imagesBefore = structuredClone(network.networkImageInventory);
  const originals = structuredClone(network.networkReviews);
  const evidence = { reviewer: 'Synthetic test fixture — not a real review', at: '2026-11-24T12:00:00Z', evidence: 'In-memory unit test only; never written to the release ledger.' };
  const italian = network.NETWORK_PAGES.filter(p => p.locale === 'it');
  const a = network.networkCopy('it').articles.comfort;
  const before = a.lead;
  try {
    for (const image of network.networkImageInventory) { image.review = 'accepted'; image.reviewEvidence = evidence.evidence; }
    for (const page of italian.slice(0, -1)) network.networkReviews[`it:${page.id}`] = {
      reviewedContent: network.networkRevisionPayload(page), createdAt: evidence.at, modifiedAt: evidence.at,
      checks: { seo: evidence, linguistic: evidence, technical: evidence, ai: evidence },
    };
    assert.ok(italian.every(page => !network.networkPublic(page)), 'A partial cluster cannot leak previews.');
    const last = italian.at(-1);
    network.networkReviews[`it:${last.id}`] = {
      reviewedContent: network.networkRevisionPayload(last), createdAt: evidence.at, modifiedAt: evidence.at,
      checks: { seo: evidence, linguistic: evidence, technical: evidence, ai: evidence },
    };
    assert.ok(italian.every(page => network.networkPublic(page)));
    const catalog = networkServiceCatalog('it', origin);
    assert.equal(catalog.itemListElement.length, 2, 'Direct work and coordination remain distinct.');
    assert.ok(catalog.itemListElement.every(offer => offer['@type'] === 'Offer' && offer.itemOffered['@type'] === 'Service'));
    assert.ok(!catalog.itemListElement.some(offer => offer.itemOffered.url.includes('/comprare-')), 'Purchase information is not an in-house legal service.');
    assert.ok(network.NETWORK_PAGES.filter(p => p.locale === 'en').every(page => !network.networkPublic(page)));
    a.lead += ' Synthetic changed revision.';
    assert.ok(italian.every(page => !network.networkPublic(page)));
    a.lead = before;
    assert.ok(italian.every(page => network.networkPublic(page)));
    network.networkImageInventory[0].review = 'pending';
    assert.ok(italian.every(page => !network.networkPublic(page)));
  } finally {
    a.lead = before;
    for (const key of Object.keys(network.networkReviews)) delete network.networkReviews[key];
    Object.assign(network.networkReviews, originals);
    network.networkImageInventory.forEach((image, index) => {
      delete image.reviewEvidence;
      Object.assign(image, imagesBefore[index]);
    });
  }
  assert.equal(network.NETWORK_PUBLIC_PAGES.length, 0);
});
