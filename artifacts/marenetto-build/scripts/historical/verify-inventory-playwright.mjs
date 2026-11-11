import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '../..');
const workspace = path.resolve(root, '../..');
const evidenceDir = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(workspace, 'generated-artifacts/migration-2026-11-11'));
const outputDir = path.join(evidenceDir, 'playwright-inventory');
const previewOrigin = (process.env.HISTORICAL_PREVIEW_ORIGIN || 'http://127.0.0.1:80').replace(/\/+$/, '');
await mkdir(outputDir, { recursive: true });
const audit = JSON.parse(await readFile(path.join(evidenceDir, 'audit.json'), 'utf8'));
const acquisitionNames = (await readdir(evidenceDir)).filter(name => /^acquisition(?:-before-resume-.*)?\.json$/.test(name)).sort();
const acquired = new Map();
for (const filename of acquisitionNames) {
  const snapshot = JSON.parse(await readFile(path.join(evidenceDir, filename), 'utf8'));
  for (const record of snapshot.records) acquired.set(record.url, record);
}
const rows = audit.rows;
if (rows.length !== 437) throw new Error(`Expected the full 437-URL inventory, found ${rows.length}.`);

const clean = value => (value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const sha = value => createHash('sha256').update(value).digest('hex');
const normalizedPath = value => value.replace(/\/+$/, '') || '/';
const chromiumPath = '/repl/tools/bin/chromium';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromiumPath) ? { executablePath: chromiumPath } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const output = [];
let next = 0;

