import type { ProCopy } from './types';
import { proItEn } from './copy-it-en';
import { proFrDe } from './copy-fr-de';
import { proNlEs } from './copy-nl-es';
import { proPtPl } from './copy-pt-pl';
import { proRuSv } from './copy-ru-sv';
import { proNoDa } from './copy-no-da';
import { proAr } from './copy-ar';

export type { ProCopy, ProFormCopy, ProMaterial } from './types';

/** Thirteen professional editions; Arabic follows the existing whole-site Arabic release gate (true). */
export const PROFESSIONAL_LOCALES = ['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'pl', 'ru', 'sv', 'no', 'da', 'ar'] as const;

export const professionalCopy: Record<string, ProCopy> = { ...proItEn, ...proFrDe, ...proNlEs, ...proPtPl, ...proRuSv, ...proNoDa, ...proAr };

export function professionalPath(locale: string) {
  const c = professionalCopy[locale];
  if (!c) throw new Error(`Unsupported professional locale: ${locale}`);
  return `${locale === 'it' ? '' : `/${locale}`}/${c.slug}`;
}
/** No-login "files coming" page. Never in sitemap or hreflang; always noindex. */
export function professionalDownloadsPath(locale: string) {
  return `${professionalPath(locale)}/${professionalCopy[locale].dlSlug}`;
}

export const PROFESSIONAL_PAGES = PROFESSIONAL_LOCALES.map(locale => ({
  id: 'professionals' as const, locale, path: professionalPath(locale),
  title: professionalCopy[locale].title, description: professionalCopy[locale].description,
}));
export const PROFESSIONAL_DOWNLOAD_PAGES = PROFESSIONAL_LOCALES.map(locale => ({
  id: 'professional-downloads' as const, locale, path: professionalDownloadsPath(locale),
  title: professionalCopy[locale].dlTitle, description: professionalCopy[locale].dlDescription,
}));

const clean = (path: string) => path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
export function professionalPageByPath(path: string) {
  const p = clean(path);
  return PROFESSIONAL_PAGES.find(page => page.path === p) ?? PROFESSIONAL_DOWNLOAD_PAGES.find(page => page.path === p);
}

/** Form copy for the shared callback dialog (falls back to English). */
export const professionalFormCopy = (locale: string) => (professionalCopy[locale] ?? professionalCopy.en).form;

