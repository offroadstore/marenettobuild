import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { openPage, originals, projectRoot, sourceDocument } from './source-fixtures';

const nativeArticles = originals.filter(row => row.locale === 'it' && row.kind === 'article');
const manifest = () => JSON.parse(readFileSync(resolve(projectRoot, 'dist/public/route-manifest.json'), 'utf8'));
const key = (path: string) => path.replace(/\/+$/, '') || '/';

test('the recovered inventory contains 14 original articles in each of nine source languages', () => {
  expect(nativeArticles).toHaveLength(14);
  const articles = originals.filter(row => row.kind === 'article');
  expect(articles).toHaveLength(126);
  for (const locale of new Set(articles.map(row => row.locale))) {
    expect(articles.filter(row => row.locale === locale)).toHaveLength(14);
  }
});

for (const article of nativeArticles) {
  test(`${article.path} preserves its original title, complete body and editorial state`, async ({ page }) => {
    await openPage(page, article.path);
    await expect(page).toHaveURL(url => url.pathname === article.path);
    await expect(page.locator('main h1')).toHaveText(article.h1);
    const body = page.locator('article[data-historical-body]');
    await expect(body).toHaveAttribute('lang', article.contentLanguage);
    expect((await body.innerText()).trim().length).toBeGreaterThan(100);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${article.path}$`));
    if (article.state === 'awaiting-confirmation') await expect(body).toHaveAttribute('data-editorial-state', 'review-pending');
    const source = sourceDocument(article);
    if (source.image) await expect(page.locator('.historical-cover')).toHaveAttribute('src', source.image);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('link[hreflang]')).toHaveCount(0);
  });
}

test('canonical slash, fragments and only permitted campaign fields agree in HTTP and SPA navigation', async ({ page }) => {
  test.setTimeout(90_000);
  for (const article of nativeArticles) {
    const source = `${article.key}?utm_source=legacy&utm_campaign=autunno&email=private%40example.test&gclid=excluded#preventivi`;
    await openPage(page, source);
    await expect(page).toHaveURL(url => url.pathname === article.path && url.search === '?utm_source=legacy&utm_campaign=autunno' && url.hash === '#preventivi');
    await openPage(page, '/');
    await page.evaluate(target => {
      history.pushState({}, '', target);
      dispatchEvent(new PopStateEvent('popstate'));
    }, source);
    await expect(page).toHaveURL(url => url.pathname === article.path && url.search === '?utm_source=legacy&utm_campaign=autunno' && url.hash === '#preventivi');
    await page.goBack();
    await expect(page).toHaveURL(url => url.pathname === '/');
  }
});

test('retired app article prefixes resolve to native source editions, also after client navigation', async ({ page }) => {
  test.setTimeout(90_000);
  const representatives = [...new Map(originals.filter(row => row.kind === 'article' && row.locale !== 'it').map(row => [row.locale, row])).values()];
  for (const article of representatives) {
    const alias = `/${article.locale}/articles/${article.family.slice(1)}?utm_source=alias&email=private%40example.test#body`;
    await openPage(page, alias);
    await expect(page).toHaveURL(url => url.pathname === article.path && url.search === '?utm_source=alias' && url.hash === '#body');
    await openPage(page, '/');
    await page.evaluate(target => { history.pushState({}, '', target); dispatchEvent(new PopStateEvent('popstate')); }, alias);
    await expect(page).toHaveURL(url => url.pathname === article.path && url.search === '?utm_source=alias' && url.hash === '#body');
    await expect(page.locator('main h1')).toHaveText(article.h1);
  }
});

test('native archive retains all 14 source article links and carries campaign context to article and request', async ({ page }) => {
  await openPage(page, '/articoli/?utm_source=archive&utm_campaign=originals&email=private%40example.test');
  for (const article of nativeArticles) {
    expect(await page.locator(`main a[href="${article.path}"]`).count(), article.path).toBeGreaterThan(0);
  }
  const article = nativeArticles[0];
  await page.locator(`main a[href="${article.path}"]`).first().click();
  await expect(page).toHaveURL(url => url.pathname === article.path && url.search === '?utm_source=archive&utm_campaign=originals');
  await page.getByTestId('nav-request').click();
  await expect(page).toHaveURL(url => url.pathname === '/richiesta' && url.search === '?utm_source=archive&utm_campaign=originals');
  await expect(page.locator('form')).toBeVisible();
});

test('search, empty results and reset still work with source article destinations', async ({ page }) => {
  await openPage(page, '/ricerca');
  const input = page.getByTestId('input-search');
  await input.fill('infiltrazioni');
  const result = page.getByTestId('card-search-ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni');
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('href', '/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/');
  await expect(page.getByTestId('text-result-count')).toContainText('1 risultato');
  await input.fill('termine-che-non-esiste-987654');
  await expect(page.getByTestId('state-empty-search')).toBeVisible();
  await page.getByTestId('button-reset-search').click();
  await expect(page.getByTestId('text-result-count')).toHaveText('14 articoli disponibili');
});

test('source internal links resolve through the explicit HTTP inventory, including declared temporary holds', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-preview', 'HTTP statuses belong to the prepared delivery handler, not Vite fallback.');
  test.setTimeout(120_000);
  const m = manifest();
  const targets = new Set<string>();
  for (const original of originals.filter(row => ['it', 'en'].includes(row.locale) && (row.state === 'restored' || row.kind === 'article'))) {
    for (const match of sourceDocument(original).html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(match[1].replaceAll('&amp;', '&'), 'https://preview.invalid');
      if (url.origin === 'https://preview.invalid') targets.add(url.pathname);
    }
  }
  const results = [];
  for (const target of targets) {
    const response = await request.get(target);
    const finalPath = new URL(response.url()).pathname;
    const holding = m.heldPages[key(finalPath)] || m.heldFeeds[key(finalPath)];
    expect(response.status(), target).toBe(holding ? 503 : 200);
    if (holding) expect(response.headers()['retry-after'], target).toBe('86400');
    results.push({ sourceTarget: target, finalPath, status: response.status(), editorialHold: !!holding });
  }
  const output = resolve(projectRoot, '../../generated-artifacts/seo-audit');
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, 'internal-link-results.json'), JSON.stringify({ results, scope: 'All native internal links from recovered Italian and English bodies; temporary holds are not public approval.' }, null, 2));
});

test('explicit Italian URL remains authoritative over the browser language', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();
  await page.goto(`${baseURL}/fr/`, { waitUntil: 'domcontentloaded' });
  await page.locator('footer a', { hasText: /Italien|Italiano/ }).last().click();
  await expect(page).toHaveURL(url => url.pathname === '/');
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1')).toHaveText(originals.find(row => row.path === '/')!.h1);
  expect(new URL(page.url()).pathname).toBe('/');
  await context.close();
});
