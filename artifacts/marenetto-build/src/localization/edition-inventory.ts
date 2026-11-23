import { LOCALES, PAGE_KEYS } from './locales';
import pages from './public-pages.json';
import { articles } from '@/content/articles';
import { historicalRedirects } from '@/content/historical-routes';
import { articlePath, libraryPath } from './paths';
import { serbianCyrillic } from './editorial-conventions';
import approvalLedger from './edition-approvals.json';
import { historicalInventory } from '@/content/historical';
import { editionStatusLabel } from './edition-status';
import { allTranslationCandidates, translationApproved, translationCandidate } from './phase2';

export type EditionState = 'draft' | 'translated' | 'reviewed' | 'published';
export type Edition = {
  id: string; locale: string; path: string; kind: 'core' | 'archive' | 'article' | 'search';
  state: EditionState; approval: string | null; source: string;
  title: string; description: string; contentLanguage: string; sitemap: boolean;
  translationRevision?: string; translationApprovalRevision?: string; translationSourcePath?: string;
};

// Approval attaches to an edition, not to the existence of a catalog key.
// The current foreign-language composition includes newer, unapproved copy.
// Retain the historical approval record in locales.json; do not extend it to new copy.
export const editions: Edition[] = LOCALES.flatMap(locale => [
  ...PAGE_KEYS.map(id => ({
    id, locale: locale.code, ...pages[locale.code as keyof typeof pages][id], kind: 'core' as const,
    state: locale.code === 'it' ? 'published' as const : 'translated' as const,
    approval: locale.code === 'it' ? 'Owner-supplied Italian layout/copy; existing project approval' : null,
    source: 'App.tsx / home-copy.ts; legacy approved catalog, newer composition requires page review',
    contentLanguage: locale.code, sitemap: locale.code === 'it',
  })),
  ...(['articles', 'guides', 'search'] as const).map(id => ({
    id, locale: locale.code, path: libraryPath(locale.code, id),
    kind: id === 'search' ? 'search' as const : 'archive' as const,
    state: locale.code === 'it' ? 'published' as const : 'draft' as const,
    approval: locale.code === 'it' ? 'Existing reviewed Italian editorial library' : null,
    source: 'pages/library.tsx; original Italian edition',
    title: `${id === 'articles' ? 'Articoli' : id === 'guides' ? 'Guide pratiche' : 'Ricerca'} | Marenetto Build`,
    description: id === 'guides' ? 'Guide per proprietari a Cefalù, con fonti, limiti e domande per i professionisti incaricati.' : 'Articoli di Marenetto Build: testi italiani, fonti e stato della revisione.',
    contentLanguage: 'it', sitemap: locale.code === 'it' && id !== 'search',
  })),
  ...articles.map(article => ({
    id: article.slug, locale: locale.code, path: articlePath(locale.code, article.slug), kind: 'article' as const,
    state: locale.code === 'it' ? 'published' as const : 'draft' as const,
    approval: locale.code === 'it' ? 'Existing Italian documentary review; not professional sign-off' : null,
    source: 'content/articles.ts / approvedFullText',
    title: `${article.title} | Marenetto Build`, description: article.summary,
    contentLanguage: 'it', sitemap: locale.code === 'it',
  })),
]);

