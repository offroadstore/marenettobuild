/** Public information only; no drafts, private routes or deployment state. */
export function llmsDocument(organization, entries, origin) {
  const locales = ['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da', 'ar'];
  const homes = locales.flatMap(locale => {
    const home = entries.find(e => e.locale === locale && e.id === 'home');
    return home ? [`- [${locale}: ${home.title}](${origin}${home.path})`] : [];
  });
  const services = entries.filter(e => ['services', 'service-premium', 'service-local', 'atelier', 'professionals', 'contact'].includes(e.id));
  const additional = entries.filter(e => e.id !== 'home' && e.id !== 'professional-downloads' && !services.includes(e));
  const network = entries.filter(e => e.id.startsWith('network-'));
  return `# ${organization.name}

> Building and renovation based in Cefalù, Sicily; premium bespoke furniture worldwide.

## Distinct service areas
- Construction and renovation: mainly within about 60 km of Cefalù, in the Madonie and along the coast. Projects beyond are considered on request with a dedicated quotation; 60 km is not a strict service boundary.
- Premium bespoke furniture: custom concrete furniture, kitchens, exclusive cement/microcement tables and design pieces, shipped or installed worldwide. Materials, dimensions, logistics, timing and team travel are agreed individually.
- Atelier Marenetto: made-to-order masonry outdoor kitchens, wood-fired ovens, tables and furniture with hand-painted Sicilian majolica, lava stone, cement and microcement. Materials are prepared in Sicily and the team builds or assembles on site, subject to project and destination feasibility. Ordinary quotations within about 60 km of Cefalù; suitable larger projects beyond use a dedicated quotation including team travel and logistics. Local authorized contractors or specialist subcontracting where required. No claim of past customers, completed international projects, universal authorization, yacht compliance or public prices.
- For architects and interior designers: glazed lava stone, Sicilian natural stone and hand-painted Sicilian majolica cut to the studio's drawings, with block selection at the quarry or by video, shop drawings for approval, production photo updates, packing, shipping and installation worldwide. Dedicated conditions for professional studios are shared on request and applied on the studio's invoice; this is a company-declared principle, not a certification of compatibility with any professional code. No commissions, percentages, public prices, completed projects, certifications, test results or downloadable files are claimed; technical documents are still being gathered.
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
${network.length ? `
## Professional network
- Marenetto Build coordinates appointed professionals and specialist businesses; they are not all internal staff.
- Radiant floors and walls, finishes and bespoke special details are confirmed direct services. Design qualifications and certification responsibilities are project-specific.
- Building work normally focuses on about 60 km around Cefalù; work beyond is considered on request, distinct from worldwide bespoke concrete furniture.
${network.map(e => `- [${e.title}](${origin}${e.path}) — ${e.description}`).join('\n')}
` : ''}

Only reviewed public links eligible for this release are listed. This file is an aid to reading, not a promise of indexing, rankings or AI citation.
`;
}
