/** Public information only; no drafts, private routes or deployment state. */
export function llmsDocument(organization, entries, origin) {
  const locales = ['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da'];
  const homes = locales.flatMap(locale => {
    const home = entries.find(e => e.locale === locale && e.id === 'home');
    return home ? [`- [${locale}: ${home.title}](${origin}${home.path})`] : [];
  });
  const services = entries.filter(e => ['services', 'service-premium', 'service-local', 'contact'].includes(e.id));
  const additional = entries.filter(e => e.id !== 'home' && !services.includes(e));
  return `# ${organization.name}

> Building and renovation based in Cefalù, Sicily; premium bespoke furniture worldwide.

## Distinct service areas
- Construction and renovation: mainly within about 60 km of Cefalù, in the Madonie and along the coast. Projects beyond are considered on request with a dedicated quotation; 60 km is not a strict service boundary.
- Premium bespoke furniture: custom concrete furniture, kitchens, exclusive cement/microcement tables and design pieces, shipped or installed worldwide. Materials, dimensions, logistics, timing and team travel are agreed individually.
- Illustrations are not evidence of completed projects. No unverified products, prices, reviews or availability are claimed.

## Contact
- Name: ${organization.name}
- Legal name: ${organization.legalName}
- Email: ${organization.email}
- Telephone: ${organization.telephone}
- Business address, confirmed by the company on 2026-11-23: ${organization.address.streetAddress}, ${organization.address.postalCode} ${organization.address.addressLocality}, Italy. This is not an independent registry verification.

## Language editions
${homes.join('\n')}

## Public service and contact pages
${services.map(e => `- [${e.title}](${origin}${e.path})`).join('\n')}

## Other verified public pages
${additional.map(e => `- [${e.title}](${origin}${e.path})`).join('\n')}

Only reviewed public links eligible for this release are listed. This file is an aid to reading, not a promise of indexing, rankings or AI citation.
`;
}
