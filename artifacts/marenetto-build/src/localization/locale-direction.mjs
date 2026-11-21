import locales from './locales.json' with { type: 'json' };

export function getLocaleDirection(code) {
  return locales.find(locale => locale.code === code)?.direction ?? 'ltr';
}
