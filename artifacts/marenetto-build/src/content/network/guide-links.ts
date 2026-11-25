import { editions } from '@/localization/edition-inventory';
import { hasTranslationApproval, isNativeEdition } from '@/localization/public-seo.mjs';
import type { EditorialActive } from '@workspace/api-client-react';
import type { NetworkId } from './types';

// Existing articles only. These are NOT mislabeled as the future Phase 5 series.
// That series can be linked when each actual destination becomes public.
const topics: Partial<Record<NetworkId, string[]>> = {
  network: ['impresa-edile-a-cefalu'],
  design: ['comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali'],
  comfort: ['cappotto-termico-vs-intonaco-termico-cefalu'],
  roofs: ['ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni'],
  ground: ['piscine-e-laghetti-zen'],
  outdoors: ['garden-design-esclusivo', 'piscine-e-laghetti-zen'],
  stone: ['opere-in-pietra-e-prospetti'],
  bespoke: ['cucine-in-muratura-luxury'],
  buying: ['comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali'],
};
export function networkGuideLinks(locale: string, id: NetworkId, active: EditorialActive[] = []) {
  const withdrawn = new Set(active.filter(item => item.revisionId === 'withdrawn')
    .flatMap(item => [item.path, ...(item.aliases ?? [])]).map(p => p.replace(/\/+$/, '')));
  return editions.filter(edition => edition.locale === locale && topics[id]?.includes(edition.id)
    && edition.kind === 'article' && edition.state === 'published' && isNativeEdition(edition) && hasTranslationApproval(edition)
    && !withdrawn.has(edition.path.replace(/\/+$/, '')));
}
