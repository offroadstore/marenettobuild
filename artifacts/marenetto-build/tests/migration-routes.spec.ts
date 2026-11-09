import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');
const report = readFileSync(resolve(projectRoot, 'MIGRATION_REPORT.md'), 'utf8');

type ArticleRoute = {
  slug: string;
  path: string;
  reviewStatus: 'technical-review' | 'editorial-review' | 'summary-reviewed' | 'documentary-review';
};

const articleRoutes: ArticleRoute[] = report.split('\n').flatMap((line) => {
  const match = line.match(
    /^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*`(\/[^`]+)`(?:\s*\(also\s*`[^`]+`\))?\s*\|\s*[^|]+\|\s*(technical-review|editorial-review|summary-reviewed|documentary-review)\s*\|/,
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
  'documentary-review': 'Testo integrale · fonti citate',
};
const campaignParamNames = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id']);

function campaignOnlySuffix(suffix: string) {
  const input = new URL(suffix, 'http://test.local');
  const approved = new URLSearchParams();
  input.searchParams.forEach((value, key) => {
    if (campaignParamNames.has(key) && !approved.has(key)) approved.append(key, value);
  });
  return `${approved.toString() ? `?${approved}` : ''}${input.hash}`;
}

const publicPagePaths = [
  '/',
  '/servizi',
  '/come-lavoriamo',
  '/proprietari-all-estero',
  '/richiesta',
  '/contatti',
  '/en/',
  '/en/services',
  '/en/how-we-work',
  '/en/owners-abroad',
  '/en/request',
  '/en/contact',
  '/articoli',
  '/guide',
  '/progetti',
  '/ricerca',
  ...articleRoutes.map(({ path }) => path),
];

