import { useMemo, useState } from 'react';
import type { KpiDashboard, KpiRow, KpiSource } from '@workspace/api-client-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Notice, StateBadge, fmtChange, fmtDate, fmtMetric, fmtValue, stateHelp } from './shared';
import { filterLabels, type FilterKey } from './filters';
import { LABEL_COL, nextSort, sortRows, type SortState } from './sort';
import { seriesId, tableId } from './csv';

export type SortProps = { sorts: Record<string, SortState>; onSort: (id: string, s: SortState) => void };
const flabel = (k: string) => filterLabels[k as FilterKey] ?? k;

export function SourceSection({ id, title, kicker, src, period, compare, inapplicable, onConnect, sorts, onSort }: SortProps & {
  id: string; title: string; kicker: string; src: KpiSource; period: KpiDashboard['period']; compare: boolean; inapplicable: string[]; onConnect?: () => void;
}) {
  const hasData = src.metrics.some(m => m.value !== null) || src.series.length > 0;
  const blocked = ['not_configured', 'disconnected', 'property_required', 'revoked', 'forbidden'].includes(src.state);
  const na = inapplicable.length > 0;
  return <section className={`int-panel mon-source ${src.state === 'stale' ? 'is-stale' : ''}`} aria-labelledby={`src-${id}`} data-testid={`section-source-${id}`}>
    <header className="mon-source-head"><div><span className="int-kicker">{kicker}</span><h3 id={`src-${id}`}>{title}</h3></div><div className="mon-source-badges">{na ? <span className="mon-state s-not_configured" data-testid={`status-inapplicable-${id}`}>Filtro non applicabile</span> : <StateBadge state={src.state} />}</div></header>
    <dl className="mon-meta"><div><dt>Fonte</dt><dd>{src.source}</dd></div><div><dt>Intervallo</dt><dd>{fmtDate(period.start)} – {fmtDate(period.end)}</dd></div><div><dt>Fuso orario</dt><dd>{src.timezone || 'non indicato'}</dd></div><div><dt>Aggiornato</dt><dd>{fmtDate(src.updatedAt, true)}</dd></div><div><dt>Dati fino al</dt><dd>{fmtDate(src.dataThrough)}</dd></div></dl>
    <FilterChips applied={src.appliedFilters ?? []} inapplicable={[...new Set([...(src.inapplicableFilters ?? []), ...inapplicable])]} />
    {na ? <Notice tone="info"><span data-testid={`text-inapplicable-${id}`}>Filtro non applicabile a questa fonte: {inapplicable.map(flabel).join(', ')}. Nessun numero è mostrato, per non presentare dati non filtrati come se lo fossero.</span></Notice> : <>
      {src.state !== 'ready' && <Notice tone={src.state === 'stale' || src.state === 'delayed' ? 'warn' : blocked ? 'info' : 'error'}>{src.message || stateHelp[src.state]}{blocked && onConnect && <> <button className="int-text-button" onClick={onConnect} data-testid={`button-goto-monitoring-${id}`}>Apri Monitoraggio <ArrowRight size={13} /></button></>}</Notice>}
      {src.metrics.length > 0 && <div className="mon-metrics">{src.metrics.map(m => <div className="mon-metric" key={m.key} data-testid={`card-metric-${id}-${m.key}`}><small>{m.label}</small><strong>{fmtMetric(m, 'value')}</strong>{compare ? <><span>prima: {fmtMetric(m, 'previous')}</span><em className={m.change === null ? 'na' : m.change === 0 ? '' : (m.change > 0) !== (m.unit === 'position') ? 'up' : 'down'}>{fmtChange(m)}</em></> : <em className="na">confronto disattivato</em>}</div>)}</div>}
      {src.metrics.some(m=>m.unit==='position') && <p className="mon-note">Posizione media: diminuire significa migliorare.</p>}
      {src.series.length > 0 && <SeriesChart id={id} src={src} sorts={sorts} onSort={onSort} />}
      {src.tables.map(t => <div className="mon-table-wrap" key={t.title}><strong>{t.title}</strong><span className="mon-topn" data-testid={`text-topn-${id}`}>Prime {t.rows.length} righe restituite dalla fonte; le voci oltre questo limite non sono incluse.</span>{t.rows.length ? <SortableTable tid={tableId(id, t.title)} rows={t.rows} src={src} sorts={sorts} onSort={onSort} caption={t.title} /> : <p className="mon-note">Nessuna riga per questo periodo.</p>}</div>)}
      {!hasData && !blocked && src.state !== 'stale' && <div className="int-empty"><span>—</span><strong>Nessun dato</strong><p>La fonte non ha restituito valori per questo periodo.</p></div>}
    </>}
    {src.limitations.length > 0 && <details className="mon-limits"><summary>Limiti di questa fonte ({src.limitations.length})</summary><ul>{src.limitations.map(l => <li key={l}>{l}</li>)}</ul></details>}
  </section>;
}

