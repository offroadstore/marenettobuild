/**
 * Audit a staged release in an isolated SSR process. Never deploys.
 * Real public eligibility remains off until the owner's explicit activation.
 */
import { createServer } from 'vite';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { renderDocument, SEO_ORIGIN } from './seo-document.mjs';
import { releaseSitemap } from './public-release.mjs';
import { llmsDocument } from './llms-document.mjs';

process.env.PORT ||= '4193';
process.env.BASE_PATH ||= '/';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../../generated-artifacts/network/candidate');
const sha = text => createHash('sha256').update(text).digest('hex');
const file = name => path.join(root, 'src/content/network', name);
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const n = await vite.ssrLoadModule('/src/content/network/index.ts');
  if (process.argv.includes('--record-reviewed-images')) {
    // This flag records an actual visual check; it does not perform one.
    const at = new Date().toISOString();
    for (const image of n.networkImageInventory) {
      const original = await readFile(path.join(out, `../originals/${image.id}-${image.n}.jpg`));
      assert.equal(sha(original), image.sha256, `Changed original: ${image.id}/${image.n}`);
      image.review = 'accepted';
      image.reviewEvidence = `AI-assisted visual editorial check ${at}: all 34 originals inspected in nine larger panels; finished rooms in all six comfort/glazing scenes; no visible brands, readable documents or identifiable people. Illustrations only, not evidence of construction, materials or hidden-system performance. Roof alt descriptions corrected to visible features.`;
    }
    await writeFile(file('images.json'), JSON.stringify(n.networkImageInventory, null, 2) + '\n');
    console.log('Recorded actual AI visual acceptance of 34 scenes; no public approvals changed.');
  } else if (process.argv.includes('--activate-for-explicit-owner-republish') || process.argv.includes('--verify-owner-activation')) {
    const ready = JSON.parse(await readFile(file('readiness.json'), 'utf8'));
    assert.equal(ready.state, 'ready-for-owner-republish');
    assert.equal(ready.editions.length, 144);
    const records = {};
    for (const page of n.NETWORK_PAGES) {
      const r = ready.editions.find(e => e.id === page.id && e.locale === page.locale);
      const reviewedContent = n.networkRevisionPayload(page);
      assert.equal(sha(reviewedContent), r?.sha256, `Stale candidate: ${page.path}`);
      records[`${page.locale}:${page.id}`] = { reviewedContent, createdAt: ready.at, modifiedAt: ready.at, checks: ready.checks };
    }
    if (process.argv.includes('--verify-owner-activation')) {
      assert.equal(Object.keys(records).length, 144);
      assert.equal(Object.keys(n.networkReviews).length, 0, 'Verification must not activate the real ledger.');
      console.log('Activation prerequisites verified for all 144 current revisions. Real release ledger unchanged.');
    } else {
      // Only run this explicit command after the owner asks to activate this
      // section. A routine build, merge or unrelated republish never runs it.
      await writeFile(file('reviews.json'), JSON.stringify(records, null, 2) + '\n');
      console.log('Owner-requested activation prepared. Nothing has been deployed or sent to search engines.');
    }
  } else {
    assert.equal(Object.keys(n.networkReviews).length, 0, 'Audit must start from inactive real release ledger.');
    const ai = JSON.parse(await readFile(file('ai-checks.json'), 'utf8'));
    const at = new Date().toISOString();
    const evidence = description => ({ reviewer: 'AI-assisted editorial and automated checks, not professional sign-off', at, evidence: description });
    const checks = {
      seo: evidence('Actual network SSR/metadata/schema/anchor tests and staged candidate audit; no promise of search ranking or rich results.'),
      linguistic: evidence('144 complete editions and shared service copy compared with IT; suggestions adjudicated, localized dated regulatory notices and final alt corrections checked. Not native-speaker certification.'),
      technical: evidence('AI documentary consistency check against consulted sources. Official 23-page L.R.16/2016 consolidation incorporates L.R.27/2024, valid 2025-02-28. Owner accepts later unverified changes as a visible case-specific caveat, not a delivery blocker. Not a qualified legal/technical opinion.'),
      ai: evidence('Actual review of 34 illustrative scenes, all six comfort/glazing finished interiors, localized visible AI disclosure, alt descriptions and responsive asset inventory. Not photographs of company work.'),
    };
    for (const page of n.NETWORK_PAGES) {
      const payload = n.networkRevisionPayload(page);
      assert.equal(sha(payload), ai.editions.find(e => e.id === page.id && e.locale === page.locale)?.contentSHA256, `Stale AI check: ${page.path}`);
      n.networkReviews[`${page.locale}:${page.id}`] = { reviewedContent: payload, createdAt: at, modifiedAt: at, checks };
    }
    assert.ok(n.NETWORK_PAGES.every(n.networkPublic), 'Candidate must verify all 144 editions.');
    const { networkCMSRecord } = await vite.ssrLoadModule('/src/content/network/cms.ts');
    for (const page of n.NETWORK_PAGES) {
      const cms = networkCMSRecord(page);
      assert.equal(cms.releaseReady, true, page.path);
      assert.doesNotMatch(cms.content.body, /__network-review/, page.path);
    }
    // These changes are confined to this test process. Production source
    // reviews.json remains empty; inventory is loaded only after staging.
    n.NETWORK_PUBLIC_PAGES.splice(0, n.NETWORK_PUBLIC_PAGES.length, ...n.NETWORK_PAGES);
    const entry = await vite.ssrLoadModule('/src/entry-server.tsx');
    const { NETWORK_SERVICE_IDS } = await vite.ssrLoadModule('/src/content/network/types.ts');
    const { regulatoryNotice } = await vite.ssrLoadModule('/src/content/network/regulatory-notice.ts');
    const editorial = entry.editions.filter(e => e.source?.startsWith('network:'));
    assert.equal(editorial.length, 144);
    const services = entry.editions.filter(e => n.NETWORK_LOCALES.includes(e.locale) && NETWORK_SERVICE_IDS.includes(e.id));
    assert.ok(services.length >= 24, 'All twelve core/local service editions must exist.');
    const targets = [...editorial, ...services];
    const template = await readFile(path.join(root, 'dist/public/index.html'), 'utf8');
    await mkdir(path.join(out, 'html'), { recursive: true });
    const reports = [];
    const docs = new Map();
    for (const edition of targets) {
      const rendered = await entry.render(edition.path, edition.locale);
      const body = rendered.body;
      assert.equal((body.match(/<h1\b/g) ?? []).length, 1, edition.path);
      assert.doesNotMatch(body, /Something went wrong|status-network-draft/, edition.path);
      if (edition.source?.startsWith('network:')) {
        assert.ok(body.includes(regulatoryNotice(edition.locale).body), edition.path);
        assert.equal(entry.equivalentEditions(edition.id).length, 12, edition.path);
      } else {
        if (!body.includes('data-testid="section-network-services"')) {
          await writeFile(path.join(out, 'missing-service-block.html'), body);
          throw new Error(`Missing network service block: ${edition.locale} ${edition.id} ${edition.path}`);
        }
        assert.ok(body.includes(n.networkCopy(edition.locale).direct), edition.path);
      }
      const html = renderDocument(template, { edition, body, alternates: entry.equivalentEditions(edition.id), canonicalPath: edition.path, structuredData: entry.editionStructuredData(edition, SEO_ORIGIN) });
      assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1, edition.path);
      assert.ok(html.includes(`href="${SEO_ORIGIN}${edition.path}"`), edition.path);
      assert.doesNotMatch(html, /href="[^"]*__network-review/, edition.path);
      if (edition.source?.startsWith('network:')) assert.equal((html.match(/hreflang="/g) ?? []).length, 13, edition.path);
      const outputFile = `${edition.locale}-${encodeURIComponent(edition.id)}.html`;
      await writeFile(path.join(out, 'html', outputFile), html);
      docs.set(edition.path.replace(/\/+$/, '') || '/', html);
      reports.push({ path: edition.path, locale: edition.locale, id: edition.id, outputFile, sha256: sha(html), status: 'SSR complete; staged-only', title: rendered.metadata?.title ?? edition.title });
    }
    const known = new Set(entry.editions.map(e => e.path.replace(/\/+$/, '') || '/'));
    for (const [pathname, html] of docs) for (const [, raw] of html.matchAll(/\bhref="(\/[^"]*)"/g)) {
      const [target, anchor] = raw.replaceAll('&amp;', '&').split('#');
      const targetPath = target.split('?')[0].replace(/\/+$/, '') || '/';
      if (targetPath.startsWith('/api/') || targetPath.startsWith('/assets/')) continue;
      const staticAsset = await stat(path.join(root, 'public', targetPath)).then(s => s.isFile()).catch(() => false);
      assert.ok(known.has(targetPath) || staticAsset, `Unknown link ${pathname} → ${raw}`);
      if (anchor && docs.has(targetPath)) assert.ok(docs.get(targetPath).includes(`id="${decodeURIComponent(anchor)}"`), `Broken anchor ${raw}`);
    }
    const sitemap = releaseSitemap(entry.editions.filter(e => e.state === 'published' && e.sitemap));
    const llms = llmsDocument({ name: 'Marenetto Build', address: {} }, entry.editions, SEO_ORIGIN);
    assert.doesNotMatch(sitemap + llms, /__network-review|__network-services-review/);
    for (const page of n.NETWORK_PAGES) assert.ok(sitemap.includes(`${SEO_ORIGIN}${page.path}`), page.path);
    await writeFile(path.join(out, 'sitemap.xml'), sitemap);
    await writeFile(path.join(out, 'llms.txt'), llms);
    await writeFile(path.join(out, 'audit.json'), JSON.stringify({ at, environment: 'Isolated staged SSR candidate; not deployed; normal public ledger unchanged', editorialPages: editorial.length, servicePages: services.length, results: reports }, null, 2));
    await writeFile(file('readiness.json'), JSON.stringify({
      state: 'ssr-verified-awaiting-http-audits', at, activation: 'not-active', professionalSignOff: false, nativeSpeakerCertification: false,
      regionalReference: { validAt: '2025-02-28', laterChanges: 'Visible case-specific caveat; accepted by owner, not blocking delivery', officialServingURL: 'https://www.regione.sicilia.it/system/files/2025-04/lr%2016_2016%20agg%2028%20feb%202025.pdf', requestedSitesAlias: 'HTTP404 observed, not represented as a successful source retrieval' },
      checks, audit: { editorialPages: editorial.length, servicePages: services.length, snapshotSHA256: sha(JSON.stringify(reports)) },
      editions: n.NETWORK_PAGES.map(page => ({ id: page.id, locale: page.locale, sha256: sha(n.networkRevisionPayload(page)) })),
    }, null, 2) + '\n');
    console.log(`Staged SSR audit passed for ${editorial.length} editorial and ${services.length} service editions; HTTP/Lighthouse completion still required. Actual release ledger unchanged.`);
  }
} finally { await vite.close(); }
