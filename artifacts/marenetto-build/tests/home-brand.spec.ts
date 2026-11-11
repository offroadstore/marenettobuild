import { expect, test } from '@playwright/test';
import { openPage, sourceHome, sourceDocument, expectedMediaURL } from './source-fixtures';

for (const locale of ['it', 'en']) {
  for (const width of [390, 768, 1440, 1920]) {
    test(`home ${locale} at ${width}px preserves source images and usable navigation`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      const original = sourceHome(locale);
      await openPage(page, original.path);
      await expect(page.locator('main h1')).toHaveText(original.h1);
      await expect(page.getByTestId('link-logo')).toBeVisible();
      await expect(page.getByTestId('link-language')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

      // Preserve source associations/alt while accepting the documented,
      // SHA-verified move off the historical hosting.
      const expectedMedia = (await page.evaluate(html => [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img')].map(img => ({ src: img.getAttribute('src'), alt: img.getAttribute('alt') })), sourceDocument(original).html))
        .map(image => ({ ...image, src: expectedMediaURL(image.src) }));
      const actualMedia = await page.locator('main .historical-content img').evaluateAll(images => images.map(img => ({ src: img.getAttribute('src'), alt: img.getAttribute('alt') })));
      expect(actualMedia).toEqual(expectedMedia);
      const hero = page.locator('.mbh-hero img');
      await expect.poll(() => hero.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      expect(await hero.evaluate((node: HTMLImageElement) => new URL(node.currentSrc).origin === location.origin)).toBe(true);
      await expect(hero).toHaveAttribute('width', '1672');
      await expect(hero).toHaveAttribute('height', '941');

      const menu = page.getByTestId('button-menu');
      let serviceHref: string;
      if (await menu.isVisible()) {
        await menu.click();
        const service = page.getByTestId('mobile-nav-services');
        serviceHref = (await service.getAttribute('href'))!;
        await service.click();
      } else {
        const service = page.getByTestId('nav-services');
        serviceHref = (await service.getAttribute('href'))!;
        await service.click();
      }
      await expect(page).toHaveURL(url => url.pathname === serviceHref);
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
