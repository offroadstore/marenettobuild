import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { getPublicMonitoring, type PublicMonitoring } from '@workspace/api-client-react';
import { getLocaleDirection } from '@/localization/locales';
import { useActiveEditorial, useEditorialStatus } from '@/lib/editorial-runtime';
import { browserAnalytics } from '@/lib/analytics/browser';
import { analyticsCopy } from '@/lib/analytics/copy';
import { CONSENT_KEY, CONSENT_MAX_AGE, consentValue, excludedPath, isPreviewOrigin, safePath, validConfig, type Choice } from '@/lib/analytics/runtime';
import { legalPages } from '@/content/legal';
import { useFixedAccessSpace } from '@/lib/analytics/fixed-access';
import { COOKIE_PREFERENCES_EVENT } from './CookiePreferencesLink';
import './analytics-preferences.css';

export function AnalyticsPreferences({ publicEditions }: { publicEditions: readonly { path: string; locale: string }[] }) {
  const [path] = useLocation();
  const active = useActiveEditorial(), editorialStatus = useEditorialStatus();
  const [config, setConfig] = useState<PublicMonitoring | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);
  const [restoredConfig, setRestoredConfig] = useState<PublicMonitoring | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const bar = useRef<HTMLElement>(null);
  useFixedAccessSpace();
  const paths = useMemo(() => {
    const records = new Map(publicEditions.map(e => [e.path, true]));
    for (const edition of active) for (const candidate of [edition.path, ...(edition.aliases ?? [])]) records.set(candidate, edition.revisionId !== 'withdrawn');
    return new Set([...records].filter(([, allowed]) => allowed).flatMap(([candidate]) => [candidate, encodeURI(candidate)]));
  }, [active, publicEditions]);
  const allowed = editorialStatus === 'verified' ? safePath(path, paths) : null;
  const locale = active.find(e => [e.path, encodeURI(e.path)].includes(path))?.locale ?? publicEditions.find(e => [e.path, encodeURI(e.path)].includes(path))?.locale ?? 'it';
  const text = analyticsCopy[locale];
  const enabled = Boolean(config && typeof window !== 'undefined' && validConfig(config, window.location.origin));
  const visible = Boolean(text && !excludedPath(path) && (allowed || legalPages.some(page => page.path === path)));
  // Legal pages share the footer controls, but never extend the measured inventory.
  const available = Boolean(visible && enabled);
  const show = visible && (open || (available && restoredConfig === config && !choice));

  useEffect(() => {
    const reopen = (event: Event) => {
      if (!visible) return;
      opener.current = (event as CustomEvent<HTMLElement>).detail;
      setOpen(value => !value);
      requestAnimationFrame(() => bar.current?.focus({ preventScroll: true }));
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, reopen);
  }, [visible]);
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
    if (!visible || !text || isPreviewOrigin(window.location.origin)) { browserAnalytics()?.navigate(null); setConfig(null); return; }
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
    const runtime = browserAnalytics();
    runtime?.configure(config);
    if (!available || !config) { runtime?.navigate(null); runtime?.consent(null); setChoice(null); setRestoredConfig(null); return; }
    let timer: ReturnType<typeof setTimeout>;
    const restore = () => {
      let saved: Choice | null = null;
      clearTimeout(timer);
      try {
        const raw = localStorage.getItem(CONSENT_KEY);
        saved = consentValue(raw, config);
        // A long-lived open tab must expire too. Never refresh the stored timestamp.
        if (saved) timer = setTimeout(restore, Math.min(86400000, Math.max(1, JSON.parse(raw!).at + CONSENT_MAX_AGE - Date.now())));
      } catch { /* storage denied: default no tracking */ }
      setChoice(saved); setRestoredConfig(config); runtime?.consent(saved);
      runtime?.navigate(allowed);
    };
    restore();
    const changed = (event: StorageEvent) => {
      if ((!event.storageArea || event.storageArea === localStorage) && (!event.key || event.key === CONSENT_KEY)) {
        restore(); setOpen(false);
      }
    };
    window.addEventListener('storage', changed);
    return () => { clearTimeout(timer); window.removeEventListener('storage', changed); };
  }, [config, available, allowed]);

  // Stop BEFORE history changes into an excluded/unknown route; React effects
  // alone run too late to stop an already loaded provider's background timers.
  useEffect(() => {
    const check = (destination: string) => {
      const target = new URL(destination, window.location.href);
      if (target.origin !== window.location.origin || !safePath(target.pathname, paths)) browserAnalytics()?.navigate(null);
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
      if (channel) browserAnalytics()?.contact(channel);
    };
    window.addEventListener('popstate', back);
    document.addEventListener('click', clicks, true);
    return () => {
      if (history.pushState === wrappedPush) history.pushState = push;
      if (history.replaceState === wrappedReplace) history.replaceState = replace;
      window.removeEventListener('popstate', back); document.removeEventListener('click', clicks, true);
    };
  }, [paths]);
  useEffect(() => () => browserAnalytics()?.navigate(null), []);

  const choose = (next: Choice) => {
    if (!config || !validConfig(config, window.location.origin)) return;
    if (next === 'rejected' && choice === 'accepted' && config.mode === 'direct' && opener.current?.isConnected) {
      try { sessionStorage.setItem('marenetto.cookie-focus', 'footer'); } catch { /* storage may be denied */ }
    }
    browserAnalytics()?.consent(next);
    setChoice(next); setOpen(false);
    try {
      if (config && enabled) localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice: next, mode: config.mode ?? 'isolated', origin: config.origin, runtimeOrigin: config.runtimeOrigin, version: config.privacyVersion, id: config.measurementId, at: Date.now() }));
      else localStorage.removeItem(CONSENT_KEY);
    } catch { /* no persistent preference without storage */ }
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
        <p>{available ? text.message : text.inactive} <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/cookie`}>{text.info}</a></p>
        {available && <div className="analytics-actions">
          <button type="button" onClick={() => choose('accepted')} data-testid="analytics-accept">{text.accept}</button>
          <button type="button" onClick={() => choose('rejected')} data-testid="analytics-reject">{text.reject}</button>
        </div>}
      </div>
    </aside>}
  </>;
}
