import { PROFESSIONAL_PAGES, PROFESSIONAL_DOWNLOAD_PAGES } from '@/content/professionals';
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
import { SERVICE_LOCALES, serviceCopy, offerPath } from '@/content/service-offers';
import { legalPath, noticeCopy } from '@/content/legal-notices';
import { legalPages } from '@/content/legal';
import { PHASE3_PAGES } from '@/content/phase3';
import { PROPERTY_PAGES } from '@/content/property-management';
import { NETWORK_PUBLIC_PAGES, networkCopy } from '@/content/network';
import { NETWORK_SERVICE_IDS } from '@/content/network/types';
import { ATELIER_PAGES } from '@/content/atelier';
import { ARABIC_PUBLIC_RELEASE, ARABIC_REVIEW_EVIDENCE } from './arabic-release';
import { ARABIC_EDITORIAL_ARTICLES, arabicEditorialPath } from '@/content/arabic-editorial';
import { ARABIC_LIBRARY_PATH, arabicLibraryCopy } from '@/content/arabic-editorial-library';
import { arabicSeo, arabicPlaceSeo } from './arabic-seo.mjs';
import { ARABIC_ARCHIVES, arabicArchivePath } from '@/content/arabic-archives';

export type EditionState = 'draft' | 'translated' | 'reviewed' | 'published';
export type Edition = {
  id: string; locale: string; path: string; kind: 'core' | 'archive' | 'article' | 'search' | 'legal';
  state: EditionState; approval: string | null; source: string;
  title: string; description: string; contentLanguage: string; sitemap: boolean;
  /** Explicit non-indexable surfaces cannot inherit legacy/public release approval. */
  indexing?: 'never';
  coreMetadata?: { title: string; description: string };
  translationRevision?: string; translationApprovalRevision?: string; translationSourcePath?: string;
};

