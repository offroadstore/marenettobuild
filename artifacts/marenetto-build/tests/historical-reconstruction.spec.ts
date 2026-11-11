import { expect, test } from '@playwright/test';
import { openPage, originals } from './source-fixtures';

test('all 14 recovered English articles retain their own URL, heading and complete language edition', async ({ page }) => {
  test.setTimeout(90_000);
  const articles = originals.filter(row => row.locale === 'en' && row.kind === 'article');
  expect(articles).toHaveLength(14);
  for (const article of articles) {
    await openPage(page, `${article.path}?utm_source=historic#article`);
    await expect(page).toHaveURL(url => url.pathname === article.path && url.searchParams.get('utm_source') === 'historic' && url.hash === '#article');
    await expect(page.locator('main h1')).toHaveText(article.h1);
    await expect(page.locator('article[data-historical-body]')).toHaveAttribute('lang', article.contentLanguage);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${article.path}$`));
    await expect(page.getByTestId('note-review-approved')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  }
});

test('recovered English navigation pages keep the native historical URL rather than obsolete aliases', async ({ page }) => {
  for (const original of originals.filter(row => row.locale === 'en' && row.state === 'restored' && row.kind !== 'article')) {
    await openPage(page, original.path);
    await expect(page).toHaveURL(url => url.pathname === original.path);
    await expect(page.locator('main h1')).toHaveText(original.h1);
  }
});

test('incomplete booking and unknown English pages remain excluded', async ({ page }) => {
  for (const path of ['/translation-ok/', '/en/translation-ok/', '/en/not-a-historical-page/']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    const status = path === '/translation-ok/' ? 410 : 404;
    expect(response?.status()).toBe(status);
    await expect(page.getByRole('heading', { name: new RegExp(`^${status}`) })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
  }
});