export function FilterChips({ applied, inapplicable }: { applied: string[]; inapplicable: string[] }) {
  if (!applied.length && !inapplicable.length) return <p className="mon-note" data-testid="text-filters-none">Filtri applicati dalla fonte: nessuno oltre il periodo.</p>;
  return <div className="mon-chips">{applied.map(f => <span key={`a-${f}`} className="mon-chip ok" data-testid="chip-filter-applied">Applicato · {flabel(f)}</span>)}{inapplicable.map(f => <span key={`n-${f}`} className="mon-chip no" data-testid="chip-filter-inapplicable">Non applicabile · {flabel(f)}</span>)}</div>;
}

const unitFor = (src: KpiSource, key: string) => src.metrics.find(m => m.key === key)?.unit ?? 'count';
const labelFor = (src: KpiSource, key: string) => src.metrics.find(x => x.key === key)?.label ?? key;

function SeriesChart({ id, src, sorts, onSort }: SortProps & { id: string; src: KpiSource }) {
  const keys = useMemo(() => Array.from(new Set(src.series.flatMap(r => Object.keys(r.values)))), [src.series]);
  const [key, setKey] = useState(keys[0] ?? '');
  const active = keys.includes(key) ? key : keys[0];
  const unit = unitFor(src, active);
  const data = src.series.map(r => ({ t: Date.parse(`${r.label.slice(0, 10)}T00:00:00Z`), v: r.values[active] ?? null })).filter(r => !Number.isNaN(r.t)).sort((a, b) => a.t - b.t);
  return <div className="mon-chart">
    <div className="mon-chart-head"><strong>Andamento giornaliero</strong><label>Metrica<select value={active} onChange={e => setKey(e.target.value)} data-testid={`select-series-${id}`}>{keys.map(k => <option key={k} value={k}>{labelFor(src, k)}</option>)}</select></label></div>
    <div className="mon-chart-box" role="img" aria-label={`Grafico di ${labelFor(src, active)} per giorno; la tabella equivalente è disponibile sotto.`}>
      <ResponsiveContainer width="100%" height={220}><LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#e8e2d6" vertical={false} />
        <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={t => new Date(Number(t)).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' })} tick={{ fontSize: 11, fill: '#6b6f68' }} minTickGap={24} />
        <YAxis reversed={unit === 'position'} tick={{ fontSize: 11, fill: '#6b6f68' }} width={48} tickFormatter={v => fmtValue(Number(v), unit)} />
        <Tooltip formatter={(v) => [fmtValue(v as number | null, unit), labelFor(src, active)]} labelFormatter={t => new Date(Number(t)).toLocaleDateString('it-IT', { dateStyle: 'medium', timeZone: 'UTC' })} />
        <Line type="linear" dataKey="v" stroke="#61A9BD" strokeWidth={id === 'ai' ? 0 : 2} dot={id === 'ai' || data.length < 12} connectNulls={false} isAnimationActive={false} />
      </LineChart></ResponsiveContainer>
    </div>
    {unit === 'position' && <small className="mon-note">Per la posizione media, valori più bassi indicano risultati più in alto.</small>}
    <small className="mon-note">{id === 'ai' ? 'Solo punti osservati: nessuna linea o interpolazione tra rilevazioni IA.' : 'I giorni non restituiti non equivalgono a zero; le linee collegano soltanto i valori disponibili.'}</small>
    <details className="mon-limits"><summary>Tabella dei valori giornalieri</summary><SortableTable tid={seriesId(id)} rows={src.series} src={src} sorts={sorts} onSort={onSort} dates caption="Valori giornalieri" /></details>
  </div>;
}

export function SortableTable({ tid, rows, src, dates, caption, sorts, onSort }: SortProps & { tid: string; rows: KpiRow[]; src: KpiSource; dates?: boolean; caption: string }) {
  const cols = Array.from(new Set(rows.flatMap(r => Object.keys(r.values))));
  const s = sorts[tid] ?? null;
  const sorted = sortRows(rows, s);
  const head = (col: string, label: string) => {
    const on = s?.col === col;
    const Icon = !on ? ArrowUpDown : s.dir === 'asc' ? ArrowUp : ArrowDown;
    return <th scope="col" key={col} aria-sort={on ? (s.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="mon-sort" onClick={() => onSort(tid, nextSort(s, col))} data-testid={`button-sort-${tid}-${col}`}>{label}<Icon size={11} aria-hidden /></button>
    </th>;
  };
  return <div className="mon-scroll"><table className="mon-table"><caption className="mon-sr">{caption}{s ? `, ordinata per ${s.col === LABEL_COL ? 'voce' : labelFor(src, s.col)} ${s.dir === 'asc' ? 'crescente' : 'decrescente'}; valori mancanti in fondo` : ''}</caption>
    <thead><tr>{head(LABEL_COL, dates ? 'Data' : 'Voce')}{cols.map(c => head(c, labelFor(src, c)))}</tr></thead>
    <tbody>{sorted.map((r, i) => <tr key={`${r.label}-${i}`}><th scope="row">{dates ? fmtDate(r.label) : r.label}</th>{cols.map(c => { const v = r.values[c] ?? null; return <td key={c} className={v === null ? 'is-missing' : ''}>{fmtValue(v, unitFor(src, c))}</td>; })}</tr>)}</tbody>
  </table></div>;
}
