import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { inspect } from './global-seo-audit.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

// Production HTTP + real hydration, History navigation and the actual language
// menu. Isolated editorial API; no credentials, providers or mutations.
test('hero alt follows all twelve home locales without changing the rest of the image', { timeout: 180_000 }, async () => {
  const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json', import.meta.url)));
  const locales = ['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da'];
  const homes = locales.map(locale => Object.values(manifest.editions).find(entry => entry.id === 'home' && entry.locale === locale));
  assert.ok(homes.every(Boolean));
  const bundle = await build({
    entryPoints: [new URL('../src/content/image-descriptions.ts', import.meta.url).pathname],
    bundle: true, write: false, platform: 'node', format: 'esm',
  });
  const { heroDescription } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  const topology = await editorialTopology({ publicIndexing: true });
  let browser;
  const report = { at: new Date().toISOString(), method: 'Isolated candidate production HTTP and Chromium; no external traffic', homes: [], errors: [], hydrationWarnings: [], externalRequests: [] };
  const directory = new URL('../../../generated-artifacts/home-hero-alt/', import.meta.url);
  try {
    browser = await chromium.launch({
      ...(existsSync('/repl/tools/bin/chromium') ? { executablePath: '/repl/tools/bin/chromium' } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({
      locale: 'it-IT', viewport: { width: 1365, height: 900 },
      extraHTTPHeaders: { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' },
    });
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== topology.origin) {
        report.externalRequests.push(url.origin + url.pathname);
        return route.abort();
      }
      if (!['GET', 'HEAD'].includes(request.method())) return route.fulfill({ status: 405 });
      if (url.pathname === '/api/editorial/active') return route.fulfill({ json: [] });
      if (url.pathname.startsWith('/api/')) return route.fulfill({ json: { enabled: false, data: null, reviews: [] } });
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => {
      if (/hydration|hydrating|did not match|server rendered/i.test(message.text())) report.hydrationWarnings.push(message.text());
    });
    const image = page.locator('.mbh-hero img');
    const attributes = () => image.evaluate(img => Object.fromEntries([...img.attributes].map(attr => [attr.name, attr.value])));
    async function settled(home) {
      await page.waitForFunction(({ locale, expected }) =>
        document.documentElement.dataset.hydrated === 'true' &&
        document.documentElement.lang.split('-')[0] === locale &&
        document.querySelector('.mbh-hero img')?.getAttribute('alt') === expected,
      { locale: home.locale, expected: heroDescription(home.locale) });
      await page.waitForTimeout(40);
      assert.equal(await image.getAttribute('alt'), heroDescription(home.locale), home.path);
    }
    async function navigate(path) {
      await page.evaluate(path => {
        history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, path);
    }
    for (const home of homes) {
      const response = await fetch(topology.origin + home.path, { headers: { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' } });
      assert.equal(response.status, 200, home.path);
      const html = await response.text();
      const initial = inspect(html, home).images.filter(img => img.src.endsWith('/cefalu-hero-left-1672.jpg'));
      assert.equal(initial.length, 1);
      assert.equal(initial[0].alt, heroDescription(home.locale), home.path + ' initial HTTP');
      const initialAttributes = Object.fromEntries(Object.entries(initial[0]).map(([key, value]) => [key.toLowerCase(), value]));
      await page.goto(topology.origin + home.path, { waitUntil: 'domcontentloaded' });
      await settled(home);
      const hydrated = await attributes();
      assert.deepEqual(hydrated, initialAttributes, home.path + ' hydration must preserve every image attribute');
      await page.evaluate(() => { window.__heroAltNavigationMarker = 'same-document'; });
      const away = Object.values(manifest.editions).find(entry => entry.id === 'process' && entry.locale === home.locale);
      assert.ok(away, home.locale + ' process route');
      await navigate(away.path);
      await page.waitForFunction(() => !document.querySelector('.mbh-hero img'));
      await navigate(home.path);
      await settled(home);
      assert.deepEqual(await attributes(), initialAttributes, home.path + ' client return');
      assert.equal(await page.evaluate(() => window.__heroAltNavigationMarker), 'same-document');
      report.homes.push({ path: home.path, locale: home.locale, expected: heroDescription(home.locale), initial: initial[0].alt, hydrated: hydrated.alt, clientReturn: await image.getAttribute('alt') });
    }
    // From DA, switch to every language including IT, then back to DA.
    // The marker proves these are client transitions, not fresh documents.
    for (const home of homes) {
      await page.getByTestId('link-language').click();
      await page.locator(`[role="menuitem"][lang="${home.locale}"]`).click();
      await page.waitForURL(topology.origin + home.path);
      await settled(home);
      assert.equal(await page.evaluate(() => window.__heroAltNavigationMarker), 'same-document');
      const row = report.homes.find(row => row.locale === home.locale);
      row.languageChange = await image.getAttribute('alt');
    }
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.hydrationWarnings, []);
    assert.deepEqual(report.externalRequests, []);
    report.passed = true;
    await context.close();
  } finally {
    await browser?.close();
    await topology.close();
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('browser-regression.json', directory), JSON.stringify(report, null, 2));
  }
});
