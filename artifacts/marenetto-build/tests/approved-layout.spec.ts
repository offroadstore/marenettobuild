import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openPage, sourceHome, pillarEdition } from './source-fixtures';
import { noticeCopy } from '../src/content/legal-notices';

const evidence = resolve(import.meta.dirname, '../../../generated-artifacts/layout-approved/after');

for (const width of [390, 580, 699, 700, 768, 1000, 1100, 1440, 1920]) {
  test(`approved photographs and logo geometry with original home text at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await openPage(page, '/');
    await expect(page.locator('main h1')).toHaveText(sourceHome('it').h1);
    await page.evaluate(() => document.fonts.ready);
    // Current approved cascade: fluid header scale and smaller mobile footer.
    // Keep numeric geometry assertions rather than reading expected sizes from CSS.
    const headerHeight = Math.min(38, Math.max(28, width * 0.03));
    for (const [selector, height] of [
      ['.topbar .mb-logo', headerHeight],
      ['.footer-logo-band .mb-logo', width <= 600 ? 30 : 34],
    ] as const) {
      const box = await page.locator(selector).boundingBox();
      expect(box?.height).toBeCloseTo(height, 1);
      // Source crop proportions: 191px monogram + 40px gap + 797px name,
      // relative to the 193px monogram height.
      expect(box?.width).toBeCloseTo(height * 1028 / 193, 1);
      await expect(page.locator(`${selector} .mb-logo__bar`)).toHaveCSS('background-color', 'rgb(36, 70, 86)');
      await expect(page.locator(`${selector} img`).first()).toHaveAttribute('src', /brand\/current-logo\.png$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator('.mbh-h1')).toHaveCSS('font-family', /sans/i);
    await expect(page.locator('main [data-historical-body]')).toHaveAttribute('lang', 'it');
    await expect(page.locator('[data-testid="illustration-note"]')).toHaveCount(1);
    // Phase 4 replaces the former footer-only statement: distinguish known AI
    // illustrations from uncertain historical sources, without inventing review.
    await expect(page.locator('footer [data-testid="illustration-note"]')).toHaveText(`${noticeCopy.it.footer} ${noticeCopy.it.ai}`);
    await expect(page.locator('.mbh-image-note [data-image-disclosure="ai-edited"]')).toHaveText(noticeCopy.it.aiLabel);
    await expect(page.locator('footer [data-testid="illustration-note"]')).toHaveCSS('font-size', '13px');
    await expect(page.locator('main h1')).toHaveCount(1);
    const hero = page.locator('.mbh-hero img');
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const current = await hero.evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(current).toContain('cefalu-hero-left-');
    await expect(hero).toHaveAttribute('src', /cefalu-hero-left-1672\.jpg$/);
    for (const source of await page.locator('.mbh-hero source').all()) {
      await expect(source).toHaveAttribute('srcset', /^.*cefalu-hero-left-.*$/);
      expect(await source.getAttribute('srcset')).not.toContain('approved-hero');
    }
    expect(current.includes('-mobile-')).toBe(width < 700);
    await expect(hero).toHaveAttribute('loading', 'eager');
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    // Four commercial areas need the compact menu through 1150px: forcing
    // the old 900px desktop boundary overlaps the language/assessment controls.
    if (width >= 1151) {
      await expect(page.locator(`.nav-links a[href="${pillarEdition('it','villas').path}"]`)).toBeVisible();
      await expect(page.getByTestId('nav-articles')).toHaveCount(0);
      await expect(page.getByTestId('button-menu')).toBeHidden();
    } else {
      const menu=page.getByTestId('button-menu');
      await expect(menu).toBeVisible();
      await expect(page.getByTestId('nav-area-villas')).toBeHidden();
      await menu.focus();
      await page.keyboard.press('Enter');
      for(const area of ['villas','outdoors','surfaces','investment'] as const) {
        await expect(page.getByTestId(`mobile-nav-area-${area}`)).toBeVisible();
        await expect(page.getByTestId(`mobile-nav-area-${area}`)).toHaveAttribute('href',pillarEdition('it',area).path);
      }
      await expect(page.getByTestId('mobile-nav-about')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu).toBeFocused();
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
    const services = page.locator(`#mobile-nav a[href^="${pillarEdition(lang,'villas').path}"]`);
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
