// Visual hints only: a language does not identify a visitor's nationality.
const REGIONS: Record<string, string> = {
  it: 'IT', en: 'GB', fr: 'FR', de: 'DE', nl: 'NL', es: 'ES', pt: 'PT',
  ru: 'RU', pl: 'PL', ro: 'RO', uk: 'UA', cs: 'CZ', sk: 'SK', sl: 'SI',
  hr: 'HR', sr: 'RS', bg: 'BG', bs: 'BA', mk: 'MK', be: 'BY', ar: 'SA',
  he: 'IL', sv: 'SE', no: 'NO', da: 'DK', fi: 'FI', hu: 'HU', el: 'GR', tr: 'TR',
};

export function languageFlag(code: string): string {
  const region = REGIONS[code];
  return region ? [...region].map(letter => String.fromCodePoint(127397 + letter.charCodeAt(0))).join('') : '';
}
