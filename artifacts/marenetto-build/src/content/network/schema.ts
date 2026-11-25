import { NETWORK_LOCALES, networkCopy, networkImages, networkPath, networkPublic, networkReviews, type NetworkPageRecord } from './index';

/**
 * Candidate audits may inspect schema without making it public. Real Article
 * publication dates are absent until actually recorded, never invented from
 * the historical site's dates or from the desired Republish date.
 */
export function networkStructuredData(page: NetworkPageRecord, origin: string) {
  const c = networkCopy(page.locale);
  const a = c.articles[page.id];
  const canonical = new URL(page.path, origin).href;
  const pillar = new URL(networkPath(page.locale), origin).href;
  const review = networkReviews[`${page.locale}:${page.id}`];
  return [
    {
      '@type': 'Article', '@id': `${canonical}#article`, headline: a.title, description: a.description,
      inLanguage: page.locale, mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: 'Marenetto Build', '@id': `${origin}/#organization` },
      publisher: { '@id': `${origin}/#organization` },
      image: networkImages(page.id).map(image => new URL(image.src, origin).href),
      ...(review ? { dateCreated: review.createdAt, dateModified: review.modifiedAt, ...(review.publishedAt ? { datePublished: review.publishedAt } : {}) } : {}),
    },
    { '@type': 'FAQPage', '@id': `${canonical}#faq`, inLanguage: page.locale,
      mainEntity: a.faq.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.home, item: `${origin}${page.locale === 'it' ? '/' : `/${page.locale}/`}` },
      ...(page.id === 'network' ? [] : [{ '@type': 'ListItem', position: 2, name: c.nav, item: pillar }]),
      { '@type': 'ListItem', position: page.id === 'network' ? 2 : 3, name: page.id === 'network' ? c.nav : a.title, item: canonical },
    ] },
  ];
}
export function networkServiceCatalog(locale: string, origin: string) {
  // The existing site has more locales than this section. Do not load a
  // nonexistent network translation or break their service-page hydration.
  if (!NETWORK_LOCALES.includes(locale)) return { '@type': 'OfferCatalog', itemListElement: [] };
  const c = networkCopy(locale);
  const a = c.articles.network;
  const eligible = networkPublic({ id: 'network', locale, path: networkPath(locale), title: a.seoTitle, description: a.description });
  return {
    '@type': 'OfferCatalog', name: c.nav,
    // An informational article about purchase checks is not a legal service
    // offered by the building company. Model direct work and coordination,
    // never every article title as an in-house professional service.
    itemListElement: eligible ? [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: c.directHeading, description: c.direct,
        url: new URL(networkPath(locale, 'comfort'), origin).href, provider: { '@id': `${origin}/#organization` } } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: c.coordinatedHeading, description: c.coordinated,
        url: new URL(networkPath(locale), origin).href, provider: { '@id': `${origin}/#organization` } } },
    ] : [],
  };
}
