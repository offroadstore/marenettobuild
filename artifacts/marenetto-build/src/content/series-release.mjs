import release from './series-release-index.json' with { type: 'json' };
const norm = p => p.replace(/\/+$/, '') || '/';
export const seriesRelease = release;
export function seriesEntries(active) {
  const exact = live => release.records.find(r => r.identity === live.identity && r.locale === live.locale &&
    norm(r.path) === norm(live.path) && live.revisionId !== 'withdrawn' &&
    ((live.revisionHash === r.hash && live.sourceHash === r.sourceHash) ||
      (live.indexingAuthorized === true && live.revisionHash && live.sourceHash)) &&
    live.content?.contentLanguage === r.locale && live.content?.guide?.episode === r.episode);
  // A later real owner-approved revision may inherit its route. That explicit
  // API ledger evidence never authorizes automatic activation of a new digest.
  const sources = new Map(active.filter(live => live.locale === 'it' && exact(live)).map(live => [live.identity,live.revisionHash]));
  return active.flatMap(live => {
    const record = exact(live);
    if (!record || !sources.has(live.identity) || live.sourceHash !== sources.get(live.identity)) return [];
    return [{
      id: live.identity, locale: live.locale, path: record.path, kind: 'article',
      title: (live.revisionHash===record.hash ? record.seoTitle : '') || live.content.seoTitle || live.content.title, description: live.content.seoDescription || live.content.summary,
      visibleTitle: live.content.title, visibleImage: live.content.image, contentLanguage: live.locale,
      activeEditorialRevision: live.revisionId, activeSeoTitle: Boolean(live.content.seoTitle),
      activeSeoDescription: Boolean(live.content.seoDescription), state: 'published', sitemap: true,
      approval: `Owner-declared internal authorization ${release.decisionDate}; exact approved series revision`,
      source: 'active-editorial:authorized-series', translationSourceStale: false,
    }];
  });
}
