import { createContext, useContext } from 'react';
import { localizeNode, translateText } from './runtime';
import type { ReactNode } from 'react';
import { articlePath, libraryPath, publicPath } from './paths';

export const LibraryLocale = createContext('it');
export function useLibraryLocale() {
  const lang = useContext(LibraryLocale);
  return {
    lang,
    t: (text: string) => translateText(lang, text),
    render: (node: ReactNode) => localizeNode(lang, node),
    articleHref: (slug: string) => articlePath(lang, slug),
    libraryHref: (page: 'articles' | 'guides' | 'search') => libraryPath(lang, page),
    publicHref: (page: string) => publicPath(lang, page),
    // ISO calendar dates keep the original day unambiguous and avoid ICU/CLDR
    // differences between the build runtime and browsers during hydration.
    date: (value: string | null) => value ?? '—',
  };
}
