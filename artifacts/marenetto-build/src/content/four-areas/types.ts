export const AREA_IDS = ['villas', 'outdoors', 'surfaces', 'investment'] as const;
export type AreaId = typeof AREA_IDS[number];

export const FOUR_AREA_LOCALES = ['it', 'en', 'de', 'fr', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da', 'ar'] as const;
export type AreaLocale = typeof FOUR_AREA_LOCALES[number];

/** [title, text] pairs keep the localized files compact and positionally aligned with AREA_STRUCTURE. */
export type Pair = [string, string];

export type AreaText = {
  slug: string;
  /** Short menu label. */
  nav: string;
  /** One-line home card tagline. */
  tagline: string;
  /** SEO title, 30–65 characters. */
  title: string;
  /** SEO description, 70–165 characters. */
  description: string;
  h1: string;
  lede: string;
  /** Coverage / who-does-what qualification, visible on the pillar. */
  scope: string;
  /** Offer items, same order as AREA_STRUCTURE[area].offer. */
  offer: Pair[];
  process: Pair[];
  faq: Pair[];
};

export type AreaUi = {
  areasLabel: string;
  about: string;
  request: string;
  home: string;
  menu: string;
  offerHeading: string;
  processHeading: string;
  faqHeading: string;
  priceHeading: string;
  priceText: string;
  readMore: string;
  ctaHeading: string;
  ctaText: string;
  breadcrumbLabel: string;
  articleArea: string;
  pillarLink: string;
  articlesArchive: string;
  fourAreasHeading: string;
  fourAreasIntro: string;
  needsHeading: string;
  /** Abroad buyer, professional, Cefalù owner. */
  needs: [Pair, Pair, Pair];
  /** Link labels for the three needs. */
  needsCta: [string, string, string];
  projects: { title: string; description: string; h1: string; text: string };
};

export type AreaLocaleCopy = { ui: AreaUi; areas: Record<AreaId, AreaText> };
