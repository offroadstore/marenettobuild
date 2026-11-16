import { renderDocument } from './seo-document.mjs';
// Only server-side configuration. Browser requests still use the shared /api
// route. Production must name this revision's API service (or internal proxy),
// never a public domain which could still serve the previous deployment.
export function editorialOrigin(env = process.env) {
  const value = env.EDITORIAL_API_ORIGIN ?? (env.NODE_ENV !== 'production' ? 'http://localhost:80' : '');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Invalid server editorial origin');
  }
  return url.origin;
}
let lastDiagnostic = -Infinity;
function unavailable(reason, status) {
  // At most one bounded diagnostic per 30 seconds, regardless of traffic or
  // changing failures. Never include URLs, payloads, headers or raw exceptions.
  if (Date.now() - lastDiagnostic >= 30_000) {
    lastDiagnostic = Date.now();
    console.error('Editorial upstream unavailable', { reason, ...(status ? { status } : {}) });
  }
  const error = new Error('Stato editoriale non verificabile.');
  error.code = 'EDITORIAL_UNAVAILABLE';
  error.reason = reason;
  return error;
}
export async function readActiveEditorial() {
  let origin;
  try { origin = editorialOrigin(); }
  catch { throw unavailable('configuration'); }
  let response;
  try {
    response = await fetch(`${origin}/api/editorial/active`, { signal: AbortSignal.timeout(5000), cache: 'no-store', redirect: 'manual' });
    if (!response.ok) {
      await response.body?.cancel();
      throw unavailable('http_status', response.status);
    }
    let active;
    try { active = await response.json(); }
    catch (error) {
      if (error.name === 'SyntaxError') throw unavailable('invalid_json');
      throw error;
    }
    if (!Array.isArray(active) || !active.every(e => e && typeof e.path === 'string' && typeof e.locale === 'string'
      && typeof e.revisionId === 'string' && typeof e.kind === 'string' && e.content && typeof e.content === 'object'
      && (!e.aliases || (Array.isArray(e.aliases) && e.aliases.every(alias => typeof alias === 'string'))))) {
      throw unavailable('invalid_snapshot');
    }
    return active;
  } catch (error) {
    if (error.code === 'EDITORIAL_UNAVAILABLE') throw error;
    throw unavailable(error.name === 'TimeoutError' || error.name === 'AbortError' ? 'timeout' : 'connection');
  }
}
export const editorialUnavailableHTML = '<!doctype html><html lang="it" dir="ltr"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Contenuti temporaneamente non disponibili</title></head><body><main><h1>Contenuti temporaneamente non disponibili</h1><p>Non possiamo verificare quali revisioni sono attive. Riprova tra poco: nessuna copia precedente viene ripubblicata.</p></main></body></html>';
export function withEditorialSnapshot(html, active) {
  return html.replace('</head>', `<script>window.__EDITORIAL_ACTIVE__=${JSON.stringify(active).replaceAll('<','\\u003c')};</script></head>`);
}
export function editorialDocument(template, rendered, edition, active, status = 200) {
  const selected = edition && { ...edition, title: edition.content.seoTitle || edition.content.title, description: edition.content.seoDescription || edition.content.summary, state: 'reviewed' };
  // Remain noindex. Editorial approval is deliberately not release approval;
  // dynamic editions are not automatically added to hreflang or sitemap.
  return withEditorialSnapshot(renderDocument(template, { edition: status === 200 ? selected : undefined, body: rendered.body, status }), active);
}
export const key = path => { try { return decodeURIComponent(path).replace(/\/+$/, '') || '/'; } catch { return path; } };
