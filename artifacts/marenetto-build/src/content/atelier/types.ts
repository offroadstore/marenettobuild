export type Pair = readonly [string, string];

/** One Atelier edition. Owner facts only: no prices, projects, clients, staff languages, certifications or lead times. */
export type AtelierCopy = {
  slug: string;
  nav: string;
  title: string; // SEO title including brand, 50-60 chars
  description: string; // 140-160 chars
  kicker: string;
  h1: string;
  lead: string;
  onRequest: string; // "Projects on request"
  ctaButton: string;
  offerHeading: string;
  offer: Pair[];
  materialsHeading: string;
  materials: Pair[];
  settingsHeading: string;
  settings: string[];
  stepsHeading: string;
  stepsIntro: string;
  steps: Pair[]; // exactly six, owner order
  territoryHeading: string;
  near: Pair;
  far: Pair;
  marketsLabel: string;
  markets: string;
  marketsNote: string;
  complianceHeading: string;
  compliance: string[];
  lexiconHeading: string;
  lexicon: Pair[];
  faqHeading: string;
  faq: Pair[];
  ctaHeading: string;
  ctaText: string;
  requestLink: string;
  entry: string; // cross-link teaser
  motifNote: string; // decorative pattern statement
  breadcrumbHome: string;
  breadcrumbServices: string;
};
