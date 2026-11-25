import { editions, canonicalEdition } from '@/localization/edition-inventory';
import { isNativeEdition, hasTranslationApproval, releaseMetadata, mergeActiveMetadata } from '@/localization/public-seo.mjs';
import { updateStructuredData } from './structured-data';

export const PUBLIC_SITE_ORIGIN = 'https://www.marenettobuild.com';
import type { EditorialActive } from '@workspace/api-client-react';
type Active = EditorialActive;
const normalized = (path: string) => path.replace(/\/+$/, '') || '/';
const approved = new Set(['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da']);

export function applyPublicReleaseMetadata(pathname: string, active: Active[]) {
  if (typeof document === 'undefined') return false;
  const canIndex = document.documentElement.dataset.publicIndexing === 'true' &&
    window.location.hostname === 'www.marenettobuild.com';
  const withdrawn = new Set(active.filter(e => e.revisionId === 'withdrawn')
    .flatMap(e => [e.path, ...(e.aliases ?? [])]).map(normalized));
  const allEntries = mergeActiveMetadata(editions, active);
  const entries = allEntries.filter(e => approved.has(e.locale) && isNativeEdition(e) && hasTranslationApproval(e) && e.kind !== 'search' &&
    e.path !== '/en/articoli/' && !e.path.startsWith('/__localization-review') && !withdrawn.has(normalized(e.path)));
  const edition = entries.find(e => normalized(e.path) === normalized(pathname));
  const candidate = withdrawn.has(normalized(pathname)) ? undefined :
    edition ?? allEntries.find(e => normalized(e.path) === normalized(pathname));
  const setMeta = (attribute: string, key: string, value: string) => {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element);
    }
    element.setAttribute('content', value);
  };
  setMeta('name', 'robots', edition && canIndex ? 'index, follow' : 'noindex, nofollow');
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
  if (!candidate) return false;
  const metadata = releaseMetadata(candidate, document.querySelector('main')?.outerHTML ?? '', entries);
  const canonicalPath = edition?.path ?? canonicalEdition(candidate).path;
  document.title = metadata.title;
  for (const [attribute, key, value] of [
    ['name', 'description', metadata.description], ['property', 'og:title', metadata.title],
    ['property', 'og:description', metadata.description], ['property', 'og:url', PUBLIC_SITE_ORIGIN + canonicalPath],
    ['property', 'og:type', candidate.kind === 'article' ? 'article' : 'website'],
    ['name', 'twitter:title', metadata.title], ['name', 'twitter:description', metadata.description],
  ]) setMeta(attribute, key, value);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = PUBLIC_SITE_ORIGIN + canonicalPath;
  // Previewing search text never grants publication evidence. As before,
  // previews claim no public alternates, even for an approved edition.
  const alternateEntries = canIndex ? entries : [];
  for (const e of alternateEntries.filter(e => edition && e.id === edition.id)) {
    for (const language of e.locale === 'it' ? ['it-IT', 'x-default'] : [e.locale]) {
      const link = document.createElement('link'); link.rel = 'alternate'; link.hreflang = language;
      link.href = PUBLIC_SITE_ORIGIN + e.path; document.head.appendChild(link);
    }
  }
  updateStructuredData(candidate, PUBLIC_SITE_ORIGIN);
  return true;
}
