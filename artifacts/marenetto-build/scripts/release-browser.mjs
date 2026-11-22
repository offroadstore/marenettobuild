import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { APPROVED_LOCALES, publicEditions, PUBLIC_ORIGIN } from './public-release.mjs';

const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json', import.meta.url)));
const entries = publicEditions(manifest);
const topology = await editorialTopology({ publicIndexing: true });
const browser = await chromium.launch({
  ...(existsSync('/repl/tools/bin/chromium') ? { executablePath: '/repl/tools/bin/chromium' } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const report = { scope: 'Isolated candidate on virtual WWW; no production mutations or SMTP', pages: [], forms: [], errors: [], realFormRequests: 0 };
try {
  const context = await browser.newContext();
  let submitted = [];
  await context.route(PUBLIC_ORIGIN + '/**', async route => {
    try {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === '/api/project-requests') {
        assert.equal(request.method(), 'POST');
        submitted.push(request.postDataJSON());
        await route.fulfill({
          status: submitted.length === 1 ? 503 : 201, contentType: 'application/json',
          body: JSON.stringify(submitted.length === 1 ? { error: 'isolated failure' } :
            { code: 'SYNTHETIC-RELEASE-ONLY', status: 'received', notificationStatus: 'isolated_test', isSynthetic: true }),
        });
        return;
      }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        await route.fulfill({ status: 204, body: '' }); return;
      }
      const realReadOnlyApi = url.pathname.startsWith('/api/') && url.pathname !== '/api/editorial/active';
      const response = await route.fetch({
        url: (realReadOnlyApi ? 'http://localhost:80' : topology.origin) + url.pathname + url.search,
        headers: { ...request.headers(), 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' },
        maxRedirects: 0,
      });
      await route.fulfill({ response });
    } catch (error) {
      if (!/closed|disposed/i.test(error.message)) report.errors.push({ scope: 'transport', message: error.message });
      await route.abort().catch(() => {});
    }
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push({ scope: 'page', message: error.message }));
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  async function open(path) {
    await page.goto(PUBLIC_ORIGIN + path, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  }
  const sampled = new Set([
    ...[...APPROVED_LOCALES].map(locale => entries.find(e => e.locale === locale && e.id === 'home')?.path),
    ...['services', 'articles', 'request'].map(id => entries.find(e => e.locale === 'it' && e.id === id)?.path),
    entries.find(e => e.kind === 'article')?.path,
  ].filter(Boolean));
  for (const path of sampled) {
    await open(path);
    const actual = await page.evaluate(() => ({
      title: document.title,
      robots: document.querySelector('meta[name="robots"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      og: document.querySelector('meta[property="og:url"]')?.content,
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(e => e.href),
    }));
    assert.equal(actual.robots, 'index, follow', path);
    assert.equal(actual.canonical, PUBLIC_ORIGIN + path, path);
    assert.equal(actual.og, PUBLIC_ORIGIN + path, path);
    assert.ok(actual.alternates.every(href => entries.some(e => PUBLIC_ORIGIN + e.path === href)), path);
    report.pages.push({ path, ...actual });
  }
  // Error/duplicate documents also retain the release capability marker, so
  // navigating back to an actual public page can restore the correct metadata.
  await open('/en/guides');
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
  await page.getByTestId('link-logo').click();
  await page.waitForURL(PUBLIC_ORIGIN + '/en/');
  await page.waitForFunction(() => document.querySelector('meta[name="robots"]')?.content === 'index, follow');
  for (const locale of process.argv.includes('--metadata-only') ? [] : APPROVED_LOCALES) {
    const edition = entries.find(e => e.locale === locale && e.id === 'request');
    submitted = [];
    await open(edition.path);
    for (const select of await page.locator('form select[required]').all()) await select.selectOption({ index: 1 });
    await page.getByTestId('input-name').fill('Synthetic Release Test');
    await page.getByTestId('input-email').fill('synthetic@example.invalid');
    await page.getByTestId('input-location').fill('Cefalù — synthetic fixture');
    await page.getByTestId('input-message').fill('Synthetic isolated release verification. No real request and no notification.');
    await page.locator('form input[type="checkbox"][required]').check();
    await page.getByTestId('button-review').click();
    await page.getByTestId('button-submit').click();
    await page.getByTestId('status-error').waitFor({ state: 'visible' });
    assert.equal(await page.getByTestId('input-name').inputValue(), 'Synthetic Release Test');
    await page.getByTestId('button-submit').click();
    await page.locator('.success-code').waitFor();
    assert.equal(await page.locator('.success-code').textContent(), 'SYNTHETIC-RELEASE-ONLY');
    assert.equal(submitted.length, 2);
    assert.equal(submitted[0].idempotencyKey, submitted[1].idempotencyKey);
    report.forms.push({ locale, errorPreservedData: true, retryReusedIdempotencyKey: true });
  }
  // Expected intercepted 503 responses produce resource-error console entries.
  report.consoleErrors = consoleErrors.filter(message => !/503 \(Service Unavailable\)/.test(message));
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  assert.equal(report.consoleErrors.length, 0, JSON.stringify(report.consoleErrors));
} finally {
  await browser.close();
  await topology.close();
  const directory = new URL('../../../generated-artifacts/seo-audit/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL(process.argv.includes('--metadata-only') ? 'release-browser-metadata.json' : 'release-browser.json', directory), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ pages: report.pages.length, forms: report.forms.length, errors: report.errors, consoleErrors: report.consoleErrors, realFormRequests: 0 }));
}
