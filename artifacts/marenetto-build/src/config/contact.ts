/** Single source of truth for the company contact number. */
export const COMPANY_PHONE = {
  e164: '+393339363007',
  waDigits: '393339363007',
  display: '+39 333 936 3007',
} as const;

/** Historical visible data retained pending owner confirmation; not verification evidence. */
export const COMPANY_CONTACT = {
  name: 'Marenetto Build',
  legalName: 'Marenetto s.r.l. unipersonale',
  vatId: 'IT06471740826',
  email: 'info@marenetto.com',
  streetAddress: 'SS 113 Settentrionale Sicula, 73b',
  localityLine: '90015 Cefalù, Palermo, Italia',
  areaServed: 'Cefalù e dintorni',
  verification: {
    phone: 'existing-approved-company-number',
    email: 'owner-confirmed-2026-11-10',
    legalIdentity: 'historical-visible-data-awaiting-confirmation',
    address: 'historical-visible-data-awaiting-confirmation',
  },
} as const;
export const emailHref = (subject: string) => `mailto:${COMPANY_CONTACT.email}?subject=${encodeURIComponent(subject)}`;

export function companyStructuredData(origin: string) {
  return {
    '@type': 'GeneralContractor', '@id': `${origin}/#organization`,
    name: COMPANY_CONTACT.name, url: `${origin}/`, logo: `${origin}/favicon.svg`,
    email: COMPANY_CONTACT.email, telephone: COMPANY_PHONE.e164,
    image: `${origin}/media/home/cefalu-hero-left-1672.jpg`,
    address: {
      '@type': 'PostalAddress', streetAddress: COMPANY_CONTACT.streetAddress,
      addressLocality: 'Cefalù', addressRegion: 'PA', postalCode: '90015', addressCountry: 'IT',
    },
    areaServed: { '@type': 'Place', name: COMPANY_CONTACT.areaServed },
  };
}

export const telHref = `tel:${COMPANY_PHONE.e164}`;

export function whatsappHref(message: string): string {
  return `https://wa.me/${COMPANY_PHONE.waDigits}?text=${encodeURIComponent(message)}`;
}
