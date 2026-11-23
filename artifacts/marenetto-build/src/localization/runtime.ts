import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import sourceData from './catalogs/sources.json';
import { portugueseReviewTerms, serbianCyrillic } from './editorial-conventions';
import localeRecords from './locales.json' with { type: 'json' };

type ApprovedCatalog = {
  locale: string;
  reviewStatus: 'approved-current-copy';
  translations: Record<string, string>;
};

const catalogLoaders = import.meta.glob<ApprovedCatalog>('./catalogs/[a-z][a-z].json', { import: 'default' });
const approvedCatalogs: Record<string, Record<string, string>> = {};
type PreviewCatalog = { locale: string; reviewStatus: 'awaiting-owner-review'; translations: Record<string, string> };
const previewLoaders = import.meta.glob<PreviewCatalog>('./preview/[a-z][a-z].json', { import: 'default' });
const correctionLoaders = import.meta.glob<PreviewCatalog>('./draft-corrections/[a-z][a-z].json', { import: 'default' });
const phase2Loaders = import.meta.glob<{ locale: string; translations: Record<string, string> }>('./phase2/[a-z][a-z].json', { import: 'default' });
const previewCatalogs: Record<string, Record<string, string>> = {};
let reviewMode = false;
const missing = new Set<string>();
const localizedValues: Record<string, Set<string>> = {};
export function setTranslationReviewMode(value: boolean) { reviewMode = value; }
export function isTranslationReviewMode() { return reviewMode; }
// Owner decision, 18 Nov 2026: the complete translated copy is public for the 12 published locales.
const publicTranslatedLocales = new Set((localeRecords as { code: string; publication: string }[])
  .filter(record => record.publication === 'published' && record.code !== 'it').map(record => record.code));
/** True when this locale shows the full translated copy (review mode, or a published locale). */
export function showsTranslatedCopy(locale: string) { return locale !== 'it' && (reviewMode || publicTranslatedLocales.has(locale)); }
export function resetTranslationFindings() { missing.clear(); }
export function translationFindings() { return [...missing].sort(); }
let previewSourceToId: Record<string, string> = {};

const sourceToId = Object.fromEntries(
  Object.entries((sourceData as { entries: Record<string, string> }).entries)
    .map(([id, source]) => [normalizeSource(source), id]),
);
const translatedCopyCache = new WeakMap<object, Map<string, unknown>>();

function normalizeSource(source: string): string {
  return source.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function translateText(locale: string, source: string): string {
  if (locale === 'it') return source;
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  const normalized = normalizeSource(source);
  const previewId = previewSourceToId[normalized];
  const preview = showsTranslatedCopy(locale) && previewId ? previewCatalogs[locale]?.[previewId] : undefined;
  if (preview) return `${leading}${locale === 'sr' ? serbianCyrillic(preview) : locale === 'pt' ? portugueseReviewTerms(preview) : preview}${trailing}`;
  if (locale === 'en') return source;
  const id = sourceToId[normalized];
  const translated = id ? approvedCatalogs[locale]?.[id] : undefined;
  if (translated) return `${leading}${locale === 'sr' ? serbianCyrillic(translated) : translated}${trailing}`;
  if (!localizedValues[locale]?.has(normalized) && normalized.length > 2 && !/^(https?:|mailto:|tel:|[/#])/.test(normalized)) missing.add(normalized);
  return source;
}

export function isLocaleCatalogLoaded(locale: string): boolean {
  return locale === 'it' || Boolean((!showsTranslatedCopy(locale) || previewCatalogs[locale]) && (locale === 'en' || approvedCatalogs[locale]));
}

export async function loadLocaleCatalog(locale: string): Promise<void> {
  if (isLocaleCatalogLoaded(locale)) return;
  if (locale !== 'en') {
    const loadCatalog = catalogLoaders[`./catalogs/${locale}.json`];
    if (!loadCatalog) throw new Error(`No approved translation catalog is available for ${locale}.`);
    const catalog = await loadCatalog();
    if (catalog.locale !== locale || catalog.reviewStatus !== 'approved-current-copy') {
      throw new Error(`Translation catalog ${locale} is not approved for publication.`);
    }
    approvedCatalogs[locale] = catalog.translations;
    localizedValues[locale] = new Set(Object.values(catalog.translations).map(value => normalizeSource(locale === 'sr' ? serbianCyrillic(value) : value)));
  }
  if (!showsTranslatedCopy(locale)) return;
  const previewSources = (await import('./preview-sources.json')).default;
  previewSourceToId = Object.fromEntries(Object.entries(previewSources.entries).map(([id, text]) => [normalizeSource(text), id]));
  const previewLoader = previewLoaders[`./preview/${locale}.json`];
  if (!previewLoader) throw new Error(`Missing preview translation catalog ${locale}.`);
  const preview = await previewLoader();
  if (preview.locale !== locale || preview.reviewStatus !== 'awaiting-owner-review') throw new Error(`Invalid preview translation catalog ${locale}.`);
  for (const id of Object.keys(previewSources.entries)) if (!preview.translations[id]?.trim()) throw new Error(`Missing ${locale} preview translation: ${id}`);
  const correctionLoader = correctionLoaders[`./draft-corrections/${locale}.json`];
  const correction = correctionLoader ? await correctionLoader() : null;
  if (correction && (correction.locale !== locale || correction.reviewStatus !== 'awaiting-owner-review')) throw new Error(`Invalid draft correction catalog: ${locale}`);
  const phase2 = await phase2Loaders[`./phase2/${locale}.json`]?.();
  if (phase2 && phase2.locale !== locale) throw new Error(`Invalid phase 2 locale: ${locale}`);
  previewCatalogs[locale] = { ...preview.translations, ...correction?.translations, ...phase2?.translations };
  Object.values(previewCatalogs[locale]).forEach(value => localizedValues[locale]?.add(normalizeSource(locale === 'sr' ? serbianCyrillic(value) : value)));
}

function localizeValue(locale: string, value: unknown): unknown {
  if (typeof value === 'string') return translateText(locale, value);
  if (Array.isArray(value)) return value.map(item => localizeValue(locale, item));
  if (isValidElement<{ children?: ReactNode; lang?: string }>(value)) {
    // Explicitly labeled original-language editorial content is not interface copy.
    if (value.props.lang && value.props.lang !== locale) return value;
    const children = value.props.children;
    const translatedProps = Object.fromEntries(Object.entries(value.props).map(([key, child]) => [
      key,
      ['aria-label', 'title', 'placeholder', 'alt'].includes(key) && typeof child === 'string'
        ? translateText(locale, child)
        : child,
    ]));
    return children === undefined
      ? cloneElement(value, translatedProps)
      : cloneElement(value, translatedProps, Children.map(children, child => localizeValue(locale, child) as ReactNode));
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, localizeValue(locale, child)]));
  }
  return value;
}

export function localizeNode(locale: string, node: ReactNode): ReactNode {
  return localizeValue(locale, node) as ReactNode;
}

export function localizeChoice<T>(locale: string, italian: T, english: T): T {
  if (locale === 'it') return italian;
  return localizeValue(locale, english) as T;
}

export function getLocalizedCopy<T extends Record<string, unknown>>(locale: string, source: Record<string, T>): T {
  if (source[locale]) return source[locale];
  return localizeValue(locale, source.en) as T;
}
