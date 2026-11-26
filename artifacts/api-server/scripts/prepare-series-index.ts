// Build-only compiler: no database, authentication or network imports.
import { readFile, writeFile } from 'node:fs/promises';
import { fingerprint, validateContent } from '../src/lib/editorial-content';
const catalog = JSON.parse(await readFile('generated-artifacts/editorial/catalog.json', 'utf8'));
if (fingerprint(catalog.seriesDrafts) !== catalog.seriesRelease.contentDigest) throw new Error('Series digest mismatch');
const records = catalog.seriesDrafts.map((seed: any) => {
  const content = validateContent(seed.content, catalog.locales);
  const italian = catalog.seriesDrafts.find((s: any) => s.identity === seed.identity && s.locale === 'it');
  return { identity: seed.identity, locale: seed.locale, path: seed.path, episode: content.guide!.episode,
    hash: fingerprint(content), sourceHash: fingerprint(validateContent(italian.content, catalog.locales)) };
});
const target='artifacts/marenetto-build/src/content/series-release-index.json';
const compiled=JSON.stringify({ ...catalog.seriesRelease, records }, null, 2) + '\n';
const current=await readFile(target,'utf8');
if (current !== compiled) {
  if (process.argv.includes('--check')) throw new Error('Indice pubblico serie non allineato: rigenerare e collaudare prima del rilascio.');
  await writeFile(target,compiled);
}
