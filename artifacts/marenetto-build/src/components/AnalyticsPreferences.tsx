import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { getPublicMonitoring, type PublicMonitoring } from '@workspace/api-client-react';
import { getLocaleDirection } from '@/localization/locales';
import { useActiveEditorial, useEditorialStatus } from '@/lib/editorial-runtime';
import { browserAnalytics } from '@/lib/analytics/browser';
import { analyticsCopy } from '@/lib/analytics/copy';
import { CONSENT_MAX_AGE, excludedPath, isPreviewOrigin, safePath, validConfig } from '@/lib/analytics/runtime';
import { PREFERENCES_CHANGED, PREFERENCES_KEY, readPreferences, savePreferences, type Preferences } from '@/lib/analytics/preferences';
import { readyVideo, seriesLabels } from '@/content/series-public.mjs';
import { browserMarketing } from '@/lib/analytics/marketing';
import { categoryCopy } from '@/lib/analytics/category-copy';
import { legalPages } from '@/content/legal';
import { useFixedAccessSpace } from '@/lib/analytics/fixed-access';
import { COOKIE_PREFERENCES_EVENT } from './CookiePreferencesLink';
import { legalPath } from '@/content/legal-notices';
import { getCallCopy } from '@/content/call-request-copy';
import './analytics-preferences.css';

