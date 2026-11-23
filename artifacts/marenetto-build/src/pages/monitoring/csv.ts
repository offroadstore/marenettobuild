import type { AiObservation, KpiPeriod, KpiSource } from '@workspace/api-client-react';
import { sortRows, type SortState } from './sort';

export type ExportScope = 'summary' | 'series' | 'tables' | 'evidence';
export type ExportSource = { key: string; title: string; src: KpiSource; inapplicable: string[] };
export const scopeLabels: Record<ExportScope, string> = { summary: 'Riepilogo', series: 'Serie giornaliere', tables: 'Tabelle', evidence: 'Evidenze IA' };

const LINE_BREAKS = /\r\n|[\r\n\u2028\u2029]/g;
const CONTROL = /[\u0000-\u001f\u007f]/g;
const RISKY_START = /^[\s\u0000-\u001f\u007f]*[=+\-@|%]/;

/** One CSV cell: formula injection neutralised (also behind leading whitespace/control), newlines and controls removed, always quoted. */
export function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  const risky = RISKY_START.test(v) || /^[\u0000-\u001f\u007f]/.test(v);
  const clean = v.replace(LINE_BREAKS, ' ').replace(CONTROL, ' ');
  return `"${(risky ? `'${clean}` : clean).replace(/"/g, '""')}"`;
}

const HEAD = ['ambito', 'fonte', 'tabella', 'riga', 'metrica', 'unita', 'valore', 'precedente', 'variazione', 'nota'];
type Row = (string | number | null)[];
const MISSING = 'valore mancante (diverso da zero)';

export type CsvInput = {
  scope: ExportScope; period: KpiPeriod; compare: boolean; filters: Record<string, string>;
  sources: ExportSource[]; sorts: Record<string, SortState>; observations?: AiObservation[];
};

export const tableId = (source: string, title: string) => `${source}:${title}`;
export const seriesId = (source: string) => `${source}:__series`;

function meta(scope: string, fonte: string, key: string, value: string | number | null): Row { return [scope === 'evidence' ? 'metadati_evidenze' : 'metadati', fonte, '', '', key, '', null, null, null, value === null ? '' : String(value)]; }

export function buildCsv(i: CsvInput): string {
  const rows: Row[] = [];
  const p = i.period;
  rows.push(meta('', 'globale', 'periodo', `${p.start}/${p.end} (${p.days} giorni)`));
  rows.push(meta('', 'globale', 'periodo_precedente', i.compare ? `${p.previousStart}/${p.previousEnd}` : 'confronto disattivato'));
  rows.push(meta('', 'globale', 'filtri_richiesti', Object.entries(i.filters).map(([k, v]) => `${k}=${v}`).join('; ') || 'nessuno'));
  rows.push(meta('', 'globale', 'unita', 'count = conteggio; percent = frazione 0-1 (variazione in punti percentuali); position = posizione media'));
  rows.push(meta('', 'globale', 'ambito_export', `${i.scope}; ordinamento righe identico alle tabelle a schermo`));
  for (const s of i.sources) {
    const src = s.src, f = s.title;
    rows.push(meta('', f, 'stato', s.inapplicable.length ? `filtro non applicabile: ${s.inapplicable.join(', ')}` : src.state));
    rows.push(meta('', f, 'fonte', src.source));
    rows.push(meta('', f, 'fuso_orario', src.timezone || 'non indicato'));
    rows.push(meta('', f, 'aggiornato', src.updatedAt));
    rows.push(meta('', f, 'dati_fino_al', src.dataThrough));
    rows.push(meta('', f, 'filtri_applicati', (src.appliedFilters ?? []).join('; ') || 'nessuno'));
    rows.push(meta('', f, 'filtri_non_applicabili', [...new Set([...(src.inapplicableFilters ?? []), ...s.inapplicable])].join('; ') || 'nessuno'));
    rows.push(meta('', f, 'limiti', src.limitations.join(' | ') || 'nessuno dichiarato'));
    for (const m of src.metrics.filter(m => m.key.startsWith('valid_'))) rows.push(meta('', f, `denominatore_${m.key}`, m.value));
    if (s.inapplicable.length) continue;
    if (i.scope === 'evidence') continue;
    if (i.scope === 'summary') {
      for (const m of src.metrics) rows.push(['riepilogo', f, '', '', m.label, m.unit, m.value, i.compare ? m.previous : null, i.compare ? m.change : null, m.value === null ? MISSING : i.compare ? '' : 'confronto disattivato']);
    } else if (i.scope === 'series') {
      const unit = (k: string) => src.metrics.find(m => m.key === k)?.unit ?? 'count';
      for (const r of sortRows(src.series, i.sorts[seriesId(s.key)] ?? null)) for (const [k, v] of Object.entries(r.values)) rows.push(['serie', f, 'giornaliera', r.label, k, unit(k), v, null, null, v === null ? MISSING : '']);
    } else {
      const unit = (k: string) => src.metrics.find(m => m.key === k)?.unit ?? 'count';
      for (const t of src.tables) {
        rows.push(meta('', f, `top_n_${t.title}`, `${t.rows.length} righe restituite dalla fonte`));
        for (const r of sortRows(t.rows, i.sorts[tableId(s.key, t.title)] ?? null)) for (const [k, v] of Object.entries(r.values)) rows.push(['tabella', f, t.title, r.label, k, unit(k), v, null, null, v === null ? MISSING : '']);
      }
    }
  }
  if (i.scope === 'evidence') rows.push(...evidenceRows(i.observations ?? []));
  return finish(rows);
}

function evidenceRows(obs: AiObservation[]): Row[] {
  const out: Row[] = [meta('evidence', 'IA', 'metodo', 'Osservazioni via API con ricerca, non ranking delle app consumer. Risposte senza grounding ed errori esclusi dal denominatore.')];
  for (const o of obs) {
    const tab = `${o.question.id} v${o.question.version}`;
    out.push(['evidenza_ia', o.provider, tab, o.at, o.status, '', o.mentioned ? 1 : 0, null, null, `citata=${o.cited ? 'si' : 'no'}; grounding=${o.grounded ? 'si' : 'no'}; modello=${o.model}; metodo=${o.method}; estratto=${o.excerpt}`]);
    for (const s of o.sources) out.push(['fonte_citata', o.provider, tab, o.at, s.kind, '', null, null, null, `${s.host} ${s.url}; evidenza_classificazione=${s.basis ?? s.kind}; collegamento al solo dominio, non pagina originale`]);
  }
  return out;
}

function finish(rows: Row[]) { return '\ufeff' + [HEAD, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n'; }

export function downloadCsv(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
