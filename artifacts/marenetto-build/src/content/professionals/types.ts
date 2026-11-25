export type Pair = readonly [string, string];

/** Material card: use, frost, stains, thickness, max size. `null` renders the localized "data under verification" label. */
export type ProMaterial = { name: string; values: readonly [string | null, string | null, string | null, string | null, string | null] };

/** Professional form additions (callback form, project professional_studio). */
export type ProFormCopy = {
  project: string; title: string; intro: string; legend: string;
  studio: string; projectType: string; types: Record<'villa' | 'hotel' | 'resort' | 'yacht' | 'other', string>;
  phase: string; product: string; material: string; dimensions: string; dimensionsHint: string; deadline: string;
  tbd: string; tbdAction: string; tbdHint: string;
  intents: string; intentSamples: string; intentBlock: string; errIntent: string;
  receiptNote: string; privacy: string;
};

/**
 * One professional edition. Owner facts only: no prices, commissions, invented
 * projects, quarries, block numbers, staff names, certifications or warranties.
 */
export type ProCopy = {
  slug: string; dlSlug: string; nav: string;
  title: string; description: string; dlTitle: string; dlDescription: string;
  breadcrumbHome: string; breadcrumbServices: string;
  kicker: string; h1: string; lead: string;
  ctaSamples: string; ctaBlock: string;
  contactLabel: string; contactPending: string; contactNote: string;
  response: string; responseNote: string; scopeNote: string;
  stepsHeading: string; stepsIntro: string; steps: readonly [Pair, Pair, Pair, Pair, Pair];
  materialsHeading: string; materialsIntro: string; pending: string;
  fields: readonly [string, string, string, string, string];
  materials: readonly [ProMaterial, ProMaterial, ProMaterial, ProMaterial];
  materialsCaveat: string;
  downloadsHeading: string; downloadsIntro: string; downloadsLink: string; comingSoon: string;
  dl: readonly [Pair, Pair, Pair, Pair, Pair, Pair]; normsNote: string;
  projectsHeading: string; projectsText: string; projectSlot: string; projectFields: readonly [string, string, string, string];
  traceHeading: string; traceMotto: string; traceText: string; traceFields: readonly [string, string, string]; traceEmpty: string; traceCaveat: string;
  programHeading: string; programFormula: string; program: readonly [Pair, Pair, Pair, Pair]; codeSentence: string; codeCaveat: string;
  visitsHeading: string; standSentence: string; visitsText: string;
  requestHeading: string; requestText: string; requestButton: string;
  faqHeading: string; faq: readonly [Pair, Pair, Pair, Pair];
  entry: string;
  dlH1: string; dlLead: string; dlBack: string; dlAsk: string;
  form: ProFormCopy;
};
