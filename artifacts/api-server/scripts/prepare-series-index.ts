// Build-only compiler: no database, authentication or network imports.
import { readFile, writeFile } from 'node:fs/promises';
import { fingerprint, validateContent } from '../src/lib/editorial-content';
import { refineSeries } from '../../../docs/editorial/release-2026-11/refinements.mjs';
const catalog = JSON.parse(await readFile(`${process.env.EDITORIAL_BUILD_ROOT??'generated-artifacts/editorial'}/catalog.json`, 'utf8'));
if (fingerprint(catalog.seriesDrafts) !== catalog.seriesRelease.contentDigest) throw new Error('Series digest mismatch');
const refined = refineSeries(catalog.seriesDrafts);
const records = refined.map((seed: any, index: number) => {
  const content = validateContent(seed.content, catalog.locales);
  const italian = refined.find((s: any) => s.identity === seed.identity && s.locale === 'it');
  return { identity: seed.identity, locale: seed.locale, path: seed.path, episode: content.guide!.episode,
    hash: fingerprint(content), sourceHash: fingerprint(validateContent(italian.content, catalog.locales)),
    ...(seed.seoTitle ? {seoTitle:seed.seoTitle} : {}),
    ...(seed.path !== catalog.seriesDrafts[index].path ? {oldPath:catalog.seriesDrafts[index].path} : {}) };
});
const target='artifacts/marenetto-build/src/content/series-release-index.json';
const compiled=JSON.stringify({ ...catalog.seriesRelease, records }, null, 2) + '\n';
const current=await readFile(target,'utf8');
if (current !== compiled) {
  if (process.argv.includes('--check')) throw new Error('Indice pubblico serie non allineato: rigenerare e collaudare prima del rilascio.');
  await writeFile(target,compiled);
}
