import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import sourceData from './catalogs/sources.json';
import previewSources from './preview-sources.json';

type ApprovedCatalog = {
  locale: string;
  reviewStatus: 'approved-current-copy';
  translations: Record<string, string>;
};

const catalogLoaders = import.meta.glob<ApprovedCatalog>('./catalogs/[a-z][a-z].json', { import: 'default' });
const approvedCatalogs: Record<string, Record<string, string>> = {};
type PreviewCatalog = { locale: string; reviewStatus: 'awaiting-owner-review'; translations: Record<string, string> };
const previewLoaders = import.meta.glob<PreviewCatalog>('./preview/[a-z][a-z].json', { import: 'default' });
const previewCatalogs: Record<string, Record<string, string>> = {};
const previewSourceToId = Object.fromEntries(Object.entries(previewSources.entries).map(([id, text]) => [normalizeSource(text), id]));

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
  const preview = previewId ? previewCatalogs[locale]?.[previewId] : undefined;
  if (preview) return `${leading}${preview}${trailing}`;
  if (locale === 'en') return source;
  const id = sourceToId[normalized];
  const translated = id ? approvedCatalogs[locale]?.[id] : undefined;
  return translated ? `${leading}${translated}${trailing}` : source;
}

export function isLocaleCatalogLoaded(locale: string): boolean {
  return locale === 'it' || Boolean(previewCatalogs[locale] && (locale === 'en' || approvedCatalogs[locale]));
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
  }
  const previewLoader = previewLoaders[`./preview/${locale}.json`];
  if (!previewLoader) throw new Error(`Missing preview translation catalog ${locale}.`);
  const preview = await previewLoader();
  if (preview.locale !== locale || preview.reviewStatus !== 'awaiting-owner-review') throw new Error(`Invalid preview translation catalog ${locale}.`);
  for (const id of Object.keys(previewSources.entries)) if (!preview.translations[id]?.trim()) throw new Error(`Missing ${locale} preview translation: ${id}`);
  previewCatalogs[locale] = preview.translations;
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
  const base = source.en;
  let byLocale = translatedCopyCache.get(base);
  if (!byLocale) {
    byLocale = new Map();
    translatedCopyCache.set(base, byLocale);
  }
  if (!byLocale.has(locale)) byLocale.set(locale, localizeValue(locale, base));
  return byLocale.get(locale) as T;
}
