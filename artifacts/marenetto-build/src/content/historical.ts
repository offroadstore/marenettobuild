import originalInventory from './historical/index.json';
import amendments from './historical-editorial/manifest.json';

type Correction = { sourceSHA256: string; contentLanguage: string; claims: number[]; authorization: string; linguisticReview: string; publicationApproved: boolean };
const corrections = amendments.pages as Record<string, Correction>;
const inventory = originalInventory.map(page => {
  const correction = corrections[page.key] ?? null;
  if (correction && (correction.sourceSHA256 !== page.sourceSHA256 || correction.publicationApproved)) throw new Error(`Invalid historical correction authorization: ${page.path}`);
  return { ...page, contentLanguage: correction?.contentLanguage ?? page.contentLanguage, editorialCorrection: correction };
});

export type HistoricalPage = typeof inventory[number];
type Document = { html: string; title: string; description: string; publishedOn: string | null; dateLabel: string | null; image: string | null; imageAlt: string; imageCaption: string | null };
const catalogs = import.meta.glob<{ default: Record<string, Document> }>('./historical/*.json');
const correctedCatalogs = import.meta.glob<{ default: Record<string, Document> }>('./historical-editorial/*.json');
const loaded = new Map<string, Record<string, Document>>();
const pending = new Map<string, Promise<void>>();
export const historicalInventory = inventory;
export const restoredPages = inventory.filter(page => page.state === 'restored' || page.editorialCorrection);
export const pathKey = (path: string) => path.replace(/\/+$/, '') || '/';
export function historicalPage(path: string) {
  return restoredPages.find(page => page.key === pathKey(path));
}
export function historicalPending(path: string) {
  return inventory.find(page => page.key === pathKey(path) && page.state === 'awaiting-confirmation');
}
export function historicalArticleForPreview(path: string) {
  return inventory.find(page => page.key === pathKey(path) && page.kind === 'article' && page.state === 'awaiting-confirmation');
}
export function historicalLoaded(locale: string) {
  return !catalogs[`./historical/${locale}.json`] || loaded.has(locale);
}
export function loadHistorical(locale: string): Promise<void> {
  const loader = catalogs[`./historical/${locale}.json`];
  if (!loader || loaded.has(locale)) return Promise.resolve();
  if (!pending.has(locale)) pending.set(locale, (async () => {
    const [original, corrected] = await Promise.all([loader(), correctedCatalogs[`./historical-editorial/${locale}.json`]?.()]);
    for (const key of Object.keys(corrected?.default ?? {})) {
      if (!original.default[key] || !corrections[key]) throw new Error(`Unregistered editorial correction: ${locale}:${key}`);
    }
    loaded.set(locale, { ...original.default, ...corrected?.default });
  })().catch(error => { pending.delete(locale); throw error; }));
  return pending.get(locale)!;
}
export function historicalDocument(page: HistoricalPage) {
  const document = loaded.get(page.locale)?.[page.key];
  if (!document) throw new Error(`Historical document not loaded: ${page.path}`);
  return document;
}
export function historicalNavigation(locale: string, page: string) {
  const family = ({ home: '/', services: '/general-contractor', articles: '/articoli', process: '/chi-siamo', contact: '/contatti' } as Record<string, string>)[page];
  return family ? restoredPages.find(original => original.locale === locale && original.family === family)?.path : undefined;
}
