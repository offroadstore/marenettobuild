import localeData from './locales.json';

export const PAGE_KEYS = ['home', 'services', 'process', 'abroad', 'request', 'contact'] as const;
export type PublicPage = typeof PAGE_KEYS[number];
export type LocaleDirection = 'ltr' | 'rtl';

export type LocaleRecord = {
  code: string;
  nativeName: string;
  direction: LocaleDirection;
  script: 'latin' | 'cyrillic' | 'greek' | 'arabic' | 'hebrew';
  publication: 'published' | 'blocked';
  copyStatus: 'complete' | 'missing';
  reviewStatus: 'approved-current-copy' | 'awaiting-owner-review';
  completePages: PublicPage[];
};

export const LOCALES = localeData as LocaleRecord[];
export const PUBLISHED_LOCALES = LOCALES.filter(locale => locale.publication === 'published');
export const LANGUAGE_CHOICES: [string, string][] = LOCALES.map(({ code, nativeName }) => [code, nativeName]);

export function getLocale(code: string): LocaleRecord | undefined {
  return LOCALES.find(locale => locale.code === code);
}

export function canPublishLocale(locale: LocaleRecord): boolean {
  return locale.copyStatus === 'complete'
    && locale.reviewStatus === 'approved-current-copy'
    && PAGE_KEYS.every(page => locale.completePages.includes(page));
}

export function getLocaleDirection(code: string): LocaleDirection {
  return getLocale(code)?.direction ?? 'ltr';
}

export function assertLocaleRegistryIsSafe(): void {
  const codes = new Set(LOCALES.map(locale => locale.code));
  if (LOCALES.length !== 29 || codes.size !== 29) {
    throw new Error(`Expected 29 unique supported locales; found ${LOCALES.length}.`);
  }

  for (const locale of LOCALES) {
    if (locale.publication === 'published' && !canPublishLocale(locale)) {
      throw new Error(`Locale ${locale.code} cannot be published without complete, approved copy.`);
    }
    if (locale.publication === 'blocked' && canPublishLocale(locale)) {
      throw new Error(`Locale ${locale.code} has approved copy but is not marked ready for publication.`);
    }
    if ((locale.code === 'ar' || locale.code === 'he') && locale.direction !== 'rtl') {
      throw new Error(`Locale ${locale.code} must use right-to-left layout.`);
    }
    if (locale.code === 'ar' && locale.script !== 'arabic') {
      throw new Error('Locale ar must use its matching script font configuration.');
    }
    if (locale.code === 'he' && locale.script !== 'hebrew') {
      throw new Error('Locale he must use its matching script font configuration.');
    }
  }
}

assertLocaleRegistryIsSafe();
