import { expect, test } from '@playwright/test';
import { openPage, sourceHome, pillarEdition } from './source-fixtures';

for (const locale of ['it', 'en']) {
  for (const width of [390, 768, 1440, 1920]) {
    test(`home ${locale} at ${width}px preserves hero and four useful commercial choices`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await openPage(page, sourceHome(locale).path);
      await expect(page.locator('main h1')).toHaveText(sourceHome(locale).h1);
      await expect(page.getByTestId('link-logo')).toBeVisible();
      await expect(page.getByTestId('link-language')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // Historical News was intentionally removed; article URLs remain in the archive.
      await expect(page.locator('main .mbx-card')).toHaveCount(0);
      for(const area of ['villas','outdoors','surfaces','investment'] as const) {
        await expect(page.locator(`main a[href="${pillarEdition(locale,area).path}"]`).first()).toBeVisible();
      }
      const hero = page.locator('.mbh-hero img');
      await expect.poll(() => hero.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      expect(await hero.evaluate((node: HTMLImageElement) => new URL(node.currentSrc).origin === location.origin)).toBe(true);
      expect(await hero.evaluate((node: HTMLImageElement) => node.currentSrc)).toContain('cefalu-hero-left-');
      await expect(hero).toHaveAttribute('width', '1672');
      await expect(hero).toHaveAttribute('height', '941');
      const menu = page.getByTestId('button-menu');
      const pillar= pillarEdition(locale,'villas').path;
      if (await menu.isVisible()) {
        await menu.click();
        await page.locator(`#mobile-nav a[href="${pillar}"]`).click();
      } else await page.locator(`.nav-links a[href="${pillar}"]`).click();
      await expect(page).toHaveURL(url => url.pathname === pillar);
      await page.getByTestId('link-logo').click();
      await page.getByTestId('link-language').click();
      const target = locale === 'it' ? 'en' : 'it';
      await page.locator(`.language-menu a[lang="${target}"]`).click();
      await expect(page).toHaveURL(url => url.pathname === sourceHome(target).path);
      await page.getByTestId('hero-request').click();
      await expect(page).toHaveURL(target === 'it' ? /\/richiesta$/ : /\/en\/request$/);
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    });
  }
}
