import { homeMetadata } from './home-seo.mjs';
import { libraryMetadata } from './library-seo.mjs';
import { searchCopy } from './search-copy.mjs';
import { commercialEntries } from '../content/commercial-release.mjs';
import { seriesEntries } from '../content/series-release.mjs';

// Language wrappers around Italian copy are not independent translations.
export function isNativeEdition(edition) {
  return edition.contentLanguage === edition.locale;
}

// Legacy release evidence is not extended to a newly translated revision.
export function hasTranslationApproval(edition) {
  if (/^phase[34]:/.test(edition.source ?? '') && (!edition.approval || edition.state !== 'published')) return false;
  return !edition.translationSourceStale && (!edition.translationRevision || Boolean(edition.approval &&
    edition.translationApprovalRevision === edition.translationRevision));
}

export function mergeActiveMetadata(entries, active) {
  // Exact active, internally authorized revisions only. Search Console account
  // verification is factual account state, never an indexing permission.
  const commercial = commercialEntries(active);
  const released = [...commercial, ...seriesEntries(active).filter(e => !commercial.some(c => c.path === e.path))];
  const merged = entries.filter(entry=>!released.some(r=>r.id===entry.id&&r.locale===entry.locale&&r.path!==entry.path)).map(entry => {
    const releasedEdition=released.find(r=>r.path===entry.path);
    if(releasedEdition) return releasedEdition;
    const live = active.find(item => item.path === entry.path && item.revisionId !== 'withdrawn');
    const normalized = path => path.replace(/\/+$/, '') || '/';
    const translationSourceStale = entry.translationSourcePath && active.some(item =>
      [item.path, ...(item.aliases ?? [])].some(path => normalized(path) === normalized(entry.translationSourcePath)));
    const source = live && active.find(item => item.identity === live.identity && item.locale === 'it' && item.revisionId !== 'withdrawn');
    const activeSourceStale = live?.locale !== 'it' && Boolean(live?.sourceHash) &&
      (!source || source.revisionHash !== live.sourceHash);
    // Active translations follow the active source hash, not the mere presence
    // of an Italian override. Static source-file invalidation is static-only.
    const candidate = (!live && translationSourceStale) || activeSourceStale ? { ...entry, translationSourceStale: true } : entry;
    return live?.content ? { ...candidate,
      // An unknown guide composition cannot inherit a historical authorization.
      ...(live.content.guide ? {indexing:'never',sitemap:false} : {}),
      title: live.content.seoTitle || live.content.title || entry.title,
      visibleTitle: live.content.title || entry.visibleTitle,
      visibleImage: live.content.image || '',
      activeEditorialRevision: live.revisionId,
      description: live.content.seoDescription || live.content.summary || entry.description,
      contentLanguage: live.content.contentLanguage || entry.contentLanguage,
      activeSeoTitle: Boolean(live.content.seoTitle?.trim()),
      activeSeoDescription: Boolean(live.content.seoDescription?.trim()),
    } : candidate;
  });
  return [...merged,...released.filter(r=>!merged.some(e=>e.path===r.path))];
}

const archiveNames = {
  it: ['Articoli su edilizia e ristrutturazioni', 'Recensioni dei clienti'],
  en: ['Construction and renovation articles', 'Customer reviews'],
  fr: ['Articles sur la construction et la rénovation', 'Avis des clients'],
  de: ['Artikel über Bau und Renovierung', 'Kundenbewertungen'],
  es: ['Artículos sobre construcción y reformas', 'Opiniones de clientes'],
  nl: ['Artikelen over bouw en renovatie', 'Klantbeoordelingen'],
  pt: ['Artigos sobre construção e renovação', 'Avaliações de clientes'],
  ru: ['Статьи о строительстве и ремонте', 'Отзывы клиентов'],
  pl: ['Artykuły o budowie i remontach', 'Opinie klientów'],
  sv: ['Artiklar om byggnation och renovering', 'Kundomdömen'],
  no: ['Artikler om bygg og renovering', 'Kundeomtaler'],
  da: ['Artikler om byggeri og renovering', 'Kundeanmeldelser'],
};
const text = value => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();

