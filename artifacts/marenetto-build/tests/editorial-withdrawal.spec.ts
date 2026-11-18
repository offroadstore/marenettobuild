import { test, expect } from '@playwright/test';
import { originals, openPage } from './source-fixtures';

const withdrawn = originals.find(row => row.locale === 'it' && row.kind === 'article' && row.state === 'restored')!;

test('cold private shell cannot reveal a withdrawn article while publication state is loading or unavailable', async ({ page }) => {
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/editorial/active', async route => {
    await waiting;
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Synthetic editorial outage"}' });
  });
  try {
    await openPage(page, '/owner-demo');
    await expect(page.locator('#editorial-active')).toHaveCount(0);
    let documentRequests = 0;
    page.on('request', request => { if (request.isNavigationRequest() && new URL(request.url()).pathname === withdrawn.path) documentRequests++; });
    await page.evaluate(target => {
      history.pushState(null, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, withdrawn.path);
    await expect(page.getByTestId('editorial-state')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('main')).not.toContainText(withdrawn.h1);
    release();
    await expect(page.getByRole('heading', { name: 'Contenuti temporaneamente non disponibili' })).toBeVisible();
    await expect(page.locator('main')).not.toContainText(withdrawn.h1);
    expect(documentRequests).toBe(0);
  } finally { release(); }
});

test('a verified withdrawal marker also prevents client navigation from showing the historical body', async ({ page }) => {
  await page.route('**/api/editorial/active', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify([{
      identity:'synthetic-withdrawal',locale:'it',path:withdrawn.path,kind:'article',revisionId:'withdrawn',
      content:{title:'Contenuto ritirato',summary:'',body:'',contentLanguage:'it',category:'',tags:[],image:'',imageAlt:'',sources:[],seoTitle:'',seoDescription:''},
    }]),
  }));
  const activeResponse = page.waitForResponse(response => response.url().endsWith('/api/editorial/active') && response.status() === 200);
  await openPage(page, '/owner-demo');
  // Wait for the real runtime request, rather than setting browser globals.
  await activeResponse;
  await page.evaluate(target => {
    history.pushState(null, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, withdrawn.path);
  await expect(page.getByRole('heading', { name: /404/ })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(withdrawn.h1);
});
