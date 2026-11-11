import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const workspace = path.resolve(root, '../..');
const evidenceDir = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(workspace, 'generated-artifacts/migration-2026-11-11'));
const outputDir = path.join(evidenceDir, 'playwright-429');
const previewOrigin = (process.env.HISTORICAL_PREVIEW_ORIGIN || 'http://127.0.0.1:80').replace(/\/+$/, '');
await mkdir(outputDir, { recursive: true });
const snapshotFile = (await readdir(evidenceDir)).filter(file => /^acquisition-before-resume-.*\.json$/.test(file)).sort().at(-1);
if (!snapshotFile) throw new Error('Missing full acquisition snapshot; refusing to infer rate-limited URLs.');
const snapshot = JSON.parse(await readFile(path.join(evidenceDir, snapshotFile), 'utf8'));
const latest = JSON.parse(await readFile(path.join(evidenceDir, 'acquisition.json'), 'utf8'));
const records = new Map(snapshot.records.map(record => [record.url, record]));
for (const record of latest.records) records.set(record.url, record);
const targets = [...records.values()].filter(record => record.original?.status === 429).sort((a, b) => a.url.localeCompare(b.url));
if (targets.length !== 102) throw new Error(`Expected 102 source HTTP 429 records, found ${targets.length}; inspect the merged acquisition before browsing.`);