export function releaseMetadata(edition, html = '', entries = []) {
  if(edition.commercialRelease==='editorial-2026-11-26') return {title:edition.title,description:edition.description};
  if (edition.source === 'active-editorial:authorized-series') {
    // Keep the approved, localized topic intact. Omit only the redundant brand
    // suffix when it would exceed the search-display target; never cut a sentence.
    return { title: [...edition.title].length > 60 ? edition.title.replace(/ \| Marenetto Build$/, '') : edition.title,
      description: edition.description };
  }
  // New commercial editions have individually authored, length-checked titles.
  // Appending the brand again would turn a valid title into an overlong one.
  if (String(edition.source).startsWith('four-areas:') && !edition.activeSeoTitle && !edition.activeSeoDescription) {
    return { title: edition.title, description: edition.description };
  }
  const search = searchCopy(edition);
  if (search && !edition.activeSeoTitle && !edition.activeSeoDescription) return search;
  if (edition.kind === 'legal') return {
    title: edition.title.endsWith(' | Marenetto Build') ? edition.title : `${edition.title} | Marenetto Build`,
    description: edition.description,
  };
  const core = homeMetadata[edition.locale] &&
    (edition.id === 'home' ? homeMetadata[edition.locale] : libraryMetadata[edition.locale]?.[edition.id] ?? edition.coreMetadata);
  const genericHome = /^(?:Home|Startseite|Accueil|Inicio|Início|Start|Hjem|Forside|Strona główna|Главная)\s*(?:[|—–-].*)?$/i.test(edition.title);
  let title = (!edition.activeSeoTitle || genericHome) && core ? core.title : edition.title;
  const names = archiveNames[edition.locale];
  const legacyArchiveTitle = /^(?:Articoli|Articles|Artikel|Artikelen|Artikler|Artículos|Artigos|Recensioni)\s*\|/i.test(title);
  if (names && legacyArchiveTitle && (edition.id === 'articles' || edition.id === 'historical:/recensioni')) {
    title = `${names[edition.id === 'articles' ? 0 : 1]} — Cefalù | Marenetto Build`;
  }
  if (edition.id === 'contact' && title === 'Kontakt Marenetto Build i Cefalù') {
    if (edition.locale === 'no') title = 'Kontakt oss i Cefalù | Marenetto Build';
    if (edition.locale === 'da') title = 'Kontakt os i Cefalù | Marenetto Build';
  }
  title = text(title).replace(/\b(?:www\.)?marenettobuild\.com\b/gi, 'Marenetto Build')
    .replace(/\|\s*Marenetto\s*$/i, '| Marenetto Build');
  if (!/Marenetto Build/i.test(title)) title += ' | Marenetto Build';
  const content = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const paragraph = [...content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => text(match[1])).find(value => value.length >= 70);
  const sourceDescription = !edition.activeSeoDescription && core ? core.description : edition.description;
  let description = (text(sourceDescription) || paragraph || `${title.split('|')[0].trim()} — Marenetto Build.`)
    .replace(/\b(?:www\.)?marenettobuild\.com\b/gi, 'Marenetto Build');
  const duplicate = !sourceDescription || entries.some(other =>
    other.path !== edition.path && other.description === sourceDescription);
  const topic = title.split('|')[0].trim();
  if (duplicate && !description.toLowerCase().startsWith(topic.toLowerCase())) description = `${topic}. ${description}`;
  // Explicit active editorial SEO stays explicit, including length exceptions.
  // Never cut a sentence merely to fit a search-display recommendation.
  return { title: search && (!edition.activeSeoTitle || genericHome) ? search.title : title,
    description: search && !edition.activeSeoDescription ? search.description : description };
}
