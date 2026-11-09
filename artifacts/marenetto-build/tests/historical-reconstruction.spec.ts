import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const archive = JSON.parse(readFileSync(resolve(root, 'content/source-pages.json'), 'utf8'));
const links = [...archive.pages[0].markdown.matchAll(/#### \[([^\]]+)\]\(https:\/\/www\.marenettobuild\.com(\/en\/[^)]+)\)/g)];

test('all 14 archived English article links reach reviewed Italian articles', async ({ page }) => {
  test.setTimeout(90_000);
  expect(links).toHaveLength(14);
  for (const [, , source] of links) {
    await page.goto(`${source}?utm_source=historic&email=private%40example.test#article`);
    await expect(page.getByTestId('text-article-title')).toBeVisible();
    await expect(page).toHaveURL(url => !url.pathname.startsWith('/en/') && url.search === '?utm_source=historic' && url.hash === '#article');
    await expect(page.getByTestId('note-review-approved')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  }
});

test('documented English navigation aliases preserve the available content', async ({ page }) => {
  for (const [source, destination] of [
    ['/en/chi-siamo/', '/en/how-we-work'],
    ['/en/contatti/', '/en/contact'],
    ['/en/articoli/', '/articoli'],
    ['/en/general-contractor/', '/en/services'],
    ['/en/construction-and-renovations/', '/articoli'],
    ['/en/building-bonuses-and-permits/', '/guide'],
    ['/en/shipyards-and-construction/', '/servizi'],
    ['/en/outdoor-and-garden-design/', '/en/services'],
    ['/en/support-and-emergency-service/', '/en/contact'],
    ['/en/recensioni/', '/servizi'],
  ]) {
    await page.goto(source);
    await expect(page).toHaveURL(url => url.pathname === destination);
    await expect(page.locator('main h1')).toBeVisible();
  }
});

test('incomplete booking and unknown English pages remain excluded', async ({ page }) => {
  for (const path of ['/translation-ok/', '/en/translation-ok/', '/en/not-a-historical-page/']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: /^404/ })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
  }
});
