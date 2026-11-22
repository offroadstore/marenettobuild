import { useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LibraryLocale } from '@/localization/library-context';
import { translateText } from '@/localization/runtime';
import { articlePath, libraryPath } from '@/localization/paths';
import { canonicalEdition, getEdition, equivalentEditions } from '@/localization/edition-inventory';
import { isTranslationReviewMode } from '@/localization/runtime';
import { updateStructuredData } from './structured-data';
import { getLocaleDirection } from '@/localization/locales';
import { applyPublicReleaseMetadata, PUBLIC_SITE_ORIGIN } from './public-release-meta';
import { useActiveEditorial } from './editorial-runtime';

export type PageMeta = { title: string; description: string; path: string; type?: 'website' | 'article'; lang?: string };

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

export function usePageMeta({ title, description, path, type = 'website', lang = 'it' }: PageMeta) {
  lang = useContext(LibraryLocale);
  const [location] = useLocation();
  const active = useActiveEditorial();
  const suffix = ' | Marenetto Build';
  title = title.endsWith(suffix) ? translateText(lang, title.slice(0, -suffix.length)) + suffix : translateText(lang, title);
  description = translateText(lang, description);
  if (lang !== 'it') {
    const page = ({ '/articoli': 'articles', '/guide': 'guides', '/ricerca': 'search', '/progetti': 'projects' } as const)[path as '/articoli'];
    path = page ? libraryPath(lang, page) : articlePath(lang, path.replace(/^\//, ''));
  }
  useEffect(() => {
    if (applyPublicReleaseMetadata(location, active)) return;
    document.title = title;
    const routeLocale = location.match(/^\/(?:__localization-review\/)?([a-z]{2})(?:\/|$)/)?.[1] ?? 'it';
    document.documentElement.lang = routeLocale;
    document.documentElement.dir = getLocaleDirection(routeLocale);
    setMeta('name', 'robots', 'noindex, nofollow');
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const edition = getEdition(routeLocale, path === '/articoli' ? 'articles' : path === '/guide' ? 'guides' : path === '/ricerca' ? 'search' : path.replace(/^\/(?:[a-z]{2}\/articles\/)?/, ''));
    const canonicalPath = isTranslationReviewMode() ? window.location.pathname : edition ? canonicalEdition(edition).path : path;
    if (edition) updateStructuredData(edition, PUBLIC_SITE_ORIGIN);
    const href = `${PUBLIC_SITE_ORIGIN}${base}${canonicalPath}`;
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
    if (edition?.state === 'published' && !isTranslationReviewMode()) for (const alternateEdition of equivalentEditions(edition.id)) {
      const alternate = document.createElement('link');
      alternate.rel = 'alternate';
      alternate.hreflang = alternateEdition.locale === 'it' ? 'it-IT' : alternateEdition.locale;
      alternate.href = new URL(alternateEdition.path, PUBLIC_SITE_ORIGIN).href;
      document.head.appendChild(alternate);
    }
    setMeta('property', 'og:url', href);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', href);
  }, [title, description, path, type, lang, location, active]);
}