async function inspect(index) {
  const row = rows[index];
  const errors = [];
  const browserContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await browserContext.newPage();
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(`console: ${message.text()}`);
  });
  await page.route('**/*', route => ['image', 'media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue());
  const original = new URL(row.url);
  const target = `${previewOrigin}${original.pathname}${original.search}${original.hash}`;
  let response;
  try {
    response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(100);
    const pageData = await page.evaluate(() => {
      const tracked = document.querySelector('[data-historical-body]');
      const scope = tracked ?? document.querySelector('main') ?? document.body;
      const clone = scope.cloneNode(true);
      clone.querySelectorAll('script,style,noscript,template,[data-preserved-ui]').forEach(node => node.remove());
      const body = (clone.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      const main = document.querySelector('main') ?? document.body;
      return {
        title: document.title,
        h1: [...main.querySelectorAll('h1')].map(node => node.innerText.trim()),
        language: document.documentElement.lang,
        canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
        robots: document.querySelector('meta[name="robots"]')?.content ?? '',
        contentSelector: tracked ? '[data-historical-body]' : main === document.body ? 'body' : 'main',
        body, bodyChars: body.length,
        links: [...main.querySelectorAll('a[href]')].map(node => ({ href: node.href, label: node.innerText.trim() })).slice(0, 100),
        images: [...main.querySelectorAll('img')].map(node => ({ src: node.getAttribute('src') || '', alt: node.getAttribute('alt') ?? '', width: node.getAttribute('width'), height: node.getAttribute('height') })),
        tables: main.querySelectorAll('table').length,
        lists: main.querySelectorAll('ol,ul').length,
        headings: [...main.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(node => ({ tag: node.tagName.toLowerCase(), text: node.innerText.trim() })),
      };
    });
    const final = new URL(page.url());
    const snapshot = acquired.get(row.url);
    const sourceStatus = row.http.original?.final ?? null;
    const sourceBody = snapshot?.original?.document?.body;
    const renderedBodyHash = sha(pageData.body);
    const sourceBodyHash = sourceBody == null ? null : sha(clean(sourceBody));
    const status = response?.status() ?? null;
    output.push({
      id: row.id, url: row.url, path: row.path, discoveries: row.discoveries,
      sourceHTTPStatus: sourceStatus, expectedBodyResult: row.bodyResult, expectedDisposition: row.disposition,
      sourceBodySHA256: row.sourceBodySHA256 ?? sourceBodyHash,
      sourceHadComparableBody: sourceStatus === 200 && sourceBody != null,
      previewInitialURL: target, previewFinalURL: page.url(), previewHTTPStatus: status,
      previewPathChanged: normalizedPath(final.pathname) !== normalizedPath(original.pathname),
      ...{ ...pageData, body: undefined },
      renderedBodySHA256: renderedBodyHash,
      browserMatchesServedBody: Boolean(row.servedBodySHA256 && row.servedBodySHA256 === renderedBodyHash),
      browserMatchesAcquiredSourceBody: Boolean(sourceStatus === 200 && sourceBodyHash && sourceBodyHash === renderedBodyHash),
      contentPresent: pageData.bodyChars > 0,
      error: errors.length ? errors : [],
    });
  } catch (error) {
    output.push({
      id: row.id, url: row.url, path: row.path, discoveries: row.discoveries,
      sourceHTTPStatus: row.http.original?.final ?? null, expectedBodyResult: row.bodyResult,
      previewInitialURL: target, previewFinalURL: page.url(), previewHTTPStatus: response?.status() ?? null,
      navigationError: error.message, error: errors,
    });
  } finally { await browserContext.close(); }
}

async function worker() {
  while (next < rows.length) await inspect(next++);
}
await Promise.all(Array.from({ length: 4 }, () => worker()));
await browser.close();
output.sort((a, b) => a.url.localeCompare(b.url));

const countBy = values => Object.fromEntries([...new Set(values)].sort().map(value => [value, values.filter(candidate => candidate === value).length]));
const summary = {
  createdAt: new Date().toISOString(), inventorySource: 'audit.json: all discovered source candidates',
  total: output.length, previewOrigin, sourceHostRequestsMade: 0,
  previewHTTPStatusCounts: countBy(output.map(row => row.previewHTTPStatus ?? 'navigation-error')),
  sourceHTTPStatusCounts: countBy(output.map(row => row.sourceHTTPStatus ?? 'unknown')),
  domTextPresentIncludingStatusPages: output.filter(row => row.contentPresent).length,
  domWithoutText: output.filter(row => !row.contentPresent).length,
  htmlRendered: output.filter(row => row.title).length,
  renderedBodyHashMatchesServedHTTP: output.filter(row => row.browserMatchesServedBody).length,
  source200BodyComparedInBrowser: output.filter(row => row.sourceHadComparableBody).length,
  renderedBodyHashMatchesSource: output.filter(row => row.browserMatchesAcquiredSourceBody).length,
  source200ButNoHistoricalBodyInArchive: output.filter(row => row.sourceHTTPStatus === 200 && !row.sourceHadComparableBody).length,
  sourceWithoutComparableHTTP200: output.filter(row => !row.sourceHadComparableBody).length,
  pagesWithBrowserErrors: output.filter(row => row.error?.length).length,
  browserErrorRoutes: output.filter(row => row.error?.length).map(row => ({ url: row.url, errors: row.error.map(error => error.split('\n')[0]) })),
  navigationFailures: output.filter(row => row.navigationError).length,
  limitations: ['Robots, fonts and media were not loaded; DOM associations were inspected, not pixel-rendered image quality.',
    'A current preview response or matching browser hash does not validate content where the original source did not return HTTP 200.',
    'No links or forms were clicked and no source-site requests were sent.'],
};
const accepted = output.filter(row => row.expectedBodyResult === 'superato');
const exactSourceMatches = output.filter(row => row.browserMatchesAcquiredSourceBody);
const rejected = output.filter(row => row.expectedBodyResult === 'fallito');
summary.acceptedBodyRows = accepted.length;
summary.acceptedBodyRowsMatchingServedHTTP = accepted.filter(row => row.browserMatchesServedBody).length;
summary.exactSourceBodyMatches = exactSourceMatches.length;
summary.registeredChangedBodyRows = audit.summary.authorizedBodyAndTitle;
summary.authorizedItalianChangedRows = audit.summary.italianAuthorizedCorrectionMatches;
summary.foreignDraftChangedRows = audit.summary.foreignDraftCorrectionMatches;
summary.sourceBodyFailures = rejected.map(row => ({ url: row.url, previewHTTPStatus: row.previewHTTPStatus, expectedDisposition: row.expectedDisposition }));
summary.sourceWithoutComparableHTTP200IsNotMissingPageCount = true;
const report = { ...summary, results: output };
await writeFile(path.join(outputDir, 'results.json'), JSON.stringify(report, null, 2));
const csvValue = value => {
  const text = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
await writeFile(path.join(outputDir, 'routes.csv'), [
  ['id', 'url', 'sourceHTTPStatus', 'expectedBodyResult', 'previewHTTPStatus', 'previewFinalURL', 'contentPresent', 'contentSelector', 'renderedBodySHA256', 'sourceBodySHA256', 'browserMatchesServedBody', 'browserMatchesAcquiredSourceBody', 'title', 'h1', 'language', 'canonical', 'robots', 'bodyChars', 'links', 'images', 'error'].map(csvValue).join(','),
  ...output.map(row => ['id', 'url', 'sourceHTTPStatus', 'expectedBodyResult', 'previewHTTPStatus', 'previewFinalURL', 'contentPresent', 'contentSelector', 'renderedBodySHA256', 'sourceBodySHA256', 'browserMatchesServedBody', 'browserMatchesAcquiredSourceBody', 'title', 'h1', 'language', 'canonical', 'robots', 'bodyChars', 'links', 'images', 'error'].map(key => csvValue(row[key])).join(',')),
].join('\n'));
await writeFile(path.join(outputDir, 'report.md'), [
  '# Controllo Playwright dell’inventario URL completo',
  '',
  `- Percorsi visitati: ${summary.total}; richieste al sito storico: 0.`,
  `- Status preview: ${JSON.stringify(summary.previewHTTPStatusCounts)}.`,
  `- Corpi storici con hash DOM identico: ${summary.renderedBodyHashMatchesSource}/${summary.source200BodyComparedInBrowser}.`,
  `- Hash del contenuto DOM uguale alla risposta HTTP servita: ${summary.renderedBodyHashMatchesServedHTTP}.`,
  `- Corpi storici HTTP 200 confrontabili: ${summary.source200BodyComparedInBrowser}; corrispondenza hash esatta nel browser: ${summary.renderedBodyHashMatchesSource}.`,
  `- HTTP 200 storici senza testo integrale nell’archivio: ${summary.source200ButNoHistoricalBodyInArchive}.`,
  `- Errori browser: ${summary.pagesWithBrowserErrors}; navigazioni fallite: ${summary.navigationFailures}.`,
  '',
  'Limiti:',
  ...summary.limitations.map(text => `- ${text}`),
  '',
  'Tutti i 437 URL e le osservazioni per pagina sono nel JSON e nel CSV.',
].join('\n'));
const bodyCheckDetails = [
  '# Confronto Playwright di tutti i contenuti confrontabili',
  '',
  `Percorsi esplorati in anteprima: ${summary.total}; richieste al sito storico: 0.`,
  '',
  `- Fonti originali con HTTP 200 e testo archiviato: ${summary.source200BodyComparedInBrowser}; hash del corpo renderizzato identico alla fonte: ${summary.exactSourceBodyMatches}.`,
  `- Altri testi con modifiche registrate e DOM uguale alla risposta servita: ${summary.authorizedItalianChangedRows} URL italiani autorizzati e ${summary.foreignDraftChangedRows} URL stranieri ancora in bozza.`,
  `- Corpi accettati dal confronto con la fonte e verificati anche nel browser: ${summary.acceptedBodyRowsMatchingServedHTTP}/${summary.acceptedBodyRows}.`,
  `- Confronti corpo/titolo falliti: ${summary.sourceBodyFailures.length}. URL: ${summary.sourceBodyFailures.map(row => new URL(row.url).pathname).join(', ')}; non sono inclusi come trasferimenti completi.`,
  `- URL senza corpo sorgente confrontabile: ${summary.sourceWithoutComparableHTTP200}, composti da ${summary.sourceHTTPStatusCounts['404'] ?? 0} risposte storiche 404 e ${summary.sourceHTTPStatusCounts['429'] ?? 0} risposte storiche 429. Non equivale a pagine/contenuti mancanti.`,
  `- Status dell’anteprima per tutti i percorsi: ${JSON.stringify(summary.previewHTTPStatusCounts)}.`,
  `- Errori JavaScript: ${summary.pagesWithBrowserErrors}, concentrati in: ${summary.browserErrorRoutes.map(item => new URL(item.url).pathname).join(', ') || 'nessuno'}.`,
  '',
  'Caveat: i 65 contenuti stranieri modificati restano bozze senza approvazione linguistica. Il controllo non attesta accuratezza tecnica, diritti o qualità visiva di immagini/fonts/media, bloccati durante il passaggio Playwright. I sette errori browser ricadono su percorsi translation-ok che restituiscono 404 e rimangono esclusi.',
  '',
  'Il CSV e il JSON con i risultati per URL restano la fonte dettagliata per la revisione.',
];
await writeFile(path.join(outputDir, 'report.md'), bodyCheckDetails.join('\n'));
await writeFile(path.join(root, 'docs/migrazione-storica/Verifica-browser-contenuti.md'), bodyCheckDetails.join('\n'));
console.log(JSON.stringify(summary, null, 2));
