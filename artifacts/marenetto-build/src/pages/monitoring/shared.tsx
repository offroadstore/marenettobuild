import type { ReactNode } from 'react';
import type { KpiMetric, MonitoringState } from '@workspace/api-client-react';

export const DASHBOARD_KEY_PREFIX = ['/api/internal/dashboard'] as const;

export const stateLabels: Record<MonitoringState, string> = {
  not_configured: 'Non configurato', disconnected: 'Non collegato', property_required: 'Proprietà da scegliere',
  unchecked: 'Da verificare',
  ready: 'Pronto', empty: 'Nessun dato nel periodo', delayed: 'Dati in ritardo', revoked: 'Autorizzazione revocata',
  forbidden: 'Accesso negato', quota: 'Quota esaurita', unavailable: 'Non disponibile', stale: 'Dati non aggiornati',
};
export const stateHelp: Record<MonitoringState, string> = {
  not_configured: 'La connessione Google non è configurata sul server. Nessun dato Google viene mostrato.',
  disconnected: 'Nessun account Google autorizzato alla lettura dei report.',
  property_required: 'Il collegamento esiste, ma il titolare deve scegliere quale proprietà leggere.',
  unchecked: 'La proprietà è stata selezionata; verificare l’accesso ai report.',
  ready: 'Lettura autorizzata e funzionante.',
  empty: 'La fonte risponde ma non ha dati per il periodo scelto.',
  delayed: 'Google elabora i dati con ritardo: gli ultimi giorni possono essere incompleti.',
  revoked: 'L’autorizzazione è stata revocata. Il titolare deve ricollegare l’account.',
  forbidden: 'L’account collegato non ha accesso alla proprietà selezionata.',
  quota: 'Limite di richieste raggiunto. Riprovare più tardi.',
  unavailable: 'La fonte non risponde in questo momento.',
  stale: 'Mostriamo l’ultima copia salvata: i numeri possono non essere aggiornati.',
};
export const serviceNames = { ga4: 'Google Analytics 4', searchConsole: 'Google Search Console' } as const;

export function errorText(e: unknown, fallback: string) {
  const d = (e as { data?: { error?: unknown } } | null)?.data;
  return d && typeof d.error === 'string' && d.error.trim() ? d.error : fallback;
}

const nf = new Intl.NumberFormat('it-IT');
export function fmtValue(v: number | null | undefined, unit: string) {
  if (v === null || v === undefined || Number.isNaN(v)) return 'non disponibile';
  if (unit === 'percent') return `${(v * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;
  if (unit === 'position') return v.toLocaleString('it-IT', { maximumFractionDigits: 1 });
  return nf.format(Math.round(v * 100) / 100);
}
export function fmtMetric(m: KpiMetric, which: 'value' | 'previous') { return fmtValue(m[which], m.unit); }
export function fmtChange(m: KpiMetric) {
  if (m.change === null) return 'variazione non disponibile';
  if (m.unit === 'percent') {
    const pp = m.change;
    return `${pp > 0 ? '+' : ''}${pp.toLocaleString('it-IT', { maximumFractionDigits: 1 })} p.p.`;
  }
  const pct = m.change * 100;
  return `${pct > 0 ? '+' : ''}${pct.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%${m.unit === 'position' ? m.change < 0 ? ' · migliora' : m.change > 0 ? ' · peggiora' : ' · invariata' : ''}`;
}
export function fmtDate(iso: string | null | undefined, time = false) {
  if (!iso) return 'mai';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return time ? `${d.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC` : d.toLocaleDateString('it-IT', { dateStyle: 'medium', timeZone: 'UTC' });
}

export function StateBadge({ state }: { state: MonitoringState }) {
  return <span className={`mon-state s-${state}`} data-testid={`status-state-${state}`}>{stateLabels[state] || state}</span>;
}
export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'ok'; children: ReactNode }) {
  return <div className={`mon-notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}
