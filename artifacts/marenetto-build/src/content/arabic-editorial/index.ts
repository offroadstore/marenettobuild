import { buildingArticles } from './building';
import { finishesArticles } from './finishes';
import { outdoorArticles } from './outdoor';
export type { ArabicEditorialArticle } from './types';

/** Professional MSA adaptations, with Gulf readers in mind; AI-assisted review.
 * These are new compositions, not fabricated recovered Arabic originals.
 * Unsupported absolute claims in the historical source are explicitly qualified.
 */
export const ARABIC_EDITORIAL_ARTICLES = [...buildingArticles, ...finishesArticles, ...outdoorArticles];
export const arabicEditorialPath = (slug: string) => `/ar/articles/${slug}`;
export const arabicEditorialByPath = (path: string) => ARABIC_EDITORIAL_ARTICLES.find(
  article => arabicEditorialPath(article.slug) === path.replace(/\/+$/, ''),
);
