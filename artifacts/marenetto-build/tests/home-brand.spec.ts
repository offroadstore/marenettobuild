import { expect, test } from '@playwright/test';
import { openPage, sourceHome, sourceDocument, sourceArticleCovers, expectedMediaURL } from './source-fixtures';

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

      // The semantic homepage intentionally deduplicates CMS card widgets and
      // recovers bare lazy placeholders from the corresponding acquired covers.
      // Derive expectations independently with DOM traversal over the archived
      // source, not the production regex extractor or a snapshot of served HTML.
      const expectedCards = (await page.evaluate(({ html, covers }) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const cards = new Map<string, { href: string; title: string; src: string | null }>();
        let pendingPicture: Element | null = null;
        for (const node of doc.querySelectorAll('picture, h4 a[href], h5 a[href]')) {
          if (node.matches('picture')) {
            pendingPicture = node;
            continue;
          }
          const href = node.getAttribute('href')!;
          const sourceImage = pendingPicture?.querySelector('img')?.getAttribute('src')
            ?? covers[href.replace(/\/+$/, '') || '/'] ?? null;
          if (!cards.has(href)) cards.set(href, { href, title: node.textContent!.replace(/\s+/g, ' ').trim(), src: sourceImage });
          else if (!cards.get(href)!.src) cards.get(href)!.src = sourceImage;
          pendingPicture = null;
        }
        return [...cards.values()];
      }, { html: sourceDocument(original).html, covers: sourceArticleCovers(locale) }))
        .map(card => ({ ...card, src: expectedMediaURL(card.src) }));
      expect(expectedCards.length).toBeGreaterThan(0);
      const actualCards = await page.locator('main .mbx-card').evaluateAll(cards => cards.map(card => ({
        href: card.getAttribute('href'),
        title: card.querySelector('.mbx-card__title')?.textContent,
        src: card.querySelector('img')?.getAttribute('src') ?? null,
      })));
      expect(actualCards).toEqual(expectedCards);
      const images = page.locator('main .mbx-card img');
      await expect(images).toHaveCount(expectedCards.filter(card => card.src).length);
      for (const image of await images.all()) {
        // Decorative thumbnail; its card title supplies the accessible link name.
        await expect(image).toHaveAttribute('alt', '');
        await expect(image).toHaveAttribute('width', '600');
        await expect(image).toHaveAttribute('height', '400');
      }
      const hero = page.locator('.mbh-hero img');
      await expect.poll(() => hero.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      expect(await hero.evaluate((node: HTMLImageElement) => new URL(node.currentSrc).origin === location.origin)).toBe(true);
      expect(await hero.evaluate((node: HTMLImageElement) => node.currentSrc)).toContain('cefalu-hero-geography-');
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
