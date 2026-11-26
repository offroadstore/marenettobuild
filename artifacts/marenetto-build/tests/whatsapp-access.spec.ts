import { expect, test } from '@playwright/test';
import { openPage } from './source-fixtures';

const viewports = [
  { name: 'phone', width: 390, height: 780 },
  { name: 'tablet', width: 820, height: 1100 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const vp of viewports) {
  test.describe(`WhatsApp access on ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('opens wa.me link with the shared number and prefilled message, in the corner and inside the viewport', async ({ page }) => {
      await openPage(page, '/');
      const link = page.getByTestId('whatsapp-float-link');
      await expect(link).toBeVisible();
      await expect(page.getByTestId('whatsapp-float')).toHaveCount(1);
      const href = (await link.getAttribute('href'))!;
      const url = new URL(href);
      expect(url.origin + url.pathname).toBe('https://wa.me/393339363007');
      expect(url.searchParams.get('text')).toBe('Buongiorno, vorrei informazioni per un lavoro.');
      const box = (await link.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(54);
      expect(box.width).toBeLessThanOrEqual(56);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width - 19);
      expect(box.y + box.height).toBeLessThanOrEqual(vp.height - 19);
    });

    test('dragging moves it inside the viewport without opening WhatsApp; click still opens', async ({ page, context }) => {
      await openPage(page, '/');
      const link = page.getByTestId('whatsapp-float-link');
      const b = (await link.boundingBox())!;
      const popups: string[] = [];
      context.on('page', p => popups.push(p.url()));
      await page.mouse.move(b.x + 28, b.y + 28);
      await page.mouse.down();
      await page.mouse.move(b.x - 120, b.y - 200, { steps: 8 });
      await page.mouse.move(-500, -500, { steps: 4 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      expect(popups).toEqual([]);
      const a = (await link.boundingBox())!;
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.x + a.width).toBeLessThanOrEqual(vp.width);
      expect(a.y + a.height).toBeLessThanOrEqual(vp.height);
      expect(a.y).toBeLessThan(b.y);
      const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
      expect(popup.url()).toMatch(/wa\.me|api\.whatsapp\.com\/send\/?\?phone=393339363007/);
      await popup.close();
    });

    test('× docks the link in flow above the hero, then another page restores the floating button with no duplicates', async ({ page, context }) => {
      await openPage(page, '/');
      const popups: string[] = [];
      context.on('page', p => popups.push(p.url()));
      await page.getByTestId('whatsapp-float-close').click();
      await expect(page.getByTestId('whatsapp-float')).toHaveCount(0);
      // Contact is intentionally secondary to the four-area primary menu.
      const inHeader = false;
      const dock = page.getByTestId(inHeader ? 'whatsapp-nav-link' : 'whatsapp-dock-link');
      await expect(dock).toBeVisible();
      await expect(dock).toHaveText('Scrivici su WhatsApp');
      expect(popups).toEqual([]);
      const pos = await dock.evaluate(el => {
        const r = el.getBoundingClientRect();
        const header = document.querySelector('header')!.getBoundingClientRect();
        return { top: r.top + window.scrollY, headerBottom: header.bottom + window.scrollY, fixed: !!el.closest('[style*="fixed"]') };
      });
      if (inHeader) {
        const g = await page.evaluate(() => {
          const l = document.querySelector('[data-testid="whatsapp-nav-link"]')!;
          const logo = document.querySelector('[data-testid="link-logo"]')!.getBoundingClientRect();
          const serv = document.querySelector('[data-testid="nav-services"]')!.getBoundingClientRect();
          const r = l.getBoundingClientRect();
          const cs = (e: Element) => getComputedStyle(e);
          return { afterLogo: r.left >= logo.right, beforeServices: r.right <= serv.left, gapToServices: serv.left - r.right, gapToLogo: r.left - logo.right,
            sameFont: cs(l).fontFamily === cs(document.querySelector('[data-testid="nav-services"]')!).fontFamily && cs(l).fontSize === cs(document.querySelector('[data-testid="nav-services"]')!).fontSize,
            iconLeft: (l.querySelector('svg')!.getBoundingClientRect().left) < (l.querySelector('span')!.getBoundingClientRect().left) };
        });
        expect(g.afterLogo && g.beforeServices && g.sameFont && g.iconLeft).toBe(true);
        expect(g.gapToServices).toBeLessThan(g.gapToLogo);
      } else {
        expect(pos.top).toBeGreaterThanOrEqual(pos.headerBottom - 1);
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(200);
        expect(await dock.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(0);
      }
      // Scrolling does not bring the floating button back.
      await expect(page.getByTestId('whatsapp-float')).toHaveCount(0);
      // Internal navigation resets.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => { window.history.pushState({}, '', '/servizi'); window.dispatchEvent(new PopStateEvent('popstate')); });
      await expect(page.getByTestId('whatsapp-float')).toHaveCount(1);
      await expect(page.getByTestId('whatsapp-dock-link')).toHaveCount(0);
      await page.goBack();
      await expect(page.getByTestId('whatsapp-float')).toHaveCount(1);
      await expect(page.getByTestId('whatsapp-dock-link')).toHaveCount(0);
    });
  });
}

test('phone floating action yields to visible content at the regular 780px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await openPage(page, '/');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.getByTestId('whatsapp-float').evaluate(box => {
    const rect = box.getBoundingClientRect();
    const overlaps = Array.from(document.querySelectorAll<HTMLElement>(
      'a,button,input,textarea,select,[role="dialog"],h1,h2,h3,h4,h5,h6,p,li,dt,dd,label,figcaption',
    )).some(element => {
      if (box.contains(element) || !element.getClientRects().length) return false;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
      const other = element.getBoundingClientRect();
      return other.width > 0 && other.height > 0 && other.left < rect.right + 4 &&
        other.right > rect.left - 4 && other.top < rect.bottom + 4 && other.bottom > rect.top - 4;
    });
    return (getComputedStyle(box).visibility === 'hidden') === overlaps;
  })).toBe(true);
});

test('phone action remains hidden while a full-screen dialog has priority', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await openPage(page, '/');
  await expect(page.getByTestId('whatsapp-float-link')).toBeVisible();
  await page.evaluate(() => {
    const dialog = document.createElement('div');
    dialog.id = 'test-consent-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.style.cssText = 'position:fixed;inset:0;z-index:100;background:white';
    document.body.append(dialog);
  });
  await expect(page.getByTestId('whatsapp-float-link')).toBeHidden();
  await page.evaluate(() => document.getElementById('test-consent-dialog')?.remove());
  await expect(page.getByTestId('whatsapp-float-link')).toBeVisible();
});

test('keyboard: × closes without opening chat; dock link is focusable; storage is untouched', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPage(page, '/contatti');
  const popups: string[] = [];
  context.on('page', p => popups.push(p.url()));
  await page.getByTestId('whatsapp-float-close').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('whatsapp-float')).toHaveCount(0);
  expect(popups).toEqual([]);
  await expect(page.getByTestId('whatsapp-dock-link')).toBeFocused();
  const stored = await page.evaluate(() => JSON.stringify([...Object.keys(localStorage), ...Object.keys(sessionStorage)]).toLowerCase() + document.cookie.toLowerCase());
  expect(stored).not.toContain('whatsapp');
});

test('a page without a hero keeps WhatsApp reachable below the primary navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPage(page, '/richiesta');
  await page.getByTestId('whatsapp-float-close').click();
  const dock = page.getByTestId('whatsapp-dock-link');
  await expect(dock).toBeVisible();
  const [d, h] = await Promise.all([dock.boundingBox(), page.locator('header').first().boundingBox()]);
  expect(d!.y).toBeGreaterThanOrEqual(h!.y + h!.height);
  await expect(page.getByTestId('whatsapp-nav-link')).toHaveCount(0);
});

test('English public and Arabic review labels, one WhatsApp float per page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPage(page, '/en/');
  await expect(page.getByTestId('whatsapp-float-link')).toHaveAttribute('aria-label', 'Write to us on WhatsApp');
  await openPage(page, '/__localization-review/ar/home');
  await expect(page.getByTestId('whatsapp-float')).toHaveCount(1);
  await expect.poll(async () => (await page.getByTestId('whatsapp-float-link').getAttribute('aria-label')) ?? '').toContain('راسلنا');
  const text = new URL((await page.getByTestId('whatsapp-float-link').getAttribute('href'))!).searchParams.get('text');
  expect(text).toContain('مرحب');
});

test('no WhatsApp float on internal area', async ({ page }) => {
  await page.goto('/internal');
  await expect(page.getByTestId('whatsapp-float')).toHaveCount(0);
});
