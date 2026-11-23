import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { getPublicMonitoring, type PublicMonitoring } from '@workspace/api-client-react';
import { getLocaleDirection } from '@/localization/locales';
import { useActiveEditorial, useEditorialStatus } from '@/lib/editorial-runtime';
import { browserAnalytics } from '@/lib/analytics/browser';
import { analyticsCopy } from '@/lib/analytics/copy';
import { CONSENT_KEY, consentValue, isPreviewOrigin, safePath, validConfig, type Choice } from '@/lib/analytics/runtime';
import './analytics-preferences.css';

export function AnalyticsPreferences({ publicEditions }: { publicEditions: readonly { path: string; locale: string }[] }) {
  const [path] = useLocation();
  const active = useActiveEditorial(), editorialStatus = useEditorialStatus();
  const [config, setConfig] = useState<PublicMonitoring | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const paths = useMemo(() => {
    const records = new Map(publicEditions.map(e => [e.path, true]));
    for (const edition of active) for (const candidate of [edition.path, ...(edition.aliases ?? [])]) records.set(candidate, edition.revisionId !== 'withdrawn');
    return new Set([...records].filter(([, allowed]) => allowed).flatMap(([candidate]) => [candidate, encodeURI(candidate)]));
  }, [active, publicEditions]);
  const allowed = editorialStatus === 'verified' ? safePath(path, paths) : null;
  const locale = active.find(e => [e.path, encodeURI(e.path)].includes(path))?.locale ?? publicEditions.find(e => [e.path, encodeURI(e.path)].includes(path))?.locale ?? 'it';
  const text = analyticsCopy[locale];
  const enabled = Boolean(config && typeof window !== 'undefined' && validConfig(config, window.location.origin));
  const visible = Boolean(allowed && text);
  const available = Boolean(visible && enabled);

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
  }, [allowed, text]);

  useEffect(() => {
    const runtime = browserAnalytics();
    runtime?.configure(config);
    runtime?.navigate(available ? allowed : null);
    if (!available || !config) { runtime?.consent(null); setChoice(null); return; }
    const restore = () => {
      let saved: Choice | null = null;
      try { saved = consentValue(localStorage.getItem(CONSENT_KEY), config); } catch { /* storage denied: default no tracking */ }
      setChoice(saved); runtime?.consent(saved);
    };
    restore();
    const changed = (event: StorageEvent) => { if (!event.key || event.key === CONSENT_KEY) restore(); };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
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
    if (next === 'accepted' && (!config || !enabled)) return;
    browserAnalytics()?.consent(next);
    setChoice(next); setOpen(false);
    try {
      if (config && enabled) localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice: next, mode: config.mode ?? 'isolated', origin: config.origin, runtimeOrigin: config.runtimeOrigin, version: config.privacyVersion, id: config.measurementId, at: Date.now() }));
      else localStorage.removeItem(CONSENT_KEY);
    } catch { /* no persistent preference without storage */ }
    opener.current?.focus();
  };
  if (!visible || !text) return null;
  const show = open || (enabled && !choice);
  return <aside className={`analytics-preferences${enabled ? '' : ' analytics-preferences--inactive'}`} lang={locale} dir={getLocaleDirection(locale)} aria-label={text[0]} data-testid="analytics-preferences">
    <div className="analytics-controls">
      <button type="button" ref={opener} onClick={() => setOpen(v => !v)} aria-expanded={show} aria-controls="analytics-options">{text[0]}</button>
      <button type="button" onClick={() => choose('rejected')} data-testid="analytics-withdraw">{text[4]}</button>
    </div>
    {show && <section id="analytics-options" aria-label={text[0]}>
      <p>{text[1]}</p><a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/cookie`} target="_blank" rel="noopener noreferrer">{text[6]}</a>
      <div className="analytics-controls">
        <button type="button" disabled={!enabled} onClick={() => choose('accepted')} data-testid="analytics-accept">{text[2]}</button>
        <button type="button" onClick={() => choose('rejected')} data-testid="analytics-reject">{text[3]}</button>
        {(choice || !enabled) && <button type="button" onClick={() => { setOpen(false); opener.current?.focus(); }}>{text[5]}</button>}
      </div>
    </section>}
  </aside>;
}
