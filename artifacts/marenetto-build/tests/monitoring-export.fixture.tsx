import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetKpiDashboardQueryKey, getGetInternalSessionQueryKey, getGetAiVisibilityQueryKey, type AiObservation, type KpiDashboard, type KpiSource } from '@workspace/api-client-react';
import { AiSettings } from '../src/pages/monitoring/ai-settings';
import { DashboardPanel } from '../src/pages/monitoring/dashboard';
import { buildCsv, csvCell } from '../src/pages/monitoring/csv';
import { sortRows } from '../src/pages/monitoring/sort';
import { safeHref } from '../src/pages/monitoring/ai-evidence';
import { toParams, DEFAULT_DRAFT, incompatibleFor, STATIC_COMPAT } from '../src/pages/monitoring/filters';

const period = { start: '2026-01-01', end: '2026-01-07', previousStart: '2025-12-25', previousEnd: '2025-12-31', days: 7 };
const obs: AiObservation = {
  id: 'o1', question: { id: 'q1', version: 2, text: 'Impresa edile affidabile a Cefalù?', enabled: true }, provider: 'openai', model: 'fixture', method: 'api+search',
  at: '2026-01-05T08:00:00Z', status: 'citation', mentioned: true, cited: true, grounded: true, excerpt: '<b>estratto</b> fixture',
  sources: [{ url: 'javascript:alert(1)', host: 'evil', kind: 'unclassified' }, { url: 'https://concorrente.example/', host: 'concorrente.example', kind: 'competitor' }, { url: 'https://portale.example/', host: 'portale.example', kind: 'directory' }],
};
const base: KpiSource = { source: 'fixture', state: 'ready', message: '', timezone: 'UTC', updatedAt: null, dataThrough: null, metrics: [{ key: 'mention_openai', label: 'Menzioni OpenAI', value: .42, previous: null, change: null, unit: 'percent' }], series: [], tables: [], limitations: [] };
const payload: KpiDashboard = { period, dataMode: 'live', operational: { ...base, metrics: [{ key: 'leads', label: 'Lead segreti', value: 12, previous: 1, change: 1, unit: 'count' }] }, ga4: { ...base, metrics: [] }, searchConsole: { ...base, metrics: [] }, ai: base, observations: [obs] };

function render(permissions: string[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  qc.setQueryData(getGetInternalSessionQueryKey(), { email: 'fixture', role: 'viewer', dataMode: 'live', permissions });
  qc.setQueryData(getGetKpiDashboardQueryKey(toParams(DEFAULT_DRAFT)), payload);
  try { return renderToStaticMarkup(<QueryClientProvider client={qc}><DashboardPanel go={() => {}} /></QueryClientProvider>); } finally { qc.clear(); }
}

test('kpi:read without monitoring:manage sees no AI numbers, filters, providers; operational never shows numbers', () => {
  const html = render(['kpi:read']);
  for (const bad of ['Menzioni OpenAI', '42%', 'Lead segreti', 'Fornitore IA', 'Domanda IA', 'Visibilità IA', 'concorrente.example']) assert.ok(!html.includes(bad), bad);
  assert.ok(html.includes('Fonte indisponibile'));
});

test('manager sees AI metrics, evidence with safe links, competitors separate from directories', () => {
  const html = render(['kpi:read', 'monitoring:manage']);
  for (const ok of ['Menzioni OpenAI', '42%', 'Concorrenti citati', 'concorrente.example', 'portale.example', 'API dei fornitori', '&lt;b&gt;estratto&lt;/b&gt;']) assert.ok(html.includes(ok), ok);
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('rel="noopener noreferrer nofollow"'));
  assert.ok(!html.includes('Lead segreti'));
});

