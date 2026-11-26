import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {LEGAL_VERSION} from '../src/content/legal';
import {setWebSecurityHeaders} from '../scripts/security-policy.mjs';
test('actual preference UI isolates external media, persists consent and removes player on revocation',async({page})=>{
  // Use an allowlisted public origin, but intercept EVERY request locally.
  // Preview hosts intentionally cannot collect or restore consent.
  const origin='https://www.marenettobuild.com',requests:string[]=[],errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  const bundle=await build({entryPoints:[resolve(import.meta.dirname,'series-browser.fixture.tsx')],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',tsconfig:resolve(import.meta.dirname,'../tsconfig.json'),loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"test"','import.meta.env.BASE_URL':'"/"'}});
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='www.youtube-nocookie.com'){
      requests.push(url.href);
      return route.fulfill(url.pathname==='/heartbeat'?{status:204}:{contentType:'text/html',body:'<!doctype html><title>Synthetic player</title><p>Test-only player</p><script>setInterval(()=>fetch("/heartbeat"),50)</script>'});
    }
    if(url.origin!==origin){requests.push(url.href);return route.abort();}
    if(url.pathname==='/fixture.js')return route.fulfill({contentType:'application/javascript',body:bundle.outputFiles[0].text});
    if(url.pathname==='/api/editorial/active'){
      const edition=await page.evaluate(()=> (window as unknown as {testEdition:unknown}).testEdition);
      return route.fulfill({json:edition?[edition]:[]});
    }
    if(url.pathname==='/api/monitoring/public')return route.fulfill({json:{enabled:false}});
    if(url.pathname.startsWith('/media/'))return route.fulfill({contentType:'image/gif',body:Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64')});
    const headers:Record<string,string>={};setWebSecurityHeaders({setHeader:(key:string,value:string)=>{headers[key]=value;},removeHeader:()=>{}});
    return route.fulfill({contentType:'text/html',headers,body:'<!doctype html><meta name="robots" content="noindex"><div id="root"></div><script src="/fixture.js"></script>'});
  });
  await page.goto(origin);
  await expect(page.getByTestId('analytics-reject')).toBeVisible();
  await expect(page.getByText('Reviewed transcript fixture. Never published.')).toBeVisible();
  expect(requests).toEqual([]);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByTestId('analytics-reject').click();
  await page.reload();
  await expect(page.getByTestId('external-media-local')).toBeVisible();
  expect(requests).toEqual([]);
  await page.getByRole('button',{name:'Preferenze media esterni',exact:true}).click();
  await page.getByTestId('consent-external-media').check();
  await page.getByTestId('cookie-save').click();
  await expect(page.getByTestId('youtube-player')).toHaveCount(1);
  await expect.poll(()=>requests.length).toBeGreaterThan(1);
  expect(await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('marenetto.cookies.v2')!);return [x.statistics,x.marketing,x.externalMedia];})).toEqual([false,false,true]);
  await page.reload();
  await expect(page.getByTestId('youtube-player')).toHaveCount(1);
  // Verify the loaded player and keyboard-accessible preference entry. In this
  // unstyled fixture Chromium delivered the coordinate click inside the frame
  // (no parent click event); do not replace the real control with a custom event.
  await expect(page.frameLocator('[data-testid="youtube-player"]').getByText('Test-only player')).toBeVisible();
  await page.getByTestId('cookie-preferences-link').focus();
  await page.getByTestId('cookie-preferences-link').press('Enter');
  await expect(page.getByTestId('consent-external-media')).toBeVisible();
  await page.getByTestId('consent-external-media').uncheck();
  await page.getByTestId('cookie-save').click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByText('Reviewed transcript fixture. Never published.')).toBeVisible();
  await page.waitForTimeout(150);const stopped=requests.length;await page.waitForTimeout(250);expect(requests.length).toBe(stopped);
  await page.screenshot({path:resolve(import.meta.dirname,'../../../generated-artifacts/costruire-cefalu-madonie/browser-revoked.png'),fullPage:true});
  // A legacy analytics grant does not grant the newly introduced category.
  await page.evaluate(version=>localStorage.setItem('marenetto.cookies.v2',JSON.stringify({schema:2,version,at:Date.now(),statistics:true,marketing:false})),LEGAL_VERSION);
  await page.reload();await expect(page.getByTestId('external-media-local')).toBeVisible();await expect(page.locator('iframe')).toHaveCount(0);
  // Expiry and cross-document revocation must unload an already present frame.
  await page.getByRole('button',{name:'Preferenze media esterni',exact:true}).click();await page.getByTestId('consent-external-media').check();await page.getByTestId('cookie-save').click();
  await expect(page.getByTestId('youtube-player')).toHaveCount(1);
  await page.evaluate(()=>{const key='marenetto.cookies.v2',value=JSON.parse(localStorage.getItem(key)!);localStorage.setItem(key,JSON.stringify({...value,at:0}));window.dispatchEvent(new StorageEvent('storage',{key}));});
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.goto(origin+'/?placeholder');
  await expect(page.getByText('Video non ancora disponibile')).toBeVisible();
  await page.getByTestId('cookie-preferences-link').click();
  await expect(page.getByTestId('consent-external-media')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(errors).toEqual([]);
});
