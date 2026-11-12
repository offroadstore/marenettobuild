import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openPage, sourceHome } from './source-fixtures';

const evidence = resolve(import.meta.dirname, '../../../generated-artifacts/cefalu-panorama');

// Independent of the older logo geometry / historical CMS-image assertions:
// those tests currently stop before reaching their hero checks.
for (const locale of ['it', 'en']) {
  for (const width of [390, 699, 700, 768, 1440, 1920]) {
    test(`corrected Cefalù hero ${locale} ${width}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await openPage(page, sourceHome(locale).path);
      await expect(page.locator('main h1')).toHaveText(sourceHome(locale).h1);
      await expect(page.locator('.mbh-hero picture')).toHaveCount(1);
      const image = page.locator('.mbh-hero img');
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const currentSrc = await image.evaluate((img: HTMLImageElement) => img.currentSrc);
      expect(currentSrc).toContain('cefalu-hero-left-');
      expect(currentSrc.includes('-mobile-')).toBe(width < 700);
      await expect(image).toHaveAttribute('src', /cefalu-hero-left-1672\.jpg$/);
      await expect(image).toHaveAttribute('fetchpriority', 'high');
      await expect(page.getByTestId('hero-request')).toBeVisible();
      await expect(page.locator('footer [data-testid="illustration-note"]')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
        await expect(page.locator(selector)).toHaveAttribute('content', /\/media\/home\/cefalu-hero-left-1672\.jpg$/);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      for (const source of await page.locator('.mbh-hero source').all()) {
        const srcset = await source.getAttribute('srcset');
        expect(srcset).toContain('cefalu-hero-left-');
        expect(srcset).not.toContain('approved-hero-');
      }

      if (locale === 'it' && [390, 1440].includes(width) && testInfo.project.name === 'vite-development') {
        await mkdir(evidence, { recursive: true });
        await page.evaluate(() => document.fonts.ready);
        // Same page, viewport, crop, typography and overlays. Only swap the image
        // family to compare with the untouched original, without changing app code.
        for (const family of ['cefalu-hero-geography', 'cefalu-hero-left']) {
          await page.locator('.mbh-hero picture').evaluate((picture, family) => {
            picture.querySelectorAll('source, img').forEach(node => {
              for (const attr of ['srcset', 'src']) {
                const value = node.getAttribute(attr);
                if (value) node.setAttribute(attr, value.replaceAll(/cefalu-hero(?:-geography|-left)?/g, family));
              }
            });
          }, family);
          await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && img.currentSrc.includes('cefalu-hero-') && img.currentSrc.includes('-left-') === img.src.includes('-left-'))).toBe(true);
          const state = family === 'cefalu-hero-geography' ? 'before' : 'after';
          await page.screenshot({ path: `${evidence}/${state}-${width}.png` });
          const style = await page.addStyleTag({ content: '.mbh-hero__shade,.mbh-hero__inner { visibility:hidden !important; }' });
          await page.locator('.mbh-hero').screenshot({ path: `${evidence}/${state}-${width}-unobscured.png` });
          await style.evaluate(node => node.remove());
        }
      }
    });
  }
}

test('every corrected encoding decodes at native or downsampled dimensions', async ({ page }) => {
  await openPage(page, '/');
  const variants = [
    ...[768, 1280, 1672].flatMap(width => ['avif', 'webp'].map(format => ({ file: `cefalu-hero-left-${width}.${format}`, width, height: Math.round(941 * width / 1672) }))),
    ...[450, 900].flatMap(width => ['avif', 'webp'].map(format => ({ file: `cefalu-hero-left-mobile-${width}.${format}`, width, height: Math.round(941 * width / 900) }))),
    { file: 'cefalu-hero-left-1672.jpg', width: 1672, height: 941 },
  ];
  for (const variant of variants) {
    const decoded = await page.evaluate(async file => {
      const img = new Image();
      img.src = `/media/home/${file}`;
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight };
    }, variant.file);
    expect(decoded, variant.file).toEqual({ width: variant.width, height: variant.height });
  }
});
