export type PropertySection = { heading: string; paragraphs: string[] };
export type PropertyCopy = {
  nav: string;
  title: string;
  description: string;
  kicker: string;
  h1: string;
  intro: string;
  splitBuild: [string, string];
  splitPartner: [string, string];
  request: string;
  whatsapp: string;
  whatsappMessage: string;
  /** Localized notice for the enquiry form when ?service=property_care is preselected. */
  selectedService: string;
  sections: PropertySection[];
  faqTitle: string;
  faq: [string, string][];
  partnerLink: string;
  partnerNote: string;
  emailLabel: string;
  related: string;
  servicesLink: string;
  abroadLink: string;
  entry: string;
};