type PublicEdition = { path: string; locale: string };
export function AnalyticsPreferences({ publicEditions, preferenceEditions = publicEditions }: {
  publicEditions: readonly PublicEdition[];
  preferenceEditions?: readonly PublicEdition[];
}) {
  const [path] = useLocation();
  const active = useActiveEditorial(), editorialStatus = useEditorialStatus();
  const [config, setConfig] = useState<PublicMonitoring | null>(null);
  const [choice, setChoice] = useState<Preferences | null>(null);
  const [restored, setRestored] = useState(false);
  const [custom, setCustom] = useState(false);
  const [statistics, setStatistics] = useState(false), [marketing, setMarketing] = useState(false);
  const [externalMedia, setExternalMedia] = useState(false);
  const realVideo = active.some(e => e.revisionId !== 'withdrawn' && readyVideo(e.content.guide?.video));
  const [storageError, setStorageError] = useState(false);
  const storageBlocked = useRef(false);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const bar = useRef<HTMLElement>(null);
  useFixedAccessSpace();
  const paths = useMemo(() => {
    const records = new Map(publicEditions.map(e => [e.path, true]));
    for (const edition of active) for (const candidate of [edition.path, ...(edition.aliases ?? [])]) records.set(candidate, edition.revisionId !== 'withdrawn');
    return new Set([...records].filter(([, allowed]) => allowed).flatMap(([candidate]) => [candidate, encodeURI(candidate)]));
  }, [active, publicEditions]);
  // Preference management must remain available even on unmeasured public
  // pages, and must not depend on a non-empty editorial override snapshot.
  const preferencePaths = useMemo(() => new Set(
    [...preferenceEditions, ...legalPages].flatMap(e => [e.path, encodeURI(e.path)]),
  ), [preferenceEditions]);
  const allowed = editorialStatus === 'verified' ? safePath(path, paths) : null;
  const locale = active.find(e => [e.path, encodeURI(e.path)].includes(path))?.locale ?? preferenceEditions.find(e => [e.path, encodeURI(e.path)].includes(path))?.locale ?? path.match(/^\/([a-z]{2})\//)?.[1] ?? 'it';
  const text = analyticsCopy[locale];
  const categories = categoryCopy[locale];
  const enabled = Boolean(config && typeof window !== 'undefined' && validConfig(config, window.location.origin));
  const visible = Boolean(text && !excludedPath(path) && (allowed || safePath(path, preferencePaths)));
  // Public preference controls never extend the separate measured inventory.
  const available = Boolean(visible && typeof window !== 'undefined' && !isPreviewOrigin(window.location.origin));
  const show = visible && (open || (available && restored && !choice));

  useEffect(() => {
    const reopen = (event: Event) => {
      if (!visible) return;
      opener.current = (event as CustomEvent<HTMLElement>).detail;
      setOpen(true); setCustom(true);
      setStatistics(choice?.statistics ?? false); setMarketing(choice?.marketing ?? false);
      setExternalMedia(choice?.externalMedia ?? false);
      requestAnimationFrame(() => bar.current?.focus({ preventScroll: true }));
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, reopen);
  }, [visible, choice]);
  useEffect(() => { setOpen(false); opener.current = null; }, [path]);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('marenetto.cookie-focus') === 'footer') {
        sessionStorage.removeItem('marenetto.cookie-focus');
        document.querySelector<HTMLElement>('[data-testid="cookie-preferences-link"]')?.focus({ preventScroll: true });
      }
    } catch { /* optional focus restoration, never a consent fallback */ }
  }, []);

  useEffect(() => {
    if (!allowed || !text || isPreviewOrigin(window.location.origin)) { browserAnalytics()?.navigate(null); setConfig(null); return; }
    let alive = true, generation = 0;
    let expiry: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      const current = ++generation;
      try {
        const data = await getPublicMonitoring({ cache: 'no-store' });
        if (!alive || current !== generation) return;
        clearTimeout(expiry);
        setConfig(data);
        expiry = setTimeout(() => { browserAnalytics()?.configure(null); setConfig(null); }, Math.max(0, Date.parse(data.expiresAt) - Date.now()));
      } catch { if (alive && current === generation) { browserAnalytics()?.configure(null); setConfig(null); } }
    };
    void refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { alive = false; clearInterval(timer); clearTimeout(expiry); window.removeEventListener('focus', refresh); };
  }, [allowed, text, visible]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const restore = () => {
      let saved: Preferences | null = null;
      clearTimeout(timer);
      try {
        // Preserve a failed withdrawal across GA's mandatory controlled reload,
        // even when a read-only browser refuses to remove the old accepted record.
        storageBlocked.current ||= history.state?.cookieConsentBlocked === true ||
          sessionStorage.getItem('marenetto.cookie-storage-blocked') === 'true';
        if (!storageBlocked.current) saved = readPreferences(localStorage.getItem(PREFERENCES_KEY));
        if (saved) timer = setTimeout(restore, Math.min(86400000, Math.max(1, saved.at + CONSENT_MAX_AGE - Date.now())));
      } catch { /* storage denied: default no tracking */ }
      setChoice(saved); setRestored(true); setStorageError(storageBlocked.current);
      if (!saved) { browserAnalytics()?.consent(null); browserMarketing()?.consent(false); }
    };
    restore();
    const changed = (event: StorageEvent) => {
      if (!event.key || event.key === PREFERENCES_KEY) {
        restore(); setOpen(false);
      }
    };
    window.addEventListener('storage', changed);
    window.addEventListener('focus', restore);
    const visibleAgain = () => { if (document.visibilityState === 'visible') restore(); };
    document.addEventListener('visibilitychange', visibleAgain);
    return () => { clearTimeout(timer); window.removeEventListener('storage', changed); window.removeEventListener('focus', restore); document.removeEventListener('visibilitychange', visibleAgain); };
  }, [choice?.at]);

  useEffect(() => {
    const runtime = browserAnalytics(), meta = browserMarketing();
    runtime?.configure(config);
    runtime?.navigate(available ? allowed : null);
    runtime?.consent(available && choice?.statistics && enabled ? 'accepted' : 'rejected');
    meta?.navigate(available ? allowed : null);
    meta?.consent(Boolean(available && choice?.marketing));
  }, [choice, available, allowed, config, enabled]);

  // Stop BEFORE history changes into an excluded/unknown route; React effects
  // alone run too late to stop an already loaded provider's background timers.
  useEffect(() => {
    const check = (destination: string) => {
      const target = new URL(destination, window.location.href);
      if (target.origin !== window.location.origin || !safePath(target.pathname, paths)) {
        browserAnalytics()?.navigate(null); browserMarketing()?.navigate(null);
      }
    };
    const push = history.pushState, replace = history.replaceState;
    const wrap = (original: typeof history.pushState): typeof history.pushState => function (state, unused, url) {
      if (url != null) check(String(url));
      return original.call(history, state, unused, url);
    };
    const wrappedPush = wrap(push), wrappedReplace = wrap(replace);
    history.pushState = wrappedPush; history.replaceState = wrappedReplace;
    const back = () => check(window.location.href);
    const clicks = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest('a') : null;
      if (!element || !safePath(window.location.pathname, paths)) return;
      const href = element.getAttribute('href') ?? '';
      const channel = /^tel:/i.test(href) ? 'phone' : /^mailto:/i.test(href) ? 'email' : /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(href) ? 'whatsapp' : null;
      if (channel) { browserAnalytics()?.contact(channel); browserMarketing()?.contact(); }
    };
    window.addEventListener('popstate', back);
    document.addEventListener('click', clicks, true);
    return () => {
      if (history.pushState === wrappedPush) history.pushState = push;
      if (history.replaceState === wrappedReplace) history.replaceState = replace;
      window.removeEventListener('popstate', back); document.removeEventListener('click', clicks, true);
    };
  }, [paths]);
  useEffect(() => () => { browserAnalytics()?.navigate(null); browserMarketing()?.navigate(null); }, []);

  const choose = (stats: boolean, ads: boolean, media: boolean) => {
    if (!available) return;
    if (!stats && choice?.statistics && config?.mode === 'direct' && opener.current?.isConnected) {
      try { sessionStorage.setItem('marenetto.cookie-focus', 'footer'); } catch { /* storage may be denied */ }
    }
    const saved = savePreferences(stats, ads, media);
    // Persist before granting or triggering GA's controlled withdrawal reload.
    if (!saved) {
      storageBlocked.current = true;
      try { sessionStorage.setItem('marenetto.cookie-storage-blocked', 'true'); } catch { /* history is the independent reload guard */ }
      try { history.replaceState({ ...history.state, cookieConsentBlocked: true }, ''); } catch { /* storage remains denied in this document */ }
      try { localStorage.removeItem(PREFERENCES_KEY); } catch { /* no implicit consent */ }
    } else {
      storageBlocked.current = false;
      try { sessionStorage.removeItem('marenetto.cookie-storage-blocked'); } catch { /* optional persistence guard */ }
      try { history.replaceState({ ...history.state, cookieConsentBlocked: false }, ''); } catch { /* no consent is inferred */ }
    }
    browserAnalytics()?.consent(saved?.statistics && enabled ? 'accepted' : 'rejected');
    browserMarketing()?.consent(Boolean(saved?.marketing));
    // A same-document event unloads iframes without waiting for a cross-tab event.
    window.dispatchEvent(new Event(PREFERENCES_CHANGED));
    setChoice(saved); setOpen(!saved); setStorageError(!saved); setCustom(false);
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    opener.current = null;
  };
  return <>
    <div className="fixed-access-space" aria-hidden="true" />
    {show && text && <aside ref={bar} id="analytics-options" tabIndex={-1} className="analytics-preferences"
      lang={locale} dir={getLocaleDirection(locale)} aria-label={text.preferences} data-testid="analytics-preferences"
      onKeyDown={event => {
        if (event.key === 'Escape' && open) {
          setOpen(false); opener.current?.focus({ preventScroll: true }); opener.current = null;
        }
      }}>
      <div className="analytics-preferences__inner">
        <p>{available ? categories.message : text.inactive} <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}${legalPath(locale, 'cookies')}`}>{text.info}</a></p>
        {open && <button type="button" className="cookie-customize" data-testid="cookie-close" onClick={() => {
          setOpen(false); opener.current?.focus({ preventScroll: true }); opener.current = null;
        }}>{getCallCopy(locale).close}</button>}
        {available && <>
          <div className="analytics-actions">
            <button type="button" onClick={() => choose(true, true, choice?.externalMedia ?? false)} data-testid="analytics-accept">{text.accept}</button>
            <button type="button" onClick={() => choose(false, false, false)} data-testid="analytics-reject">{text.reject}</button>
          </div>
          <button className="cookie-customize" type="button" aria-expanded={custom} aria-controls="cookie-categories" onClick={() => {
            setCustom(v => !v); setStatistics(choice?.statistics ?? false); setMarketing(choice?.marketing ?? false);
            setExternalMedia(choice?.externalMedia ?? false);
          }} data-testid="cookie-customize">{categories.customize}</button>
        </>}
      </div>
      {available && custom && <fieldset id="cookie-categories" className="cookie-categories">
        <legend>{text.preferences}</legend>
        <label><input type="checkbox" checked={statistics} onChange={e => setStatistics(e.target.checked)} data-testid="consent-statistics" />{categories.statistics}</label>
        <label><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} data-testid="consent-marketing" />{categories.marketing}</label>
        {(realVideo || choice?.externalMedia) && <label><input type="checkbox" checked={externalMedia} onChange={e => setExternalMedia(e.target.checked)} data-testid="consent-external-media" />{seriesLabels[locale]?.[2] ?? seriesLabels.it[2]} (YouTube)</label>}
        <button type="button" onClick={() => choose(statistics, marketing, externalMedia)} data-testid="cookie-save">{categories.save}</button>
      </fieldset>}
      {storageError && <p role="alert">{categories.storageError}</p>}
    </aside>}
  </>;
}
