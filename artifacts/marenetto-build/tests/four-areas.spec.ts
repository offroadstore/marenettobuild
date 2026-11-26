import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openPage, pillarEdition, projectRoot } from './source-fixtures';

type Edition = {id:string;locale:string;path:string;title:string;description:string;kind:string};
const manifest=JSON.parse(readFileSync(resolve(projectRoot,'dist/public/route-manifest.json'),'utf8'));
const entries=Object.values(manifest.editions) as Edition[];
const locales=['it','en','de','fr','nl','es','pt','ru','pl','sv','no','da','ar'];
const areas=['villas','outdoors','surfaces','investment'] as const;
const evidence=resolve(projectRoot,'../../generated-artifacts/four-areas/after/browser');
const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');

for(const locale of locales) for(const width of [390,1280]) {
  test(`commercial journey home → four pillars → article ${locale} ${width}`,async({page},testInfo)=>{
    test.setTimeout(60000);
    await page.setViewportSize({width,height:width===390?844:720});
    await page.route('**/api/**',route=>route.request().method()==='GET'?route.continue():route.abort('blockedbyclient'));
    const errors:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    const home=entries.find(e=>e.locale===locale&&e.id==='home')!;
    await openPage(page,home.path);
    await expect(page.locator('main h1')).toHaveCount(1);
    for(const area of areas) await expect(page.locator(`main a[href="${pillarEdition(locale,area).path}"]`).first()).toBeVisible();
    await expect(page.locator('[data-testid^="link-need-"]')).toHaveCount(3);
    await expect(page.locator('main .mbx-card')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.dir)).toBe(locale==='ar'?'rtl':'ltr');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect.poll(()=>page.locator('.fa-area img').evaluateAll(nodes=>nodes.every(node=>{
      const image=node as HTMLImageElement;return image.complete&&image.naturalWidth>0;
    })),{timeout:15000}).toBe(true);
    if(['it','de','nl','ar'].includes(locale)&&testInfo.project.name==='production-preview') {
      await page.screenshot({path:`${evidence}/home-${locale}-${width}.png`,fullPage:true});
    }
    for(const area of areas) {
      const pillar=entries.find(e=>e.locale===locale&&e.id===`pillar-${area}`)!;
      if(await page.getByTestId('button-menu').isVisible()) {
        await page.getByTestId('button-menu').click();
        await page.locator(`#mobile-nav a[href="${pillar.path}"]`).click();
      } else await page.locator(`.nav-links a[href="${pillar.path}"]`).click();
      await expect(page).toHaveURL(url=>url.pathname===pillar.path);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page).toHaveTitle(pillar.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',pillar.description);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://www.marenettobuild.com'+pillar.path);
      await expect(page.getByTestId('pillar-request')).toHaveCount(1);
      const cta=new URL((await page.getByTestId('pillar-request').getAttribute('href'))!,'https://www.marenettobuild.com');
      expect(cta.pathname).toBe(locale==='it'?'/richiesta':`/${locale}/request`);
      const images=await page.locator('main img').evaluateAll(nodes=>nodes.map(node=>{
        const img=node as HTMLImageElement;return {alt:img.alt,loaded:img.complete&&img.naturalWidth>0};
      }));
      expect(images.every(img=>img.loaded&&img.alt.length>10)).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // Initial no-JS HTML must contain exactly the same authored metadata and real anchors.
      const response=await page.request.get(pillar.path);
      expect(response.status()).toBe(200);
      const html=await response.text();
      expect(html).toContain(`<title>${escape(pillar.title)}</title>`);
      expect(html).toContain(`content="${escape(pillar.description)}"`);
      expect(html).toContain('data-testid="pillar-request"');
      if(['de','ar'].includes(locale)&&area==='investment'&&testInfo.project.name==='production-preview') {
        await page.screenshot({path:`${evidence}/pillar-${locale}-${width}.png`,fullPage:true});
      }
    }
    const article=entries.find(e=>e.locale===locale&&e.kind==='article'&&e.id==='comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali')!;
    expect(article).toBeTruthy();
    await openPage(page,article.path);
    await expect(page.getByTestId('article-area')).toHaveCount(1);
    await expect(page.getByTestId('article-pillar-link')).toHaveCount(1);
    const pillar=pillarEdition(locale,'investment');
    await expect(page.getByTestId('article-area').locator(`a[href="${pillar.path}"]`)).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(errors).toEqual([]);
  });
}

test('Arabic → German → Italian preserves identity, focus and document direction',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const arabic=pillarEdition('ar','investment');
  await openPage(page,arabic.path);
  for(const locale of ['de','it']) {
    await page.getByTestId('link-language').click();
    await page.locator(`.language-menu a[lang="${locale}"]`).click();
    await expect(page).toHaveURL(url=>url.pathname===pillarEdition(locale,'investment').path);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.dir)).toBe('ltr');
    await expect(page.locator('html')).toHaveAttribute('lang',locale==='it'?'it-IT':locale);
    const geometry=await page.evaluate(()=>({x:window.scrollX,width:document.documentElement.scrollWidth,viewport:innerWidth}));
    expect(geometry.x).toBe(0);
    expect(geometry.width).toBeLessThanOrEqual(geometry.viewport);
    await page.getByTestId('button-menu').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('button-menu')).toBeFocused();
  }
});

test('tablet menu keeps long labels readable without horizontal overflow',async({page},testInfo)=>{
  await page.setViewportSize({width:1000,height:800});
  for(const locale of ['it','de','nl','ar']) {
    await openPage(page,pillarEdition(locale,'villas').path);
    await expect(page.getByTestId('button-menu')).toBeVisible();
    await expect(page.locator('.topbar .nav-links')).toBeHidden();
    await page.getByTestId('button-menu').click();
    await expect(page.locator('.mobile-nav a')).toHaveCount(6);
    for(const link of await page.locator('.mobile-nav a').all())await expect(link).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(testInfo.project.name==='production-preview')await page.screenshot({
      path:`../../generated-artifacts/four-areas/after/browser/tablet-${locale}-1000.png`,fullPage:false,
    });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('button-menu')).toBeFocused();
  }
});
