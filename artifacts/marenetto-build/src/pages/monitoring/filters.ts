import type { GetKpiDashboardParams } from '@workspace/api-client-react';

export const FILTER_KEYS = ['device', 'country', 'city', 'page', 'channel', 'trafficSource', 'query', 'provider', 'question', 'pageLanguage'] as const;
export type FilterKey = typeof FILTER_KEYS[number];
export type SourceKey = 'ga4' | 'searchConsole' | 'bing' | 'ai';
export type Preset = 7 | 28 | 90 | 'custom';
export const AI_FILTERS: readonly FilterKey[] = ['provider', 'question'];

/** Equivalent to the server matrix; used until the first response provides `compatibility`. */
export const STATIC_COMPAT: Record<SourceKey, string[]> = {
  ga4: ['device', 'country', 'city', 'page', 'channel', 'trafficSource', 'pageLanguage'],
  searchConsole: ['device', 'country', 'page', 'query', 'pageLanguage'],
  bing: [],
  ai: ['provider', 'question'],
};

export const filterLabels: Record<FilterKey, string> = {
  device: 'Dispositivo', country: 'Paese', city: 'Città', page: 'Pagina', channel: 'Canale',
  trafficSource: 'Sorgente di traffico', query: 'Query di ricerca', provider: 'Fornitore IA', question: 'Domanda IA', pageLanguage: 'Lingua pagina',
};
export const sourceLabels: Record<'all' | SourceKey, string> = {
  all: 'Tutte le fonti', ga4: 'Google Analytics 4', searchConsole: 'Google Search Console', bing: 'Bing Webmaster Tools', ai: 'Visibilità IA',
};
export const filterMax: Record<FilterKey, number> = { device: 10, country: 80, city: 80, page: 200, channel: 80, trafficSource: 80, query: 160, provider: 20, question: 20, pageLanguage: 5 };

export type Draft = { preset: Preset; start: string; end: string; compare: boolean; source: 'all' | SourceKey; filters: Partial<Record<FilterKey, string>> };
export const DEFAULT_DRAFT: Draft = { preset: 28, start: '', end: '', compare: true, source: 'all', filters: {} };

export function activeFilters(f: Draft['filters']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of FILTER_KEYS) { const v = f[k]?.trim(); if (v) out[k] = v; }
  return out;
}

export function toParams(a: Draft): GetKpiDashboardParams {
  const p: GetKpiDashboardParams = a.preset === 'custom' ? { start: a.start, end: a.end } : { days: a.preset };
  p.compare = a.compare ? 'true' : 'false';
  p.source = a.source;
  return { ...p, ...(activeFilters(a.filters) as Partial<GetKpiDashboardParams>) };
}

export function compatOf(c: Record<string, string[]> | undefined): Record<string, string[]> { return c && Object.keys(c).length ? c : STATIC_COMPAT; }

/** Active filters that the given source cannot honour. */
export function incompatibleFor(source: string, filters: Record<string, string>, compat: Record<string, string[]>): string[] {
  const allowed = compat[source] ?? [];
  return Object.keys(filters).filter(k => !allowed.includes(k));
}

/** Whether a filter can be set in the draft for the chosen source. */
export function filterAllowed(key: FilterKey, source: Draft['source'], compat: Record<string, string[]>, canManage: boolean) {
  if (!canManage && AI_FILTERS.includes(key)) return false;
  if (source === 'all') return Object.entries(compat).some(([s, keys]) => (canManage || s !== 'ai') && keys.includes(key));
  return (compat[source] ?? []).includes(key);
}
