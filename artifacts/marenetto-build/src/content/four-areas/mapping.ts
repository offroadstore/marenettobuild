import type { AreaId } from './types';

/**
 * Explicit, exclusive article/guide family -> area classification.
 * Keys are the historical family identity (the Italian slug, which is also the
 * `id` of every Arabic adaptation and the `slug` of every library article).
 * No regex or tag heuristics: an unmapped public identity is an error.
 */
export const ARTICLE_AREA: Readonly<Record<string, AreaId>> = Object.freeze({
  'tecniche-avanzate-gestione-deformazioni-strutture-edili': 'villas',
  'cappotto-termico-vs-intonaco-termico-cefalu': 'villas',
  'garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto': 'villas',
  'ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni': 'villas',
  'cucine-in-muratura-luxury': 'outdoors',
  'piscine-e-laghetti-zen': 'outdoors',
  'opere-in-pietra-e-prospetti': 'outdoors',
  'garden-design-esclusivo': 'outdoors',
  'pavimenti-stampati-in-resina': 'surfaces',
  'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam': 'surfaces',
  'pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete': 'surfaces',
  'impresa-edile-a-cefalu': 'investment',
  'comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali': 'investment',
  'gestione-manutenzione-immobile': 'investment',
  'network-network': 'investment',
  'network-design': 'villas',
  'network-systems': 'villas',
  'network-comfort': 'villas',
  'network-roofs': 'villas',
  'network-ground': 'villas',
  'network-outdoors': 'outdoors',
  'network-glazing': 'villas',
  'network-craft': 'surfaces',
  'network-stone': 'outdoors',
  'network-bespoke': 'surfaces',
  'network-buying': 'investment',
});

/** Normalizes '/x/', 'historical:/x', 'x' to the family key 'x'. */
export function normalizeArticleIdentity(identity: string) {
  return identity.replace(/^historical:/, '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').split('/').at(-1) ?? '';
}

/** Lookup that returns undefined for unknown identities (for audits). */
export function articleArea(identity: string): AreaId | undefined {
  return ARTICLE_AREA[normalizeArticleIdentity(identity)];
}

/** Strict lookup used by article detail pages: unmapped public identities fail loudly. */
export function requireArticleArea(identity: string): AreaId {
  const area = articleArea(identity);
  if (!area) throw new Error(`Unmapped public article identity (four-areas/mapping.ts): ${identity}`);
  return area;
}
