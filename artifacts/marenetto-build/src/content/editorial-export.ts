import { articles } from './articles';
import { historicalInventory, loadHistorical, historicalDocument } from './historical';
import { editions, redirects, excludedRoutes } from '../localization/edition-inventory';
import { LOCALES } from '../localization/locales';
import { render } from '../entry-server';

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
  return { locales: LOCALES.map(locale => locale.code), records, reservedPaths: [...editions.map(e => e.path), ...Object.keys(redirects), ...excludedRoutes.map(route => route.path)] };
}
