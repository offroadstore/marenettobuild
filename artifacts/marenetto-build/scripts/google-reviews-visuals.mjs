// Static screenshot checks only: synthetic markup, no live Google calls or browser interactions.
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const app = path.resolve(import.meta.dirname, '..');
const out = path.resolve(app, '../../generated-artifacts/google-reviews');
await mkdir(out, { recursive: true });
const renderer = path.join(out, 'visual-renderer.mjs');
await build({
  stdin: {
    contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { GoogleReviewsView } from './src/components/home/GoogleReviews';
      export function render(locale) {
        return renderToStaticMarkup(<GoogleReviewsView locale={locale} data={{
          rating:3.8, userRatingCount:47, googleMapsUri:'https://maps.google.com/?cid=fixture',
          writeReviewUri:'https://www.google.com/maps/fixture/write', attributions:[],
          reviews:[2,5,1,4,3].map((rating,i)=>({
            rating, text:'RECENSIONE SIMULATA '+(i+1)+'\\nTesto originale di prova, non una recensione reale. Spazi, accenti e righe restano invariati.',
            languageCode:'it', authorName:'Autore simulato '+(i+1),
            authorUri:'https://www.google.com/maps/contrib/fixture'+i,
            googleMapsUri:'https://www.google.com/maps/reviews/fixture'+i,
            photoDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='
          }))
        }} />);
      }`,
    resolveDir: app, loader: 'tsx',
  },
  outfile: renderer, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic',
  define: { 'import.meta.env.BASE_URL': '"/"' },
  banner: { js: "import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);" },
});
const { render } = await import(pathToFileURL(renderer));
const css = await readFile(path.join(app, 'src/styles/home.css'), 'utf8');
const logo = await readFile(path.join(app, 'public/images/google-maps-attribution.svg'));
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined);
const browser = await chromium.launch({ headless: true, executablePath });
const requests = [];
const page = await browser.newPage();
await page.route('**/*', route => { requests.push(route.request().url()); return route.abort(); });
try {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da']) {
      const markup = render(locale).replaceAll('/images/google-maps-attribution.svg', `data:image/svg+xml;base64,${logo.toString('base64')}`);
      await page.setContent(`<!doctype html><html lang="${locale}"><meta charset="utf-8"><style>
        :root { --mb-ink:#192a39; --mb-ink-2:#4c5660; --mb-font:Arial,sans-serif; }
        * { box-sizing:border-box; } body { margin:0; background:#f6f4f0; color:#192a39; font-family:Arial,sans-serif; }
        main { max-width:1100px; margin:auto; padding:24px; } .sample { max-width:620px; }
        a { color:inherit; } ${css}
        </style><main><p>SIMULAZIONE — nessuna recensione reale</p><div class="sample">${markup}</div></main></html>`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} overflows at ${width}`);
      assert.equal(await page.locator('blockquote').count(), 5);
      assert.equal(await page.locator('img[alt="Google Maps"]').evaluate(image => image.naturalWidth), 98, 'Official logo must load');
      if (locale === 'it' && width !== 320) await page.screenshot({ path: path.join(out, `simulated-${width}.png`), fullPage: true });
    }
  }
  assert.deepEqual(requests, [], 'Static review block must not request third-party assets');
  console.log('Static screenshots saved; no overflow in 12 locales at 320/390/1440px; no third-party requests.');
} finally { await browser.close(); }
