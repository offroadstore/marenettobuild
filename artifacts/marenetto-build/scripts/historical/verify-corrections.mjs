import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '../..');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const amendments = await read('content/historical-corrections.applied.json');
const routes = await read('dist/public/route-manifest.json');
const sha = text => createHash('sha256').update(text).digest('hex');
const originalCatalogs = Object.fromEntries(await Promise.all([...new Set(Object.values(amendments.pages).map(page => page.locale))].map(async locale => [locale, await read(`src/content/historical/${locale}.json`)])));
const server = spawn(process.execPath, [path.join(root, 'scripts/serve-seo.mjs')], { env: { ...process.env, PORT: '4264' }, stdio: ['ignore', 'pipe', 'inherit'] });
const origin = 'http://127.0.0.1:4264';
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = [], errors = [];
try {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`HTTP handler exited ${code}`))); });
  const parser = await browser.newPage();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', event => { if (event.type() === 'error' && /hydrat|mismatch|React error/i.test(event.text())) errors.push(event.text()); });
  for (const [key, revision] of Object.entries(amendments.pages)) {
    const original = originalCatalogs[revision.locale][key];
    if (sha(original.html) !== revision.originalHTMLSHA256) throw new Error(`Original changed: ${key}`);
    const changes = amendments.changes.filter(change => change.path === revision.path);
    const expected = await parser.evaluate(({ html, changes }) => {
      const parse = value => new DOMParser().parseFromString(value, 'text/html');
      const clean = text => text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      let expected = clean(parse(html).body.textContent);
      for (const change of changes) {
        const candidates = [...new Set([change.before, clean(parse(change.beforeHTML).body.textContent)])];
        let matched = false;
        for (const before of candidates) {
          const escaped = before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
          const expression = new RegExp(escaped, 'g');
          if ([...expected.matchAll(expression)].length !== 1) continue;
          expected = expected.replace(expression, () => change.after);
          matched = true;
          break;
        }
        if (!matched) throw new Error(`Ambiguous authorized source passage ${change.claim}: ${change.path}`);
      }
      return clean(expected);
    }, { html: original.html, changes });
    const response = await fetch(origin + revision.path);
    const html = await response.text();
    if (response.status !== 200 || response.headers.get('x-robots-tag') !== 'noindex, nofollow' || /hreflang=/.test(html)) throw new Error(`Unsafe preview response: ${revision.path}`);
    const initial = await parser.evaluate(html => {
      const d = new DOMParser().parseFromString(html, 'text/html');
      return { body: d.querySelector('[data-historical-body]')?.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(), h1: d.querySelector('main h1')?.textContent, lang: d.documentElement.lang };
    }, html);
    if (initial.body !== expected) throw new Error(`Unlisted change in HTTP body: ${revision.path}`);
    await page.goto(origin + revision.path, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    const rendered = await page.evaluate(() => ({
      body: document.querySelector('[data-historical-body]')?.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(),
      h1: document.querySelector('main h1')?.textContent, lang: document.documentElement.lang,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      contentLanguage: document.querySelector('[data-historical-body]')?.getAttribute('lang'),
      sourceLabel: Boolean(document.querySelector('[data-source-language="it"]')),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    if (rendered.body !== expected || rendered.h1 !== initial.h1 || rendered.lang !== initial.lang || rendered.contentLanguage !== revision.contentLanguage || rendered.canonical !== new URL(revision.path, routes.origin).href || rendered.overflow) throw new Error(`Hydration/body/metadata changed: ${revision.path}`);
    if (revision.locale !== 'it' && revision.contentLanguage === 'it' && !rendered.sourceLabel) throw new Error(`Italian source not labelled: ${revision.path}`);
    results.push({ path: revision.path, locale: revision.locale, status: 200, approvedDeltaOnly: true, originalHTMLSHA256: sha(original.html), servedBodySHA256: sha(expected), stableAfterHydration: true, overflow: false });
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
} finally { await browser.close(); server.kill('SIGTERM'); }
const output = path.resolve(root, '../../generated-artifacts/editorial-corrections');
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'verification.json'), JSON.stringify({ results, errors, sourceOriginalsChanged: false, missingCounterparts: amendments.missingCounterparts, publicationApproved: false }, null, 2));
console.log(JSON.stringify({ correctedPagesChecked: results.length, errors: errors.length, approvedDeltaOnly: true, originalArchiveUntouched: true, publicationApproved: false }));
