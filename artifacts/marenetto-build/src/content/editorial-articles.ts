import { articles as originals, type Article } from './articles';
import { useActiveEditorial } from '../lib/editorial-runtime';
import { historicalPage } from './historical';
import { articlePath } from '../localization/paths';
export function useEditorialArticles(locale: string): Article[] {
  const active = useActiveEditorial().filter(e => e.kind === 'article' && e.locale === locale);
  const withdrawn = new Set(active.filter(e => e.revisionId === 'withdrawn').map(e => e.identity));
  const catalog = new Map(originals.filter(article => !withdrawn.has(article.slug)).map(article => {
    const native = historicalPage(articlePath(locale, article.slug));
    return [article.slug, native ? { ...article, title: native.h1, summary: native.description } : article];
  }));
  for (const edition of active.filter(e => e.revisionId !== 'withdrawn')) {
    const c = edition.content;
    const previous = catalog.get(edition.identity);
    catalog.set(edition.identity, { ...previous, slug: edition.identity, title: c.title, originalTitle: previous?.originalTitle ?? c.title, summary: c.summary, category: c.category as Article['category'], publishedOn: previous?.publishedOn ?? null, reviewStatus: previous?.reviewStatus ?? 'summary-reviewed', review: previous?.review ?? { responsible: null, reviewedAt: null, sources: [] }, approvedFullText: null, isGuide: Boolean(c.guide) || previous?.isGuide || false, image: c.image, imageAlt: c.imageAlt, overview: [c.body.replace(/<[^>]*>/g,' ')], questions: [], claimsToReview: [] });
  }
  return [...catalog.values()];
}
