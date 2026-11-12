import { useMemo, useState, type FormEvent } from 'react';
import { useGetKpiDashboard, getGetKpiDashboardQueryKey, type GetKpiDashboardParams, type KpiSource, type KpiDashboard } from '@workspace/api-client-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Bell, CalendarRange, HardHat, LayoutDashboard, RefreshCw } from 'lucide-react';
import { Notice, StateBadge, errorText, fmtChange, fmtDate, fmtMetric, fmtValue, stateHelp } from './shared';
import './monitoring.css';

type Preset = 7 | 28 | 90 | 'custom';
const yesterdayUtc = () => { const d = new Date(); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
const daySpan = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1;

export function DashboardPanel({ go }: { go: (tab: 'overview' | 'leads' | 'notifications' | 'monitoring') => void }) {
  const [preset, setPreset] = useState<Preset>(28);
  const [draft, setDraft] = useState({ start: '', end: '' });
  const [custom, setCustom] = useState<{ start: string; end: string } | null>(null);
  const [formError, setFormError] = useState('');
  const params: GetKpiDashboardParams = preset === 'custom' && custom ? { start: custom.start, end: custom.end } : { days: preset === 'custom' ? 28 : preset };
  const q = useGetKpiDashboard(params, { query: { queryKey: getGetKpiDashboardQueryKey(params), retry: false, staleTime: 5 * 60_000, refetchOnMount: true } });
  const max = yesterdayUtc();
  const apply = (e: FormEvent) => {
    e.preventDefault();
    const { start, end } = draft;
    if (!start || !end) return setFormError('Indicare data di inizio e di fine.');
    if (start > end) return setFormError('La data di inizio deve precedere la fine.');
    if (end > max) return setFormError('Il periodo deve terminare ieri o prima (UTC).');
    if (daySpan(start, end) > 366) return setFormError('Il periodo può coprire al massimo 366 giorni.');
    setFormError(''); setCustom({ start, end });
  };
  const d = q.data;
  return <div className="int-content mon-root">
    <div className="int-section-intro"><div><span className="int-kicker">KPI / EVIDENZE</span><h2>Numeri che si possono verificare.</h2><p>Ogni fonte è mostrata separatamente, con il suo fuso orario, la freschezza e i limiti. Nessun dato viene inventato né convertito tra fonti; eventuali stime del fornitore sono indicate nei limiti.</p></div>
      <div className="mon-quick"><button className="int-small-button" onClick={() => go('overview')} data-testid="button-quick-overview"><LayoutDashboard size={14} /> Panoramica operativa</button><button className="int-small-button" onClick={() => go('leads')} data-testid="button-quick-leads"><HardHat size={14} /> Richieste</button><button className="int-small-button" onClick={() => go('notifications')} data-testid="button-quick-notifications"><Bell size={14} /> Notifiche</button></div></div>
    <div className="mon-period int-panel">
      <div className="mon-seg" role="group" aria-label="Periodo">{([7, 28, 90] as const).map(n => <button key={n} aria-pressed={preset === n} className={preset === n ? 'on' : ''} onClick={() => { setPreset(n); setFormError(''); }} data-testid={`button-period-${n}`}>{n} giorni</button>)}<button aria-pressed={preset === 'custom'} className={preset === 'custom' ? 'on' : ''} onClick={() => setPreset('custom')} data-testid="button-period-custom"><CalendarRange size={13} /> Personalizzato</button></div>
      {preset === 'custom' && <form className="mon-range" onSubmit={apply}><label>Dal<input type="date" max={max} value={draft.start} onChange={e => setDraft(s => ({ ...s, start: e.target.value }))} data-testid="input-range-start" /></label><label>Al<input type="date" max={max} value={draft.end} onChange={e => setDraft(s => ({ ...s, end: e.target.value }))} data-testid="input-range-end" /></label><button className="int-primary" type="submit" data-testid="button-range-apply">Applica</button></form>}
      {d && <p className="mon-period-meta" data-testid="text-period">Periodo {fmtDate(d.period.start)} – {fmtDate(d.period.end)} ({d.period.days} giorni) · confronto con {fmtDate(d.period.previousStart)} – {fmtDate(d.period.previousEnd)}</p>}
    </div>
    {formError && <Notice tone="error">{formError}</Notice>}
    {preset === 'custom' && !custom && <Notice>Scegliere le date e premere Applica. Fino ad allora sono mostrati gli ultimi 28 giorni.</Notice>}
    {q.isLoading && <div className="mon-skel-grid"><div className="int-skeleton wide" /><div className="int-skeleton" /><div className="int-skeleton" /></div>}
    {q.isError && <Notice tone="error">{errorText(q.error, 'Impossibile caricare la dashboard per questo periodo.')} <button className="int-small-button" onClick={() => q.refetch()} data-testid="button-dashboard-retry"><RefreshCw size={13} /> Riprova</button></Notice>}
    {d && <>
      <SourceSection id="operational" title="Richieste dal sito" kicker="FONTE OPERATIVA / DATABASE" src={d.operational} period={d.period} mode={d.dataMode} />
      <SourceSection id="ga4" title="Google Analytics 4" kicker="FONTE GOOGLE / TRAFFICO" src={d.ga4} period={d.period} onConnect={() => go('monitoring')} />
      <SourceSection id="searchConsole" title="Google Search Console" kicker="FONTE GOOGLE / RICERCA" src={d.searchConsole} period={d.period} onConnect={() => go('monitoring')} />
    </>}
  </div>;
}

function SourceSection({ id, title, kicker, src, period, mode, onConnect }: { id: string; title: string; kicker: string; src: KpiSource; period: KpiDashboard['period']; mode?: KpiDashboard['dataMode']; onConnect?: () => void }) {
  const hasData = src.metrics.some(m => m.value !== null) || src.series.length > 0;
  const blocked = ['not_configured', 'disconnected', 'property_required', 'revoked', 'forbidden'].includes(src.state);
  return <section className={`int-panel mon-source ${src.state === 'stale' ? 'is-stale' : ''}`} aria-labelledby={`src-${id}`} data-testid={`section-source-${id}`}>
    <header className="mon-source-head"><div><span className="int-kicker">{kicker}</span><h3 id={`src-${id}`}>{title}</h3></div><div className="mon-source-badges">{mode && <span className={`mon-mode ${mode}`} data-testid="status-data-mode">{mode === 'synthetic' ? 'DATI SINTETICI DI PROVA' : 'Dati reali dal database'}</span>}<StateBadge state={src.state} /></div></header>
    <dl className="mon-meta"><div><dt>Fonte</dt><dd>{src.source}</dd></div><div><dt>Intervallo</dt><dd>{fmtDate(period.start)} – {fmtDate(period.end)}</dd></div><div><dt>Fuso orario</dt><dd>{src.timezone || 'non indicato'}</dd></div><div><dt>Aggiornato</dt><dd>{fmtDate(src.updatedAt, true)}</dd></div><div><dt>Dati fino al</dt><dd>{fmtDate(src.dataThrough)}</dd></div></dl>
    {mode === 'synthetic' && <Notice tone="warn">Questi numeri operativi sono sintetici: servono a provare l’interfaccia e non descrivono richieste reali.</Notice>}
    {src.state !== 'ready' && <Notice tone={src.state === 'stale' || src.state === 'delayed' ? 'warn' : blocked ? 'info' : 'error'}>{src.message || stateHelp[src.state]}{blocked && onConnect && <> <button className="int-text-button" onClick={onConnect} data-testid={`button-goto-monitoring-${id}`}>Apri Monitoraggio <ArrowRight size={13} /></button></>}</Notice>}
    {src.metrics.length > 0 && <div className="mon-metrics">{src.metrics.map(m => <div className="mon-metric" key={m.key} data-testid={`card-metric-${id}-${m.key}`}><small>{m.key === 'approved' ? 'Approvata' : m.label}</small><strong>{fmtMetric(m, 'value')}</strong><span>prima: {fmtMetric(m, 'previous')}</span><em className={m.change === null ? 'na' : m.change > 0 ? 'up' : m.change < 0 ? 'down' : ''}>{fmtChange(m)}</em></div>)}</div>}
    {src.series.length > 0 && <SeriesChart id={id} src={src} />}
    {src.tables.map(t => <DataTable key={t.title} title={t.title} rows={t.rows} src={src} />)}
    {!hasData && !blocked && src.state !== 'stale' && <div className="int-empty"><span>—</span><strong>Nessun dato</strong><p>La fonte non ha restituito valori per questo periodo.</p></div>}
    {src.limitations.length > 0 && <details className="mon-limits"><summary>Limiti di questa fonte ({src.limitations.length})</summary><ul>{src.limitations.map(l => <li key={l}>{l}</li>)}</ul></details>}
  </section>;
}

function unitFor(src: KpiSource, key: string) { return src.metrics.find(m => m.key === key)?.unit ?? 'count'; }
function labelFor(src: KpiSource, key: string) { const m = src.metrics.find(x => x.key === key); return key === 'approved' ? 'Approvata' : m?.label ?? key; }

function SeriesChart({ id, src }: { id: string; src: KpiSource }) {
  const keys = useMemo(() => Array.from(new Set(src.series.flatMap(r => Object.keys(r.values)))), [src.series]);
  const [key, setKey] = useState(keys[0] ?? '');
  const active = keys.includes(key) ? key : keys[0];
  const unit = unitFor(src, active);
  const data = src.series.map(r => ({ t: Date.parse(`${r.label.slice(0, 10)}T00:00:00Z`), label: r.label, v: r.values[active] ?? null })).filter(r => !Number.isNaN(r.t)).sort((a, b) => a.t - b.t);
  return <div className="mon-chart">
    <div className="mon-chart-head"><strong>Andamento giornaliero</strong><label>Metrica<select value={active} onChange={e => setKey(e.target.value)} data-testid={`select-series-${id}`}>{keys.map(k => <option key={k} value={k}>{labelFor(src, k)}</option>)}</select></label></div>
    <div className="mon-chart-box" role="img" aria-label={`Grafico di ${labelFor(src, active)} per giorno; la tabella equivalente è disponibile sotto.`}>
      <ResponsiveContainer width="100%" height={220}><LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#e8e2d6" vertical={false} />
        <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={t => new Date(Number(t)).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' })} tick={{ fontSize: 11, fill: '#6b6f68' }} minTickGap={24} />
        <YAxis reversed={unit === 'position'} tick={{ fontSize: 11, fill: '#6b6f68' }} width={48} tickFormatter={v => fmtValue(Number(v), unit)} />
        <Tooltip formatter={(v) => [fmtValue(v as number | null, unit), labelFor(src, active)]} labelFormatter={t => new Date(Number(t)).toLocaleDateString('it-IT', { dateStyle: 'medium', timeZone: 'UTC' })} />
        <Line type="linear" dataKey="v" stroke="#61A9BD" strokeWidth={2} dot={data.length < 12} connectNulls={false} isAnimationActive={false} />
      </LineChart></ResponsiveContainer>
    </div>
    {unit === 'position' && <small className="mon-note">Per la posizione media, valori più bassi indicano risultati più in alto.</small>}
    <details className="mon-limits"><summary>Tabella dei valori giornalieri</summary><DataTableInner rows={src.series} src={src} dates /></details>
  </div>;
}

function DataTable({ title, rows, src }: { title: string; rows: KpiSource['series']; src: KpiSource }) {
  return <div className="mon-table-wrap"><strong>{title}</strong>{rows.length ? <DataTableInner rows={rows} src={src} /> : <p className="mon-note">Nessuna riga per questo periodo.</p>}</div>;
}
function DataTableInner({ rows, src, dates }: { rows: KpiSource['series']; src: KpiSource; dates?: boolean }) {
  const cols = Array.from(new Set(rows.flatMap(r => Object.keys(r.values))));
  return <div className="mon-scroll"><table className="mon-table"><thead><tr><th scope="col">{dates ? 'Data' : 'Voce'}</th>{cols.map(c => <th scope="col" key={c}>{labelFor(src, c)}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={`${r.label}-${i}`}><th scope="row">{dates ? fmtDate(r.label) : r.label}</th>{cols.map(c => <td key={c}>{fmtValue(r.values[c] ?? null, unitFor(src, c))}</td>)}</tr>)}</tbody></table></div>;
}
