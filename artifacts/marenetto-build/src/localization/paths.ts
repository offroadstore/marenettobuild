import pages from './public-pages.json';

export type LibraryPage = 'articles' | 'guides' | 'search' | 'projects';
const italian: Record<LibraryPage, string> = { articles: '/articoli', guides: '/guide', search: '/ricerca', projects: '/progetti' };
const segments: Record<LibraryPage, string> = { articles: 'articles', guides: 'guides', search: 'search', projects: 'projects' };
export function libraryPath(lang: string, page: LibraryPage) {
  return lang === 'it' ? italian[page] : `/${lang}/${segments[page]}`;
}
export function articlePath(lang: string, slug: string) {
  return lang === 'it' ? `/${slug}` : `${libraryPath(lang, 'articles')}/${slug}`;
}
export function publicPath(lang: string, page: string) {
  if (page in italian) return libraryPath(lang, page as LibraryPage);
  const data = pages as Record<string, Record<string, { path: string }>>;
  const found = data[lang]?.[page]?.path;
  if (!found) throw new Error(`Missing ${lang} route for ${page}`);
  return found;
}
