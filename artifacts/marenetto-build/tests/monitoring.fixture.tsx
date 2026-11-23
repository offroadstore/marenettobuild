import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetKpiDashboardQueryKey, getGetInternalSessionQueryKey, type KpiDashboard, type KpiSource } from '@workspace/api-client-react';
import { DashboardPanel } from '../src/pages/monitoring/dashboard';
import { fmtChange, fmtValue } from '../src/pages/monitoring/shared';
import { toParams, DEFAULT_DRAFT } from '../src/pages/monitoring/filters';

test('provider fixtures render Italian metrics, comparisons, metadata and tables without network', () => {
  const source: KpiSource = {
    source: 'Fixture Google autorizzata solo per test', state: 'ready', message: 'Fixture, non statistiche reali',
    timezone: 'Europe/Rome', updatedAt: '2026-01-09T12:00:00Z', dataThrough: '2026-01-07',
    metrics: [
      { key: 'users', label: 'Utenti attivi', value: 100, previous: 50, change: 1, unit: 'count' },
      { key: 'engagementRate', label: 'Tasso di coinvolgimento', value: .4, previous: .2, change: 20, unit: 'percent' },
    ],
    series: [
      { label: '2026-01-01', values: { users: 25, engagementRate: .3 } },
      { label: '2026-01-07', values: { users: 75, engagementRate: .5 } },
    ],
    tables: [{ title: 'Canali · fixture', rows: [{ label: 'Organic Search', values: { users: 100 } }] }, { title: 'Pagine · fixture', rows: [{ label: '/servizi?fixture=<script>test</script>', values: { users: 100 } }] }],
    limitations: ['Fixture simulata: nessuna chiamata Google.'],
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false } } });
  const payload: KpiDashboard = {
    period: { start: '2026-01-01', end: '2026-01-07', previousStart: '2025-12-25', previousEnd: '2025-12-31', days: 7 },
    dataMode: 'synthetic', operational: { ...source, source: 'Database sintetico · fixture' },
    ga4: source, searchConsole: { ...source, source: 'Search Console · fixture', timezone: 'America/Los_Angeles', state: 'delayed' },
  };
  const render = () => {
    queryClient.setQueryData(getGetInternalSessionQueryKey(), { email: 'x', role: 'viewer', dataMode: 'synthetic', permissions: ['kpi:read'] });
    queryClient.setQueryData(getGetKpiDashboardQueryKey(toParams(DEFAULT_DRAFT)), payload);
    return renderToStaticMarkup(<QueryClientProvider client={queryClient}><DashboardPanel go={() => {}} /></QueryClientProvider>);
  };
  try {
    let html = render();
    for (const value of ['40%', '+20 p.p.', '20%', 'Organic Search', 'Europe/Rome', 'America/Los_Angeles', 'UTC', 'Dati in ritardo', 'Tabella dei valori giornalieri', 'Fonte indisponibile', 'Esporta CSV', 'aria-sort']) assert.ok(html.includes(value), value);
    assert.ok(html.includes('&lt;script&gt;test&lt;/script&gt;'));
    assert.ok(!html.includes('<script>test</script>'));
    assert.equal(fmtValue(null, 'count'), 'non disponibile');
    assert.equal(fmtValue(0, 'count'), '0');
    assert.equal(fmtValue(.01, 'percent'), '1%');
    assert.equal(fmtValue(1, 'percent'), '100%');
    assert.equal(fmtChange({ key: 'x', label: 'X', value: 1, previous: 0, change: null, unit: 'count' }), 'variazione non disponibile');
    payload.ga4 = { ...source, state: 'stale', message: 'Dati obsoleti · fixture' };
    html = render(); assert.ok(html.includes('Dati non aggiornati')); assert.ok(html.includes('Dati obsoleti'));
    payload.ga4 = { ...source, state: 'revoked', message: 'Autorizzazione revocata · fixture', metrics: [], tables: [], series: [] };
    html = render(); assert.ok(html.includes('Autorizzazione revocata')); assert.ok(html.includes('Apri Monitoraggio'));
  } finally { queryClient.clear(); }
});
