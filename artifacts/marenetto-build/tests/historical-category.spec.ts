import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { historicalArticleMenus } from '../src/content/historical-article-menu';
import { openPage, originals, projectRoot, sourceDocument } from './source-fixtures';

const categories = Object.values(historicalArticleMenus).flatMap(menu => menu.categories);
const samples = categories.filter(category => historicalArticleMenus.it.categories.some(c => c.path === category.path)
  || ['/en/general-contractor/', '/de/bau-und-renovierung/', '/ru/stroitelstvo-i-remont/', '/pl/projektowanie-przestrzeni-zewnetrznych-i-ogrodow/'].includes(category.path));
const evidence = resolve(projectRoot, '../../generated-artifacts/category-redesign');

for (const width of [390, 1440]) {
  test(`category layout and SSR before hydration at ${width}`, async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const category of samples) {
      const response = await page.goto(`${baseURL}${category.path}`);
      expect(response?.status(), category.path).toBe(200);
      const row = originals.find(p => p.path === category.path)!;
      await expect(page.locator('main h1')).toHaveText(row.h1);
      await expect(page.locator('[data-historical-category]')).toHaveAttribute('lang', row.contentLanguage);
      const nav = page.getByTestId('nav-category-switch');
      await expect(nav.locator('a')).toHaveCount(6);
      await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute('href', row.path);
      const source = sourceDocument(row).html;
      const count = [...source.matchAll(/<h4[^>]*>\s*<a\b/g)].length;
      await expect(page.locator('.mb-cat-card')).toHaveCount(count);
      await expect(page.locator('.mb-cat-results .mb-cat-aside')).toHaveCount(0);
      if (count === 0) await expect(page.getByTestId('status-category-empty')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('.mb-cat').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(247, 242, 232)');
      const titleSize = await page.locator('main h1').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      expect(titleSize).toBeGreaterThanOrEqual(34);
      if (testInfo.project.name === 'production-preview' && row.locale === 'it') {
        await mkdir(evidence, { recursive: true });
        // Load all real local photographs before full-page evidence is captured.
        await page.locator('.mb-cat img').evaluateAll(async imgs => {
          await Promise.all(imgs.map(img => { const image = img as HTMLImageElement; image.loading = 'eager'; return image.decode().catch(() => {}); }));
        });
        await page.screenshot({ path: resolve(evidence, `${row.family.slice(1)}-${width}-after.jpg`), fullPage: true });
      }
    }
    await context.close();
  });
}

test('category keyboard focus, campaigns and client navigation preserve native paths', async ({ page }) => {
  await openPage(page, '/general-contractor/?utm_source=category&utm_campaign=editorial&email=private%40example.test');
  const current = page.getByTestId('nav-category-switch').locator('a[aria-current="page"]');
  await current.focus();
  await expect(current).toBeFocused();
  expect(await current.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.getByTestId('link-category-edilizia-e-ristrutturazioni').click();
  await expect(page).toHaveURL(url => url.pathname === '/edilizia-e-ristrutturazioni/' && url.search === '?utm_source=category&utm_campaign=editorial');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.evaluate(() => { history.pushState({}, '', '/general-contractor/?utm_source=category'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.locator('.mb-cat-list--single')).toBeVisible();
  await page.getByTestId('link-category-article-0').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(url => url.pathname === '/gestione-manutenzione-immobile/' && url.search === '?utm_source=category');
  await expect(page.locator('[data-historical-category]')).toHaveCount(0);
});

test('general contractor and unchanged pages have same-viewport before/after evidence', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-preview', 'One set of release-build comparisons is sufficient');
  test.skip(process.env.CATEGORY_VISUAL_COMPARE !== '1', 'Opt-in comparison requires category-baseline.mjs output from the pre-redesign revision');
  test.setTimeout(90_000);
  await mkdir(evidence, { recursive: true });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const [name, path] of [['general-contractor', '/general-contractor/'], ['home', '/'], ['article', '/gestione-manutenzione-immobile/']] as const) {
      const baseline = await readFile(resolve(evidence, `${name}-baseline.html`), 'utf8');
      await page.route(`**${path}`, route => route.fulfill({ status: 200, contentType: 'text/html', body: baseline }));
      await page.goto(`${baseURL}${path}`);
      await page.locator('img').evaluateAll(async imgs => { await Promise.all(imgs.map(img => { const image = img as HTMLImageElement; image.loading = 'eager'; return image.decode().catch(() => {}); })); });
      await page.screenshot({ path: resolve(evidence, `${name}-${width}-before.jpg`), fullPage: true });
      const beforeGeometry = await page.locator('main').boundingBox();
      await page.unroute(`**${path}`);
      await page.goto(`${baseURL}${path}`);
      await page.locator('img').evaluateAll(async imgs => { await Promise.all(imgs.map(img => { const image = img as HTMLImageElement; image.loading = 'eager'; return image.decode().catch(() => {}); })); });
      await page.screenshot({ path: resolve(evidence, `${name}-${width}-after.jpg`), fullPage: true });
      if (name !== 'general-contractor') {
        await expect(page.locator('[data-historical-category]')).toHaveCount(0);
        const afterGeometry = await page.locator('main').boundingBox();
        expect(afterGeometry).toEqual(beforeGeometry);
      }
    }
    await context.close();
  }
});
