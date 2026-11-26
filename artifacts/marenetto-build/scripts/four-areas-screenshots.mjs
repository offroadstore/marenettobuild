import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

// Static evidence only: no clicks, forms, cookies, flags or POST requests.
const root=new URL('../../../generated-artifacts/four-areas/',import.meta.url);
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],
  ...(existsSync('/repl/tools/bin/chromium')?{executablePath:'/repl/tools/bin/chromium'}:{})});
const captures=[
  ['/',1280,720,'after/home-desktop.jpg'],
  ['/',390,844,'after/home-mobile.jpg'],
  ['/de/',1280,1200,'visual-inspection/home-de-desktop.jpg'],
  ['/ar/',390,844,'visual-inspection/home-ar-mobile.jpg'],
  ['/de/kaufen-sanieren-vermieten-cefalu',390,844,'visual-inspection/pillar-de-mobile.jpg'],
  ['/ar/buy-renovate-rent-cefalu',390,844,'visual-inspection/pillar-ar-mobile.jpg'],
];
const results=[];
try {
  for(const [path,width,height,destination] of captures) {
    const context=await browser.newContext({locale:'en-US',viewport:{width,height}});
    const page=await context.newPage();
    const response=await page.goto('http://127.0.0.1:80'+path,{waitUntil:'domcontentloaded'});
    if(response.status()!==200)throw new Error(`Screenshot ${path}: HTTP ${response.status()}`);
    await page.waitForFunction(()=>document.documentElement.dataset.hydrated==='true');
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>{
      const images=[...document.querySelectorAll('main img')];
      return images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0);
    },null,{timeout:30000});
    const file=new URL(destination,root);
    await mkdir(new URL('./',file),{recursive:true});
    await page.screenshot({path:fileURLToPath(file),type:'jpeg',quality:88,fullPage:true});
    results.push({path,width,height,destination,locale:'en-US',fullPage:true,
      images:await page.locator('main img').count(),date:new Date().toISOString()});
    await context.close();
  }
  await writeFile(new URL('after/screenshots-context.json',root),JSON.stringify({
    method:'Static read-only captures; document hydrated, local fonts ready and every main image decoded before capture',
    captures:results,
  },null,2));
} finally {await browser.close();}
