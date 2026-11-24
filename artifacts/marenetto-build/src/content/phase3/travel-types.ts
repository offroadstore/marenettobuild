/** Native copy for the Sicily/travel coverage page and its compact blocks. */
export type TravelCopy = {
  slug: string; nav: string; metaTitle: string; metaDescription: string;
  kicker: string; title: string; intro: string;
  scale: [string, string, string, string, string];
  ordinary: { label: string; heading: string; text: string; points: string[]; zonesLink: string };
  travel: { label: string; heading: string; text: string; points: string[] };
  destHeading: string; destNote: string; dest: [string, string][];
  infoHeading: string; infoIntro: string; info: string[];
  quoteHeading: string; quoteText: string; quote: string[];
  complianceHeading: string; complianceText: string; compliance: string[];
  faqHeading: string; faq: [string, string][];
  linksHeading: string; links: { services: string; request: string; zones: string; contact: string };
  contactHeading: string; contactText: string; mailSubject: string;
  indexKicker: string; indexTitle: string; indexText: string;
  blockTitle: string; blockText: string; cta: string;
  zonesIntro: string; zonesNote: string; zonesMetaDescription: string;
};
