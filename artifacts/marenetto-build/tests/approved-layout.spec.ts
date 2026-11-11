import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openPage, sourceHome } from './source-fixtures';

const evidence = resolve(import.meta.dirname, '../../../generated-artifacts/layout-approved/after');

for (const width of [390, 580, 699, 700, 768, 1000, 1100, 1440, 1920]) {
  test(`approved photographs and logo geometry with original home text at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await openPage(page, '/');
    await expect(page.locator('main h1')).toHaveText(sourceHome('it').h1);
    await page.evaluate(() => document.fonts.ready);
    const headerHeight = width < 700 ? 32 : width < 1100 ? 38 : 43;
    for (const [selector, height, expectedWidth] of [
      ['.topbar .mb-logo', headerHeight, headerHeight === 32 ? 170.421875 : headerHeight === 38 ? 202.390625 : 229.015625],
      ['.footer-logo-band .mb-logo', 38, 202.390625],
    ] as const) {
      const box = await page.locator(selector).boundingBox();
      expect(box?.height).toBeCloseTo(height, 1);
      expect(box?.width).toBeCloseTo(expectedWidth, 1);
      await expect(page.locator(`${selector} .mb-logo__bar`)).toHaveCSS('background-color', 'rgb(36, 70, 86)');
      await expect(page.locator(`${selector} img`).first()).toHaveAttribute('src', /brand\/current-logo\.png$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator('.mbh-h1')).toHaveCSS('font-family', /sans/i);
    await expect(page.locator('main [data-historical-body]')).toHaveAttribute('lang', 'it');
    await expect(page.locator('[data-testid="illustration-note"]')).toHaveCount(1);
    await expect(page.locator('footer [data-testid="illustration-note"]')).toHaveText('Immagini illustrative generate con IA; non rappresentano lavori eseguiti.');
    await expect(page.locator('footer [data-testid="illustration-note"]')).toHaveCSS('font-size', '13px');
    await expect(page.locator('main h1')).toHaveCount(1);
    const hero = page.locator('.mbh-hero img');
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const current = await hero.evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(current).toContain('approved-hero-');
    expect(current.includes('-mobile-')).toBe(width < 700);
    await expect(hero).toHaveAttribute('loading', 'eager');
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    if (width >= 900) {
      await expect(page.getByTestId('nav-articles')).toBeVisible();
      await expect(page.locator('#article-categories-desktop-it a')).toHaveCount(6);
      await expect(page.getByTestId('button-menu')).toBeHidden();
    }
    if ([390, 768, 1440, 1920].includes(width) && testInfo.project.name === 'vite-development') {
      await mkdir(evidence, { recursive: true });
      await page.screenshot({ path: `${evidence}/${width}-opening.png` });
    }
  });
}

for (const lang of ['it', 'en', 'de']) {
  test(`public layout, campaign and keyboard navigation ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const home = sourceHome(lang).path;
    await openPage(page, `${home}?utm_source=layout-check&utm_campaign=approved`);
    await expect(page.locator('main h1')).toHaveText(sourceHome(lang).h1);
    expect(await page.evaluate(() => document.documentElement.dir || 'ltr')).toBe('ltr');
    await expect(page.locator('.site-shell')).toHaveAttribute('dir', 'ltr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const logo = await page.getByTestId('link-logo').boundingBox();
    const language = await page.getByTestId('link-language').boundingBox();
    expect(Math.min(logo!.x + logo!.width, language!.x + language!.width) - Math.max(logo!.x, language!.x)).toBeLessThanOrEqual(0);
    const bar = page.getByTestId('mobile-contact-bar');
    await expect(bar).toBeVisible();
    await expect(page.getByTestId('cbar-call')).toHaveAttribute('href', 'tel:+393339363007');
    await expect(page.getByTestId('cbar-write')).toHaveAttribute('href', /^mailto:info@marenetto\.com/);
    for (const link of await bar.locator('a').all()) {
      const box = await link.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId('button-menu').focus();
    await page.keyboard.press('Enter');
    await expect(bar).toHaveAttribute('data-hidden', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('button-menu')).toBeFocused();
    await expect(bar).not.toHaveAttribute('data-hidden');
    await page.getByTestId('link-language').click();
    await expect(bar).toHaveAttribute('data-hidden', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('link-language')).toBeFocused();
    await page.getByTestId('button-menu').focus();
    await page.keyboard.press('Enter');
    const services = page.getByTestId('mobile-nav-services');
    const destination = new URL((await services.getAttribute('href'))!, page.url());
    await services.focus();
    await expect(services).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url => url.pathname === destination.pathname && url.searchParams.get('utm_source') === 'layout-check');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    await page.getByTestId('link-logo').click();
    await page.getByTestId('hero-request').click();
    await page.getByTestId('input-name').focus();
    await expect(bar).toHaveAttribute('data-hidden', 'true');
    await page.getByTestId('input-name').blur();
    await expect(bar).not.toHaveAttribute('data-hidden');
  });
}
