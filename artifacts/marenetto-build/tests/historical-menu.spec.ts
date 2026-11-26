import { expect, test } from '@playwright/test';
import { openPage, pillarEdition } from './source-fixtures';

const locales = ['it','en','de','fr','nl','es','pt','ru','pl','sv','no','da','ar'];
const areas = ['villas','outdoors','surfaces','investment'] as const;

for(const locale of locales) {
  test(`four-area navigation, articles kept in footer: ${locale}`,async({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await openPage(page,locale==='it'?'/':`/${locale}/`);
    const navigation=page.locator('.nav-links');
    for(const area of areas) {
      await expect(navigation.locator(`a[href="${pillarEdition(locale,area).path}"]`)).toHaveCount(1);
    }
    await expect(navigation.locator('a')).toHaveCount(5);
    await expect(page.getByTestId('nav-articles')).toHaveCount(0);
    await expect(page.locator('footer a').filter({hasText: /Articoli|Articles|Artikel|Artikelen|Artykuły|Artikler|Artículos|Artigos|Статьи|مقالات|Artiklar/}).first()).toBeVisible();
    await page.setViewportSize({width:390,height:844});
    await page.getByTestId('button-menu').focus();
    await page.keyboard.press('Enter');
    const mobile=page.locator('#mobile-nav');
    for(const area of areas) await expect(mobile.locator(`a[href="${pillarEdition(locale,area).path}"]`)).toBeVisible();
    await expect(page.getByTestId('mobile-nav-articles')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('button-menu')).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
}
