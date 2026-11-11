import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { extractDocument } from './extract.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.resolve(root, '../../generated-artifacts/historical-fidelity');
const acquisition = JSON.parse(await readFile(path.join(output, 'acquisition.json'), 'utf8'));
const legacy = JSON.parse(await readFile(path.join(output, 'legacy/source-articles-it.json'), 'utf8'));
const browserResults = JSON.parse(await readFile(path.join(output, 'five-browser-results.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'dist/public/route-manifest.json'), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
export function readableDiff(before, after) {
  const a = before.map(block => `${block.tag}: ${block.text}`);
  const b = after.map(block => `${block.tag}: ${block.text}`);
  const n = b.length + 1;
  const memo = new Uint32Array((a.length + 1) * n);
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) memo[i * n + j] = a[i] === b[j] ? memo[(i + 1) * n + j + 1] + 1 : Math.max(memo[(i + 1) * n + j], memo[i * n + j + 1]);
  let i = 0, j = 0;
  const lines = [];
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { lines.push({ op: '=', text: a[i++] }); j++; }
    else if (j < b.length && (i === a.length || memo[i * n + j + 1] >= memo[(i + 1) * n + j])) lines.push({ op: '+', text: b[j++] });
    else lines.push({ op: '-', text: a[i++] });
  }
  return lines;
}
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const parser = await browser.newPage();
const rows = [];
try {
  for (const record of acquisition.records) {
    for (const side of ['original', 'new']) {
      const response = record[side];
      if (!response?.document) continue;
      const hop = response.hops.at(-1);
      const bytes = await readFile(path.join(output, hop.file));
      if (sha(bytes) !== hop.sha256) throw new Error(`Captured source integrity mismatch: ${hop.file}`);
      response.document = await parser.evaluate(extractDocument, { html: bytes.toString('utf8'), url: response.finalURL, side });
    }
    const original = record.original?.document;
    const candidate = record.new?.document;
    const published = record.original?.status === 200 && Boolean(original?.body);
    const existing = record.new?.status === 200 && Boolean(candidate?.body);
    const bodyEqual = published && existing && original.body === candidate.body;
    const titleEqual = existing && original?.h1[0] === candidate.h1[0];
    const type = record.original?.feed ? 'public CMS feed' : original?.isArticle ? 'article' : published ? 'page/archive/category' : 'source unavailable or not published';
    const url = new URL(record.url);
    const locale = record.declaredLocale ?? (/^[a-z]{2}$/.test(url.pathname.split('/')[1]) ? url.pathname.split('/')[1] : 'it');
    const configured = acquisition.build.aliasesConfigured.includes(url.pathname.replace(/\/$/, ''));
    const observedInPublic = record.discoveries.some(d => d !== 'configured-redirect-not-proof-of-history');
    const sourceBodyHash = original ? sha(original.body) : null;
    const targetBodyHash = candidate ? sha(candidate.body) : null;
    const outcome = record.error ? 'acquisition-error' : !published ? 'original-not-published-or-feed' :
      !existing ? (record.new?.status === 410 ? 'historical-content-retired' : 'historical-content-missing') :
      bodyEqual && titleEqual ? 'title-and-body-identical' : 'available-but-different';
    rows.push({
      ...record, locale, type, configured, observedInPublic, published, outcome,
      comparison: { bodyEqual, titleEqual, originalBodySHA256: sourceBodyHash, servedBodySHA256: targetBodyHash,
        bodyScope: original?.extraction, targetBodyScope: candidate?.extraction,
        rawHashes: { original: record.original?.hops.at(-1)?.sha256 ?? null, served: record.new?.hops.at(-1)?.sha256 ?? null },
        bodyDiff: readableDiff(original?.blocks ?? [], candidate?.blocks ?? []),
        title: { original: original?.h1 ?? [], served: candidate?.h1 ?? [] },
        headings: { original: original?.headings ?? [], served: candidate?.headings ?? [] },
        images: { original: original?.images ?? [], served: candidate?.images ?? [], note: 'References/alt/dimensions captured. Media byte equivalence and external stylesheet backgrounds are not certified.' },
        attachments: { original: original?.attachments ?? [], served: candidate?.attachments ?? [] },
        links: { original: original?.links ?? [], served: candidate?.links ?? [] },
      },
    });
  }
} finally { await browser.close(); }

const italianCanonical = rows.filter(r => r.discoveries.includes('sitemap-loc'));
const liveArticles = italianCanonical.filter(r => r.original?.document?.isArticle);
const articleProvenance = legacy.articles.map(archive => {
  const live = rows.find(row => row.url.replace(/\/$/, '') === archive.url.replace(/\/$/, ''));
  return { slug: archive.slug, destinationOrigin: 'rielaborazione già presente nel nuovo progetto; NON copia letterale dello storico né dell’archivio',
    liveSource: live?.url ?? archive.url, liveAcquiredAt: live?.original?.hops.at(-1)?.acquiredAt,
    liveTitle: live?.original?.document?.h1, liveBodySHA256: live?.comparison.originalBodySHA256,
    servedTitle: live?.new?.document?.h1, servedBodySHA256: live?.comparison.servedBodySHA256,
    equality: live?.comparison.bodyEqual ?? false, rawHistoricalFile: live?.original?.hops.at(-1)?.file,
    rawServedFile: live?.new?.hops.at(-1)?.file, oldArchive: { recordedDate: legacy.fetchedAt, recordedURL: archive.url, recordedTitle: archive.title, sha256: sha(archive.markdown), truncatedFlag: archive.truncated, dateIndependentlyProven: false },
    rationale: 'MIGRATION_REPORT.md documents earlier automated Italian rework and qualification/removal of company-specific claims. No new article rewrite has been performed for this comparison.',
  };
});
const decisions = liveArticles.flatMap(row => row.original.document.blocks.map((block, index) => ({ index, ...block })).filter(block =>
  /garanzi|polizza|assicur|certificat|leader|anni di|esperienza|attrezz|bonus|detraz|risparm|sicurezza|specializz|professionist|qualificat|obbligatori|senza.*demoli|competitiv/i.test(block.text)
).map(block => ({ url: row.url, title: row.original.document.h1[0], blockNumber: block.index + 1, tag: block.tag, exactPassage: block.text, sourceFile: row.original.hops.at(-1).file, decision: 'owner review required; preserved as historical evidence, not asserted as current verified company capability' })));

const languageSummary = {};
for (const locale of [...new Set(rows.map(row => row.locale))].sort()) {
  const list = rows.filter(row => row.locale === locale && row.published && row.observedInPublic);
  if (!list.length) continue;
  languageSummary[locale] = {
    observedPublishedURLs: list.length, canonicalSitemapEditions: list.filter(r => r.discoveries.some(d => ['sitemap-loc', 'sitemap-hreflang'].includes(d))).length,
    articles: list.filter(r => r.type === 'article').length,
    distinctArticlePaths: new Set(list.filter(r => r.type === 'article').map(r => new URL(r.url).pathname.replace(/\/$/, ''))).size,
    distinctPublishedPaths: new Set(list.map(r => new URL(r.url).pathname.replace(/\/$/, ''))).size,
    missingOrRetiredInNew: list.filter(r => ['historical-content-missing', 'historical-content-retired'].includes(r.outcome)).length,
    titleAndBodyIdentical: list.filter(r => r.outcome === 'title-and-body-identical').length,
    newApprovedCompleteHistoricalEdition: false,
    sameBodyAsItalian: list.filter(r => r.locale !== 'it' && rows.some(it => it.locale === 'it' && it.published && it.original.document.isArticle === r.original.document.isArticle && it.comparison.originalBodySHA256 === r.comparison.originalBodySHA256)).map(r => r.url),
    evidence: 'Existence/body text/metadata, not linguistic accuracy or owner approval.',
  };
}
const discoveredPublished = rows.filter(row => row.published && row.observedInPublic);
const missing = discoveredPublished.filter(row => row.outcome === 'historical-content-missing');
const summary = {
  createdAt: new Date().toISOString(), appCommitActuallyServed: acquisition.commit,
  taskStatus: 'NOT COMPLETE: historical fidelity not demonstrated; copied-body checks of the project catalog were not historical migration proof',
  discoveredURLs: acquisition.inventory.length, acquiredURLs: rows.length, pendingURLs: acquisition.inventory.length - rows.length,
  acquisitionErrors: acquisition.errors, acquisitionCapReached: acquisition.capped,
  italianCanonicalContentFamilies: italianCanonical.length, italianArticleFamilies: liveArticles.length,
  uniquePublishedBodyFingerprints: new Set(discoveredPublished.map(row => row.comparison.originalBodySHA256)).size,
  observedPublishedHTMLURLs: discoveredPublished.length,
  bodyAndTitleFaithfulURLs: discoveredPublished.filter(row => row.outcome === 'title-and-body-identical').length,
  availableButDifferentURLs: discoveredPublished.filter(row => row.outcome === 'available-but-different').length,
  missingHistoricalHTMLURLs: missing.length,
  retiredHistoricalHTMLURLs: discoveredPublished.filter(row => row.outcome === 'historical-content-retired').length,
  historicalPathsStillReachable: discoveredPublished.filter(row => row.new?.status === 200).length,
  pathsKeptWithoutPathChange: discoveredPublished.filter(row => row.new?.status === 200 && new URL(row.new.finalURL).pathname.replace(/\/$/, '') === new URL(row.url).pathname.replace(/\/$/, '')).length,
  configuredAliases: acquisition.build.aliasesConfigured.length,
  configuredAliasesWithIndependentPublishedSource: new Set(rows.filter(row => row.configured && row.published).map(row => new URL(row.url).pathname.replace(/\/$/, ''))).size,
  configuredAliasesWhoseHistoricalSourceIs404: new Set(rows.filter(row => row.configured && row.original?.status === 404).map(row => new URL(row.url).pathname.replace(/\/$/, ''))).size,
  historicalMissingPathsNotCoveredByAliases: missing.filter(row => !row.configured).length,
  publicCMS: {
    platform: 'Framework360', sitemapItalianContents: italianCanonical.length, articleFamilies: liveArticles.length,
    tagArchivesNotInSitemap: rows.filter(r => r.published && new URL(r.url).pathname.startsWith('/tag/')).map(r => r.url),
    feedURLs: rows.filter(r => r.original?.feed).map(r => ({ url: r.url, items: r.original.feed.items.length, status: r.original.status, file: r.original.hops.at(-1).file })),
    publicExportProvided: false,
    note: 'Published HTML and feed/sitemap/navigation acquired. No authenticated/private CMS data requested. No export was supplied; completeness beyond the discovered public graph cannot be guaranteed.',
  },
  languages: languageSummary,
  requestedLanguages: JSON.parse(await readFile(path.join(root, 'src/localization/locales.json'), 'utf8')).map(l => l.code),
  browserRecheck: { actualCodeCommit: acquisition.commit, command: "pnpm --filter @workspace/marenetto-build exec playwright test --config=playwright.config.ts --project=production-preview tests/migration-routes.spec.ts tests/whatsapp-access.spec.ts --grep 'ogni pagina pubblica|opens wa.me|English and Arabic' --reporter=json", stats: browserResults.stats, evidence: 'five-browser-results.json' },
  ownerDecisionPassages: decisions.length,
  siteMutation: 'No new article rewrite, no route/slug changes, no frontend redesign, no deployment and no indexing activation.',
};
await mkdir(path.join(output, 'diffs'), { recursive: true });
await writeFile(path.join(output, 'comparison.json'), JSON.stringify({ summary, articleProvenance, decisions, rows }, null, 2));
await writeFile(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
await writeFile(path.join(output, 'article-provenance.json'), JSON.stringify(articleProvenance, null, 2));
await writeFile(path.join(output, 'owner-decisions.json'), JSON.stringify(decisions, null, 2));
const aliasCoverage = acquisition.build.aliasesConfigured.map(source => ({
  source, configuredDestination: manifest.redirects[source],
  observedURLs: rows.filter(row => new URL(row.url).pathname.replace(/\/$/, '') === source).map(row => ({
    url: row.url, discoveries: row.discoveries, originalStatus: row.original?.status, originalCanonical: row.original?.document?.canonical,
    newStatus: row.new?.status, destination: row.new?.finalURL, outcome: row.outcome,
  })),
}));
await writeFile(path.join(output, 'configured-alias-coverage.json'), JSON.stringify(aliasCoverage, null, 2));
const columns = ['url', 'locale', 'type', 'discoveries', 'originalInitialStatus', 'originalFinalStatus', 'originalCanonical', 'newDestination', 'newInitialStatus', 'newFinalStatus', 'newCanonical', 'outcome', 'sourceFile', 'servedFile', 'configured', 'observedInPublic'];
const csvRows = rows.map(row => ({ ...row, originalInitialStatus: row.original?.initialStatus, originalFinalStatus: row.original?.status, originalCanonical: row.original?.document?.canonical,
  newDestination: row.new?.finalURL?.replace(acquisition.candidateOrigin, ''), newInitialStatus: row.new?.initialStatus, newFinalStatus: row.new?.status, newCanonical: row.new?.document?.canonical,
  sourceFile: row.original?.hops.at(-1)?.file, servedFile: row.new?.hops.at(-1)?.file,
}));
await writeFile(path.join(output, 'historical-url-ledger.csv'), [columns.join(','), ...csvRows.map(row => columns.map(key => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n'));
await writeFile(path.join(output, 'article-provenance.csv'), ['slug,destinationOrigin,liveSource,liveAcquiredAt,liveBodySHA256,servedBodySHA256,equality', ...articleProvenance.map(row => ['slug', 'destinationOrigin', 'liveSource', 'liveAcquiredAt', 'liveBodySHA256', 'servedBodySHA256', 'equality'].map(key => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n'));
console.info(JSON.stringify(summary, null, 2));
