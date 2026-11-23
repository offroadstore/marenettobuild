import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { LEGAL_VERSION } from '../src/content/legal';
import { setWebSecurityHeaders } from '../scripts/security-policy.mjs';

const origin = 'https://www.marenettobuild.com';
const key = 'marenetto.cookies.v2';
const root = resolve(import.meta.dirname, '../dist/public');
const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

/** Exercise the actual production HTML, CSS, JS and form, never the live site.
 * Every request is fulfilled locally or aborted, including emails and providers.
 */
async function setup(page: Page, host = origin) {
  const manifest = JSON.parse(await readFile(resolve(root, 'route-manifest.json'), 'utf8'));
  const meta: { url: string; headers: Record<string, string> }[] = [];
  const ga: any[] = [];
  const submissions: any[] = [];
  let response: 'error' | 'rejected' | 'sent' = 'error';
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === 'www.facebook.com') {
      meta.push({ url: url.href, headers: await request.allHeaders() });
      await route.fulfill({ contentType: 'image/gif', body: gif, headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' } }); return;
    }
    if (url.hostname === 'www.googletagmanager.com') {
      await route.fulfill({ contentType: 'text/javascript', body: `
        const run = a => { if(a[0]==='event'&&!window['ga-disable-G-D0QJL17CVC']) fetch('https://www.google-analytics.com/g/collect',{method:'POST',body:JSON.stringify(Array.from(a))}); };
        dataLayer.forEach(run); dataLayer.push = function(a) { Array.prototype.push.call(this,a);run(a); };
        document.cookie='_ga=fixture; Path=/; Secure';
      ` }); return;
    }
    if (url.hostname.endsWith('google-analytics.com')) {
      ga.push(JSON.parse(request.postData() ?? 'null'));
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); return;
    }
    if (url.origin !== host) { await route.abort(); return; }
    if (url.pathname === '/api/editorial/active') { await route.fulfill({ json: [] }); return; }
    if (url.pathname === '/api/monitoring/public') {
      await route.fulfill({ json: { enabled: true, mode: 'direct', origin: host, runtimeOrigin: '', measurementId: 'G-D0QJL17CVC',
        privacyUrl: host + '/cookie', privacyVersion: LEGAL_VERSION, expiresAt: new Date(Date.now() + 60000).toISOString() } }); return;
    }
    if (url.pathname === '/api/project-requests') {
      submissions.push(request.postDataJSON());
      await route.fulfill(response === 'sent' ? { status: 201, json: { status: 'sent' } } :
        response === 'rejected' ? { status: 400, json: { error: 'fixture rejected' } } : { status: 500, json: { error: 'fixture error' } }); return;
    }
    if (url.pathname.startsWith('/api/')) { await route.fulfill({ json: { enabled: false } }); return; }
    const file = manifest.pages[url.pathname] ?? (request.isNavigationRequest() ? 'index.html' : url.pathname.slice(1));
    if (file.includes('..')) { await route.abort(); return; }
    try {
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
      const headers: Record<string, string> = {};
      setWebSecurityHeaders({ setHeader: (name: string, value: string) => { headers[name] = value; } });
      // Enforce the production policy, not only report it.
      headers['Content-Security-Policy'] = headers['Content-Security-Policy-Report-Only'];
      delete headers['Content-Security-Policy-Report-Only'];
      await route.fulfill({ body: await readFile(resolve(root, file)), contentType: mime[extname(file)] ?? 'application/octet-stream', headers });
    } catch { await route.fulfill({ status: 404, body: 'Fixture asset not found' }); }
  });
  await page.addInitScript(() => document.addEventListener('click', e => {
    if ((e.target as Element).closest('a[href^="tel:"],a[href^="mailto:"],a[href^="https://wa.me"],a[href^="https://api.whatsapp.com"]')) e.preventDefault();
  }));
  return { meta, ga, submissions, response: (next: typeof response) => { response = next; } };
}
async function customize(page: Page, statistics: boolean, marketing: boolean) {
  if (!await page.getByTestId('analytics-preferences').count()) await page.getByTestId('cookie-preferences-link').click();
  if (!await page.getByTestId('consent-statistics').count()) await page.getByTestId('cookie-customize').click();
  await page.getByTestId('consent-statistics').setChecked(statistics);
  await page.getByTestId('consent-marketing').setChecked(marketing);
  await page.getByTestId('cookie-save').click();
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
}
for (const statistics of [false, true]) for (const marketing of [false, true]) {
  test(`actual build consent statistics=${statistics} marketing=${marketing}`, async ({ page, context }) => {
    const f = await setup(page);
    await context.addCookies([{ name: 'meta-existing', value: 'must-not-leave', domain: 'www.facebook.com', path: '/', secure: true, sameSite: 'None' }]);
    await page.goto(origin + '/?email=private@example.invalid#private-fragment');
    await expect(page.getByTestId('analytics-accept')).toBeVisible();
    if (!statistics && !marketing) await page.screenshot({ path: '../../generated-artifacts/monitoring/meta-desktop.jpg' });
    expect(f.meta).toHaveLength(0); expect(f.ga).toHaveLength(0);
    await customize(page, statistics, marketing);
    if (marketing) await expect.poll(() => f.meta.length).toBe(1);
    if (statistics) await expect.poll(() => f.ga.length).toBe(1);
    expect(f.meta.length).toBe(marketing ? 1 : 0);
    expect(f.ga.length).toBe(statistics ? 1 : 0);
    const stored = await page.evaluate(key => localStorage.getItem(key), key);
    await page.getByTestId('cookie-preferences-link').click();
    await expect(page.getByTestId('consent-statistics')).toBeChecked({ checked: statistics });
    await expect(page.getByTestId('consent-marketing')).toBeChecked({ checked: marketing });
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(stored);
    await page.getByTestId('analytics-preferences').press('Escape');
    await page.locator('footer a[href="/general-contractor/"]').first().click();
    await expect(page).toHaveURL(origin + '/general-contractor/');
    if (marketing) await expect.poll(() => f.meta.length).toBe(2);
    if (statistics) await expect.poll(() => f.ga.length).toBe(2);
    expect(await page.locator('meta[name="facebook-domain-verification"]').count()).toBe(1);
    await page.locator('footer a[href^="tel:"]').first().click();
    if (marketing) await expect.poll(() => f.meta.length).toBe(3);
    if (statistics) await expect.poll(() => f.ga.length).toBe(3);
    for (const request of f.meta) {
      const url = new URL(request.url);
      expect([...url.searchParams.keys()].sort()).toEqual(['dl', 'ev', 'id', 'rl', 'ts']);
      expect(url.searchParams.get('id')).toBe('1133839426103230');
      expect(request.headers.referer).toBeUndefined();
      expect(request.headers.cookie).toBeUndefined();
      expect(JSON.stringify(request)).not.toMatch(/private|must-not-leave|mailto|tel:|whatsapp|@|%40/);
    }
    await page.reload();
    await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(stored);
  });
}

