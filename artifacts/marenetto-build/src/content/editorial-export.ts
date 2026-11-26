import { articles } from './articles';
import { historicalInventory, loadHistorical, historicalDocument } from './historical';
import { editions, redirects, excludedRoutes } from '../localization/edition-inventory';
import { LOCALES } from '../localization/locales';
import { render } from '../entry-server';
import { NETWORK_PAGES } from './network';
import { networkCMSRecord } from './network/cms';
import { regulatoryNotice } from './network/regulatory-notice';
import { networkCopy, networkImages } from './network';
import { areaCopy, areaPath, type AreaId } from './four-areas';

/** Reuse the approved area routes, translated notices and authorized image inventory. */
export function exportSeriesContext() {
  return Object.fromEntries(['it','en','de','nl','fr','es','pt','pl','ru','sv','no','da'].map(locale => {
    const copy = networkCopy(locale);
    return [locale, {
      notice: regulatoryNotice(locale),
      areas: Object.fromEntries((['villas','outdoors','surfaces','investment'] as AreaId[]).map(id => [id, {
        path: areaPath(locale, id), title: areaCopy(locale).areas[id].nav,
      }])),
      images: Object.fromEntries(['design','outdoors','bespoke','buying'].map(id => {
        const key = id as 'design' | 'outdoors' | 'bespoke' | 'buying';
        const image = networkImages(key)[0];
        return [id, {src: image.src, alt: copy.articles[key].imageAlts[0]}];
      })),
    }];
  }));
}

// Build-time import only. The API bundles this snapshot, never reads or writes
// frontend source files at request time.
export async function exportEditorialCatalog() {
  const records = [];
  const families: Record<string, string> = { '/': 'home', '/chi-siamo': 'process', '/contatti': 'contact', '/articoli': 'articles', '/general-contractor': 'services' };
  for (const locale of LOCALES) await loadHistorical(locale.code);
  const identity = (family: string) => families[family] ?? family.replace(/^\//, '');
  const content = (title: string, summary: string, body: string, language: string, extra = {}) => ({
    title, summary, body, contentLanguage: language, category: '', tags: [], image: '', imageAlt: '', sources: [], seoTitle: title, seoDescription: summary, ...extra,
  });
  for (const original of historicalInventory) {
    const doc = historicalDocument(original);
    records.push({
      identity: identity(original.family), locale: original.locale, path: original.path,
      kind: original.kind === 'article' ? 'article' : 'page',
      historical: true, correction: Boolean(original.editorialCorrection),
      content: content(original.h1, doc.description, doc.html, original.contentLanguage, { image: doc.image ?? '', imageAlt: doc.imageAlt }),
      originalKey: original.key, originalMetadata: original,
    });
  }
  for (const edition of editions) {
    if (edition.kind === 'legal') continue; // Immutable owner-supplied texts, not CMS drafts.
    const id = edition.id.startsWith('historical:') ? identity(edition.id.slice(11)) : edition.id;
    const existing = records.find(record => record.identity === id && record.locale === edition.locale);
    const article = articles.find(article => article.slug === id);
    if (article) {
      const escaped = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      const body = (article.approvedFullText ?? article.overview.join('\n\n')).split(/\n\s*\n/).map(block => block.startsWith('## ') ? `<h2>${escaped(block.slice(3))}</h2>` : `<p>${escaped(block)}</p>`).join('');
      const rework = content(article.title, article.summary, body, 'it', { category: article.category, image: article.image, imageAlt: article.imageAlt, sources: article.review.sources.map(({ title, url }) => ({ title, url })) });
      if (existing) Object.assign(existing, { rework });
      else records.push({ identity: id, locale: edition.locale, path: edition.path, kind: 'article', historical: false, correction: false, content: rework });
    } else if (!edition.id.startsWith('historical:')) {
      const result = await render(`/__localization-review/${edition.locale}/${edition.id}`, edition.locale);
      // Keep narrative markup; interactive controls remain the live site's job.
      const body = result.body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
      const composition = content(edition.title, edition.description, body, edition.contentLanguage);
      if (existing) Object.assign(existing, { rework: composition, aliases: edition.path.replace(/\/+$/,'') !== existing.path.replace(/\/+$/,'') ? [edition.path] : [] });
      else records.push({ identity: id, locale: edition.locale, path: edition.path, kind: 'page', historical: false, correction: false, content: composition });
    }
  }
  // Seed drafts with per-language immutable revisions, never activeRevisionId.
  // Normal deployments import them for the existing private CMS only.
  for (const page of NETWORK_PAGES) {
    const record = networkCMSRecord(page);
    const existing: number = records.findIndex(r => r.identity === record.identity && r.locale === record.locale);
    if (existing >= 0) records[existing] = record;
    else records.push(record);
  }
  return { locales: LOCALES.map(locale => locale.code), records, reservedPaths: [...editions.map(e => e.path), ...NETWORK_PAGES.map(page => page.path), ...Object.keys(redirects), ...excludedRoutes.map(route => route.path)] };
}
