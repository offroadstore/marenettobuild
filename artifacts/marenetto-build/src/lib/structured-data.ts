import { companyServiceAreas, companyStructuredData } from '@/config/contact';
import { articleBySlug } from '@/content/articles';
import { PHASE3_COPY, TRAVEL_COPY, phase3PageByPath } from '@/content/phase3';
import { canonicalEdition, type Edition } from '@/localization/edition-inventory';
import { serviceCopy } from '@/content/service-offers';
import { localBuildingArea } from '@/config/service-area';
import { propertyCopy } from '@/content/property-management';

export function editionStructuredData(edition: Edition, origin: string) {
  const canonical = new URL(canonicalEdition(edition).path, origin).href;
  const graph: Record<string, unknown>[] = [
    companyStructuredData(origin),
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Marenetto Build', url: `${origin}/`, publisher: { '@id': `${origin}/#organization` } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Marenetto Build', item: `${origin}/` }, ...(edition.path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: edition.title.split(' | ')[0], item: canonical }])] },
  ];
  const article = articleBySlug.get(edition.id);
  if (edition.id === 'property-management') {
    const text = propertyCopy[edition.locale];
    const partner = 'https://www.cefaluapartments.it/#organization';
    graph.push({ '@type': 'Organization', '@id': partner, name: 'Cefalù Apartments', url: 'https://www.cefaluapartments.it/' });
    graph.push({
      '@type': 'Service', '@id': `${canonical}#service`, url: canonical, inLanguage: edition.locale,
      name: text.h1, description: text.intro,
      provider: { '@id': `${origin}/#organization` },
      areaServed: { '@type': 'Place', name: 'Cefalù e paesi limitrofi' },
      subjectOf: { '@type': 'WebPage', '@id': canonical, url: canonical, about: { '@id': partner },
        description: `${text.splitBuild.join(': ')} ${text.splitPartner.join(': ')}` },
    });
    graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, inLanguage: edition.locale,
      mainEntity: text.faq.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } })) });
  }
  if (edition.id === 'service-premium' || edition.id === 'service-local') {
    const text = serviceCopy[edition.locale];
    const premium = edition.id === 'service-premium';
    graph.push({
      '@type': 'Service', '@id': `${canonical}#service`, url: canonical, inLanguage: edition.locale,
      name: premium ? text.premiumTitle : text.localTitle,
      description: premium ? text.premiumIntro : text.scope,
      provider: { '@id': `${origin}/#organization` },
      areaServed: premium ? { '@type': 'Place', name: 'Worldwide' } : localBuildingArea,
    });
    if (premium) graph.push({
      '@type': 'FAQPage', inLanguage: edition.locale,
      mainEntity: text.faq.map(([name, answer]) => ({
        '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    });
  }
  if (article && edition.locale === 'it' && edition.state === 'published') graph.push({
    '@type': 'Article', headline: article.title, inLanguage: 'it', mainEntityOfPage: canonical,
    publisher: { '@id': `${origin}/#organization` }, image: new URL(article.image, origin).href,
    ...(article.publishedOn ? { datePublished: article.publishedOn } : {}),
  });
  const p3 = edition.source.startsWith('phase3') ? phase3PageByPath(edition.path) : undefined;
  if (p3?.kind === 'furniture') {
    const f = PHASE3_COPY[p3.locale]!.furniture;
    graph.push({ '@type': 'Service', name: f.metaTitle, description: f.metaDescription, inLanguage: p3.locale, url: canonical,
      provider: { '@id': `${origin}/#organization` }, areaServed: { '@type': 'Place', name: 'Worldwide' }, serviceType: f.metaTitle });
    graph.push({ '@type': 'FAQPage', inLanguage: p3.locale, mainEntity: f.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  }
  if (p3?.kind === 'travel') {
    const t = TRAVEL_COPY[p3.locale]!;
    graph.push({ '@type': 'Service', name: t.metaTitle, description: t.metaDescription, inLanguage: p3.locale, url: canonical,
      provider: { '@id': `${origin}/#organization` }, areaServed: companyServiceAreas(), serviceType: t.metaTitle });
    graph.push({ '@type': 'FAQPage', inLanguage: p3.locale, mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  }
  if (p3?.kind === 'place') graph.push({ '@type': 'Service', name: p3.title.split(' | ')[0], description: p3.description, inLanguage: p3.locale, url: canonical,
    provider: { '@id': `${origin}/#organization` },
    areaServed: p3.place.schemaType === 'Place' ? { '@type': 'Place', name: p3.place.name, containedInPlace: { '@type': 'City', name: 'Tusa' } } : { '@type': 'City', name: p3.place.name } });
  return graph;
}

export function updateStructuredData(edition: Edition, origin: string) {
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach(script => script.remove());
  const element = document.createElement('script');
  element.type = 'application/ld+json';
  element.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': editionStructuredData(edition, origin) });
  document.head.appendChild(element);
}
