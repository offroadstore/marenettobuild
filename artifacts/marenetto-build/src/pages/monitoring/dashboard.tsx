import { useMemo, useState } from 'react';
import { useGetKpiDashboard, getGetKpiDashboardQueryKey, useGetInternalSession, getGetInternalSessionQueryKey } from '@workspace/api-client-react';
import { Bell, Download, LayoutDashboard, RefreshCw } from 'lucide-react';
import { Notice, errorText, fmtDate } from './shared';
import { DEFAULT_DRAFT, activeFilters, compatOf, incompatibleFor, sourceLabels, toParams, type Draft } from './filters';
import { SourceSection } from './source-section';
import { FilterBar } from './filter-bar';
import { SummaryStrip } from './summary';
import { AiEvidence } from './ai-evidence';
import { buildCsv, downloadCsv, scopeLabels, type ExportScope, type ExportSource } from './csv';
import type { SortState } from './sort';
import './monitoring.css';

const yesterdayUtc = () => { const d = new Date(); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
const daySpan = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1;
const kickers: Record<string, string> = { ga4: 'FONTE GOOGLE / TRAFFICO', searchConsole: 'FONTE GOOGLE / RICERCA', bing: 'FONTE MICROSOFT / RICERCA', ai: 'FONTE IA / OSSERVAZIONI API' };

export function DashboardPanel({ go }: { go: (tab: 'overview' | 'leads' | 'notifications' | 'monitoring') => void }) {
  const session = useGetInternalSession({ query: { queryKey: getGetInternalSessionQueryKey(), staleTime: 5 * 60_000, retry: false } });
  const canManage = !!session.data?.permissions.includes('monitoring:manage');
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [applied, setApplied] = useState<Draft>(DEFAULT_DRAFT);
  const [formError, setFormError] = useState('');
  const [sorts, setSorts] = useState<Record<string, SortState>>({});
  const params = toParams(applied);
  const q = useGetKpiDashboard(params, { query: { queryKey: getGetKpiDashboardQueryKey(params), retry: false, staleTime: 5 * 60_000, refetchOnMount: true } });
  const d = q.data;
  const compat = compatOf(d?.compatibility);
  const max = yesterdayUtc();
  const dirty = JSON.stringify(toParams(draft)) !== JSON.stringify(params);
  const apply = () => {
    if (draft.preset === 'custom') {
      const { start, end } = draft;
      if (!start || !end) return setFormError('Indicare data di inizio e di fine.');
      if (start > end) return setFormError('La data di inizio deve precedere la fine.');
      if (end > max) return setFormError('Il periodo deve terminare ieri o prima (UTC).');
      if (daySpan(start, end) > 366) return setFormError('Il periodo può coprire al massimo 366 giorni.');
    }
    if (!canManage && (draft.source === 'ai' || draft.filters.provider || draft.filters.question)) return setFormError('I filtri IA sono riservati al titolare.');
    setFormError(''); setApplied(draft);
  };
  const filters = activeFilters(applied.filters);

  const sources: ExportSource[] = useMemo(() => {
    if (!d) return [];
    const list: { key: string; src?: typeof d.ga4 }[] = [{ key: 'ga4', src: d.ga4 }, { key: 'searchConsole', src: d.searchConsole }, { key: 'bing', src: d.bing }];
    if (canManage) list.push({ key: 'ai', src: d.ai });
    return list.filter((x): x is { key: string; src: typeof d.ga4 } => !!x.src && (applied.source === 'all' || applied.source === x.key))
      .map(x => ({ key: x.key, title: sourceLabels[x.key as keyof typeof sourceLabels], src: x.src, inapplicable: incompatibleFor(x.key, filters, compat) }));
  }, [d, canManage, applied.source, filters, compat]);
  const observations = canManage && (applied.source === 'all' || applied.source === 'ai') ? d?.observations ?? [] : [];
  const compare = d?.compare ?? applied.compare;

  const exportCsv = (scope: ExportScope) => {
    if (!d) return;
    const text = buildCsv({ scope, period: d.period, compare, filters, sources, sorts, observations: scope === 'evidence' ? observations : undefined });
    downloadCsv(`kpi-${scope}-${d.period.start}_${d.period.end}.csv`, text);
  };
  const meta = d ? `Periodo ${fmtDate(d.period.start)} – ${fmtDate(d.period.end)} (${d.period.days} giorni) · ${compare ? `confronto con ${fmtDate(d.period.previousStart)} – ${fmtDate(d.period.previousEnd)}` : 'confronto disattivato'}` : undefined;

  return <div className="int-content mon-root">
    <div className="int-section-intro"><div><span className="int-kicker">KPI / EVIDENZE</span><h2>Numeri che si possono verificare.</h2><p>Ogni fonte è mostrata separatamente, con il suo fuso orario, la freschezza e i limiti. Nessun dato viene inventato, sommato o convertito tra fonti; un valore mancante non è uno zero.</p></div>
      <div className="mon-quick"><button className="int-small-button" onClick={() => go('overview')} data-testid="button-quick-overview"><LayoutDashboard size={14} /> Panoramica operativa</button><button className="int-small-button" onClick={() => go('notifications')} data-testid="button-quick-notifications"><Bell size={14} /> Notifiche</button></div></div>
    <FilterBar draft={draft} setDraft={setDraft} onApply={apply} onReset={() => { setDraft(DEFAULT_DRAFT); setApplied(DEFAULT_DRAFT); setFormError(''); }} compat={compat} canManage={canManage} dirty={dirty} maxDate={max} meta={meta} />
    {formError && <Notice tone="error">{formError}</Notice>}
    {q.isLoading && <div className="mon-skel-grid"><div className="int-skeleton wide" /><div className="int-skeleton" /><div className="int-skeleton" /></div>}
    {q.isError && <Notice tone="error">{errorText(q.error, 'Impossibile caricare la dashboard per questo periodo.')} <button className="int-small-button" onClick={() => q.refetch()} data-testid="button-dashboard-retry"><RefreshCw size={13} /> Riprova</button></Notice>}
    {d && <>
      <SummaryStrip sources={sources} compare={compare} showMeta={applied.source === 'all'} />
      <div className="int-panel mon-export" data-testid="panel-export">
        <div><strong>Esporta CSV</strong><p className="mon-note">Usa solo i dati già caricati in questa pagina, nello stesso ordinamento delle tabelle. Include periodo, fuso, freschezza, stato, limiti, filtri, unità e denominatori.</p></div>
        <div className="mon-actions">{(['summary', 'series', 'tables'] as const).map(s => <button key={s} className="int-small-button" onClick={() => exportCsv(s)} data-testid={`button-export-${s}`}><Download size={13} /> {scopeLabels[s]}</button>)}{canManage && observations.length > 0 && <button className="int-small-button" onClick={() => exportCsv('evidence')} data-testid="button-export-evidence"><Download size={13} /> {scopeLabels.evidence}</button>}</div>
      </div>
      {applied.source === 'all' && <OperationalUnavailable />}
      {sources.map(s => <SourceSection key={s.key} id={s.key} title={s.title} kicker={kickers[s.key]} src={s.src} period={d.period} compare={compare} inapplicable={s.inapplicable} sorts={sorts} onSort={(id, st) => setSorts(m => ({ ...m, [id]: st }))} onConnect={() => go('monitoring')} />)}
      {applied.source === 'bing' && !d.bing && <Notice>Bing Webmaster Tools non è disponibile in questa risposta: configurare la proprietà in Monitoraggio.</Notice>}
      {canManage && (applied.source === 'all' || applied.source === 'ai') && d.observations && incompatibleFor('ai', filters, compat).length === 0 && <AiEvidence observations={observations} />}
    </>}
  </div>;
}

function OperationalUnavailable() {
  return <section className="int-panel mon-source" aria-labelledby="src-operational" data-testid="section-source-operational">
    <header className="mon-source-head"><div><span className="int-kicker">FONTE OPERATIVA</span><h3 id="src-operational">Richieste dal sito</h3></div><span className="mon-state s-unavailable" data-testid="status-operational-unavailable">Fonte indisponibile</span></header>
    <p className="mon-copy">Il modulo attuale invia soltanto email e non alimenta i vecchi lead. Non è disponibile un contatore anonimo con copertura sufficientemente affidabile dopo interruzioni o errori: nessun conteggio o zero presunto viene mostrato. Un clic contatto, un evento GA4 e un invio accettato da SMTP sono misure diverse; nessuno prova la consegna in casella. Lo storico delle vecchie richieste non viene letto da questo cruscotto né cancellato.</p>
  </section>;
}
