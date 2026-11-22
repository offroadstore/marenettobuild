import originalInventory from './historical/index.json';
import amendments from './historical-editorial/manifest.json';
import mediaData from './historical-media.json';
import sourceUpdateData from './historical-source-updates.json';
import { recoverArticleThumbnails } from './historical-thumbnails';
import { normalizePublicContact } from '@/config/contact';

type SourceUpdate = { oldLabel: string; newLabel: string; title: string; sourceSHA256: string; bodySHA256: string; acquiredAt: string; sourceBody: string };
const sourceUpdates = sourceUpdateData as Record<string, SourceUpdate>;

const media = mediaData as Record<string, string>;
const optimizedMedia: Record<string, string> = {
  '/api/historical-media/efd6e76bd864df306bde2e7d0d02c0bbbd21ef0dac17c26a4e34bd3b2b6e8377.png': '/media/optimized-historical/efd6e76bd864df306bde2e7d0d02c0bbbd21ef0dac17c26a4e34bd3b2b6e8377.webp',
  '/api/historical-media/0d54c619c311c74cbf6047aed8c6c325410850dc12012731823955c588b21e51.png': '/media/optimized-historical/0d54c619c311c74cbf6047aed8c6c325410850dc12012731823955c588b21e51.webp',
};
const localMedia = (value: string) => optimizedMedia[media[value] ?? value] ?? media[value] ?? value;
const historicalLogos = new Set(Object.entries(media).filter(([source]) => source.includes('/img/logos/')).map(([, target]) => localMedia(target)));
function localMediaHTML(html: string) {
  html = normalizePublicContact(html);
  html = html.replace(/href="\/contatos\/?"/g, 'href="/pt/contatti/"');
  // Keep words, alt and caption untouched. Replace only exact inventoried URLs.
  for (const [source, destination] of Object.entries(media).sort((a, b) => b[0].length - a[0].length)) {
    html = html.replaceAll(source.replaceAll('&', '&amp;'), destination).replaceAll(source, destination);
  }
  for (const [source, destination] of Object.entries(optimizedMedia)) html = html.replaceAll(source, destination);
  // Local filenames are hashes: retain the logo's role after URL replacement.
  return html.replace(/<img\b[^>]*>/gi, tag => {
    if (/^<img\s*\/?>$/i.test(tag)) return '';
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
    return src && historicalLogos.has(src) ? tag.replace(/^<img\b/i, '<img data-historical-logo=""') : tag;
  });
}

type Correction = { sourceSHA256: string; contentLanguage: string; claims: number[]; authorization: string; linguisticReview: string; publicationApproved: boolean };
const corrections = amendments.pages as Record<string, Correction>;
const inventory = originalInventory.map(page => {
  const correction = corrections[page.key] ?? null;
  if (correction && (correction.sourceSHA256 !== page.sourceSHA256 || correction.publicationApproved)) throw new Error(`Invalid historical correction authorization: ${page.path}`);
  const update = sourceUpdates[page.key];
  return { ...page, blockedBy: page.blockedBy.map(normalizePublicContact),
    ...(update ? { title: update.title, h1: update.newLabel, sourceSHA256: update.sourceSHA256, bodySHA256: update.bodySHA256, acquiredAt: update.acquiredAt } : {}),
    contentLanguage: correction?.contentLanguage ?? page.contentLanguage, editorialCorrection: correction };
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
    const covers = Object.fromEntries(inventory.filter(page => page.locale === locale && page.kind === 'article')
      .flatMap(page => {
        const image = original.default[page.key]?.image;
        return image ? [[page.key, image]] : [];
      }));
    loaded.set(locale, Object.fromEntries(Object.entries({ ...original.default, ...corrected?.default }).map(([key, document]) => {
      const update = sourceUpdates[key];
      // Dated public-source corrections are separate from the immutable catalogs.
      // Only the two literal labels independently recovered in full are updated.
      if (update && document.html.split(update.oldLabel).length !== 3) throw new Error(`Source update no longer applies unambiguously: ${key}`);
      return [key, {
        ...document, title: normalizePublicContact(update?.newLabel ?? document.title),
        description: normalizePublicContact(document.description),
        imageAlt: normalizePublicContact(document.imageAlt),
        imageCaption: document.imageCaption ? normalizePublicContact(document.imageCaption) : null,
        html: localMediaHTML(recoverArticleThumbnails(update ? document.html.replaceAll(update.oldLabel, update.newLabel) : document.html, covers)),
        image: document.image ? localMedia(document.image) : null,
      }];
    })));
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
