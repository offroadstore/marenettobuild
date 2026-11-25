import { SERVED_PLACES } from '@/content/phase3/places';
/** Single source of truth for the company contact number. */
export const COMPANY_PHONE = {
  e164: '+393339363007',
  waDigits: '393339363007',
  display: '+39 333 936 3007',
} as const;

/** Owner confirmed controller identity, VAT and address on 2026-11-23.
 * This is a company declaration, not an independent registry verification. */
export const COMPANY_CONTACT = {
  name: 'Marenetto Build',
  legalName: 'Marenetto s.r.l. unipersonale',
  vatId: 'IT06471740826',
  email: 'info@marenetto.com',
  streetAddress: 'SS 113 Settentrionale Sicula, 73b',
  localityLine: '90015 Cefalù, Palermo, Italia',
  areaServed: 'Ristrutturazioni e costruzioni principalmente entro circa 60 km da Cefalù, Madonie e costa; progetti oltre su richiesta e preventivo dedicato',
  verification: {
    phone: 'existing-approved-company-number',
    email: 'owner-confirmed-2026-11-10',
    legalIdentity: 'owner-confirmed-2026-11-23',
    vatId: 'owner-confirmed-2026-11-23',
    address: 'owner-confirmed-2026-11-23',
  },
} as const;
/** Apply the owner's official contact to legacy public copy, not source archives. */
export function normalizePublicContact(value: string): string {
  return value.replace(/info@marenettobuild\.com/gi, COMPANY_CONTACT.email);
}

export const emailHref = (subject: string) => `mailto:${COMPANY_CONTACT.email}?subject=${encodeURIComponent(subject)}`;

/** Ordinary locations are not an exclusive coverage boundary.
 * Wider areas describe an offer subject to project-specific feasibility,
 * not existing branches, completed projects or overseas authorisations. */
export function companyServiceAreas() {
  return [
    { '@type': 'Place', name: 'Madonie' },
    ...SERVED_PLACES.map(place => place.schemaType === 'Place'
      ? { '@type': 'Place', name: place.name, containedInPlace: { '@type': 'City', name: 'Tusa' } }
      : { '@type': 'City', name: place.name }),
    { '@type': 'AdministrativeArea', name: 'Sicilia' },
    { '@type': 'Country', name: 'Italia' },
    { '@type': 'Place', name: 'Worldwide (on request)' },
  ];
}

export function companyStructuredData(origin: string) {
  return {
    '@type': 'GeneralContractor', '@id': `${origin}/#organization`,
    name: COMPANY_CONTACT.name, url: `${origin}/`, logo: `${origin}/favicon.svg`,
    legalName: COMPANY_CONTACT.legalName, taxID: COMPANY_CONTACT.vatId,
    email: COMPANY_CONTACT.email, telephone: COMPANY_PHONE.e164,
    image: `${origin}/media/home/cefalu-hero-left-1672.jpg`,
    address: {
      '@type': 'PostalAddress', streetAddress: COMPANY_CONTACT.streetAddress,
      addressLocality: 'Cefalù', addressRegion: 'PA', postalCode: '90015', addressCountry: 'IT',
    },
    additionalType: 'https://schema.org/LocalBusiness',
    areaServed: companyServiceAreas(),
  };
}

export const telHref = `tel:${COMPANY_PHONE.e164}`;

export function whatsappHref(message: string): string {
  return `https://wa.me/${COMPANY_PHONE.waDigits}?text=${encodeURIComponent(message)}`;
}
