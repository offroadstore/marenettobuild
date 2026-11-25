import type { AtelierCopy } from './types';
import { copyWest } from './copy-west';
import { copyNorth } from './copy-north';

export type { AtelierCopy } from './types';

/** Thirteen complete Atelier editions, coupled to the whole-site Arabic release check. */
/** Arabic is routed with the others; its edition stays draft until ARABIC_PUBLIC_RELEASE. */
export const ATELIER_PUBLIC_LOCALES = ['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da', 'ar'] as const;
/** Arabic review URL while the ar locale is blocked (see localization/arabic-release.ts). */
export const ATELIER_PREVIEW_PREFIX = '/__localization-review/ar-site/atelier-marenetto-outdoor-kitchens';

export const atelierCopy: Record<string, AtelierCopy> = { ...copyWest, ...copyNorth };

export function atelierPath(locale: string) {
  const c = atelierCopy[locale];
  if (!c) throw new Error(`Unsupported Atelier locale: ${locale}`);
  return `${locale === 'it' ? '' : `/${locale}`}/${c.slug}`;
}

export const ATELIER_PAGES = ATELIER_PUBLIC_LOCALES.map(locale => ({
  id: 'atelier' as const, locale, path: atelierPath(locale),
  title: atelierCopy[locale].title, description: atelierCopy[locale].description,
}));

export function atelierPageByPath(path: string) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return ATELIER_PAGES.find(page => page.path === clean);
}
