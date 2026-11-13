import { getDomain } from 'tldts';

export const RUNTIME_PATH = '/_analytics-runtime/';
function publicOrigin(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && u.origin === raw && !u.port &&
      !/(?:replit\.(?:dev|app)|repl\.co|localhost|\.invalid)$/.test(u.hostname) &&
      getDomain(u.hostname, { allowPrivateDomains: true }) ? u : null;
  } catch { return null; }
}
export function runtimePolicy(env) {
  const site = publicOrigin(env.MARENETTO_ANALYTICS_ORIGIN);
  const runtime = publicOrigin(env.MARENETTO_ANALYTICS_RUNTIME_ORIGIN);
  if (env.NODE_ENV !== 'production' || env.MARENETTO_ANALYTICS_RUNTIME_APPROVED !== 'true' ||
    env.MARENETTO_ANALYTICS_RELEASE_APPROVED !== 'true' || env.MARENETTO_ANALYTICS_PRIVACY_APPROVED !== 'true' ||
    !site || !runtime || getDomain(site.hostname, { allowPrivateDomains: true }) === getDomain(runtime.hostname, { allowPrivateDomains: true })) return null;
  const csp = `default-src 'none'; script-src 'self' https://www.googletagmanager.com; style-src 'unsafe-inline'; connect-src https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; img-src https://*.google-analytics.com https://*.analytics.google.com; frame-src 'none'; frame-ancestors ${site.origin}; base-uri 'none'; form-action 'none'`;
  return { siteOrigin: site.origin, runtimeOrigin: runtime.origin, host: runtime.host, csp };
}
// The parent origin is deliberately pinned by the independent deployment,
// never accepted from a URL, fragment, referrer, message or arbitrary Host.
export function runtimeDocument(policy) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Runtime analytics Marenetto</title><script defer src="${RUNTIME_PATH}runtime.js" data-site-origin="${policy.siteOrigin}"></script></head><body></body></html>`;
}
