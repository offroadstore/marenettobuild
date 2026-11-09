export const LANGUAGE_STORAGE_KEY = 'marenetto-language';
const DEFAULT_LANGUAGE = 'it';
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|lighthouse|embedly|pinterest|linkedin|skype|discord|curl|wget/i;

// Browsers may report "no" (Norwegian) as nb/nn; the published site uses "no".
const ALIASES: Record<string, string> = { nb: 'no', nn: 'no', iw: 'he' };

function baseLanguage(tag: string): string | undefined {
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  if (!/^[a-z]{2,3}$/.test(base)) return undefined;
  return ALIASES[base] ?? base;
}

/**
 * Returns the language code to show on first entry from the home page.
 * A saved explicit choice wins; otherwise the first browser language whose
 * base language is published. Unpublished languages are never returned.
 */
export function chooseLanguage(browserLanguages: readonly string[], savedChoice: string | null | undefined, publishedCodes: readonly string[]): string {
  const published = new Set(publishedCodes);
  if (savedChoice && published.has(savedChoice)) return savedChoice;
  for (const tag of browserLanguages) {
    const base = baseLanguage(tag);
    if (base && published.has(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

export function isAutomaticVisitor(userAgent: string): boolean {
  return BOT_PATTERN.test(userAgent);
}

export function readSavedLanguage(): string | null {
  try { return window.localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { return null; }
}

export function saveLanguageChoice(code: string): void {
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code); } catch { /* storage unavailable or blocked */ }
}
