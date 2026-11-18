import { expect, test } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const reportDir = path.resolve(root, '../../generated-artifacts/seo-audit');
test('ICU calendar hydration regression in bs mk be', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-preview');
  test.setTimeout(120_000);
  const manifest = JSON.parse(await readFile(path.join(root, 'dist/public/route-manifest.json'), 'utf8'));
  const paths = Object.keys(manifest.pages).filter(pathname => /^\/(?:bs|mk|be)\/$|^\/__localization-review\/(?:bs|mk|be)\/(?:home$|articles(?:\/|$)|search$)/.test(pathname));
  const errors: string[] = [];
  const results = [];
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`); });
  for (const pathname of paths) {
    await page.goto(pathname, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await expect(page.locator('h1')).toHaveCount(1);
    results.push({ path: pathname, hydrated: true, errorsSoFar: errors.length });
  }
  await mkdir(reportDir, { recursive: true });
  await writeFile(path.join(reportDir, 'rendered-recheck.json'), JSON.stringify({ reason: 'Original pass found 54 ICU-dependent date mismatches; dates now use original ISO calendar values.', results, errors }, null, 2));
  expect(errors).toEqual([]);
});

test('isolated synthetic forms keep data after errors and show a receipt', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-preview');
  test.setTimeout(120_000);
  const results = [];
  const matrix = JSON.parse(await readFile(path.join(reportDir, 'route-matrix.json'), 'utf8'));
  for (const locale of ['it', 'nl', 'pt', 'sv', 'no', 'da']) {
    const requests: Record<string, unknown>[] = [];
    await page.route('**/api/project-requests', async route => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({ status: requests.length === 1 ? 503 : 200, contentType: 'application/json',
        body: JSON.stringify(requests.length === 1 ? { error: 'synthetic isolated failure' } : { code: 'SYNTHETIC-SEO-ONLY', status: 'received', notificationStatus: 'isolated_test', isSynthetic: true }) });
    });
    const requestEdition = matrix.editions.find((edition: { locale: string; id: string; path: string }) => edition.locale === locale && edition.id === 'request' && !edition.path.startsWith('/__'));
    await page.goto(requestEdition.path, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    for (const select of await page.locator('form select[required]').all()) await select.selectOption({ index: 1 });
    await page.getByTestId('input-name').fill('Synthetic SEO Test');
    await page.getByTestId('input-email').fill('synthetic@example.test');
    await page.getByTestId('input-location').fill('Cefalù — prova sintetica');
    await page.getByTestId('input-message').fill('Richiesta sintetica isolata per controllo del modulo, senza dati personali reali.');
    await page.locator('form input[type="checkbox"][required]').check();
    await page.getByTestId('button-review').click();
    await page.getByTestId('button-submit').click();
    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('input-name')).toHaveValue('Synthetic SEO Test');
    await page.getByTestId('button-submit').click();
    await expect(page.locator('.success-code')).toHaveText('SYNTHETIC-SEO-ONLY');
    expect(requests).toHaveLength(2);
    expect(requests[0].idempotencyKey).toBe(requests[1].idempotencyKey);
    results.push({ locale, errorPreservedData: true, syntheticReceipt: true, realApiCalls: 0, realNotifications: 0 });
    await page.unroute('**/api/project-requests');
  }
  await writeFile(path.join(reportDir, 'isolated-form-results.json'), JSON.stringify({ scope: 'UI with intercepted responses; not SMTP or backend delivery verification', results }, null, 2));
});

test('all exposed editions hydrate without changing their main heading', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-preview', 'The complete inventory is tested against the actual prepared HTTP handler.');
  test.setTimeout(600_000);
  const manifest = JSON.parse(await readFile(path.join(root, 'dist/public/route-manifest.json'), 'utf8'));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const results = [];
  for (const pathname of Object.keys(manifest.pages)) {
    const response = await page.goto(pathname, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), pathname).toBe(200);
    const source = await response!.text();
    const initialHeading = await page.evaluate(html => new DOMParser().parseFromString(html, 'text/html').querySelector('h1')?.textContent, source);
    await expect(page.locator('h1'), pathname).toHaveCount(1);
    // Ensure the module has run and the catalog is loaded, not merely that HTML exists.
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    expect((await page.locator('h1').textContent())?.replace(/\s+/g, ' ').trim(), pathname).toBe(initialHeading?.replace(/\s+/g, ' ').trim());
    const canonicalCount = await page.locator('link[rel="canonical"]').count();
    expect(canonicalCount, pathname).toBe(1);
    if (/^\/(?:__localization-review\/)?(?:ar|he)\//.test(pathname)) {
      await expect(page.locator('.site-shell')).toHaveAttribute('dir', 'rtl');
    }
    results.push({ path: pathname, hydrated: true, headingStable: true, errorsSoFar: errors.length });
  }
  await mkdir(reportDir, { recursive: true });
  await writeFile(path.join(reportDir, 'rendered-results.json'), JSON.stringify({ results, errors }, null, 2));
  expect(errors).toEqual([]);
});

test('explicit Italian URL, keyboard language selection, RTL mobile geometry and laboratory metrics', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'production-preview');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await expect(page).toHaveURL(/\/$/);
  await page.getByTestId('link-language').click();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('link-language')).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.evaluate(() => ({
    navigation: performance.getEntriesByType('navigation').map(entry => entry.toJSON()),
    paint: performance.getEntriesByType('paint').map(entry => entry.toJSON()),
    resources: performance.getEntriesByType('resource').map(entry => entry.toJSON()),
    viewport: { width: innerWidth, scrollWidth: document.documentElement.scrollWidth },
  }));
  await mkdir(reportDir, { recursive: true });
  await writeFile(path.join(reportDir, 'lab-metrics.json'), JSON.stringify({ scope: 'Local Chromium, 390x844, no network/CPU throttling; not field CWV, INP not measured', metrics }, null, 2));
  for (const locale of ['ar', 'he']) {
    await page.goto(`/__localization-review/${locale}/home`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => Math.abs(document.documentElement.getBoundingClientRect().left))).toBeLessThanOrEqual(1);
    await expect(page.locator('.site-shell')).toHaveCSS('direction', 'rtl');
    await expect(page.getByTestId('link-footer-phone')).toHaveCSS('direction', 'ltr');
    await expect(page.locator('.mbh-hero img')).toHaveCSS('transform', 'none');
  }
});
