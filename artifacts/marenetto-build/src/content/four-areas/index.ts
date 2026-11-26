import originals from '@/content/historical/index.json';
import { atelierPath } from '@/content/atelier';
import { PROFESSIONAL_PAGES } from '@/content/professionals';
import { propertyPath, publicPagePath } from '@/content/property-management';
import { offerPath, requestPath } from '@/content/service-offers';
import { translationCandidate, translationApproved } from '@/localization/phase2';
import { ARABIC_EDITORIAL_ARTICLES, arabicEditorialPath } from '@/content/arabic-editorial';
import { AREA_IDS, FOUR_AREA_LOCALES, type AreaId, type AreaLocale, type AreaLocaleCopy } from './types';
import { ARTICLE_AREA } from './mapping';
import { it } from './copy/it';
import { en } from './copy/en';
import { de } from './copy/de';
import { fr } from './copy/fr';
import { nl } from './copy/nl';
import { es } from './copy/es';
import { pt } from './copy/pt';
import { ru } from './copy/ru';
import { pl } from './copy/pl';
import { sv } from './copy/sv';
import { no } from './copy/no';
import { da } from './copy/da';
import { ar } from './copy/ar';

export * from './types';
export { ARTICLE_AREA, articleArea, requireArticleArea, normalizeArticleIdentity } from './mapping';

const COPY: Record<AreaLocale, AreaLocaleCopy> = { it, en, de, fr, nl, es, pt, ru, pl, sv, no, da, ar };

/** Link key: 'atelier' | 'property' | 'abroad' | 'local' | 'premium' | 'article:<family>'. */
type LinkKey = string;
/** Per offer item: candidate links, first resolvable wins (article editions are missing in sv/no/da). */
export const AREA_STRUCTURE: Record<AreaId, { offer: LinkKey[][]; service: 'local-building' | 'bespoke-furniture'; image: string; articles: string[] }> = {
  villas: {
    offer: [['local'], ['article:cappotto-termico-vs-intonaco-termico-cefalu', 'local'], ['article:tecniche-avanzate-gestione-deformazioni-strutture-edili', 'local']],
    service: 'local-building',
    image: '/media/articles/impresa-edile-a-cefalu.jpg',
    articles: [],
  },
  outdoors: {
    offer: [['article:piscine-e-laghetti-zen', 'local'], ['atelier'], ['article:garden-design-esclusivo', 'local'], ['article:opere-in-pietra-e-prospetti', 'local'], ['local']],
    service: 'local-building',
    image: '/media/articles/piscine-e-laghetti-zen.jpg',
    articles: [],
  },
  surfaces: {
    offer: [['article:ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam', 'premium'], ['premium'], ['article:pavimenti-stampati-in-resina', 'local']],
    service: 'bespoke-furniture',
    image: '/media/articles/pavimenti-stampati-in-resina.jpg',
    articles: [],
  },
  investment: {
    offer: [['article:comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali', 'abroad'], ['abroad'], ['property'], ['article:impresa-edile-a-cefalu', 'local']],
    service: 'local-building',
    image: '/media/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali.jpg',
    articles: [],
  },
};
for (const [family, area] of Object.entries(ARTICLE_AREA)) AREA_STRUCTURE[area].articles.push(family);

/** Existing localized article path for a family, or undefined when no edition exists in that locale. */
export function articleFamilyPath(locale: string, family: string): string | undefined {
  if (locale === 'ar') {
    const article = ARABIC_EDITORIAL_ARTICLES.find(a => a.id === family);
    return article ? arabicEditorialPath(article.slug) : undefined;
  }
  // Only reviewed/restored public editions; held (awaiting-confirmation) editions are never linked.
  const row = originals.find(r => r.locale === locale && r.kind === 'article' && r.family === `/${family}` && r.state === 'restored');
  if (!row) return undefined;
  const candidate = translationCandidate(row.path);
  return candidate && !translationApproved(candidate) ? undefined : row.path;
}

export function resolveAreaLink(locale: string, key: LinkKey): string | undefined {
  if (key.startsWith('article:')) return articleFamilyPath(locale, key.slice(8));
  switch (key) {
    case 'atelier': return atelierPath(locale);
    case 'property': return propertyPath(locale);
    case 'abroad': return publicPagePath(locale, 'abroad');
    case 'local': return offerPath(locale, 'local');
    case 'premium': return offerPath(locale, 'premium');
    default: throw new Error(`Unknown four-areas link key: ${key}`);
  }
}

export function areaCopy(locale: string): AreaLocaleCopy {
  const copy = COPY[locale as AreaLocale];
  if (!copy) throw new Error(`Unsupported four-areas locale: ${locale}`);
  return copy;
}
export function isAreaLocale(locale: string): locale is AreaLocale {
  return (FOUR_AREA_LOCALES as readonly string[]).includes(locale);
}

export function areaPath(locale: string, area: AreaId) {
  const slug = areaCopy(locale).areas[area].slug;
  return `${locale === 'it' ? '' : `/${locale}`}/${slug}`;
}

/** Single conversion target: the existing localized request form, with service preselection. */
export function areaRequestPath(locale: string, area: AreaId) {
  return `${requestPath(locale)}?service=${AREA_STRUCTURE[area].service}`;
}

export type FourAreaPage = {
  id: `pillar-${AreaId}`; area: AreaId; locale: AreaLocale; path: string;
  title: string; description: string; h1: string; nav: string; requestPath: string;
};
export const FOUR_AREA_PAGES: FourAreaPage[] = FOUR_AREA_LOCALES.flatMap(locale => AREA_IDS.map(area => {
  const c = COPY[locale].areas[area];
  return { id: `pillar-${area}` as const, area, locale, path: areaPath(locale, area), title: c.title, description: c.description, h1: c.h1, nav: c.nav, requestPath: areaRequestPath(locale, area) };
}));

const clean = (path: string) => path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
export function areaPage(locale: string, area: AreaId) {
  return FOUR_AREA_PAGES.find(page => page.locale === locale && page.area === area);
}
export function areaPageByPath(path: string) {
  const key = clean(path);
  return FOUR_AREA_PAGES.find(page => page.path === key);
}

/** Hidden, noindex preparatory Projects page (no projects, clients or images). */
export type ProjectPage = { id: 'projects'; locale: AreaLocale; path: string; title: string; description: string; h1: string; text: string; noindex: true };
export const PROJECT_PAGES: ProjectPage[] = FOUR_AREA_LOCALES.map(locale => ({
  id: 'projects', locale, path: locale === 'it' ? '/progetti' : `/${locale}/projects`,
  ...COPY[locale].ui.projects, noindex: true,
}));
export function projectPageByPath(path: string) {
  const key = clean(path);
  return PROJECT_PAGES.find(page => page.path === key);
}

/** Only integrated editions are offered; a withdrawn edition falls back to Atelier. */
export function professionalPath(locale: string, excludedPaths: readonly string[] = []) {
  const page=PROFESSIONAL_PAGES.find(page=>page.locale===locale);
  return page&&!excludedPaths.some(path=>clean(path)===clean(page.path))?page.path:atelierPath(locale);
}