export const reviewHubEdition: Edition = {
  id: 'review-hub', locale: 'it', path: '/__localization-review', kind: 'search', state: 'draft', approval: null,
  source: 'Editorial review index; not an approved public content edition', title: 'Revisione delle 29 lingue | Marenetto Build',
  description: 'Indice delle bozze editoriali da verificare con il titolare. Nessuna nuova approvazione linguistica implicita.',
  contentLanguage: 'it', sitemap: false,
};
const approvalRecords = approvalLedger.records as Record<string, { state: EditionState; approvalEvidence: string | null }>;
for (const edition of editions) {
  const record = approvalRecords[`${edition.locale}:${edition.id}`];
  edition.state = record?.state ?? (edition.kind === 'core' ? 'translated' : 'draft');
  edition.approval = record?.approvalEvidence ?? null;
  if (edition.state === 'published' && !edition.approval) throw new Error(`Missing edition approval evidence: ${edition.locale}:${edition.id}`);
  edition.sitemap = edition.state === 'published' && Boolean(edition.approval) && edition.kind !== 'search';
}
for (const edition of editions) if (edition.locale === 'sr' && edition.kind === 'core') {
  edition.title = serbianCyrillic(edition.title);
  edition.description = serbianCyrillic(edition.description);
}
// A historical publication is evidence of provenance, not a new linguistic or
// factual sign-off. Revoke inherited approval when replacing the composition.
const coreFamilies: Record<string, string> = { home: '/', process: '/chi-siamo', contact: '/contatti', articles: '/articoli' };
for (const edition of editions) {
  const family = edition.kind === 'article' ? `/${edition.id}` : coreFamilies[edition.id];
  if (!family) continue;
  const original = historicalInventory.find(page => page.family === family && page.locale === edition.locale && (page.state === 'restored' || page.editorialCorrection || (page.state === 'awaiting-confirmation' && page.kind === 'article')));
  if (!original) continue;
  edition.state = original.state === 'restored' ? 'reviewed' : 'draft';
  edition.approval = null;
  edition.sitemap = false;
  Object.assign(edition, {
    path: original.path, title: original.title, description: original.description,
    contentLanguage: original.contentLanguage, source: `historical snapshot ${original.sourceSHA256}; ${original.source}`,
  });
}
for (const original of historicalInventory.filter(page => page.state === 'restored' || page.editorialCorrection || (page.state === 'awaiting-confirmation' && page.kind === 'article'))) {
  if (editions.some(edition => edition.path === original.path)) continue;
  editions.push({
    id: original.id, locale: original.locale, path: original.path, kind: original.kind as Edition['kind'],
    state: original.state === 'restored' ? 'reviewed' : 'draft', approval: null, sitemap: false, title: original.title,
    description: original.description, contentLanguage: original.contentLanguage,
    source: `historical snapshot ${original.sourceSHA256}; ${original.source}`,
  });
}
for (const translation of allTranslationCandidates) {
  const edition = editions.find(e => e.path === translation.path);
  if (!edition) throw new Error(`Unregistered translation: ${translation.path}`);
  const approved = translationApproved(translation);
  Object.assign(edition, { title: translation.title, description: translation.description,
    contentLanguage: translation.locale, state: approved ? 'published' : 'reviewed',
    approval: approved ? translation.approval!.evidence : null, sitemap: approved,
    translationRevision: translation.revisionSHA256,
    translationSourcePath: translation.sourcePath,
    translationApprovalRevision: approved ? translation.approval!.revisionSHA256 : undefined,
    source: `phase2:${translation.sourcePath}@${translation.sourceRevisionSHA256}`,
  });
}
export const editionByPath = new Map(editions.map(edition => [edition.path, edition]));
export function editionDisplayStatus(edition: Edition) {
  if (edition.translationRevision) return edition.approval ? '' : 'Traduzione confrontata · da approvare';
  return editionStatusLabel(edition, historicalInventory.find(page => page.path === edition.path));
}
export function equivalentEditions(id: string) {
  return editions.filter(edition => edition.id === id && edition.state === 'published' && edition.approval);
}
export function getEdition(locale: string, id: string) {
  return editions.find(edition => edition.locale === locale && edition.id === id);
}
export function reviewPathForEdition(edition: Edition) {
  if (translationCandidate(edition.path)) return edition.path;
  if (edition.source.startsWith('historical snapshot ')) return edition.path;
  const segment = edition.kind === 'article' ? `articles/${edition.id}` : edition.id;
  return `/__localization-review/${edition.locale}/${segment}`;
}
export function canonicalEdition(edition: Edition) {
  if (historicalInventory.some(page => page.path === edition.path && page.state === 'awaiting-confirmation')) return edition;
  // A foreign interface around the original Italian article is not a translation.
  if (edition.contentLanguage !== 'it') return edition;
  const byId = getEdition('it', edition.id);
  if (byId) return byId;
  const original = historicalInventory.find(page => page.path === edition.path);
  const italian = original && historicalInventory.find(page => page.family === original.family && page.locale === 'it' && page.state === 'restored');
  return editions.find(candidate => candidate.path === italian?.path) ?? edition;
}
export const redirects: Record<string, string> = {
  ...historicalRedirects,
  '/progetti': '/servizi',
  ...Object.fromEntries(LOCALES.filter(locale => locale.code !== 'it').map(locale => [libraryPath(locale.code, 'projects'), pages[locale.code as keyof typeof pages].services.path])),
};
// Never redirect a recovered native edition to a rewritten Italian article.
for (const original of historicalInventory.filter(page => page.state === 'restored' || page.state === 'awaiting-confirmation')) delete redirects[original.key];
// Retire only the article prefixes introduced by the new app, in favor of the
// independently recovered native historical URL. Never invent a translated slug.
for (const original of historicalInventory.filter(page => (page.state === 'restored' || page.state === 'awaiting-confirmation') && page.kind === 'article' && page.locale !== 'it')) {
  redirects[`/${original.locale}/articles/${original.family.slice(1)}`] = original.path;
}
// Corrected historical core pages replace the app's reworked routes as well.
// Keep those previously exposed app links working through one permanent alias.
for (const original of historicalInventory.filter(page => page.editorialCorrection)) {
  const id = Object.entries(coreFamilies).find(([, family]) => family === original.family)?.[0];
  const previous = id && (pages as Record<string, Record<string, { path: string }>>)[original.locale]?.[id]?.path;
  const previousKey = previous?.replace(/\/+$/, '') || '/';
  if (previous && previousKey !== original.key && !historicalInventory.some(page => page.key === previousKey)) redirects[previousKey] = original.path;
}
// Collapse justified historical aliases to one permanent redirect, never to home by default.
for (const source of Object.keys(redirects)) {
  const visited = new Set([source]);
  let target = redirects[source];
  while (redirects[target]) {
    if (visited.has(target)) throw new Error(`Redirect cycle: ${source}`);
    visited.add(target);
    target = redirects[target];
  }
  redirects[source] = target;
}
export const excludedRoutes = [
  { path: '/translation-ok', status: 410, reason: 'Retired translation test, not editorial content' },
  { path: '/audit-nonexistent-20261110', status: 404, reason: 'Nonexistent audit control' },
  { path: '/internal', status: 200, reason: 'Authenticated private application; never sitemap' },
  { path: '/owner-demo', status: 200, reason: 'Fictional demonstration; never sitemap' },
  { path: '/content/:locale/:slug', status: null, reason: 'Dynamic CMS; no approved static publication inventory; fail closed in public handler' },
];
