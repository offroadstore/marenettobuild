import pages from '@/localization/public-pages.json';
import type { PropertyCopy } from './types';
import { copyA } from './copy-a';
import { copyB } from './copy-b';
import { copyC } from './copy-c';
import { copyD } from './copy-d';
import { prepareSection, extraFaq } from './extra';
import { copyAr, prepareSectionAr, extraFaqAr } from './copy-ar';

export type { PropertyCopy, PropertySection } from './types';

export const PROPERTY_LOCALES = ['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da', 'ar'] as const;
export type PropertyLocale = typeof PROPERTY_LOCALES[number];
export const PARTNER_URL = 'https://www.cefaluapartments.it';
export const PROPERTY_SERVICE_VALUE = 'property_care';
const PROPERTY_SLUGS: Record<PropertyLocale, string> = {
  it: 'gestione-affitti-brevi-cefalu',
  en: 'short-let-property-management-cefalu',
  fr: 'gestion-location-courte-duree-cefalu',
  de: 'ferienvermietung-verwaltung-cefalu',
  nl: 'beheer-vakantieverhuur-cefalu',
  es: 'gestion-alquiler-vacacional-cefalu',
  pt: 'gestao-arrendamento-turistico-cefalu',
  ru: 'upravlenie-kratkosrochnoj-arendoj-chefalu',
  pl: 'zarzadzanie-najmem-krotkoterminowym-cefalu',
  sv: 'forvaltning-korttidsuthyrning-cefalu',
  no: 'forvaltning-korttidsutleie-cefalu',
  da: 'administration-korttidsudlejning-cefalu',
  ar: 'short-let-property-management-cefalu',
};

const base: Record<string, PropertyCopy> = { ...copyA, ...copyB, ...copyC, ...copyD, ...copyAr };
const sections = { ...prepareSection, ...prepareSectionAr };
const faqs = { ...extraFaq, ...extraFaqAr };
export const propertyCopy: Record<string, PropertyCopy> = Object.fromEntries(
  Object.entries(base).map(([locale, c]) => [locale, { ...c, sections: [...c.sections, sections[locale]], faq: [...c.faq.slice(0, 4), ...faqs[locale], ...c.faq.slice(4)] }]),
);

type PageMap = Record<string, Record<string, { path: string }>>;
const publicPages = pages as unknown as PageMap;

function assertLocale(locale: string) {
  if (!propertyCopy[locale]) throw new Error(`Unsupported property-management locale: ${locale}`);
}
export function propertyPath(locale: string) {
  assertLocale(locale);
  return `${locale === 'it' ? '' : `/${locale}`}/${PROPERTY_SLUGS[locale as PropertyLocale]}`;
}
export function publicPagePath(locale: string, key: 'services' | 'abroad' | 'request') {
  return publicPages[locale][key].path;
}
export function propertyRequestPath(locale: string) {
  assertLocale(locale);
  return `${publicPagePath(locale, 'request')}?service=${PROPERTY_SERVICE_VALUE}`;
}

export const PROPERTY_PAGES = PROPERTY_LOCALES.map(locale => ({
  id: 'property-management' as const,
  locale,
  path: propertyPath(locale),
  title: propertyCopy[locale].title,
  description: propertyCopy[locale].description,
}));

export function propertyPageByPath(path: string) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return PROPERTY_PAGES.find(page => page.path === clean);
}

/** Localized notice for the request form when ?service=property_care is preselected. */
export function propertySelectionNotice(locale: string) {
  return propertyCopy[locale]?.selectedService ?? propertyCopy.en.selectedService;
}
