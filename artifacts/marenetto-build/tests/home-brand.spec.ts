import { expect, test } from '@playwright/test';

for (const path of ['/', '/en/']) {
  for (const width of [360, 768, 1440]) {
    test(`home ${path} at ${width}px keeps images and navigation usable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.getByTestId('link-logo')).toBeVisible();
      await expect(page.getByTestId('link-language')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

      const images = page.locator('main img');
      expect(await images.count()).toBeGreaterThanOrEqual(4);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
        expect(await image.getAttribute('alt')).toBeTruthy();
        expect(await image.evaluate((node: HTMLImageElement) => new URL(node.currentSrc).origin === location.origin)).toBe(true);
        expect(await image.getAttribute('width')).toBeTruthy();
        expect(await image.getAttribute('height')).toBeTruthy();
      }

      await page.getByTestId('link-logo').click();
      const menu = page.getByTestId('button-menu');
      if (await menu.isVisible()) {
        await menu.click();
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
        await page.getByTestId('mobile-nav-services').click();
      } else {
        await page.getByTestId('nav-services').click();
      }
      await expect(page).toHaveURL(path === '/' ? /\/servizi$/ : /\/en\/services$/);
      await page.getByTestId('link-logo').click();
      await page.getByTestId('link-language').click();
      await page.getByRole('menuitem', { name: path === '/' ? 'English' : 'Italiano', exact: true }).click();
      await expect(page).toHaveURL(path === '/' ? /\/en\/$/ : /\/$/);
      await page.getByTestId('hero-request').click();
      await expect(page).toHaveURL(path === '/' ? /\/en\/request$/ : /\/richiesta$/);
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    });
  }
}
