/** Index policy, shared by the build, production HTTP and hydrated client.
 * Exclusion does not remove a route or block crawling of its noindex signal.
 * Arabic topic archives retain the same historical identity as their source.
 */
export function indexExclusion(edition) {
  if (edition.id === 'projects') return 'Progetti: mancano materiali autentici approvati';
  if (String(edition.id).startsWith('historical:/tag/') ||
      /\/(?:tag|tags)\//.test(edition.path) ||
      String(edition.source).startsWith('arabic-archives:/tag/')) {
    return 'Archivio tag: consultabile, escluso dall’indice e dagli hreflang';
  }
  return undefined;
}
