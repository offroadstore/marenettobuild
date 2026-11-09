import { legacyRedirects } from './articles';

/**
 * English links actually emitted by the archived site. Articles deliberately
 * resolve to reviewed Italian content, not to a fictitious translated edition.
 * Do not add a catch-all /en/:slug rule: incomplete historical URLs stay 404s.
 */
const englishArticles: Record<string, string> = {
  'buying-and-renovating-a-house-in-cefalu-a-technical-guide-to-the-5-essential-checks': 'comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali',
  'construction-company-in-cefalu-turning-your-vision-into-reality': 'impresa-edile-a-cefalu',
  'water-and-moisture-leak-detection-how-to-address-it-without-demolition': 'ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni',
  '10-year-warranty-on-construction-work-the-marenetto-decennial-insurance-policy': 'garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto',
  'thermal-insulation-vs-thermal-plaster-the-best-choice-for-sicily': 'cappotto-termico-vs-intonaco-termico-cefalu',
  'isoplam-outdoor-floors-complete-guide-to-stamped-concrete-and-skyconcrete': 'pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete',
  'renovate-without-demolition-the-complete-guide-to-microverlayr-isoplam-microcement': 'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam',
  'property-maintenance-management': 'gestione-manutenzione-immobile',
  'exclusive-garden-design': 'garden-design-esclusivo',
  'stone-works-and-facades': 'opere-in-pietra-e-prospetti',
  'stamped-resin-flooring': 'pavimenti-stampati-in-resina',
  'zen-pools-and-ponds': 'piscine-e-laghetti-zen',
  'luxury-built-in-kitchens': 'cucine-in-muratura-luxury',
  'advanced-techniques-for-managing-deformations-in-modern-building-structures': 'tecniche-avanzate-gestione-deformazioni-strutture-edili',
};

export const historicalRedirects: Record<string, string> = {
  ...legacyRedirects,
  '/en/articoli': '/articoli',
  '/en/chi-siamo': '/en/how-we-work',
  '/en/contatti': '/en/contact',
  '/en/recensioni': '/progetti',
  '/en/general-contractor': '/en/services',
  '/en/construction-and-renovations': '/articoli',
  '/en/building-bonuses-and-permits': '/guide',
  '/en/shipyards-and-construction': '/progetti',
  '/en/outdoor-and-garden-design': '/en/services',
  '/en/support-and-emergency-service': '/en/contact',
  ...Object.fromEntries(Object.entries(englishArticles).map(([source, destination]) => [`/en/${source}`, `/${destination}`])),
};
