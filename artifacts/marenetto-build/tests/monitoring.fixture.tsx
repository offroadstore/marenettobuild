import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetMonitoringQueryKey, getGetKpiDashboardQueryKey, getGetInternalSessionQueryKey, type KpiDashboard, type KpiSource, type MonitoringSettings } from '@workspace/api-client-react';
import { MonitoringPanel } from '../src/pages/monitoring/monitoring';
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

test('Monitoring separates direct GA4, obsolete discovery and closed advanced runtime', () => {
  const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  const payload: MonitoringSettings = {
    environment: 'production', canManage: true, oauthConfigured: true, connected: true,
    services: ['ga4', 'searchConsole'].map(service => ({ service: service as 'ga4' | 'searchConsole', state: 'ready', property: service === 'ga4' ? 'properties/565537156' : 'sc-domain:marenettobuild.com', lastCheckedAt: null, lastSuccessAt: null, error: null })),
    tags: { measurementId: 'G-D0QJL17CVC', containerId: '' }, updatedAt: '2026-11-23T09:00:00Z',
    trackingEnabled: false, trackingBlockers: ['Runtime alternativo non configurato'],
    collection: { requested: false, origin: '', runtimeOrigin: '', privacyUrl: '/privacy', privacyVersion: 'fixture', stream: null, checkedAt: null, realtimeCheckedAt: null, realtimeReceivedAt: null, status: 'non in uso' },
    streamCheck: { state: 'mismatch', measurementId: 'G-D0QJL17CVC', publicMeasurementId: 'G-D0QJL17CVC', property: 'properties/565537156', stream: null, checkedAt: '2026-11-23T09:00:00Z', message: 'Stream fixture non corrispondente' },
    discovery: { url: 'https://www.marenettobuild.com/', checkedAt: '2026-11-12T16:47:35Z', stale: true, findings: ['Framework360: rilevazione storica'], limitations: 'Solo HTML iniziale' },
  };
  try {
    qc.setQueryData(getGetMonitoringQueryKey(), payload);
    const html = renderToStaticMarkup(<QueryClientProvider client={qc}><MonitoringPanel /></QueryClientProvider>);
    for (const text of ['G-D0QJL17CVC', 'ID non corrispondente', 'Avanzate (non in uso)', 'America/Los_Angeles è il fuso fisso', 'Obsoleto', 'Riesegui sul sito pubblicato', 'Verifica ID nella proprietà GA4']) assert.ok(html.includes(text), text);
    assert.ok(!html.includes('G-YP31TW342Z'));
    assert.match(html, /<details[^>]*data-testid="monitoring-advanced"[^>]*>/);
    assert.ok(!/<details[^>]*open[^>]*data-testid="monitoring-advanced"/.test(html));
    assert.ok(html.indexOf('id="mon-disc"') < html.indexOf('data-testid="monitoring-advanced"'));
    for (const control of ['button-verify-stream', 'button-enable-collection', 'button-disable-collection', 'button-verify-realtime']) assert.ok(html.includes(control), control);
  } finally { qc.clear(); }
});