test('marketing withdrawal preserves GA, clears applicable cookies and tabs synchronize', async ({ page, context }) => {
  const f = await setup(page);
  await page.goto(origin + '/');
  await customize(page, true, true);
  await expect.poll(() => f.meta.length).toBe(1);
  await expect.poll(() => f.ga.length).toBe(1);
  await page.evaluate(() => {
    document.cookie = '_fbp=old; Path=/; Secure';
    document.cookie = '_fbc=old; Domain=.marenettobuild.com; Path=/; Secure';
  });
  const second = await context.newPage(), other = await setup(second);
  await second.goto(origin + '/');
  await expect.poll(() => other.meta.length).toBe(1);
  await customize(page, true, false);
  await expect.poll(() => page.evaluate(() => document.cookie)).not.toMatch(/_fbp|_fbc/);
  await second.getByTestId('cookie-preferences-link').click();
  await expect(second.getByTestId('consent-marketing')).not.toBeChecked();
  await expect(second.getByTestId('consent-statistics')).toBeChecked();
  await second.getByTestId('analytics-preferences').press('Escape');
  const count = f.meta.length, otherCount = other.meta.length;
  await page.locator('footer a[href="/general-contractor/"]').first().click();
  await expect.poll(() => f.ga.length).toBe(2);
  expect(f.meta).toHaveLength(count); expect(other.meta).toHaveLength(otherCount);
  await second.close();
});

test('legacy/changed notice/expired preferences and denied storage never imply consent; open tab expires', async ({ page }) => {
  const f = await setup(page);
  await page.goto(origin + '/');
  await page.evaluate(() => {
    localStorage.setItem('marenetto.analytics.v1', JSON.stringify({ choice: 'accepted', at: Date.now() }));
  });
  await page.reload();
  await expect(page.getByTestId('analytics-accept')).toBeVisible();
  expect(f.meta).toHaveLength(0); expect(f.ga).toHaveLength(0);
  await page.getByTestId('cookie-customize').click();
  await expect(page.getByTestId('consent-statistics')).not.toBeChecked();
  await expect(page.getByTestId('consent-marketing')).not.toBeChecked();
  await page.getByTestId('analytics-reject').click();
  for (const change of [{ version: 'old' }, { at: Date.now() - 180 * 86400000 }, { at: Date.now() + 3600000 }]) {
    await page.evaluate(({ key, change }) => {
      const value = JSON.parse(localStorage.getItem(key)!);
      localStorage.setItem(key, JSON.stringify({ ...value, statistics: true, marketing: true, ...change }));
    }, { key, change });
    await page.reload();
    await expect(page.getByTestId('analytics-accept')).toBeVisible();
    expect(f.meta).toHaveLength(0); expect(f.ga).toHaveLength(0);
    await page.getByTestId('analytics-reject').click();
  }
  await page.evaluate(key => {
    const value = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(key, JSON.stringify({ ...value, statistics: false, marketing: true, at: Date.now() - 180 * 86400000 + 5000 }));
  }, key);
  await page.reload();
  await expect.poll(() => f.meta.length).toBe(1);
  await expect(page.getByTestId('analytics-preferences')).toBeVisible({ timeout: 10000 });
  const count = f.meta.length;
  await page.locator('footer a[href^="tel:"]').first().click();
  expect(f.meta).toHaveLength(count);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Denied', 'SecurityError'); }; });
  await page.getByTestId('analytics-accept').click();
  await expect(page.getByRole('alert')).toContainText('Salvataggio non riuscito');
  expect(f.meta).toHaveLength(count); expect(f.ga).toHaveLength(0);
});

