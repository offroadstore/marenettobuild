import pages from './public-pages.json';
import originals from '@/content/historical/index.json';

export type LibraryPage = 'articles' | 'guides' | 'search' | 'projects';
const italian: Record<LibraryPage, string> = { articles: '/articoli', guides: '/guide', search: '/ricerca', projects: '/progetti' };
const segments: Record<LibraryPage, string> = { articles: 'articles', guides: 'guides', search: 'search', projects: 'projects' };
export function libraryPath(lang: string, page: LibraryPage) {
  const original = page === 'articles' && originals.find(row => row.locale === lang && row.family === '/articoli' && row.state === 'restored');
  if (original) return original.path;
  return lang === 'it' ? italian[page] : `/${lang}/${segments[page]}`;
}
export function articlePath(lang: string, slug: string) {
  const original = originals.find(row => row.locale === lang && row.family === `/${slug}` && (row.state === 'restored' || row.state === 'awaiting-confirmation') && row.kind === 'article');
  if (original) return original.path;
  return lang === 'it' ? `/${slug}` : `/${lang}/articles/${slug}`;
}
export function publicPath(lang: string, page: string) {
  if (page in italian) return libraryPath(lang, page as LibraryPage);
  const data = pages as Record<string, Record<string, { path: string }>>;
  const found = data[lang]?.[page]?.path;
  if (!found) throw new Error(`Missing ${lang} route for ${page}`);
  return found;
}
