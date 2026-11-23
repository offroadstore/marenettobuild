import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { resolve } from 'node:path';
let bundle = '';
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [resolve(import.meta.dirname, 'direct-analytics-browser.fixture.tsx')],
    bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
    tsconfig: resolve(import.meta.dirname, '../tsconfig.json'), loader: { '.css': 'empty' },
    define: { 'process.env.NODE_ENV': '"test"', 'import.meta.env.BASE_URL': '"/"' },
  });
  bundle = result.outputFiles[0].text;
});

test('direct GA waits for consent, sanitizes events, reloads on revocation and never runs on private routes', async ({ page }) => {
  const origin = 'https://www.marenettobuild.com';
  const loads: string[] = [], events: any[] = [], configurations: any[] = [];
  await page.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (u.hostname === 'www.googletagmanager.com') {
      loads.push(u.href);
      await route.fulfill({ contentType: 'application/javascript', body: `
        const run=a=>{
          if(a[0]==='config') fetch('https://www.google-analytics.com/config',{method:'POST',body:JSON.stringify(Array.from(a))});
          if(a[0]==='event'&&!window['ga-disable-G-D0QJL17CVC']) fetch('https://www.google-analytics.com/g/collect',{method:'POST',body:JSON.stringify(Array.from(a))});
        };
        dataLayer.forEach(run); dataLayer.push=function(a){Array.prototype.push.call(this,a);run(a);};
        document.cookie='_ga=fixture; Path=/; Secure';
      ` }); return;
    }
    if (u.hostname.endsWith('google-analytics.com')) {
      const data = JSON.parse(route.request().postData() ?? 'null');
      if (u.pathname === '/config') configurations.push(data); else events.push(data);
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); return;
    }
    if (u.origin !== origin) { await route.abort(); return; }
    if (u.pathname === '/api/editorial/active') { await route.fulfill({ json: [] }); return; }
    if (u.pathname === '/api/monitoring/public') {
      await route.fulfill({ json: { enabled: true, mode: 'direct', origin, runtimeOrigin: '',
        measurementId: 'G-D0QJL17CVC', privacyUrl: origin + '/cookie', privacyVersion: '2026-11-23',
        expiresAt: new Date(Date.now() + 60000).toISOString() } }); return;
    }
    if (u.pathname === '/fixture.js') { await route.fulfill({ contentType: 'application/javascript', body: bundle }); return; }
    await route.fulfill({ contentType: 'text/html', body: '<html><body><div id="root"></div><script src="/fixture.js"></script></body></html>' });
  });
  await page.goto(origin + '/?email=private@example.invalid#secret');
  await expect(page.getByTestId('analytics-accept')).toBeVisible();
  expect(loads).toHaveLength(0);
  await page.getByTestId('analytics-reject').click();
  await page.reload(); expect(loads).toHaveLength(0);
  await page.getByTestId('cookie-preferences-link').click();
  await page.getByTestId('analytics-accept').click();
  await expect.poll(() => loads.length).toBe(1);
  await expect.poll(() => events.length).toBe(1);
  expect(configurations[0][2]).toMatchObject({ send_page_view: false, anonymize_ip: true,
    allow_google_signals: false, allow_ad_personalization_signals: false });
  await page.getByRole('link', { name: 'Servizi', exact: true }).click();
  await expect.poll(() => events.length).toBe(2);
  expect(JSON.stringify(events)).not.toMatch(/private|secret|@|#/);
  expect(events[1][2].page_location).toBe(origin + '/servizi');
  await page.getByTestId('cookie-preferences-link').click();
  expect(loads).toHaveLength(1);
  await Promise.all([
    page.waitForEvent('load'),
    page.getByTestId('analytics-reject').click(),
  ]);
  await expect(page.locator('#marenetto-direct-analytics')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => Boolean((window as any).dataLayer))).toBe(false);
  expect(await page.evaluate(() => document.cookie)).not.toContain('_ga');
  const count = events.length; await page.waitForTimeout(150); expect(events).toHaveLength(count);
  for (const destination of ['/internal', '/sign-in', '/sign-up', '/internal/leads', '/owner-demo']) {
    await page.goto(origin + destination);
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
    expect(loads).toHaveLength(1);
  }
  await page.goto(origin + '/');
  await page.getByTestId('cookie-preferences-link').click();
  await page.getByTestId('analytics-accept').click();
  await expect.poll(() => loads.length).toBe(2);
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('link', { name: 'Console', exact: true }).click(),
  ]);
  await expect(page).toHaveURL(origin + '/internal');
  await expect.poll(() => page.evaluate(() => Boolean((window as any).dataLayer))).toBe(false);
  await expect(page.locator('#marenetto-direct-analytics')).toHaveCount(0);
  expect(loads).toHaveLength(2);
});