test('CSV neutralises formulas, quotes, keeps missing distinct from zero and follows sort', () => {
  assert.equal(csvCell('=1+1'), `"'=1+1"`);
  assert.equal(csvCell(' \t@cmd'), `"'  @cmd"`);
  assert.equal(csvCell('\u0001-2'), `"' -2"`);
  assert.equal(csvCell('a,b\n"c"'), '"a,b ""c"""');
  assert.equal(csvCell(-3), '-3');
  assert.equal(csvCell(null), '');
  const rows = [{ label: 'a', values: { u: null } }, { label: 'b', values: { u: 0 } }, { label: 'c', values: { u: 5 } }];
  assert.deepEqual(sortRows(rows, { col: 'u', dir: 'desc' }).map(r => r.label), ['c', 'b', 'a']);
  assert.deepEqual(sortRows(rows, { col: 'u', dir: 'asc' }).map(r => r.label), ['b', 'c', 'a']);
  const src: KpiSource = { source: 'GA4 fixture', state: 'ready', message: '', timezone: 'Europe/Rome', updatedAt: '2026-01-08T10:00:00Z', dataThrough: '2026-01-07', appliedFilters: ['device'], metrics: [{ key: 'u', label: 'Utenti', value: null, previous: 0, change: null, unit: 'count' }], series: [], tables: [{ title: 'Pagine', rows }], limitations: ['Soglie GA4'] };
  const input = {
    period, compare: true, filters: { device: 'mobile' }, sorts: { 'ga4:Pagine': { col: 'u', dir: 'desc' as const } },
    sources: [{ key: 'ga4', title: 'Google Analytics 4', src, inapplicable: [] }, { key: 'bing', title: 'Bing', src: { ...src, metrics: [{ key: 'clicks', label: 'Clic', value: 99, previous: 1, change: 1, unit: 'count' as const }] }, inapplicable: incompatibleFor('bing', { device: 'mobile' }, STATIC_COMPAT) }],
  };
  const sum = buildCsv({ ...input, scope: 'summary' });
  assert.ok(sum.includes('valore mancante (diverso da zero)'));
  for (const v of ['Europe/Rome', 'Soglie GA4', '2025-12-25/2025-12-31', 'filtro non applicabile: device']) assert.ok(sum.includes(v), v);
  assert.ok(!sum.includes(',99,'));
  const tab = buildCsv({ ...input, scope: 'tables' });
  const pos = ['c', 'b', 'a'].map(l => tab.indexOf(`"Pagine","${l}"`));
  assert.ok(pos[0] > 0 && pos[0] < pos[1] && pos[1] < pos[2], 'export follows on-screen sort');
  const ev = buildCsv({ ...input, scope: 'evidence', observations: [{ ...obs, excerpt: '=HYPERLINK("x")\nriga' }] });
  assert.ok(!ev.split('\r\n').some(line => line.startsWith('=')));
  assert.ok(ev.includes('estratto==HYPERLINK(""x"") riga'));
  assert.equal(safeHref('javascript:alert(1)'), null);
  assert.equal(safeHref('https://a.example/x'), 'https://a.example/x');
});

test('owner IA form renders zero budget with manual and weekly execution disabled',()=>{
  const qc=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  qc.setQueryData(getGetAiVisibilityQueryKey(),{
    revision:'fixture',budgetUsd:0,spentUsd:0,reservedUsd:0,remainingUsd:0,month:'2026-11',weeklyEnabled:false,workerReady:false,
    schedule:'lunedì 09:00 Europe/Rome',blockers:['Budget a zero.','Anteprima non autorizzata.'],providers:[
      {provider:'openai',configured:true,model:'fixture-openai',method:'fixture',blockers:[],maximumUsd:30},
      {provider:'gemini',configured:true,model:'fixture-gemini',method:'fixture',blockers:['Termini Google non compatibili'],maximumUsd:null},
      {provider:'anthropic',configured:false,model:'fixture-claude',method:'fixture',blockers:['Credenziale assente'],maximumUsd:6},
    ],
    questions:Array.from({length:10},(_,i)=>({id:`q${i+1}`,version:1,text:'impresa edile a Cefalù',enabled:true})),campaigns:[],results:[],
  });
  try {
    const html=renderToStaticMarkup(<QueryClientProvider client={qc}><AiSettings setFlash={()=>{}}/></QueryClientProvider>);
    for(const text of ['Visibilità nelle IA','Calendario spento','Termini Google non compatibili','Spesa riconciliata','fixture-openai','fixture-claude'])assert.ok(html.includes(text),text);
    assert.match(html,/<button[^>]*disabled=""[^>]*data-testid="button-ai-run"/);
    assert.match(html,/<input[^>]*disabled=""[^>]*data-testid="checkbox-ai-weekly"/);
    assert.ok(!html.includes('Impossibile leggere'));
  } finally {qc.clear();}
});
