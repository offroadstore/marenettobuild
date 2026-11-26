import { useEffect, useState } from 'react';
import { PREFERENCES_CHANGED, PREFERENCES_KEY, readPreferences } from './preferences';
import { CONSENT_MAX_AGE, isPreviewOrigin } from './runtime';

/** SSR and initial hydration are always local, even with an accepted saved choice. */
export function useExternalMediaConsent() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const restore = () => {
      clearTimeout(timer);
      let saved = null;
      try {
        if (!isPreviewOrigin(location.origin) && history.state?.cookieConsentBlocked !== true &&
          sessionStorage.getItem('marenetto.cookie-storage-blocked') !== 'true') {
          saved = readPreferences(localStorage.getItem(PREFERENCES_KEY));
        }
      } catch { /* storage denied means no external media */ }
      setAllowed(saved?.externalMedia === true);
      if (saved) timer = setTimeout(restore, Math.min(86400000, Math.max(1, saved.at + CONSENT_MAX_AGE - Date.now())));
    };
    const changed = (event: StorageEvent) => { if (!event.key || event.key === PREFERENCES_KEY) restore(); };
    restore();
    window.addEventListener(PREFERENCES_CHANGED, restore);
    window.addEventListener('storage', changed);
    window.addEventListener('focus', restore);
    document.addEventListener('visibilitychange', restore);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(PREFERENCES_CHANGED, restore);
      window.removeEventListener('storage', changed);
      window.removeEventListener('focus', restore);
      document.removeEventListener('visibilitychange', restore);
    };
  }, []);
  return allowed;
}