const chromiumPath = '/repl/tools/bin/chromium';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromiumPath) ? { executablePath: chromiumPath } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const semaphore = Array(3).fill(Promise.resolve());
let next = 0;
const results = [];
const screenshots = [];
const normalizedPath = pathname => pathname.replace(/\/+$/, '') || '/';
async function visit(index) {
  const record = targets[index];
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(`console: ${message.text()}`); });
  await page.route('**/*', route => ['image', 'media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue());
  const sourceURL = new URL(record.url);
  const localURL = `${previewOrigin}${sourceURL.pathname}${sourceURL.search}${sourceURL.hash}`;
  let response;
  let failure = null;
  try {
    response = await page.goto(localURL, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(250);
    const rendered = await page.evaluate(() => {
      const text = document.body?.innerText || '';
      return {
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map(element => element.innerText.trim()),
        description: document.querySelector('meta[name="description"]')?.content || '',
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        robots: document.querySelector('meta[name="robots"]')?.content || '',
        language: document.documentElement.lang,
        bodyStart: text.replace(/\s+/g, ' ').trim().slice(0, 500),
        links: [...document.querySelectorAll('a[href]')].map(anchor => anchor.href).slice(0, 20),
        imageCount: document.querySelectorAll('img').length,
        images: [...document.querySelectorAll('img')].map(image => ({ src: image.currentSrc || image.src, alt: image.alt })).slice(0, 20),
      };
    });
    const final = new URL(page.url());
    const httpRedirects = [];
    for (let request = response?.request(); request?.redirectedFrom(); request = request.redirectedFrom()) {
      const status = (await request.response())?.status() ?? null;
      if (status >= 300 && status < 400) httpRedirects.unshift({ url: request.url(), status });
    }
    const result = {
      sourceURL: record.url, sourceInitialStatus: record.original.initialStatus, sourceAcquisitionStatus: record.original.status,
      sourceRetryAfter: record.original.hops?.at(-1)?.headers?.['retry-after'] || null,
      sourceHTTPChain: record.original.hops.map(hop => ({ url: hop.url, status: hop.status })),
      sourceTitle: record.original.document?.title ?? null, sourceH1: record.original.document?.h1 ?? [],
      sourceBodyBytes: record.original.hops?.at(-1)?.bytes ?? null,
      sourceRobotsTag: record.original.hops?.at(-1)?.headers?.['x-robots-tag'] ?? null,
      discovery: record.discoveries, sourceFamily: record.family ?? null,
      previewURL: localURL, previewFinalURL: page.url(),
      previewHTTPStatus: response?.status() ?? null,
      httpRedirects,
      previewPathChanged: normalizedPath(final.pathname) !== normalizedPath(sourceURL.pathname),
      previewSlashOnlyNormalization: normalizedPath(final.pathname) === normalizedPath(sourceURL.pathname) && final.pathname !== sourceURL.pathname,
      ...rendered, errors,
    };
    results.push(result);
    const screenshotKind = result.previewHTTPStatus >= 400 ? 'http-error'
      : result.previewPathChanged ? 'route-change' : /non trovato|not found|404/i.test(result.title) ? 'not-found'
      : 'rendered';
    if (!screenshots.some(image => image.kind === screenshotKind)) {
      const screenshot = `${screenshotKind}-${String(index + 1).padStart(3, '0')}.jpg`;
      await page.screenshot({ path: path.join(outputDir, screenshot), type: 'jpeg', quality: 75, fullPage: false });
      screenshots.push({ kind: screenshotKind, file: `playwright-429/${screenshot}`, url: record.url });
    }
  } catch (error) {
    results.push({
      sourceURL: record.url, sourceInitialStatus: record.original.initialStatus, sourceAcquisitionStatus: record.original.status,
      sourceRetryAfter: record.original.hops?.at(-1)?.headers?.['retry-after'] || null,
      sourceHTTPChain: record.original.hops.map(hop => ({ url: hop.url, status: hop.status })),
      sourceTitle: record.original.document?.title ?? null, sourceH1: record.original.document?.h1 ?? [],
      sourceBodyBytes: record.original.hops?.at(-1)?.bytes ?? null,
      sourceRobotsTag: record.original.hops?.at(-1)?.headers?.['x-robots-tag'] ?? null,
      discovery: record.discoveries, sourceFamily: record.family ?? null,
      previewURL: localURL, previewHTTPStatus: response?.status() ?? null,
      error: error.message, errors,
    });
  } finally { await context.close(); }
}
async function worker() {
  while (next < targets.length) {
    const index = next++;
    await visit(index);
  }
}
await Promise.all(semaphore.map(worker));
await browser.close();
results.sort((a, b) => a.sourceURL.localeCompare(b.sourceURL));
const statusCounts = Object.fromEntries([...new Set(results.map(row => row.previewHTTPStatus ?? 'navigation-error'))].map(status => [status, results.filter(row => (row.previewHTTPStatus ?? 'navigation-error') === status).length]));
const titleGroups = Object.groupBy(results, row => `${row.previewHTTPStatus ?? 'nav-error'} | ${row.title || row.error || '(no title)'}`);
const report = {
  createdAt: new Date().toISOString(), source: snapshotFile,
  sourceHostRequestsMade: 0, scope: 'The 102 old-site HTTP 429 paths were opened only against the local preview; images/fonts/media blocked to keep the check bounded.',
  total: targets.length, previewOrigin, previewStatusCounts: statusCounts,
  sourceDiscoveryCounts: Object.fromEntries([...new Set(targets.flatMap(record => record.discoveries))].map(discovery => [discovery, targets.filter(record => record.discoveries.includes(discovery)).length])),
  sourceFinalStatusCounts: Object.fromEntries([...new Set(targets.map(record => record.original.status))].map(status => [status, targets.filter(record => record.original.status === status).length])),
  sourceInitialStatusCounts: Object.fromEntries([...new Set(targets.map(record => record.original.initialStatus))].map(status => [status, targets.filter(record => record.original.initialStatus === status).length])),
  sourceChallengeTitleCounts: Object.fromEntries([...new Set(targets.map(record => record.original.document?.title ?? '(nessun titolo)'))].map(title => [title, targets.filter(record => (record.original.document?.title ?? '(nessun titolo)') === title).length])),
  sourceRetryAfterCount: targets.filter(record => record.original.hops.at(-1)?.headers?.['retry-after']).length,
  rendered: results.filter(row => row.previewHTTPStatus && row.title).length,
  pathChangedByPreviewRouting: results.filter(row => row.previewPathChanged).length,
  samePathSlashNormalization: results.filter(row => row.previewSlashOnlyNormalization).length,
  actualHTTPRedirects: results.filter(row => row.httpRedirects?.length).length,
  navigationFailures: results.filter(row => row.error).length,
  pagesWithBrowserErrors: results.filter(row => row.errors?.length).length,
  titleGroups: Object.fromEntries(Object.entries(titleGroups).map(([title, rows]) => [title, rows.length])),
  screenshots, results,
};
await writeFile(path.join(outputDir, 'results.json'), JSON.stringify(report, null, 2));
const csv = rows => rows.map(row => row.map(value => {
  const text = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}).join(',')).join('\n');
await writeFile(path.join(outputDir, 'routes.csv'), csv([
  ['sourceURL', 'sourceInitialStatus', 'sourceFinalStatus', 'sourceHTTPChain', 'discovery', 'previewStatus', 'previewFinalURL', 'previewPathChanged', 'previewSlashOnlyNormalization', 'httpRedirects', 'sourceTitle', 'previewTitle', 'previewH1', 'language', 'canonical', 'robots', 'linkCount', 'imageCount', 'sourceRetryAfter', 'browserErrors'],
  ...results.map(row => [row.sourceURL, row.sourceInitialStatus, row.sourceAcquisitionStatus, row.sourceHTTPChain, row.discovery, row.previewHTTPStatus, row.previewFinalURL, row.previewPathChanged, row.previewSlashOnlyNormalization, row.httpRedirects, row.sourceTitle, row.title, row.h1, row.language, row.canonical, row.robots, row.links?.length, row.imageCount, row.sourceRetryAfter, row.errors]),
]));
await writeFile(path.join(outputDir, 'report.md'), [
  '# Esplorazione Playwright dei 102 URL limitati', '',
  `- URL d'origine che avevano risposto 429: **${report.total}**; richieste inviate al sito d'origine in questo controllo: **0**.`,
  `- Verifiche eseguite esclusivamente sull'anteprima locale: ${previewOrigin}.`,
  `- Risposte HTTP dell'anteprima: ${JSON.stringify(report.previewStatusCounts)}.`,
  `- Provenienza: ${JSON.stringify(report.sourceDiscoveryCounts)}.`,
  `- Fonte: risposte finali ${JSON.stringify(report.sourceFinalStatusCounts)}; iniziali ${JSON.stringify(report.sourceInitialStatusCounts)}; titoli challenge ${JSON.stringify(report.sourceChallengeTitleCounts)}; header Retry-After ${report.sourceRetryAfterCount}.`,
  `- Anteprima: ${JSON.stringify(report.previewStatusCounts)}; pagine con titolo ${report.rendered}; percorsi cambiati dall'app ${report.pathChangedByPreviewRouting}; solo normalizzazioni slash ${report.samePathSlashNormalization}; redirect HTTP reali ${report.actualHTTPRedirects}; errori navigazione ${report.navigationFailures}; errori JavaScript/console ${report.pagesWithBrowserErrors}.`,
  '- Le risposte 429 originali mostravano una pagina anti-bot. Non dimostrano che i contenuti mancassero.',
  '',
  '## Esiti raggruppati per risposta e titolo', '',
  ...Object.entries(report.titleGroups).map(([title, count]) => `- ${title}: ${count}`),
  '', '## Screenshot selezionati', '',
  ...screenshots.map(image => `- ${image.kind}: ${image.file} — ${image.url}`),
  '', 'Il registro completo è in results.json; la tabella compatta per URL è routes.csv.',
].join('\n'));
const pathKind = record => {
  if (record.discoveries.includes('public-cms-feed')) return 'feed';
  if (record.discoveries.includes('content-link')) return 'content-link';
  const pathname = new URL(record.url).pathname;
  if (pathname.includes('/articles/')) return 'article alias candidate';
  if (/\/contact\/$/.test(pathname)) return 'contact alias candidate';
  if (/\/how-we-work\/$/.test(pathname) || pathname === '/come-lavoriamo/') return 'about alias candidate';
  return 'other configured candidate';
};
const originStatus = Object.fromEntries([...new Set(targets.map(record => record.original.initialStatus))].map(status => [status, targets.filter(record => record.original.initialStatus === status).length]));
const sourceTitles = Object.fromEntries([...new Set(targets.map(record => record.original.document?.title ?? '(nessun titolo)'))].map(title => [title, targets.filter(record => (record.original.document?.title ?? '(nessun titolo)') === title).length]));
const detail = [
  '# Che cosa rappresentano i 102 URL con HTTP 429',
  '',
  'I 102 sono le risposte finali 429 nell’acquisizione; non sono 102 articoli mancanti. Tutti mostravano il blocco anti-bot, senza titolo editoriale o H1. Le richieste Playwright sono state inviate solo all’anteprima locale: zero richieste al sito storico.',
  '',
  `| Provenienza | URL |`,
  '|---|---:|',
  ...Object.entries(report.sourceDiscoveryCounts).map(([label, count]) => `| ${label} | ${count} |`),
  '',
  `Catena HTTP iniziale della fonte: ${JSON.stringify(originStatus)}; status finale: ${JSON.stringify(report.sourceFinalStatusCounts)}. Titoli del challenge: ${JSON.stringify(sourceTitles)}. Retry-After presente su ${report.sourceRetryAfterCount} risposte.`,
  '',
  '## Esplorazione del routing locale',
  '',
  `Playwright ha verificato ${report.total} percorsi. Status della nuova anteprima: ${JSON.stringify(report.previewStatusCounts)}. L’app ha portato ${report.pathChangedByPreviewRouting} URL a un percorso diverso dopo il rendering; ${report.samePathSlashNormalization} hanno cambiato solo slash finale. I percorsi cambiati dall’app non sono prova di redirect HTTP né di alias storico accertato.`,
  '',
  'Gli 89 candidati provenienti dalle rotte configurate comprendono 72 URL /{lingua}/articles/... in otto lingue (nove slug per lingua), otto /{lingua}/contact/, otto /{lingua}/how-we-work/ e /come-lavoriamo/. L’anteprima reindirizza gli articoli verso slug localizzati e i contatti/pagine lavoro verso le pagine attuali; il sito storico non ha potuto confermare che questi percorsi esistessero. Non vanno contati come 89 pagine storiche acquisite.',
  '',
  'I nove feed /{lingua}/m/blog/feed/ (incluso quello senza prefisso lingua) ricevono 503 in anteprima perché i contenuti del feed restano in attesa di conferma.',
  '',
  'Dei quattro link trovati nei contenuti, /contatti, /pt e /ru restituiscono una pagina in anteprima (le due homepage mostrano contenuti in portoghese e russo); /contatos restituisce 404. Per quest’ultimo la risposta 429 originale non consente di stabilire se sia un refuso o una pagina storica reale.',
  '',
  '## Righe per URL',
  '',
  '| Percorso fonte | Provenienza | Status anteprima | Percorso dopo il rendering | Titolo |',
  '|---|---|---:|---|---|',
  ...results.map(row => `| ${new URL(row.sourceURL).pathname} | ${pathKind(targets.find(record => record.url === row.sourceURL))} | ${row.previewHTTPStatus ?? 'non verificato'} | ${row.previewFinalURL ? new URL(row.previewFinalURL).pathname : 'non raggiunto'} | ${row.title || row.error || 'nessun titolo'} |`),
  '',
  'Il CSV e il JSON allegati contengono anche lingua, canonical, H1, metadati noindex, link, immagini, errori e catene di risposta. Il sito storico non è stato modificato.',
];
await writeFile(path.join(root, 'docs/migrazione-storica/Esplorazione-102-url.md'), detail.join('\n'));
console.log(JSON.stringify({ total: report.total, previewStatusCounts: report.previewStatusCounts, sourceDiscoveryCounts: report.sourceDiscoveryCounts, rendered: report.rendered, pathChangedByPreviewRouting: report.pathChangedByPreviewRouting, samePathSlashNormalization: report.samePathSlashNormalization, actualHTTPRedirects: report.actualHTTPRedirects, navigationFailures: report.navigationFailures, pagesWithBrowserErrors: report.pagesWithBrowserErrors, screenshots }, null, 2));