test('actual email-only form generates Lead only after sent, not review/error/rejection; no field leakage', async ({ page }) => {
  const f = await setup(page);
  await page.goto(origin + '/richiesta?email=private@example.invalid#secret');
  await customize(page, false, true);
  await page.getByTestId('select-propertyType').selectOption('apartment');
  await page.getByTestId('select-service').selectOption('renovation');
  await page.getByTestId('input-location').fill('Cefalù');
  await page.getByTestId('select-projectStage').selectOption('planning');
  await page.getByTestId('input-message').fill('PRIVATE-FORM-MESSAGE long enough for validation.');
  await page.getByTestId('input-name').fill('PRIVATE-NAME');
  await page.getByTestId('input-email').fill('private@example.invalid');
  await page.getByTestId('check-privacy').check();
  await page.getByTestId('button-review').click();
  const leads = () => f.meta.filter(r => new URL(r.url).searchParams.get('ev') === 'Lead');
  expect(leads()).toHaveLength(0); expect(f.submissions).toHaveLength(0);
  await page.getByTestId('button-submit').click();
  await expect(page.getByTestId('status-error')).toBeVisible();
  expect(leads()).toHaveLength(0);
  f.response('rejected');
  await page.getByTestId('button-submit').click();
  await expect.poll(() => f.submissions.length).toBe(2);
  expect(leads()).toHaveLength(0);
  f.response('sent');
  await page.getByTestId('button-submit').click();
  await expect(page.getByTestId('status-success')).toBeVisible();
  await expect.poll(() => leads().length).toBe(1);
  expect(JSON.stringify(f.meta)).not.toMatch(/PRIVATE|private|@|secret|%40/);
  expect(await page.evaluate(key => localStorage.getItem(key), key)).not.toMatch(/PRIVATE|private|@|secret/);
  expect(await page.locator('script[src*="facebook"],img[src*="noscript"]').count()).toBe(0);
});

test('read-only storage cannot revive old grants after failed withdrawal and GA reload', async ({ page }) => {
  const f = await setup(page);
  await page.goto(origin + '/');
  await customize(page, true, true);
  await expect.poll(() => f.meta.length).toBe(1);
  await expect.poll(() => f.ga.length).toBe(1);
  const blockWrites = () => {
    Storage.prototype.setItem = () => { throw new DOMException('Read only', 'SecurityError'); };
    Storage.prototype.removeItem = () => { throw new DOMException('Read only', 'SecurityError'); };
  };
  await page.addInitScript(blockWrites);
  await page.evaluate(blockWrites);
  await page.getByTestId('cookie-preferences-link').click();
  await page.getByTestId('consent-statistics').uncheck();
  await page.getByTestId('consent-marketing').uncheck();
  await Promise.all([page.waitForEvent('load'), page.getByTestId('cookie-save').click()]);
  await expect(page.getByTestId('analytics-preferences')).toBeVisible();
  await expect(page.locator('#marenetto-direct-analytics')).toHaveCount(0);
  expect(await page.evaluate(() => history.state.cookieConsentBlocked)).toBe(true);
  await page.waitForTimeout(200);
  expect(f.meta).toHaveLength(1); expect(f.ga).toHaveLength(1);
  await page.getByTestId('cookie-customize').click();
  await expect(page.getByTestId('consent-statistics')).not.toBeChecked();
  await expect(page.getByTestId('consent-marketing')).not.toBeChecked();
});

test('375px consent remains independent, compact after choice and clear of mobile contacts; private and previews excluded', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const f = await setup(page);
  await page.goto(origin + '/');
  const bar = page.getByTestId('analytics-preferences');
  await expect(bar).toBeVisible();
  await page.screenshot({ path: '../../generated-artifacts/monitoring/meta-mobile-375.jpg' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const barBox = await bar.boundingBox();
  for (const selector of ['.mb-cbar', '.wa-float']) {
    const contact = page.locator(selector).first();
    if (await contact.isVisible()) {
      const box = await contact.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(barBox!.y + 1);
    }
  }
  await customize(page, false, true);
  await expect.poll(() => f.meta.length).toBe(1);
  for (const path of ['/internal', '/internal/leads', '/sign-in', '/sign-in/test', '/sign-up', '/sign-up/test', '/owner-demo', '/__localization-review/it/home', '/content/preview']) {
    await page.goto(origin + path);
    const count = f.meta.length;
    await page.waitForTimeout(100);
    expect(f.meta).toHaveLength(count);
    await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  }
  expect(f.meta).toHaveLength(1);
  await page.unrouteAll();
  const preview = await setup(page, 'https://preview.replit.dev');
  await page.goto('https://preview.replit.dev/');
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  expect(preview.meta).toHaveLength(0);
});
