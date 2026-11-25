export const NETWORK_IDS = ['network', 'design', 'systems', 'comfort', 'roofs', 'ground', 'outdoors', 'glazing', 'craft', 'stone', 'bespoke', 'buying'] as const;
export const NETWORK_SERVICE_IDS = [
  'services', 'service-local', 'historical:/general-contractor',
  'historical:/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto',
] as const;
export type NetworkId = typeof NETWORK_IDS[number];
export type NetworkSection = { heading: string; paragraphs: string[] };
export type NetworkArticle = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  lead: string;
  sections: NetworkSection[];
  checklist: string[];
  faq: [string, string][];
  nextStep: string;
  imageAlts: [string, string, string];
};
export type NetworkCopy = {
  nav: string; home: string; contents: string; faq: string; checklist: string;
  sources: string; related: string; contact: string; services: string; furniture: string;
  illustration: string; reviewNotice: string; scope: string; directHeading: string;
  direct: string; coordinatedHeading: string; coordinated: string;
  articles: Record<NetworkId, NetworkArticle>;
};