async function followClientSidePath(page: Page, path: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

async function expectReplaceNavigation(page: Page, source: string, destination: string, suffix = '') {
  await page.goto(`${source}${suffix}`);
  const expectedUrl = new URL(`${destination}${campaignOnlySuffix(suffix)}`, page.url());
  const hasExpectedUrlParts = (url: URL) =>
    url.pathname === expectedUrl.pathname
    && JSON.stringify([...url.searchParams]) === JSON.stringify([...expectedUrl.searchParams])
    && url.hash === expectedUrl.hash;
  await expect(page).toHaveURL(hasExpectedUrlParts);
  await expect(page.locator('main h1').first()).toBeVisible();

  await page.goto('/');
  await followClientSidePath(page, `${source}${suffix}`);
  await expect(page).toHaveURL(hasExpectedUrlParts);
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

    const redirectCases = [
      { legacyPath: '/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto#contatti', destination: '/servizi' },
      { legacyPath: '/assistenza-e-pronto-intervento#contatti', destination: '/contatti' },
    ];
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    });

    test(`${article.path}/ canonizza il percorso con replace`, async ({ page }) => {
      await expectReplaceNavigation(
        page,
        `${article.path}/`,
        article.path,
        '?utm_source=legacy&utm_campaign=autunno%20build&utm_medium=email&utm_term=case_study&utm_content=historic&utm_id=campaign-2026&ref=storico&gclid=click-id&email=private%40example.test#preventivi',
      );
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
    // The empty portfolio remains retired; its historical URLs finish on services.
    const finalDestination = route.destination === '/progetti' ? '/servizi' : route.destination;
    test(`${route.source} conserva query e frammento su ${finalDestination} e sostituisce la cronologia`, async ({ page }) => {
      await expectReplaceNavigation(
        page,
        route.source,
        finalDestination,
        '?utm_source=legacy&utm_campaign=autunno%20build&utm_medium=email&utm_term=case_study&utm_content=historic&utm_id=campaign-2026&ref=storico&gclid=click-id&email=private%40example.test#preventivi',
      );
    });
  }

  test('il percorso storico fino alla richiesta conserva solo i parametri UTM approvati', async ({ page }) => {
    await page.goto('/assistenza-e-pronto-intervento?utm_source=legacy&utm_campaign=autunno%20build&utm_medium=email&ref=storico&gclid=click-id&email=private%40example.test#preventivi');
    const expectedCampaign = [
      ['utm_source', 'legacy'],
      ['utm_campaign', 'autunno build'],
      ['utm_medium', 'email'],
    ];
    await expect(page).toHaveURL((url) =>
      url.pathname === '/contatti'
      && JSON.stringify([...url.searchParams]) === JSON.stringify(expectedCampaign)
      && url.hash === '#preventivi',
    );
    await expect(page.locator('main h1').first()).toBeVisible();

    await page.getByTestId('link-contact-request').click();
    await expect(page).toHaveURL((url) =>
      url.pathname === '/richiesta'
      && JSON.stringify([...url.searchParams]) === JSON.stringify(expectedCampaign)
      && url.hash === '',
    );
  });

  test('i parametri UTM seguono anche i link dall’archivio articoli alla richiesta', async ({ page }) => {
    await page.goto('/edilizia-e-ristrutturazioni?utm_source=legacy&utm_campaign=autunno%20build&ref=storico&gclid=click-id');
    const expectedCampaign = [
      ['utm_source', 'legacy'],
      ['utm_campaign', 'autunno build'],
    ];
    await expect(page).toHaveURL((url) =>
      url.pathname === '/articoli'
      && JSON.stringify([...url.searchParams]) === JSON.stringify(expectedCampaign),
    );

    const article = articleRoutes[0];
    await page.getByTestId(`card-archive-${article.slug}`).click();
    await expect(page).toHaveURL((url) =>
      url.pathname === article.path
      && JSON.stringify([...url.searchParams]) === JSON.stringify(expectedCampaign),
    );

    await page.getByTestId('link-article-request').click();
    await expect(page).toHaveURL((url) =>
      url.pathname === '/richiesta'
      && JSON.stringify([...url.searchParams]) === JSON.stringify(expectedCampaign),
    );
  });
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

test.describe('integrità dei link delle pagine pubbliche', () => {
  test('ogni pagina pubblica e ogni link interno raggiungono una pagina valida', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });

    let appOrigin = '';
    const internalTargets = new Map<string, { source: string; label: string; href: string }>();

    for (const sourcePath of publicPagePaths) {
      const response = await page.goto(sourcePath, { waitUntil: 'domcontentloaded' });
      appOrigin ||= new URL(page.url()).origin;
      expect(response?.status(), `La pagina pubblica ${sourcePath} non è raggiungibile`).toBeLessThan(400);
      await expect(page.getByRole('heading', { name: '404 Page Not Found' }), `La pagina pubblica ${sourcePath} mostra una 404`).toHaveCount(0);
      await expect(page.locator('main h1').first(), `La pagina pubblica ${sourcePath} non mostra il titolo`).toBeVisible();

      const menuToggle = page.getByTestId('button-menu');
      if (await menuToggle.isVisible()) {
        await menuToggle.click();
      }

      const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
        anchors.map((anchor) => ({
          href: (anchor as HTMLAnchorElement).href,
          label: (anchor.textContent ?? '').trim().replace(/\s+/g, ' ') || (anchor as HTMLAnchorElement).getAttribute('aria-label') || 'link senza etichetta',
        })),
      );

      for (const { href, label } of hrefs) {
        const target = new URL(href, page.url());

    const pageErrors: string[] = [];
        if (target.origin !== appOrigin || !['http:', 'https:'].includes(target.protocol)) continue;
        const targetPath = `${target.pathname}${target.search}${target.hash}`;
        if (!internalTargets.has(targetPath)) {
          internalTargets.set(targetPath, { source: sourcePath, label, href: targetPath });
        }
      }
    }

    for (const target of internalTargets.values()) {
      const response = await page.goto(target.href, { waitUntil: 'domcontentloaded' });
      // Fragment-only navigation has no HTTP response: still verify destination
      // and visible content below instead of reading status from a null response.
      if (response) expect(response.status(), `Il link "${target.label}" in ${target.source} non è raggiungibile: ${target.href}`).toBeLessThan(400);
      await expect(
        page.getByRole('heading', { name: '404 Page Not Found' }),
        `Il link "${target.label}" in ${target.source} porta a una 404: ${target.href}`,
      ).toHaveCount(0);
      await expect(
        page.locator('main h1').first(),
        `Il link "${target.label}" in ${target.source} non mostra una pagina: ${target.href}`,
      ).toBeVisible();
    }
  });
});
