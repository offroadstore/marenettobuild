/**
 * Arabic public release gate. Arabic editions (core shell, services, legal notices, Phase3,
 * property management, network, Atelier and historical-family adaptations) have complete
 * Arabic bodies and revision evidence. Keep this coupled to locales.json and the coverage
 * regression suite; a catalog flag alone never establishes completeness.
 * Review evidence is AI-assisted bilingual comparison, not native-speaker certification.
 */
export const ARABIC_PUBLIC_RELEASE = true;
export const ARABIC_REVIEW_EVIDENCE = 'AI-assisted Arabic translation with sentence-level comparison against the English/Italian source (2026-11-25); no native-speaker, legal or professional certification';
/** Dev/preview-only mirror of /ar/... while the locale is blocked. noindex via the review shell. */
export const ARABIC_PREVIEW_PREFIX = '/__localization-review/ar-site';
