// Read-only served-page and screenshot evidence. Does not open forms or send enquiries.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const origin = process.env.MOTTO_PREVIEW_ORIGIN;
if (!origin) throw new Error('MOTTO_PREVIEW_ORIGIN is required.');
const root = new URL('../', import.meta.url);
const output = new URL('../../../generated-artifacts/brand-mottos/', import.meta.url);
await mkdir(output, { recursive: true });
const copy = JSON.parse(await readFile(new URL('src/content/brand-mottos.json', root), 'utf8'));
const pages = JSON.parse(await readFile(new URL('src/localization/public-pages.json', root), 'utf8'));
const locales = JSON.parse(await readFile(new URL('src/localization/locales.json', root), 'utf8'));
const browser = await chromium.launch({
  headless: true,
  ...(existsSync('/repl/tools/bin/chromium') ? { executablePath: '/repl/tools/bin/chromium' } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const evidence = [];
try {
  for (const locale of locales.filter(item => item.publication === 'published')) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: locale.code });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const pathname = pages[locale.code].home.path;
    const response = await page.goto(new URL(pathname, origin).href, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, pathname);
    const initial = await response.text();
    const before = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    }));
    const slogans = page.locator('[data-brand-motto="corporate"]');
    assert.equal(await slogans.count(), 2, pathname);
    assert.deepEqual(await slogans.allTextContents(), [copy[locale.code].corporate, copy[locale.code].corporate]);
    for (const placement of ['home', 'footer']) {
      assert.equal((initial.match(new RegExp(`data-motto-placement="${placement}"`, 'g')) ?? []).length, 1, pathname);
    }
    const geometry = await slogans.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { placement: node.dataset.mottoPlacement, left: rect.left, right: rect.right, width: rect.width,
        fontSize: getComputedStyle(node).fontSize, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth };
    }));
    for (const rect of geometry) {
      assert.ok(rect.left >= 0 && rect.right <= 391, `${pathname}: motto outside mobile viewport`);
      assert.ok(rect.scrollWidth <= rect.clientWidth + 1, `${pathname}: motto overflow`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, pathname);
    assert.deepEqual(errors, [], pathname);
    evidence.push({ locale: locale.code, path: pathname, status: response.status(), ssrOccurrences: 2,
      hydratedOccurrences: 2, text: copy[locale.code].corporate, geometry, metadata: before, pageErrors: errors });
    if (['it', 'de', 'fr'].includes(locale.code)) {
      for (const [name, viewport] of Object.entries({ mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 1000 } })) {
        await page.setViewportSize(viewport);
        await page.locator('.mbh-hero').screenshot({ path: new URL(`${locale.code}-hero-${name}.png`, output).pathname });
        await page.locator('.footer-logo-band').screenshot({ path: new URL(`${locale.code}-footer-${name}.png`, output).pathname });
      }
    }
    await context.close();
  }
  const blocked = await fetch(new URL('/ar/', origin));
  assert.equal(blocked.status, 404);
  assert.doesNotMatch(await blocked.text(), /data-brand-motto/);
  await writeFile(new URL('served-evidence.json', output), JSON.stringify({ evidence, arabic: '404; not activated' }, null, 2));
  console.log(`Verified SSR/client text and mobile geometry in ${evidence.length} active languages; saved hero/footer screenshots in IT, DE, FR.`);
} finally {
  await browser.close();
}
