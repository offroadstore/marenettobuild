import { analyticsCopy } from '@/lib/analytics/copy';
import { legalPath, noticeCopy } from '@/content/legal-notices';

export const COOKIE_PREFERENCES_EVENT = 'marenetto:cookie-preferences';

/** The only persistent entry; opening never changes the stored consent. */
export function CookiePreferencesLink({ lang }: { lang: string }) {
  const text = analyticsCopy[lang];
  if (!text) return null;
  return <a href={noticeCopy[lang] ? legalPath(lang, 'cookies') : '/cookie'} lang={lang} className="cookie-preferences-link"
    data-testid="cookie-preferences-link" onClick={event => {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT, { detail: event.currentTarget }));
    }}>{text.preferences}</a>;
}
