import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';

export const projectRoot = resolve(import.meta.dirname, '..');
export type SourcePage = {
  path: string; key: string; family: string; locale: string;
  h1: string; kind: string; state: string; contentLanguage: string; editorialCorrection?: unknown;
};
const corrections = JSON.parse(readFileSync(resolve(projectRoot, 'src/content/historical-editorial/manifest.json'), 'utf8')).pages;
const migratedMedia: Record<string, string> = JSON.parse(readFileSync(resolve(projectRoot, 'src/content/historical-media.json'), 'utf8'));
// Moving original bytes to persistent storage is an intentional URL change,
// not a photographic substitution. Keep the raw source fixtures unchanged.
export function expectedMediaURL(url: string | null): string | null {
  return url ? migratedMedia[url] ?? url : null;
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
export async function openPage(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  return response;
}
