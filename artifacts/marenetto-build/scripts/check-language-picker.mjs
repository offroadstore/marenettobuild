import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const url = process.argv[2];
if (!url) throw new Error('Pass the routed preview URL');
const browser = await chromium.launch({
  executablePath: '/repl/tools/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ locale: 'nl-NL', viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(url);
    const suggestion = page.getByTestId('language-suggestion');
    await suggestion.waitFor();
    assert.equal(await suggestion.locator('a').innerText(), 'Nederlands');
    assert.equal(new URL(page.url()).pathname, '/');
    await suggestion.locator('a').click();
    await page.waitForURL('**/nl/');
    await page.getByTestId('link-language').click();
    const menu = page.locator('.language-menu');
    await menu.waitFor();
    assert.equal(await menu.locator('[role="menuitem"]').count(), 29);
    assert.doesNotMatch(await menu.innerText(), /storico|recuperato|approvare|verificata/i);
    assert.equal(await menu.locator('.language-flag').count(), 29);
    assert.equal((await menu.locator('[aria-current="true"]').textContent()).trim(), '🇳🇱Nederlands');
    const bounds = await menu.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= width);
    await menu.getByRole('menuitem', { name: 'Italiano', exact: true }).click();
    await page.waitForURL(new URL('/', url).href);
    await page.reload();
    await page.getByTestId('link-language').waitFor();
    assert.equal(await suggestion.count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('marenetto-language')), 'it');
    await page.getByTestId('link-language').click();
    await page.keyboard.press('End');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('lang')), 'tr');
    await page.keyboard.press('Escape');
    assert.equal(await menu.count(), 0);
    console.log(`${width}px: browser suggestion, equivalent route, clean flagged menu, manual preference and keyboard passed`);
    await context.close();
  }
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();
  await page.goto(new URL('/en/', url).href);
  await page.getByTestId('link-language').waitFor();
  assert.equal(await page.getByTestId('language-suggestion').count(), 0);
  assert.equal(new URL(page.url()).pathname, '/en/');
  console.log('Explicit language route preserved with a different browser language');
  await context.close();
} finally {
  await browser.close();
}