// Approval attaches to an edition, not to the existence of a catalog key.
// The current foreign-language composition includes newer, unapproved copy.
// Retain the historical approval record in locales.json; do not extend it to new copy.
export const editions: Edition[] = LOCALES.flatMap(locale => [
  ...PAGE_KEYS.map(id => ({
    id, locale: locale.code, ...pages[locale.code as keyof typeof pages][id], kind: 'core' as const,
    coreMetadata: pages[locale.code as keyof typeof pages][id],
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
// Explicit owner authorization for these public editions, not inherited from Phase 2.
for (const locale of SERVICE_LOCALES) for (const id of ['premium', 'local'] as const) {
  const text = serviceCopy[locale];
  editions.push({
    id: `service-${id}`, locale, path: offerPath(locale, id), kind: 'core',
    state: 'published', approval: 'Owner instruction: index all public editions, 2026-11-25', sitemap: true, contentLanguage: locale,
    title: `${id === 'premium' ? text.premiumTitle : text.localTitle} | Marenetto Build`,
    description: id === 'premium' ? text.premiumIntro : text.scope,
    source: 'phase3:service-offers; owner-authorized public release',
  });
}
for (const locale of SERVICE_LOCALES) for (const kind of ['privacy', 'cookies', 'ai'] as const) {
  const text = noticeCopy[locale];
  editions.push({
    id: `legal-${kind}`, locale, path: legalPath(locale, kind), kind: 'core',
    state: 'published', approval: 'Owner instruction: index all public editions, 2026-11-25', sitemap: true, contentLanguage: locale,
    title: `${text[kind]} | Marenetto Build`,
    description: kind === 'privacy' ? text.privacyText[1] : kind === 'cookies' ? text.cookieText[1] : text.aiText[0],
    source: 'phase4:legal-notices; owner-authorized public release, not legal certification',
  });
}
// Owner-supplied legal editions are Italian only, independently of core-page approvals.
editions.push(...legalPages.filter(content => !editions.some(e => e.path === content.path)).map(content => ({
  id: content.path.slice(1), locale: 'it', path: content.path, kind: 'legal' as const,
  title: content.title, description: content.description, contentLanguage: 'it',
  state: 'published' as const, approval: 'Owner-supplied legal texts, 23 November 2026',
  source: 'offroadstore/marenettobuild legal-pages; content/legal.ts',
  sitemap: true,
})));
// Phase3/4 native editions (service areas, custom furniture, AI use). Registered after the approval ledger.
for (const page of PHASE3_PAGES) {
  if (editions.some(e => e.path === page.path)) continue;
  editions.push({ id: page.id, locale: page.locale, path: page.path, kind: 'core' as const,
    title: page.title, description: page.description, contentLanguage: page.locale,
    state: 'published' as const, approval: 'Owner authorization for publication review (Phase3/4); native-speaker review not performed',
    source: `phase3:content/phase3/${page.kind}`, sitemap: true } as Edition);
}
// The owner's new indexing decision covers every existing native public page
// in the twelve active languages, not private previews, missing translations,
// or runtime withdrawals (which still take precedence at release time).
for (const edition of editions) {
  if (SERVICE_LOCALES.includes(edition.locale as typeof SERVICE_LOCALES[number]) &&
      edition.contentLanguage === edition.locale && edition.kind !== 'search' &&
      edition.state !== 'draft') {
    edition.state = 'published';
    edition.approval = 'Owner authorization: index all public pages, 2026-11-25; no independent factual certification';
    edition.sitemap = true;
    if (edition.translationRevision) edition.translationApprovalRevision = edition.translationRevision;
  }
}
// Append AFTER legacy owner-wide authorization: unreviewed network revisions
// must never inherit the approval of older public pages.
for (const page of NETWORK_PUBLIC_PAGES) editions.push({
  id: `network-${page.id}`, locale: page.locale, path: page.path, kind: 'article',
  state: 'published', approval: 'Revision-specific network evidence in content/network/reviews.json',
  source: 'network:revision-reviewed', title: page.title, description: page.description,
  contentLanguage: page.locale, sitemap: true,
});
for (const edition of editions) {
  if ((NETWORK_SERVICE_IDS as readonly string[]).includes(edition.id) && NETWORK_PUBLIC_PAGES.some(page => page.locale === edition.locale)) {
    const c = networkCopy(edition.locale);
    edition.description = `${edition.title.split(' | ')[0]}. ${c.articles.comfort.description}`;
    if (edition.coreMetadata) edition.coreMetadata = { ...edition.coreMetadata, description: edition.description };
  }
}
for (const page of PROPERTY_PAGES) {
  if (editions.some(edition => edition.path.replace(/\/+$/, '') === page.path.replace(/\/+$/, ''))) {
    throw new Error(`Property service route collision: ${page.path}`);
  }
  editions.push({ ...page, kind: 'core', contentLanguage: page.locale, state: 'published',
    approval: 'Owner-authorized property-management service prepared for republish; no independent business or native-speaker certification',
    source: 'property-management:owner-declarations', sitemap: true });
}
// Atelier: thirteen editions; the Arabic one follows the Arabic release gate below.
for (const page of ATELIER_PAGES) {
  if (editions.some(edition => edition.path.replace(/\/+$/, '') === page.path)) throw new Error(`Atelier route collision: ${page.path}`);
  editions.push({ ...page, kind: 'core', contentLanguage: page.locale, state: 'published',
    approval: 'Owner-supplied Atelier facts (task #100); no independent native-speaker or factual certification',
    source: 'atelier:owner-declarations', sitemap: true });
}
// Professionals: thirteen useful editions; downloads are draft/noindex "files coming" resources (no sitemap/hreflang).
for (const page of PROFESSIONAL_PAGES) {
  if (editions.some(edition => edition.path.replace(/\/+$/, '') === page.path)) throw new Error(`Professional route collision: ${page.path}`);
  editions.push({ ...page, kind: 'core', contentLanguage: page.locale, state: 'published',
    approval: 'Owner-supplied professional programme facts (task #101); no independent native-speaker, legal or technical certification',
    source: 'professionals:owner-declarations', sitemap: true });
}
for (const page of PROFESSIONAL_DOWNLOAD_PAGES) {
  if (editions.some(edition => edition.path.replace(/\/+$/, '') === page.path)) throw new Error(`Professional downloads route collision: ${page.path}`);
  editions.push({ ...page, kind: 'core', contentLanguage: page.locale, state: 'draft', approval: null,
    source: 'professionals:downloads-placeholder (files coming, noindex)', sitemap: false, indexing: 'never' });
}
// Arabic editorial adaptations (new compositions by the parent, not recovered originals).
// The id joins the Italian historical family so hreflang pairs the editions once published.
// Remove unreviewed Italian-source placeholder articles before adding real compositions.
for (let i = editions.length - 1; i >= 0; i--) {
  if (editions[i].locale === 'ar' && editions[i].kind === 'article' && editions[i].contentLanguage !== 'ar') editions.splice(i, 1);
}
for (const article of ARABIC_EDITORIAL_ARTICLES) {
  const path = arabicEditorialPath(article.slug);
  if (editions.some(edition => edition.path.replace(/\/+$/, '') === path)) throw new Error(`Arabic article route collision: ${path}`);
  const source = editions.find(e => e.locale === 'it' && e.path.replace(/\/+$/, '') === article.sourcePath.replace(/\/+$/, ''));
  if (!source) throw new Error(`Arabic adaptation source is not inventoried: ${article.sourcePath}`);
  editions.push({ id: source.id, locale: 'ar', path, kind: 'article', contentLanguage: 'ar',
    title: article.title, description: article.description, state: 'reviewed', approval: null, sitemap: false,
    source: `arabic-editorial:${article.sourcePath} (new MSA adaptation, not a recovered original)` });
}
for (const edition of editions.filter(e => e.locale === 'ar')) {
  const metadata = edition.id.startsWith('place-') ? arabicPlaceSeo[edition.id.slice(6)] : arabicSeo[edition.id];
  if (metadata) {
    Object.assign(edition, metadata);
    if (edition.coreMetadata) edition.coreMetadata = metadata;
  }
}
{
  const library = editions.find(edition => edition.locale === 'ar' && edition.id === 'articles');
  const fields = { path: ARABIC_LIBRARY_PATH, ...arabicSeo.articles,
    contentLanguage: 'ar', state: 'reviewed' as const, source: 'arabic-editorial:library' };
  if (library) Object.assign(library, fields);
  else editions.push({ id: 'articles', locale: 'ar', kind: 'archive', approval: null, sitemap: false, ...fields });
}
for (const edition of editions.filter(e => e.locale === 'ar' && (e.id === 'guides' || e.id === 'search'))) {
  edition.contentLanguage = 'ar';
  edition.state = 'reviewed';
}
// Arabic release gate: applied last so no earlier owner-wide authorization can promote
// Arabic. Until release, Arabic editions are drafts (no sitemap, hreflang or llms entry).
for (const archive of ARABIC_ARCHIVES) {
  const source = editions.find(e => e.locale === 'it' && e.path.replace(/\/+$/, '') === archive.sourcePath.replace(/\/+$/, ''));
  if (!source) throw new Error(`Arabic archive source missing: ${archive.sourcePath}`);
  editions.push({ id: source.id, locale: 'ar', path: arabicArchivePath(archive), kind: 'archive',
    state: 'reviewed', approval: null, sitemap: false, contentLanguage: 'ar',
    title: archive.title, description: archive.description, source: `arabic-archives:${archive.sourcePath}` });
}
for (const edition of editions) {
  if (edition.locale !== 'ar' || edition.contentLanguage !== 'ar' || edition.kind === 'search' || edition.id === 'professional-downloads') continue;
  if (ARABIC_PUBLIC_RELEASE) {
    edition.state = 'published';
    edition.approval = `Owner instruction to publish Arabic (task #100); ${ARABIC_REVIEW_EVIDENCE}`;
    edition.sitemap = true;
  } else {
    edition.state = 'draft';
    edition.approval = null;
    edition.sitemap = false;
  }
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
  // New archive compositions have real localized paths, not routable historical ids.
  // Preserve the existing article/core previews; do not invent /historical:/... URLs.
  if (edition.source.startsWith('arabic-archives:')) return edition.path;
  if (edition.id === 'property-management' || edition.id === 'atelier' || edition.id === 'professionals' || edition.id === 'professional-downloads') return edition.path;
  if (edition.source.startsWith('network:')) return edition.path;
  if (edition.source.startsWith('phase3:') || edition.source.startsWith('phase4:')) return edition.path;
  if (translationCandidate(edition.path)) return edition.path;
  if (edition.source.startsWith('phase3')) return edition.path;
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
