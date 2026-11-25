/**
 * Finite, local-only HTTP/Lighthouse fixture for the staged SSR documents.
 * Client modules are deliberately removed: this measures initial HTML/CSS,
 * not hydration or interaction. It never changes the live release ledger.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../../generated-artifacts/network/candidate');
const audit = JSON.parse(await readFile(path.join(out, 'audit.json'), 'utf8'));
const documents = new Map();
for (const row of audit.results) {
  const html = (await readFile(path.join(out, 'html', row.outputFile), 'utf8'))
    .replace(/<script\b(?=[^>]*(?:type="module"|src=))[^>]*>[\s\S]*?<\/script>/g, '');
  documents.set(row.path.replace(/\/+$/, '') || '/', html);
}
const mime = { '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://fixture.invalid').pathname);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const doc = documents.get(pathname.replace(/\/+$/, '') || '/');
    if (doc) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(doc); return; }
    if (/^\/api\/(?:network-media|historical-media)\//.test(pathname)) {
      const r = await fetch(`http://localhost:80${pathname}`);
      res.statusCode = r.status;
      res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
      res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    for (const folder of ['dist/public', 'public']) {
      const base = path.join(root, folder);
      const full = path.resolve(base, '.' + pathname);
      if (!full.startsWith(base + path.sep)) continue;
      if (await stat(full).then(s => s.isFile()).catch(() => false)) {
        res.setHeader('Content-Type', mime[path.extname(full)] || 'application/octet-stream');
        res.end(await readFile(full)); return;
      }
    }
    res.statusCode = 404; res.end('Not part of the staged fixture');
  } catch { res.statusCode = 500; res.end('Fixture read failed'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  const results = [];
  for (const row of audit.results) {
    const r = await fetch(origin + row.path);
    const html = await r.text();
    assert.equal(r.status, 200, row.path);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, row.path);
    results.push({ path: row.path, locale: row.locale, status: r.status, noindex: r.headers.get('x-robots-tag'), canonical: html.match(/rel="canonical" href="([^"]+)"/)?.[1] });
  }
  await writeFile(path.join(out, 'http-results.json'), JSON.stringify({ at: new Date().toISOString(), environment: 'Temporary local-only staged SSR fixture; no client modules, not deployed', results }, null, 2));
  const targets = audit.results.filter(r =>
    r.locale === 'it' ||
    ['en', 'de', 'nl', 'fr'].includes(r.locale) && ['network-network', 'network-comfort', 'service-local'].includes(r.id));
  browser = await chromium.launch({ executablePath: execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim(), headless: true,
    args: ['--remote-debugging-port=9224', '--no-sandbox'] });
  const scores = [];
  for (const target of targets) {
    const url = origin + target.path;
    const result = await lighthouse(url, {
      port: 9224, onlyCategories: ['seo', 'accessibility'], output: 'json', logLevel: 'error', formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false },
      throttlingMethod: 'provided', maxWaitForLoad: 45000,
    });
    const lhr = result?.lhr;
    if (!lhr || lhr.runtimeError) throw new Error(`Lighthouse failed at ${target.path}: ${lhr?.runtimeError?.message}`);
    const failed = Object.values(lhr.audits).filter(a => a.score !== null && a.score < 1).map(a => ({ id: a.id, title: a.title, score: a.score, details: a.details }));
    await writeFile(path.join(out, `lighthouse-${target.locale}-${encodeURIComponent(target.id)}.json`), result.report);
    scores.push({ ...target, url, fetchTime: lhr.fetchTime, lighthouseVersion: lhr.lighthouseVersion, viewport: '390×844 mobile',
      environment: 'Staged SSR HTML/CSS only, client modules removed, deliberate noindex; not a full interaction audit',
      seo: lhr.categories.seo.score, accessibility: lhr.categories.accessibility.score, failed });
    await writeFile(path.join(out, 'lighthouse-coverage.json'), JSON.stringify({ auditScope: '12 Italian editorial pages, all 4 existing Italian service pages, and EN/DE/NL/FR pillar, comfort and local-service samples; initial HTML/CSS only', results: scores }, null, 2));
    console.log(`${target.locale} ${target.id}: SEO ${lhr.categories.seo.score}; accessibility ${lhr.categories.accessibility.score}`);
  }
  const readinessPath = path.join(root, 'src/content/network/readiness.json');
  const readiness = JSON.parse(await readFile(readinessPath, 'utf8'));
  assert.equal(readiness.state, 'ssr-verified-awaiting-http-audits');
  readiness.state = 'ready-for-owner-republish';
  readiness.finalChecks = {
    at: new Date().toISOString(), httpDocuments: results.length, httpPassed: results.length, lighthouseURLs: scores.length,
    seoScores: [...new Set(scores.map(s => s.seo))], accessibilityScores: [...new Set(scores.map(s => s.accessibility))],
    environment: 'Local-only staged SSR HTML/CSS, deliberate noindex; no new interaction tester',
  };
  await writeFile(readinessPath, JSON.stringify(readiness, null, 2) + '\n');
  console.log(`HTTP200: ${results.length}/${results.length} staged documents. Lighthouse: ${scores.length} URLs; no publication.`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
