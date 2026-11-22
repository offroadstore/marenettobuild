import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(new URL('../package.json', import.meta.url));
const { build } = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const result = await build({
  entryPoints: [fileURLToPath(new URL('../src/components/home/GoogleReviews.tsx', import.meta.url))],
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false, jsx: 'automatic',
  alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
});
const module = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
const { GoogleReviews } = module.exports;

const locales = JSON.parse(await readFile(new URL('../src/localization/locales.json', import.meta.url), 'utf8'));
for (const locale of locales.map(item => item.code)) {
  test(`Google reviews ${locale}: external link only, no copied review data or embeds`, () => {
    const html = renderToStaticMarkup(React.createElement(GoogleReviews, { locale }));
    assert.match(html, /data-testid="google-reviews-link"/);
    assert.match(html, /target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /https:\/\/www\.google\.com\/maps\/search\//);
    assert.match(html, /query=Marenetto%20Build%20Cefal%C3%B9/);
    assert.doesNotMatch(html, /Hannah|Salvatore|Sal G\b|list-reviewers/);
    assert.doesNotMatch(html, /<(iframe|script|img)\b|AggregateRating|"@type":\s*"Review"/);
    if (locale === 'it') assert.match(html, /Leggi le recensioni dei nostri clienti su Google/);
    else assert.doesNotMatch(html, /Leggi le recensioni/);
  });
}
