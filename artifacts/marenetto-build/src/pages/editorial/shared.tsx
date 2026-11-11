import type { EditorialContent, EditorialSummary } from '@workspace/api-client-react';
import { LOCALES, getLocaleDirection } from '@/localization/locales';

export type EditorialRole = 'owner' | 'editor' | 'viewer';
export type EditorialState = EditorialSummary['state'];

export const STATE_LABELS: Record<EditorialState, string> = { draft: 'Bozza', review: 'In revisione', approved: 'Approvata', active: 'Attiva' };
export const STATE_ORDER: EditorialState[] = ['draft', 'review', 'approved', 'active'];
export const KIND_LABELS = { article: 'Articolo', page: 'Pagina' } as const;
export const ACTION_LABELS: Record<string, string> = { submit: 'Inviata in revisione', approve: 'Approvata', activate: 'Attivata', withdraw: 'Ritirata', restore: 'Ripristinata come bozza', create: 'Creata', save: 'Salvata', import: 'Importata' };

/** Finite freshness: data refetches on every mount and after 30 s of idleness. */
export const QUERY_FRESH = { staleTime: 30_000, refetchOnMount: 'always' as const, refetchOnWindowFocus: true, retry: false };

export const IDENTITY_RE = /^[a-z0-9][a-z0-9/-]{0,179}$/;
export const ALL_LOCALES = LOCALES.map(l => l.code);
export const localeName = (code: string) => LOCALES.find(l => l.code === code)?.nativeName ?? code.toUpperCase();
export const localeDir = (code: string) => (LOCALES.some(l => l.code === code) ? getLocaleDirection(code) : 'ltr');

export function apiErrorText(e: unknown, fallback = 'Operazione non riuscita.'): string {
  const err = e as { status?: number; data?: { error?: unknown } | null; message?: string } | null;
  if (!err) return fallback;
  const msg = err.data && typeof err.data.error === 'string' ? err.data.error : '';
  if (err.status === 503) return msg || 'L’archivio editoriale non è disponibile (503). Nessun dato dimostrativo viene mostrato al suo posto.';
  if (err.status === 409) return msg || 'Conflitto di versione: l’edizione è stata modificata da un’altra sessione.';
  if (err.status === 403) return msg || 'Il tuo ruolo non consente questa operazione.';
  if (err.status === 404) return msg || 'Edizione non trovata.';
  return msg || err.message || fallback;
}

let dirtyFlag = false;
export const setEditorialDirty = (v: boolean) => { dirtyFlag = v; };
export const editorialHasUnsavedChanges = () => dirtyFlag;
export const confirmDiscard = () => !dirtyFlag || window.confirm('Ci sono modifiche non salvate in questa edizione. Uscire e perderle?');

export const shortHash = (h?: string | null) => (h ? h.slice(0, 12) : '—');
export function fmtDate(s?: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}

export const emptyContent = (lang: string): EditorialContent => ({ title: '', summary: '', body: '', category: '', tags: [], image: '', imageAlt: '', sources: [], seoTitle: '', seoDescription: '', contentLanguage: lang });

