import type { KpiMetric } from '@workspace/api-client-react';
import { StateBadge, fmtChange, fmtMetric } from './shared';
import type { ExportSource } from './csv';

const GA4_EXTRA = /contact|event|contatt/i;

/** Pick the headline metrics per source: GA4 first 4 core + contact/event metrics; AI keeps backend keys incl. denominators. */
export function pickSummary(key: string, metrics: KpiMetric[]) {
  if (key === 'ga4') return metrics.filter((m, i) => i < 4 || GA4_EXTRA.test(m.key));
  if (key === 'ai') return metrics.filter(m => /^(mention|citation|valid)_/.test(m.key));
  return metrics;
}

export function SummaryStrip({ sources, compare, showMeta = false }: { sources: ExportSource[]; compare: boolean; showMeta?: boolean }) {
  return <section className="int-panel mon-summary" aria-labelledby="mon-summary-title" data-testid="section-summary">
    <header className="mon-source-head"><div><span className="int-kicker">RIEPILOGO / FONTI SEPARATE</span><h3 id="mon-summary-title">Ogni fonte con i suoi numeri</h3></div></header>
    <p className="mon-note">I valori non vengono sommati né convertiti tra fonti: utenti GA4, clic di ricerca e risposte IA misurano cose diverse.</p>
    <div className="mon-summary-grid">{sources.map(s => {
      const ms = pickSummary(s.key, s.src.metrics);
      return <div className="mon-summary-col" key={s.key} data-testid={`summary-${s.key}`}>
        <div className="mon-summary-head"><strong>{s.title}</strong>{s.inapplicable.length ? <span className="mon-state s-not_configured">Filtro non applicabile</span> : <StateBadge state={s.src.state} />}</div>
        {s.inapplicable.length ? <p className="mon-note">Filtro non applicabile: nessun numero.</p> : ms.length ? <ul className="mon-summary-list">{ms.map(m => <li key={m.key} data-testid={`summary-metric-${s.key}-${m.key}`}><span>{m.label}{m.key.startsWith('valid_') && <small> · denominatore</small>}</span><b>{fmtMetric(m, 'value')}</b>{compare && <em className={m.change === null ? 'na' : ''}>{fmtChange(m)}</em>}</li>)}</ul> : <p className="mon-note">Nessuna metrica disponibile.</p>}
      </div>;
    })}{showMeta && <div className="mon-summary-col"><div className="mon-summary-head"><strong>Meta Pixel</strong><span className="mon-state s-not_configured">Pixel installato, dati non collegati</span></div><p className="mon-note">Solo dopo consenso marketing. Ricezione non certificata; nessun report Insights disponibile.</p></div>}</div>
  </section>;
}
