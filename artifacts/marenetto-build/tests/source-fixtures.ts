import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';

export const projectRoot = resolve(import.meta.dirname, '..');
export function pillarEdition(locale: string, area: 'villas'|'outdoors'|'surfaces'|'investment') {
  const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'dist/public/route-manifest.json'), 'utf8'));
  const entry = (Object.values(manifest.editions) as {id:string;locale:string;path:string}[])
    .find(e => e.locale === locale && e.id === `pillar-${area}`);
  if (!entry) throw new Error(`Missing built pillar: ${locale}:${area}`);
  return entry;
}
export type SourcePage = {
  path: string; key: string; family: string; locale: string;
  h1: string; kind: string; state: string; contentLanguage: string; editorialCorrection?: unknown;
};
const corrections = JSON.parse(readFileSync(resolve(projectRoot, 'src/content/historical-editorial/manifest.json'), 'utf8')).pages;
const migratedMedia: Record<string, string> = JSON.parse(readFileSync(resolve(projectRoot, 'src/content/historical-media.json'), 'utf8'));
// Only these two acquired covers already use these WebP derivatives. Keep this
// fixture independent of the production resolver and pin the actual output
// bytes so a replacement photograph cannot silently pass as an optimization.
const approvedWebp: Record<string, { path: string; sha256: string }> = {
  '/api/historical-media/efd6e76bd864df306bde2e7d0d02c0bbbd21ef0dac17c26a4e34bd3b2b6e8377.png': {
    path: '/media/optimized-historical/efd6e76bd864df306bde2e7d0d02c0bbbd21ef0dac17c26a4e34bd3b2b6e8377.webp',
    sha256: 'baa030604150aee911e5b425aace3aeb13a9874178fdda65bd80aa16d133c584',
  },
  '/api/historical-media/0d54c619c311c74cbf6047aed8c6c325410850dc12012731823955c588b21e51.png': {
    path: '/media/optimized-historical/0d54c619c311c74cbf6047aed8c6c325410850dc12012731823955c588b21e51.webp',
    sha256: '1740d766825c2dbaa661a9a74f58c12f4ddc34982c6c48dd9cdd00e4e49c6864',
  },
};
const checkedWebp = new Set<string>();
export function expectedMediaURL(url: string | null): string | null {
  if (!url) return null;
  const migrated = migratedMedia[url] ?? url;
  const optimized = approvedWebp[migrated];
  if (!optimized) return migrated;
  if (!checkedWebp.has(optimized.path)) {
    const bytes = readFileSync(resolve(projectRoot, 'public', optimized.path.slice(1)));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), optimized.sha256);
    checkedWebp.add(optimized.path);
  }
  return optimized.path;
}
export const originals: SourcePage[] = JSON.parse(readFileSync(resolve(projectRoot, 'src/content/historical/index.json'), 'utf8')).map((row: SourcePage) => ({
  ...row, contentLanguage: corrections[row.key]?.contentLanguage ?? row.contentLanguage, editorialCorrection: corrections[row.key],
}));
export function sourceHome(locale: string) {
  const found = originals.find(row => row.locale === locale && row.family === '/');
  if (!found) throw new Error(`No recovered source home: ${locale}`);
  return found;
}
export function sourceDocument(row: SourcePage): { html: string; image: string | null; imageAlt: string } {
  if (row.editorialCorrection) return JSON.parse(readFileSync(resolve(projectRoot, `src/content/historical-editorial/${row.locale}.json`), 'utf8'))[row.key];
  return JSON.parse(readFileSync(resolve(projectRoot, `src/content/historical/${row.locale}.json`), 'utf8'))[row.key];
}
export function sourceArticleCovers(locale: string): Record<string, string> {
  const catalog = JSON.parse(readFileSync(resolve(projectRoot, `src/content/historical/${locale}.json`), 'utf8'));
  return Object.fromEntries(originals.filter(row => row.locale === locale && row.kind === 'article')
    .flatMap(row => catalog[row.key]?.image ? [[row.key, catalog[row.key].image]] : []));
}
export async function openPage(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  return response;
}