export function imageError(url: string): string {
  const v = url.trim();
  if (!v) return '';
  if (/\s/.test(v)) return 'L’indirizzo dell’immagine non può contenere spazi.';
  if (v.startsWith('/')) return /^\/(?:media|brand|api\/historical-media)\//.test(v) && !v.includes('..') && !v.includes('?') ? '' : 'Scegli un’immagine pubblica da /media/, /brand/ o /api/historical-media/.';
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password && !/\/(?:internal|private|attachments)(?:\/|$)/i.test(u.pathname) && !/[?&](?:x-goog-|x-amz-|token=|signature=)/i.test(u.search) ? '' : 'Usa un’immagine pubblica HTTPS, non un allegato privato.'; } catch { return 'Usa un percorso pubblico (/…) o un URL https:// valido.'; }
}
export function urlError(url: string): string {
  try { const u = new URL(url.trim()); return u.protocol === 'https:' && !u.username && !u.password ? '' : 'Usa un indirizzo HTTPS pubblico.'; } catch { return 'URL non valido.'; }
}
export function pathError(p: string): string {
  const v = p.trim();
  if (!v) return 'Il percorso è obbligatorio e va indicato esplicitamente.';
  if (!v.startsWith('/')) return 'Il percorso deve iniziare con /.';
  if (v.length > 250) return 'Massimo 250 caratteri.';
  if (v.includes('//') || v.includes('..')) return 'Il percorso non può contenere // o ..';
  if (!/^\/[\p{L}\p{N}\-._~%/]*$/u.test(v)) return 'Caratteri ammessi: lettere, cifre, - . _ ~ % /';
  return '';
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const frameShell = (inner: string, lang = 'it', dir = 'ltr') => `<!doctype html><html lang="${escapeHtml(lang)}" dir="${dir}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: ${escapeHtml(window.location.origin)}; style-src 'unsafe-inline'"><base href="${escapeHtml(window.location.origin)}/" target="_blank"><style>body{font:15px/1.7 Georgia,'Noto Serif',serif;color:#2a2620;background:#fbf8f1;margin:0;padding:22px 26px;overflow-wrap:anywhere}h1{font-size:25px;line-height:1.2;margin:0 0 10px}h2{font-size:19px;margin:24px 0 8px}h3{font-size:16px}img{max-width:100%;height:auto}.lead{color:#5f584c;font-style:italic;border-inline-start:3px solid #b59a6a;padding-inline-start:12px}.meta{font:11px/1.5 monospace;color:#857c6c;margin-bottom:14px}blockquote{border-inline-start:3px solid #d2c6ae;margin:0;padding-inline-start:14px;color:#5d564b}a{color:#8c4f33}table{border-collapse:collapse}td,th{border:1px solid #ddd3c2;padding:4px 7px}</style></head><body>${inner}</body></html>`;

export function contentDocument(c: EditorialContent, locale: string) {
  const img = c.image && !imageError(c.image) ? `<p><img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.imageAlt)}"></p>` : '';
  const sources = c.sources.length ? `<h2>Fonti</h2><ol>${c.sources.map(s => `<li>${escapeHtml(s.title)} <small>${escapeHtml(s.url)}</small></li>`).join('')}</ol>` : '';
  return frameShell(`<div class="meta">${escapeHtml(c.category || 'senza categoria')} · ${escapeHtml(c.tags.join(', '))}</div><h1>${escapeHtml(c.title)}</h1>${c.summary ? `<p class="lead">${escapeHtml(c.summary)}</p>` : ''}${img}${c.body}${sources}`, c.contentLanguage || locale, localeDir(locale));
}
export const rawDocument = (body: string) => frameShell(body);

/** Sandboxed iframe: no allow-scripts, no allow-same-origin. Content never touches the console document. */
export function SafeFrame({ srcDoc, title, className, testId }: { srcDoc: string; title: string; className?: string; testId?: string }) {
  return <iframe className={`ed-frame ${className ?? ''}`} sandbox="" referrerPolicy="no-referrer" srcDoc={srcDoc} title={title} data-testid={testId} />;
}

export function StateBadge({ state }: { state: EditorialState }) {
  return <span className={`ed-state ${state}`} data-testid={`status-${state}`}><i />{STATE_LABELS[state]}</span>;
}
export function ProvenanceTags({ s }: { s: Pick<EditorialSummary, 'historical' | 'correction' | 'stale' | 'contentLanguage' | 'locale'> }) {
  return <span className="ed-tags">
    {s.historical ? <span className="ed-prov historical" title="Provenienza: sito storico. Non equivale ad approvazione.">Storico</span> : <span className="ed-prov rework">Rielaborazione</span>}
    {s.correction && <span className="ed-prov correction">Correzione</span>}
    {s.stale && <span className="ed-prov stale" title="La sorgente italiana è cambiata dopo questa traduzione">Obsoleta</span>}
    {s.contentLanguage !== s.locale && <span className="ed-prov foreign" title={`Contenuto in ${s.contentLanguage.toUpperCase()} pubblicato sotto ${s.locale.toUpperCase()}`}>{s.contentLanguage.toUpperCase()} sotto {s.locale.toUpperCase()}</span>}
  </span>;
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return <div className="ed-skeleton" aria-busy="true" aria-label="Caricamento">{Array.from({ length: rows }, (_, i) => <span key={i} style={{ width: `${92 - (i % 3) * 14}%` }} />)}</div>;
}
