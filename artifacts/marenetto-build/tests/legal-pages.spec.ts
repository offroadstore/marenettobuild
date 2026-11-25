import { test, expect } from '@playwright/test';
import { noticeCopy, legalPath } from '../src/content/legal-notices';

test.use({ locale: 'en-US' });
test('legal links retain enquiry state, hydrate in Italian and remain available with analytics off', async ({ page, context }) => {
  const copy = noticeCopy.it!;
  let submissions = 0;
  const tracking: string[] = [];
  context.on('request', request => {
    if (/googletagmanager|google-analytics|_analytics-runtime/.test(request.url())) tracking.push(request.url());
  });
  await context.route('**/api/project-requests', async route => { submissions++; await route.abort(); });
  await page.goto('/richiesta');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  const name = page.locator('[data-testid="input-name"]');
  const email = page.locator('[data-testid="input-email"]');
  await name.fill('Verifica sintetica');
  await email.fill('legal-test@example.invalid');
  for (const checked of [false, true]) {
    await page.getByTestId('check-privacy').setChecked(checked);
    const link = page.getByTestId('request-privacy-link');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const popupPromise = page.waitForEvent('popup');
    await link.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/\/privacy$/);
    await expect(popup.locator('html')).toHaveAttribute('data-hydrated', 'true');
    await expect(popup.locator('html')).toHaveAttribute('lang', /^it/);
    await expect(popup.locator('h1')).toHaveText(copy.privacy);
    for (const paragraph of copy.privacyText) await expect(popup.locator('main')).toContainText(paragraph);
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await popup.close();
    await expect(name).toHaveValue('Verifica sintetica');
    await expect(email).toHaveValue('legal-test@example.invalid');
    expect(await page.getByTestId('check-privacy').isChecked()).toBe(checked);
    await expect(page).toHaveURL(/\/richiesta$/);
  }
  expect(submissions).toBe(0);
  await page.getByTestId('footer-legal-links').locator(`a[href="${legalPath('it', 'cookies')}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${legalPath('it', 'cookies')}$`));
  await expect(page.locator('h1')).toHaveText(copy.cookies);
  for (const paragraph of copy.cookieText) await expect(page.locator('main')).toContainText(paragraph);
  await expect(page.locator('footer')).toContainText(copy.footer);
  await expect(page.getByTestId('illustration-note').locator(`a[href="${legalPath('it', 'ai')}"]`)).toHaveCount(1);
  await page.getByTestId('cookie-preferences-link').click();
  await expect(page.getByTestId('analytics-accept')).toHaveCount(0);
  await expect(page.locator('#analytics-options a')).toHaveAttribute('href', legalPath('it', 'cookies'));
  await page.getByTestId('cookie-close').click();
  await page.getByTestId('footer-legal-links').locator(`a[href="${legalPath('it', 'privacy')}"]`).click();
  await expect(page.locator('h1')).toHaveText(copy.privacy);
  await expect(page.locator('html')).toHaveAttribute('lang', /^it/);
  expect(tracking).toEqual([]);
});
