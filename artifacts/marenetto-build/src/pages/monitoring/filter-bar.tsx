import type { FormEvent } from 'react';
import { CalendarRange, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { AiProvider, GetKpiDashboardDevice } from '@workspace/api-client-react';
import { FILTER_KEYS, filterAllowed, filterLabels, filterMax, sourceLabels, type Draft, type FilterKey, type SourceKey } from './filters';
import publicPages from '../../localization/public-pages.json';

const deviceLabels: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' };
const providerLabels: Record<string, string> = { openai: 'OpenAI', gemini: 'Google Gemini', anthropic: 'Anthropic' };
const choices: Partial<Record<FilterKey, string[]>> = {
  country: ['ITA','GBR','USA','FRA','DEU','NLD','ESP','CHE','BEL','AUT','CAN','AUS','SWE'],
  city: ['Cefalù','Palermo','Roma','Milano','London','Paris','Berlin','Amsterdam'],
  channel: ['Direct','Organic Search','Paid Search','Referral','Organic Social','Email','Unassigned'],
  trafficSource: ['google','bing','(direct)','facebook','instagram','newsletter'],
  pageLanguage: Object.keys(publicPages),
  page: Object.values(publicPages).flatMap(p => Object.values(p).map(v => v.path)),
};

export function FilterBar({ draft, setDraft, onApply, onReset, compat, canManage, dirty, maxDate, meta }: {
  draft: Draft; setDraft: (f: (d: Draft) => Draft) => void; onApply: () => void; onReset: () => void;
  compat: Record<string, string[]>; canManage: boolean; dirty: boolean; maxDate: string; meta?: string;
}) {
  const sources: ('all' | SourceKey)[] = canManage ? ['all', 'ga4', 'searchConsole', 'bing', 'ai'] : ['all', 'ga4', 'searchConsole', 'bing'];
  const keys = FILTER_KEYS.filter(k => canManage || (k !== 'provider' && k !== 'question'));
  const setSource = (source: Draft['source']) => setDraft(d => {
    const filters: Draft['filters'] = {};
    for (const k of FILTER_KEYS) if (d.filters[k] && filterAllowed(k, source, compat, canManage)) filters[k] = d.filters[k];
    return { ...d, source, filters };
  });
  const setF = (k: FilterKey, v: string) => setDraft(d => ({ ...d, filters: { ...d.filters, [k]: v } }));
  const submit = (e: FormEvent) => { e.preventDefault(); onApply(); };
  return <form className="int-panel mon-period mon-filterbar" onSubmit={submit} aria-label="Filtri della dashboard" data-testid="form-dashboard-filters">
    <div className="mon-seg" role="group" aria-label="Periodo">{([7, 28, 90] as const).map(n => <button type="button" key={n} aria-pressed={draft.preset === n} className={draft.preset === n ? 'on' : ''} onClick={() => setDraft(d => ({ ...d, preset: n }))} data-testid={`button-period-${n}`}>{n} giorni</button>)}<button type="button" aria-pressed={draft.preset === 'custom'} className={draft.preset === 'custom' ? 'on' : ''} onClick={() => setDraft(d => ({ ...d, preset: 'custom' }))} data-testid="button-period-custom"><CalendarRange size={13} /> Personalizzato</button></div>
    {draft.preset === 'custom' && <div className="mon-range"><label>Dal<input type="date" max={maxDate} value={draft.start} onChange={e => setDraft(d => ({ ...d, start: e.target.value }))} data-testid="input-range-start" /></label><label>Al<input type="date" max={maxDate} value={draft.end} onChange={e => setDraft(d => ({ ...d, end: e.target.value }))} data-testid="input-range-end" /></label></div>}
    <label className="mon-check"><input type="checkbox" checked={draft.compare} onChange={e => setDraft(d => ({ ...d, compare: e.target.checked }))} data-testid="checkbox-compare" /> Confronta con il periodo precedente</label>
    <div className="mon-filter-grid">
      <label>Fonte<select value={draft.source} onChange={e => setSource(e.target.value as Draft['source'])} data-testid="select-filter-source">{sources.map(s => <option key={s} value={s}>{sourceLabels[s]}</option>)}</select></label>
      {keys.map(k => {
        const ok = filterAllowed(k, draft.source, compat, canManage);
        const hint = ok ? undefined : `${filterLabels[k]}: non applicabile alla fonte scelta`;
        const common = { disabled: !ok, title: hint, 'aria-describedby': ok ? undefined : 'filter-na-help', 'data-testid': `filter-${k}` };
        return <label key={k} className={ok ? '' : 'is-disabled'}>{filterLabels[k]}
          {k === 'device' ? <select {...common} value={draft.filters.device ?? ''} onChange={e => setF(k, e.target.value)}><option value="">Tutti</option>{Object.values(GetKpiDashboardDevice).map(v => <option key={v} value={v}>{deviceLabels[v]}</option>)}</select>
            : k === 'provider' ? <select {...common} value={draft.filters.provider ?? ''} onChange={e => setF(k, e.target.value)}><option value="">Tutti</option>{Object.values(AiProvider).map(v => <option key={v} value={v}>{providerLabels[v]}</option>)}</select>
              : k === 'question' ? <select {...common} value={draft.filters.question ?? ''} onChange={e => setF(k, e.target.value)}><option value="">Tutte</option>{Array.from({ length: 10 }, (_, i) => `q${i + 1}`).map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}</select>
                : choices[k] ? <select {...common} value={draft.filters[k] ?? ''} onChange={e=>setF(k,e.target.value)}><option value="">Tutti</option>{choices[k]!.map(v=><option key={v} value={v}>{v}</option>)}</select>
                  : <input {...common} value={ok ? draft.filters[k] ?? '' : ''} maxLength={filterMax[k]} onChange={e => setF(k, e.target.value)} placeholder={ok ? 'argomento edile, senza nomi' : 'non applicabile'} spellCheck={false} autoComplete="off" />}
        </label>;
      })}
    </div>
    <p id="filter-na-help" className="mon-note">I filtri disattivati non sono supportati dalla fonte scelta. Con "Tutte le fonti", le fonti che non supportano un filtro attivo mostrano "filtro non applicabile" senza numeri.</p>
    <p className="mon-note">Selettori limitati alla tassonomia verificata; pagina e lingua coprono le sei pagine canoniche per lingua. La lingua del modulo è distinta. Le query ammettono soltanto il vocabolario edile previsto, senza dati personali.</p>
    <div className="mon-actions"><button className="int-primary" type="submit" disabled={!dirty} data-testid="button-filters-apply"><SlidersHorizontal size={13} /> Applica</button><button type="button" className="int-small-button" onClick={onReset} data-testid="button-filters-reset"><RotateCcw size={13} /> Ripristina</button>{dirty && <span className="mon-note" data-testid="text-filters-dirty">Modifiche non ancora applicate.</span>}</div>
    {meta && <p className="mon-period-meta" data-testid="text-period">{meta}</p>}
  </form>;
}
