import { test, expect, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { runtimePolicy, runtimeDocument } from '../analytics-runtime/policy.mjs';
const apiRequire = createRequire(resolve(import.meta.dirname, '../../api-server/package.json'));
const { build } = apiRequire('esbuild');
let bundle = '';
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [resolve(import.meta.dirname, 'analytics-browser.fixture.tsx')],
    bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
    tsconfig: resolve(import.meta.dirname, '../tsconfig.json'),
    loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"test"', 'import.meta.env.BASE_URL': '"/"' },
  });
  bundle = result.outputFiles[0].text;
});

async function setup(page: Page, origin = 'https://analytics-test.example.com') {
  const runtimeOrigin = 'https://metrics-runtime.example.net';
  const requests: string[] = [], events: any[] = [], probes: any[] = [];
  let configAvailable = true, receiptMode = 'error';
  await page.route('**/*', async route => {
    const request = route.request(), u = new URL(request.url());
    if (u.origin === runtimeOrigin) {
      const policy = runtimePolicy({ NODE_ENV: 'production', MARENETTO_ANALYTICS_ORIGIN: origin,
        MARENETTO_ANALYTICS_RUNTIME_ORIGIN: runtimeOrigin, MARENETTO_ANALYTICS_RUNTIME_APPROVED: 'true',
        MARENETTO_ANALYTICS_RELEASE_APPROVED: 'true', MARENETTO_ANALYTICS_PRIVACY_APPROVED: 'true' });
      if (!policy) { await route.fulfill({ status: 404 }); return; }
      const script = u.pathname === '/_analytics-runtime/runtime.js';
      await route.fulfill({ contentType: script ? 'application/javascript' : 'text/html',
        headers: { 'Content-Security-Policy': policy.csp, 'Referrer-Policy': 'no-referrer' },
        body: script ? await readFile(resolve(import.meta.dirname, '../analytics-runtime/client.js'), 'utf8') : runtimeDocument(policy) });
      return;
    }
    if (['www.googletagmanager.com', 'www.google-analytics.com'].includes(u.hostname)) {
      requests.push(request.url());
      if (u.pathname === '/gtag/js') {
        await route.fulfill({ contentType: 'application/javascript', body: `
          const probe={parentDOM:false,parentStorage:false,parentTimer:false,frameStorage:false};
          try{void parent.document.body;probe.parentDOM=true;}catch{}
          try{void parent.localStorage.length;probe.parentStorage=true;}catch{}
          try{parent.setInterval(()=>{},100);probe.parentTimer=true;}catch{}
          try{void localStorage.length;probe.frameStorage=true;}catch{}
          document.cookie='_ga=GA1.1.123.456; Path=/';
          document.cookie='session=forbidden; Path=/';
          fetch('https://www.google-analytics.com/g/collect',{method:'POST',body:JSON.stringify(['isolation',probe])});
          const run=a=>{
            if(a[0]==='event')fetch('https://www.google-analytics.com/g/collect',{method:'POST',body:JSON.stringify(Array.from(a))});
          };
          dataLayer.forEach(run);dataLayer.push=function(a){Array.prototype.push.call(this,a);run(a);};
          // Simulate a provider with background activity, destroyed on withdrawal.
          setInterval(()=>fetch('https://www.google-analytics.com/g/collect',{method:'POST',body:'["heartbeat"]'}),100);
        ` });
      } else {
        const data = JSON.parse(request.postData() || 'null');
        if (data?.[0] === 'event') events.push(data);
        if (data?.[0] === 'isolation') probes.push(data[1]);
        await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
      return;
    }
    if (u.origin !== origin) { await route.abort(); return; }
    if (u.pathname === '/fixture.js') { await route.fulfill({ contentType: 'application/javascript', body: bundle }); return; }
    if (u.pathname === '/api/editorial/active') { await route.fulfill({ json: [] }); return; }
    if (u.pathname === '/api/monitoring/public') {
      if (!configAvailable) { await route.fulfill({ status: 503, json: { error: 'fixture unavailable' } }); return; }
      await route.fulfill({ json: { enabled: true, origin, runtimeOrigin, measurementId: 'G-FIXTURE123', privacyUrl: origin + '/privacy', privacyVersion: 'fixture-v1', expiresAt: new Date(Date.now() + 60000).toISOString() } }); return;
    }
    if (u.pathname === '/api/project-requests') {
      await route.fulfill(receiptMode === 'error' ? { status: 500, json: { error: 'fixture failed' } } : { status: 201, json: { code: 'private-reference', isSynthetic: receiptMode === 'synthetic' } }); return;
    }
    await route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><div id="root"></div><script src="/fixture.js"></script></body></html>' });
  });
  await page.goto(origin + '/?email=private@example.com#secret');
  return { requests, events, probes, unavailable: () => { configAvailable = false; }, receipt: (mode: string) => { receiptMode = mode; } };
}

type CookieFixtureWindow = Window & { __cookieFixture: {
  grant(): unknown;
  read(): { statistics: boolean; marketing: boolean } | null;
} };

test('unmeasured static service and localized legal routes reopen preferences and persist rejection with an empty editorial snapshot', async ({ page }) => {
  const f = await setup(page);
  for (const path of ['/en/privacy', '/en/cookie-policy', '/arredi-su-misura', '/area-servizi-edili', '/zone-servite']) {
    await page.goto(`https://analytics-test.example.com${path}`);
    await expect(page.getByTestId('cookie-preferences-link')).toBeVisible();
    expect(await page.evaluate(() => (window as CookieFixtureWindow).__cookieFixture.grant()))
      .toMatchObject({ statistics: true, marketing: true });
    await page.reload();
    await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
    await page.getByTestId('cookie-preferences-link').click();
    await expect(page.getByTestId('consent-statistics')).toBeChecked();
    await expect(page.getByTestId('consent-marketing')).toBeChecked();
    await page.getByTestId('analytics-reject').click();
    expect(await page.evaluate(() => (window as CookieFixtureWindow).__cookieFixture.read()))
      .toMatchObject({ statistics: false, marketing: false });
    await page.reload();
    await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
    await page.getByTestId('cookie-preferences-link').click();
    await expect(page.getByTestId('consent-statistics')).not.toBeChecked();
    await expect(page.getByTestId('consent-marketing')).not.toBeChecked();
    await page.getByTestId('cookie-close').click();
    await expect(page.locator('iframe')).toHaveCount(0);
  }
  expect(f.requests).toEqual([]);
});

test('preview static pages reopen the inactive preferences panel without enabling providers', async ({ page }) => {
  const origin = 'https://candidate.preview.example.org';
  const f = await setup(page, origin);
  for (const path of ['/en/privacy', '/arredi-su-misura', '/zone-servite']) {
    await page.goto(origin + path);
    await page.getByTestId('cookie-preferences-link').click();
    await expect(page.getByTestId('analytics-preferences')).toBeVisible();
    await expect(page.getByTestId('analytics-accept')).toHaveCount(0);
    await expect(page.getByTestId('consent-statistics')).toHaveCount(0);
    await page.getByTestId('cookie-close').click();
    await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
  }
  expect(f.requests).toEqual([]);
});

test('consent/refusal/reload, SPA deduplication, contact vs stored enquiry, exclusion and immediate revoke', async ({ page }) => {
  const f = await setup(page);
  await expect(page.getByTestId('analytics-reject')).toBeVisible();
  expect(f.requests).toHaveLength(0);
  await page.getByTestId('analytics-reject').click();
  await page.reload();
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  await expect(page.getByTestId('analytics-accept')).toHaveCount(0);
  expect(f.requests).toHaveLength(0);
  await page.getByTestId('cookie-preferences-link').click();
  await page.getByTestId('analytics-accept').click();
  await expect.poll(() => f.requests.filter(url => new URL(url).pathname === '/gtag/js').length).toBe(1);
  await expect.poll(() => f.events.filter(e => e[1] === 'page_view').length).toBe(1);
  await expect.poll(() => f.probes.length).toBe(1);
  expect(f.probes[0]).toMatchObject({ parentDOM: false, parentStorage: false, parentTimer: false });
  expect(await page.locator('iframe').getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
  expect(await page.locator('iframe').getAttribute('src')).toBe('https://metrics-runtime.example.net/_analytics-runtime/');
  expect(await page.locator('iframe').getAttribute('srcdoc')).toBeNull();
  await expect.poll(() => page.evaluate(() => document.cookie)).toContain('_ga=GA1.1.123.456');
  expect(await page.evaluate(() => document.cookie)).not.toContain('session=forbidden');
  await page.getByRole('link', { name: 'Servizi', exact: true }).click();
  await expect.poll(() => f.events.filter(e => e[1] === 'page_view').length).toBe(2);
  await page.getByRole('link', { name: 'Servizi', exact: true }).click();
  expect(f.events.filter(e => e[1] === 'page_view')).toHaveLength(2);
  // Prevent the contact href's external side effect without suppressing capture.
  await page.evaluate(() => document.addEventListener('click', e => {
    if ((e.target as Element).closest('a[href^="mailto:"],a[href^="tel:"],a[href^="https://wa.me"]')) e.preventDefault();
  }));
  for (const name of ['Phone', 'Email', 'WhatsApp']) await page.getByRole('link', { name, exact: true }).click();
  await expect.poll(() => f.events.filter(e => e[1] === 'contact_click').length).toBe(3);
  await page.getByRole('button', { name: 'Submit fixture' }).click();
  expect(f.events.filter(e => e[1] === 'generate_lead')).toHaveLength(0);
  f.receipt('synthetic');
  await page.getByRole('button', { name: 'Submit fixture' }).click();
  expect(f.events.filter(e => e[1] === 'generate_lead')).toHaveLength(0);
  f.receipt('live');
  await page.getByRole('button', { name: 'Submit fixture' }).click();
  await expect.poll(() => f.events.filter(e => e[1] === 'generate_lead').length).toBe(1);
  await page.getByRole('button', { name: 'Submit fixture' }).click();
  expect(f.events.filter(e => e[1] === 'generate_lead')).toHaveLength(1);
  expect(JSON.stringify(f.events)).not.toMatch(/private|secret|mailto|390000|query|#/);
  for (const event of f.events) {
    expect(Object.keys(event[2]).sort()).toEqual((event[1] === 'contact_click' ? ['contact_channel', 'page_location', 'page_referrer', 'page_title', 'send_to'] : ['page_location', 'page_referrer', 'page_title', 'send_to']).sort());
    expect(event[2].page_referrer).toBe('');
  }
  for (const name of ['Console', 'Login', 'Demo', 'Review']) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page.locator('iframe')).toHaveCount(0);
    const count = f.requests.length;
    await page.waitForTimeout(250);
    expect(f.requests).toHaveLength(count);
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page.locator('iframe')).toHaveCount(1);
  }
  await page.evaluate(() => { document.cookie = '_ga=test; path=/; Secure'; document.cookie = '_ga_FIXTURE=test; path=/; Secure'; });
  await page.getByTestId('cookie-preferences-link').click();
  await expect(page.locator('iframe')).toHaveCount(1);
  await page.getByTestId('analytics-reject').click();
  await expect(page.getByTestId('cookie-preferences-link')).toBeFocused();
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.evaluate(() => document.cookie)).not.toContain('_ga');
  const count = f.requests.length;
  await page.waitForTimeout(300);
  expect(f.requests).toHaveLength(count);
  await page.reload();
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('a preview never loads Google even with forged enabled config; unavailable config stops an active runtime', async ({ page }) => {
  const preview = await setup(page, 'https://preview.replit.dev');
  await page.getByTestId('cookie-preferences-link').click();
  await expect(page.getByTestId('analytics-preferences')).toContainText('Le statistiche non sono attive.');
  await expect(page.getByTestId('analytics-accept')).toHaveCount(0);
  expect(preview.requests).toHaveLength(0);
  await page.unrouteAll();
  const f = await setup(page);
  await page.getByTestId('analytics-accept').click();
  await expect(page.locator('iframe')).toHaveCount(1);
  f.unavailable();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByTestId('cookie-preferences-link').click();
  await expect(page.getByTestId('analytics-accept')).toBeVisible();
});

test('existing choices survive config refresh and a new tab without renewing the timestamp; tabs synchronize both choices', async ({ page, context }) => {
  const f = await setup(page);
  await page.getByTestId('analytics-reject').click();
  const stored = await page.evaluate(() => localStorage.getItem('marenetto.cookies.v2'));
  await page.reload();
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByRole('link', { name: 'Servizi', exact: true }).click();
  await expect(page).toHaveURL(/\/servizi/);
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('marenetto.cookies.v2'))).toBe(stored);
  expect(f.requests).toHaveLength(0);
  const other = await context.newPage();
  const second = await setup(other);
  await expect(other.getByTestId('analytics-preferences')).toHaveCount(0);
  expect(await other.evaluate(() => localStorage.getItem('marenetto.cookies.v2'))).toBe(stored);
  await page.getByTestId('cookie-preferences-link').click();
  expect(await page.evaluate(() => localStorage.getItem('marenetto.cookies.v2'))).toBe(stored);
  await page.getByTestId('analytics-accept').click();
  await expect(other.locator('iframe')).toHaveCount(1);
  await expect(other.getByTestId('analytics-preferences')).toHaveCount(0);
  const accepted = await page.evaluate(() => localStorage.getItem('marenetto.cookies.v2'));
  await other.reload();
  await expect(other.locator('iframe')).toHaveCount(1);
  expect(await other.evaluate(() => localStorage.getItem('marenetto.cookies.v2'))).toBe(accepted);
  await other.getByTestId('cookie-preferences-link').click();
  await expect(other.locator('iframe')).toHaveCount(1);
  await other.getByTestId('analytics-reject').click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(other.locator('iframe')).toHaveCount(0);
  await expect(page.getByTestId('analytics-preferences')).toHaveCount(0);
  expect(second.requests.length).toBeGreaterThan(0);
  await other.close();
});

for (const choice of ['accepted', 'rejected']) {
  test(`a stored ${choice} choice expires in an open tab and does not renew on restore`, async ({ page }) => {
    const f = await setup(page);
    await page.getByTestId('analytics-reject').click();
    await page.evaluate(choice => {
      const v = JSON.parse(localStorage.getItem('marenetto.cookies.v2')!);
      localStorage.setItem('marenetto.cookies.v2', JSON.stringify({ ...v, statistics: choice === 'accepted', marketing: false, at: Date.now() - 180 * 86400000 + 1500 }));
    }, choice);
    await page.reload();
    if (choice === 'accepted') await expect(page.locator('iframe')).toHaveCount(1);
    else expect(f.requests).toHaveLength(0);
    await expect(page.getByTestId('analytics-preferences')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByTestId('analytics-accept')).toBeVisible();
  });
}
