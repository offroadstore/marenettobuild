import { renderDocument } from './seo-document.mjs';
export async function readActiveEditorial() {
  try {
    const response = await fetch('http://localhost:80/api/editorial/active', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!response.ok) throw new Error('Editorial unavailable');
    const active = await response.json();
    if (!Array.isArray(active)) throw new Error('Invalid editorial response');
    return active;
  } catch {
    const error = new Error('Stato editoriale non verificabile.');
    error.code = 'EDITORIAL_UNAVAILABLE';
    throw error;
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
