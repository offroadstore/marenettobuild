import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { extractDocument } from './extract.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.resolve(root, '../../generated-artifacts/historical-fidelity');
const before = JSON.parse(await readFile(path.join(output, 'comparison.json'), 'utf8'));
const inventory = JSON.parse(await readFile(path.join(root, 'src/content/historical/index.json'), 'utf8'));
const amendments = JSON.parse(await readFile(path.join(root, 'content/historical-corrections.applied.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'dist/public/route-manifest.json'), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const key = value => value.replace(/\/+$/, '') || '/';
const origin = 'http://127.0.0.1:4261';
await mkdir(path.join(output, 'new-restored'), { recursive: true });
const server = spawn(process.execPath, [path.join(root, 'scripts/serve-seo.mjs')], { env: { ...process.env, PORT: '4261' }, stdio: ['ignore', 'pipe', 'pipe'] });
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const parser = await browser.newPage();
const rows = [];
const rendered = [];
const failures = [];
let originalRenderedReview;
try {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`HTTP handler exited ${code}`))); });
  for (const source of before.rows) {
    const sourceURL = new URL(source.url);
    const metadata = inventory.find(page => page.key === key(sourceURL.pathname));
    const response = await fetch(origin + sourceURL.pathname + sourceURL.search);
    const bytes = Buffer.from(await response.arrayBuffer());
    const file = `new-restored/${source.key}.html`;
    await writeFile(path.join(output, file), bytes);
    const target = /html/.test(response.headers.get('content-type') ?? '') ? await parser.evaluate(extractDocument, { html: bytes.toString('utf8'), url: response.url, side: 'new' }) : null;
    let original;
    if (source.original?.document) {
      const hop = source.original.hops.at(-1);
      const raw = await readFile(path.join(output, hop.file));
      if (sha(raw) !== hop.sha256) throw new Error(`Original source integrity failure: ${hop.file}`);
      original = await parser.evaluate(extractDocument, { html: raw.toString('utf8'), url: source.original.finalURL, side: 'original' });
    }
    const noindex = /noindex/.test(response.headers.get('x-robots-tag') ?? '');
    const bodyIdentical = original && target ? original.body === target.body : false;
    const revision = amendments.pages[metadata?.key];
    let authorizedBody = original?.body;
    if (revision && original) for (const change of amendments.changes.filter(change => change.path === metadata.path)) {
      const expression = new RegExp(change.before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'), 'g');
      if ([...authorizedBody.matchAll(expression)].length !== 1) throw new Error(`Ambiguous authorized source delta: ${metadata.path} #${change.claim}`);
      authorizedBody = authorizedBody.replace(expression, () => change.after);
    }
    const authorizedBodyIdentical = Boolean(revision && target && authorizedBody === target.body);
    const titleIdentical = original && target ? original.h1[0] === target.h1[0] : false;
    const result = {
      url: source.url, path: sourceURL.pathname, state: metadata?.state ?? 'not-a-restored-editorial-page', kind: metadata?.kind,
      status: response.status, destination: response.url, canonical: target?.canonical,
      editorialCorrection: Boolean(revision), authorizedBodyIdentical, authorizedBodySHA256: revision && authorizedBody ? sha(authorizedBody) : null,
      originalFile: source.original?.hops.at(-1)?.file, originalSHA256: source.original?.hops.at(-1)?.sha256,
      servedFile: file, servedSHA256: sha(bytes), originalBodySHA256: original ? sha(original.body) : null,
      servedBodySHA256: target ? sha(target.body) : null, bodyIdentical, titleIdentical, noindex,
      htmlTitleIdentical: original && target ? original.title === target.title : false,
      originalTitle: original?.title, servedTitle: target?.title,
      originalHeadings: original?.headings, servedHeadings: target?.headings,
      originalLinks: original?.links, servedLinks: target?.links,
      originalImages: original?.images, servedImages: target?.images,
      originalAttachments: original?.attachments, servedAttachments: target?.attachments,
    };
    rows.push(result);
    if (!noindex) failures.push({ url: source.url, check: 'noindex missing' });
    if (metadata?.state === 'restored' && (response.status !== 200 || !bodyIdentical || !titleIdentical || !result.htmlTitleIdentical)) failures.push({ url: source.url, check: 'restored HTTP title/body/status', status: response.status, titleIdentical, htmlTitleIdentical: result.htmlTitleIdentical, bodyIdentical, originalStart: original?.body.slice(0, 150), servedStart: target?.body.slice(0, 150) });
    if (metadata?.state === 'awaiting-confirmation' && metadata.kind === 'article') {
      const alternates = target?.alternates ?? [];
      if (response.status !== 200 || !(revision ? authorizedBodyIdentical : bodyIdentical) || !titleIdentical || !result.htmlTitleIdentical || !noindex || target?.canonical !== new URL(metadata.path, manifest.origin).href || alternates.length || !bytes.toString('utf8').includes('data-editorial-state="review-pending"')) {
        failures.push({ url: source.url, check: 'unreviewed article must serve full original, self-canonical, noindex and without hreflang', status: response.status, bodyIdentical, titleIdentical, htmlTitleIdentical: result.htmlTitleIdentical, canonical: target?.canonical, hreflangCount: alternates.length });
      }
    }
    if (revision && (response.status !== 200 || !authorizedBodyIdentical || !titleIdentical || !result.htmlTitleIdentical)) failures.push({ url: source.url, check: 'Only explicit owner-authorized editorial deltas may differ from the independently acquired original', status: response.status, authorizedBodyIdentical });
    if (metadata?.state === 'awaiting-confirmation' && metadata.kind !== 'article' && !revision && response.status !== 503) failures.push({ url: source.url, check: 'non-article holding response must be temporary 503', status: response.status });
  }
  if (!failures.length && !process.argv.includes('--http-only')) {
    const cases = inventory.filter(page => page.kind === 'article' || (page.state === 'restored' && page.family === '/'));
    for (const sample of cases) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', event => { if (event.type() === 'error' && /hydrat|mismatch|React error/i.test(event.text())) errors.push(event.text()); });
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      try {
        await page.goto(origin + sample.path, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true', { timeout: 20000 });
        const actual = await page.evaluate(extractDocument, { html: await page.content(), url: page.url(), side: 'new' });
        const expected = rows.find(row => key(new URL(row.url).pathname) === sample.key);
        const result = { path: sample.path, locale: sample.locale, bodyIdentical: sha(actual.body) === expected.originalBodySHA256, authorizedBodyIdentical: Boolean(expected.authorizedBodySHA256 && sha(actual.body) === expected.authorizedBodySHA256), titleIdentical: actual.h1[0] === sample.h1, errors, overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), navigationMs: await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd) };
        rendered.push(result);
        if (!(result.bodyIdentical || result.authorizedBodyIdentical) || !result.titleIdentical || errors.length || result.overflow) failures.push({ path: sample.path, check: 'hydrated mobile content', ...result });
      } catch (error) { failures.push({ path: sample.path, check: 'hydration run', error: String(error) }); }
      await page.close();
    }
    // Read-only public widget check: no form submission, no consent clicks, no
    // credentials. An HTTP body alone cannot prove the absence of CMS reviews.
    const original = await browser.newPage();
    try {
      await original.goto('https://www.marenettobuild.com/recensioni/', { waitUntil: 'domcontentloaded', timeout: 25000 });
      await original.waitForTimeout(1500);
      const html = await original.content();
      await writeFile(path.join(output, 'original-reviews-rendered.html'), html);
      const document = await original.evaluate(extractDocument, { html, url: original.url(), side: 'original' });
      const old = before.rows.find(row => row.url === 'https://www.marenettobuild.com/recensioni/');
      originalRenderedReview = { url: original.url(), body: document.body, bodySHA256: sha(document.body), matchesHTTP: document.body === old.original.document.body, note: 'Single read-only sample, not certification of every external CMS widget or every locale.', file: 'original-reviews-rendered.html' };
    } catch (error) { originalRenderedReview = { error: String(error), missing: 'Rendered public CMS review widget remains unverified; requires published export or reachable rendered view.' }; }
    await original.close();
  }
} finally { server.kill(); await browser.close(); }
const uniqueRestored = inventory.filter(page => page.state === 'restored');
const result = {
  createdAt: new Date().toISOString(), appCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  workingTreeDiffSHA256: sha(execFileSync('git', ['diff', '--', 'artifacts/marenetto-build'], { cwd: root })),
  checkedURLs: rows.length, restoredPaths: uniqueRestored.length,
  faithfulRawURLCases: rows.filter(row => row.state === 'restored' && row.bodyIdentical && row.titleIdentical && row.status === 200).length,
  exactArticleURLCases: rows.filter(row => row.kind === 'article' && row.bodyIdentical && row.titleIdentical && row.htmlTitleIdentical && row.status === 200).length,
  temporaryHoldingPaths: Object.keys(manifest.heldPages).length,
  previewCorrectedPaths: Object.keys(amendments.pages).length,
  authorizedCorrectionCases: rows.filter(row => row.editorialCorrection && row.authorizedBodyIdentical).length,
  pendingArticlePaths: inventory.filter(page => page.state === 'awaiting-confirmation' && page.kind === 'article').length,
  restoredArticlePaths: uniqueRestored.filter(page => page.kind === 'article').length,
  restoredItalianArticleFamilies: uniqueRestored.filter(page => page.kind === 'article' && page.locale === 'it').length,
  availableOriginalArticlePaths: inventory.filter(page => page.kind === 'article' && (page.state === 'restored' || page.state === 'awaiting-confirmation')).length,
  renderedCases: rendered.length, rendered, failures, rows, originalRenderedReview,
  futureSitemapCount: (await readFile(path.join(root, 'dist/public/sitemap.xml'), 'utf8')).match(/<loc>/g)?.length ?? 0,
  heldFeeds: Object.keys(manifest.heldFeeds ?? {}), mediaLimit: 'Reference URLs/attributes preserved where in captured HTML, including inline backgrounds. Image bytes, licenses, external CSS-only assets and all third-party widgets are not certified.',
  performanceLimit: 'Navigation timings are controlled mobile-viewport lab samples with external resources blocked, not field CWVs or INP.',
};
await writeFile(path.join(output, 'restoration-verification.json'), JSON.stringify(result, null, 2));
const columns = ['url','state','status','destination','canonical','bodyIdentical','editorialCorrection','authorizedBodyIdentical','titleIdentical','noindex','originalFile','originalSHA256','servedFile','servedSHA256','originalBodySHA256','authorizedBodySHA256','servedBodySHA256'];
const cell = value => `"${String(value ?? '').replaceAll('"','""')}"`;
await writeFile(path.join(output, 'restoration-url-ledger.csv'), [columns.join(','), ...rows.map(row => columns.map(column => cell(row[column])).join(','))].join('\n'));
console.log(JSON.stringify({ restoredPaths: result.restoredPaths, faithfulRawURLCases: result.faithfulRawURLCases, renderedCases: rendered.length, heldPaths: result.temporaryHoldingPaths, failures, originalRenderedReview }, null, 2));
if (failures.length) process.exitCode = 1;
