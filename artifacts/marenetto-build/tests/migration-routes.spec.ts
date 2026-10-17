import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');
const report = readFileSync(resolve(projectRoot, 'MIGRATION_REPORT.md'), 'utf8');

type ArticleRoute = {
  slug: string;
  path: string;
  reviewStatus: 'technical-review' | 'editorial-review' | 'summary-reviewed';
};

const articleRoutes: ArticleRoute[] = report.split('\n').flatMap((line) => {
  const match = line.match(
    /^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*`(\/[^`]+)`(?:\s*\(also\s*`[^`]+`\))?\s*\|\s*[^|]+\|\s*(technical-review|editorial-review|summary-reviewed)\s*\|/,
  );
  return match
    ? [{ slug: match[1], path: match[2], reviewStatus: match[3] as ArticleRoute['reviewStatus'] }]
    : [];
});

const reportedRoutes = report.split('\n').flatMap((line) => {
  const match = line.match(/^\|\s*(\/[^|]+?)\s*\|\s*(\/[^|]+?)\s*(?:\(direct\))?\s*\|$/);
  return match ? [{ source: match[1].trim(), destination: match[2].trim() }] : [];
});

const reviewLabels: Record<ArticleRoute['reviewStatus'], string> = {
  'technical-review': 'In revisione tecnica',
  'editorial-review': 'In revisione editoriale',
  'summary-reviewed': 'Sintesi revisionata',
};

async function followClientSidePath(page: Page, path: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

async function expectReplaceNavigation(page: Page, source: string, destination: string) {
  await page.goto(source);
  await expect(page).toHaveURL(new RegExp(`${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
  await expect(page.locator('main h1').first()).toBeVisible();

  await page.goto('/');
  await followClientSidePath(page, source);
  await expect(page).toHaveURL(new RegExp(`${destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('rotte articoli dalla migrazione', () => {
  test('il report elenca tutti e soli i 14 percorsi attesi', async () => {
    expect(articleRoutes).toHaveLength(14);
    expect(new Set(articleRoutes.map(({ slug }) => slug)).size).toBe(14);
  });

  for (const article of articleRoutes) {
    test(`${article.path} mostra titolo, revisione e immagine funzionante`, async ({ page }) => {
      await page.goto('/articoli');
      const archiveCard = page.getByTestId(`card-archive-${article.slug}`);
      await expect(archiveCard).toBeVisible();
      const expectedTitle = (await archiveCard.locator('h3').textContent())?.trim();
      expect(expectedTitle).toBeTruthy();

      await page.goto(article.path);
      await expect(page).toHaveURL(new RegExp(`${article.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
      await expect(page.getByTestId('text-article-title')).toHaveText(expectedTitle!);
      await expect(page.getByTestId(`status-review-${article.slug}`)).toHaveText(reviewLabels[article.reviewStatus]);

      const image = page.getByTestId('img-article-hero');
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    });

    test(`${article.path}/ canonizza il percorso con replace`, async ({ page }) => {
      await expectReplaceNavigation(page, `${article.path}/`, article.path);
    });
  }
});

test.describe('redirect delle pagine storiche', () => {
  test('il report mantiene tutte le 11 mappature e le due route dirette', async () => {
    expect(reportedRoutes).toHaveLength(11);
    expect(reportedRoutes).toContainEqual({ source: '/articoli/', destination: '/articoli' });
    expect(reportedRoutes).toContainEqual({ source: '/contatti/', destination: '/contatti' });
  });

  for (const route of reportedRoutes) {
    test(`${route.source} porta a ${route.destination} e sostituisce la cronologia`, async ({ page }) => {
      await expectReplaceNavigation(page, route.source, route.destination);
    });
  }
});

test.describe('ricerca e filtri dell’archivio', () => {
  test('ricerca, risultato vuoto e reset sono funzionanti', async ({ page }) => {
    await page.goto('/ricerca');
    const input = page.getByTestId('input-search');
    await input.fill('infiltrazioni');
    await expect(page.getByTestId('card-search-ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni')).toBeVisible();
    await expect(page.getByTestId('text-result-count')).toContainText('1 risultato');

    await input.fill('termine-che-non-esiste-987654');
    await expect(page.getByTestId('state-empty-search')).toBeVisible();
    await expect(page.getByTestId('text-result-count')).toContainText('0 risultati');
    await page.getByTestId('button-reset-search').click();
    await expect(page.getByTestId('text-result-count')).toHaveText('14 articoli disponibili');
  });

  test('archivio mostra tutti gli articoli, filtra per categoria e ripristina il totale', async ({ page }) => {
    await page.goto('/articoli');
    await expect(page.getByTestId('text-archive-count')).toHaveText('14 articoli');
    await page.getByRole('tab', { name: 'Finiture e superfici' }).click();

    const cards = page.locator('[data-testid^="card-archive-"]');
    await expect(cards).toHaveCount(4);
    await expect(page.getByTestId('text-archive-count')).toHaveText('4 articoli');
    expect(await cards.evaluateAll((items) => items.every(
      (item) => item.querySelector('.lib-card-meta span')?.textContent?.trim() === 'Finiture e superfici',
    ))).toBe(true);

    await page.getByRole('tab', { name: 'Tutti' }).click();
    await expect(cards).toHaveCount(14);
    await expect(page.getByTestId('text-archive-count')).toHaveText('14 articoli');
  });
});
