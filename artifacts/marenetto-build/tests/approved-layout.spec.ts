import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const evidence = resolve(import.meta.dirname, '../../../generated-artifacts/layout-approved/after');

for (const width of [390, 580, 699, 700, 768, 1000, 1100, 1440, 1920]) {
  test(`approved composition and unchanged logo geometry at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('main h1')).toHaveText('Costruzioni e ristrutturazioni a Cefalù.');
    await page.evaluate(() => document.fonts.ready);
    const headerHeight = width < 700 ? 32 : width < 1100 ? 38 : 43;
    for (const [selector, height, expectedWidth] of [
      ['.topbar .mb-logo', headerHeight, headerHeight === 32 ? 170.421875 : headerHeight === 38 ? 202.390625 : 229.015625],
      ['.footer-logo-band .mb-logo', 38, 202.390625],
    ] as const) {
      const box = await page.locator(selector).boundingBox();
      expect(box?.height).toBe(height);
      expect(box?.width).toBe(expectedWidth);
      await expect(page.locator(`${selector} .mb-logo__bar`)).toHaveCSS('background-color', 'rgb(36, 70, 86)');
      await expect(page.locator(`${selector} img`).first()).toHaveAttribute('src', /brand\/current-logo\.png$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator('.mbh-h1')).toHaveCSS('font-family', /sans/i);
    await expect(page.locator('.mbh-hero__lead')).toHaveText('Diamo forma ai tuoi progetti, con cura e presenza sul posto.');
    await expect(page.locator('[data-testid="illustration-note"]')).toHaveCount(1);
    await expect(page.locator('footer [data-testid="illustration-note"]')).toHaveText('Immagini illustrative generate con IA; non rappresentano lavori eseguiti.');
    await expect(page.locator('footer [data-testid="illustration-note"]')).toHaveCSS('font-size', '13px');
    await expect(page.locator('main [data-testid="illustration-note"]')).toHaveCount(0);
    await expect(page.getByTestId('section-contact-strip')).toContainText('Il tuo progetto comincia da un confronto.');
    await expect(page.locator('main h1')).toHaveCount(1);
    const cards = page.locator('a.mbh-card');
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      expect(await card.getAttribute('href')).toMatch(/^\/servizi#(costruzioni|cura-proprieta|prima-acquisto)$/);
      await expect(card.locator('p, a, .mbh-num')).toHaveCount(0);
      const photo = await card.locator('figure').boundingBox();
      expect(photo!.width / photo!.height).toBeCloseTo(1.5, 2);
    }
    const hero = page.locator('.mbh-hero img');
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const current = await hero.evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(current).toContain('approved-hero-');
    expect(current.includes('-mobile-')).toBe(width < 700);
    await expect(hero).toHaveAttribute('loading', 'eager');
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    if (width >= 900) {
      await expect(page.locator('.nav-links a')).toHaveCount(3);
      await expect(page.getByTestId('button-menu')).toBeHidden();
    }
    if ([390, 768, 1440, 1920].includes(width) && testInfo.project.name === 'vite-development') {
      await mkdir(evidence, { recursive: true });
      // Trigger deferred images before documenting the complete page.
      for (const image of await page.locator('main img').all()) await image.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${evidence}/${width}.png`, fullPage: true });
      await page.screenshot({ path: `${evidence}/${width}-opening.png` });
    }
  });
}

// No RTL language (ar, he) has a preview catalog yet (src/localization/preview), so the RTL shell cannot be rendered in this preview.
for (const lang of ['it', 'en', 'de']) {
  test(`public layout, campaign and keyboard navigation ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const home = lang === 'it' ? '/' : `/${lang}/`;
    await page.goto(`${home}?utm_source=layout-check&utm_campaign=approved`);
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dir || 'ltr')).toBe('ltr');
    await expect(page.locator('.site-shell')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
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
    const card = page.getByTestId('card-service-01');
    await card.focus();
    await expect(card).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url => url.hash === '#costruzioni' && url.searchParams.get('utm_source') === 'layout-check');
    await expect(page.locator('#costruzioni')).toBeFocused();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBeGreaterThan(2);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
    await page.getByTestId('link-logo').click();
    await page.getByTestId('hero-request').click();
    await page.getByTestId('input-name').focus();
    await expect(bar).toHaveAttribute('data-hidden', 'true');
    await page.getByTestId('input-name').blur();
    await expect(bar).not.toHaveAttribute('data-hidden');
  });
}
