import { professionalCopy } from '@/content/professionals';
import publicPagesForSd from '@/localization/public-pages.json';
import { companyServiceAreas, companyStructuredData } from '@/config/contact';
import { articleBySlug } from '@/content/articles';
import { PHASE3_COPY, TRAVEL_COPY, phase3PageByPath } from '@/content/phase3';
import { canonicalEdition, type Edition } from '@/localization/edition-inventory';
import { serviceCopy } from '@/content/service-offers';
import { localBuildingArea } from '@/config/service-area';
import { propertyCopy } from '@/content/property-management';
import { atelierCopy } from '@/content/atelier';
import { historicalInventory, historicalDocument, historicalLoaded } from '@/content/historical';
import { networkPageByPath } from '@/content/network';
import { networkStructuredData, networkServiceCatalog } from '@/content/network/schema';
import { NETWORK_SERVICE_IDS } from '@/content/network/types';
import { arabicEditorialSchema } from '@/content/arabic-editorial/schema';
import { arabicEditorialByPath } from '@/content/arabic-editorial';
import { areaPageByPath, areaCopy, areaPage, articleArea } from '@/content/four-areas';

export function editionStructuredData(edition: Edition, origin: string) {
  const canonical = new URL(canonicalEdition(edition).path, origin).href;
  const graph: Record<string, unknown>[] = [
    companyStructuredData(origin),
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Marenetto Build', url: `${origin}/`, publisher: { '@id': `${origin}/#organization` } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: edition.locale === 'ar' ? 'الرئيسية' : 'Marenetto Build', item: `${origin}${edition.locale === 'ar' ? '/ar/' : '/'}` }, ...(edition.path === '/' || edition.path === '/ar/' ? [] : [{ '@type': 'ListItem', position: 2, name: edition.title.split(' | ')[0], item: canonical }])] },
  ];
  const pillar = areaPageByPath(edition.path);
  if (pillar && !edition.activeEditorialRevision && !edition.source.startsWith('active-editorial:')) {
    const text = areaCopy(pillar.locale);
    const offer = text.areas[pillar.area];
    graph.push({
      '@type': 'Service', '@id': `${canonical}#service`, url: canonical, inLanguage: edition.locale,
      name: offer.h1, description: offer.lede, serviceType: offer.offer.map(([name]) => name).join(', '),
      provider: { '@id': `${origin}/#organization` }, areaServed: localBuildingArea,
    });
    graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, inLanguage: edition.locale,
      mainEntity: offer.faq.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } })) });
    const crumb = graph.findIndex(item => item['@type'] === 'BreadcrumbList');
    graph[crumb] = { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: text.ui.home, item: `${origin}${edition.locale === 'it' ? '/' : `/${edition.locale}/`}` },
      { '@type': 'ListItem', position: 2, name: offer.nav, item: canonical },
    ] };
    return graph;
  }
  const assigned = edition.kind === 'article' ? articleArea(edition.id) : undefined;
  const articlePillar = assigned ? areaPage(edition.locale, assigned) : undefined;
  const articleVisibleTitle = edition.visibleTitle ?? arabicEditorialByPath(edition.path)?.h1 ??
    historicalInventory.find(page => page.path === edition.path)?.h1 ?? articleBySlug.get(edition.id)?.title ?? edition.title.split(' | ')[0];
  const articleBreadcrumb = articlePillar ? { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: areaCopy(edition.locale).ui.home, item: `${origin}${edition.locale === 'it' ? '/' : `/${edition.locale}/`}` },
    { '@type': 'ListItem', position: 2, name: articlePillar.nav, item: `${origin}${articlePillar.path}` },
    { '@type': 'ListItem', position: 3, name: articleVisibleTitle, item: canonical },
  ] } : undefined;
  if (articleBreadcrumb) graph[graph.findIndex(item => item['@type'] === 'BreadcrumbList')] = articleBreadcrumb;
  // A selected live revision is not the old static composition. In particular,
  // do not retain Arabic FAQs or images that the live body no longer displays.
  if (edition.activeEditorialRevision || edition.source.startsWith('active-editorial:')) {
    if (edition.kind === 'article') graph.push({
      '@type': 'Article', '@id': `${canonical}#article`,
      headline: edition.visibleTitle ?? edition.title, inLanguage: edition.contentLanguage,
      mainEntityOfPage: canonical, url: canonical,
      publisher: { '@id': `${origin}/#organization` },
      ...(edition.visibleImage ? { image: new URL(edition.visibleImage,origin).href } : {}),
    });
    return graph;
  }
  const arabicArticleGraph = edition.locale === 'ar' ? arabicEditorialSchema(edition.path, origin) : [];
  if (arabicArticleGraph.length) return [
    ...graph.filter(item => item['@type'] !== 'BreadcrumbList'),
    ...arabicArticleGraph.filter(item => !articleBreadcrumb || item['@type'] !== 'BreadcrumbList'),
    ...(articleBreadcrumb ? [articleBreadcrumb] : []),
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
      areaServed: { '@type': 'Place', name: edition.locale === 'ar' ? 'تشفالو والبلدات المجاورة' : 'Cefalù e paesi limitrofi' },
      subjectOf: { '@type': 'WebPage', '@id': canonical, url: canonical, about: { '@id': partner },
        description: `${text.splitBuild.join(': ')} ${text.splitPartner.join(': ')}` },
    });
    graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, inLanguage: edition.locale,
      mainEntity: text.faq.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } })) });
  }
  if (edition.id === 'professionals') {
    const text = professionalCopy[edition.locale];
    const crumbs = graph.findIndex(item => item['@type'] === 'BreadcrumbList');
    if (crumbs >= 0) graph.splice(crumbs, 1);
    const services = (publicPagesForSd as Record<string, Record<string, { path: string }>>)[edition.locale]?.services?.path;
    const home = `${origin}${edition.locale === 'it' ? '/' : `/${edition.locale}/`}`;
    // Mirrors the visible breadcrumb exactly: Home > Services > page.
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: text.breadcrumbHome, item: home },
      ...(services ? [{ '@type': 'ListItem', position: 2, name: text.breadcrumbServices, item: `${origin}${services}` }] : []),
      { '@type': 'ListItem', position: services ? 3 : 2, name: text.nav, item: canonical },
    ] });
    const page = graph.find(item => item['@type'] === 'WebPage');
    if (!page) graph.push({ '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: text.title, description: text.description, inLanguage: edition.locale });
    graph.push({ '@type': 'Service', '@id': `${canonical}#service`, url: canonical, inLanguage: edition.locale,
      name: text.h1, description: `${text.lead} ${text.scopeNote}`, serviceType: text.materials.map(m => m.name).join(', '),
      audience: { '@type': 'BusinessAudience', name: text.kicker },
      provider: { '@id': `${origin}/#organization` }, areaServed: { '@type': 'Place', name: 'Worldwide' } });
    graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, inLanguage: edition.locale,
      mainEntity: text.faq.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } })) });
    return graph;
  }
  if (edition.id === 'atelier') {
    const text = atelierCopy[edition.locale];
    const crumbs = graph.findIndex(item => item['@type'] === 'BreadcrumbList');
    if (crumbs >= 0) graph.splice(crumbs, 1);
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: text.breadcrumbHome, item: `${origin}${edition.locale === 'it' ? '/' : `/${edition.locale}/`}` },
      { '@type': 'ListItem', position: 2, name: text.nav, item: canonical },
    ] });
    // Worldwide applies to the Atelier only; local building services keep their own area.
    graph.push({ '@type': 'Service', '@id': `${canonical}#service`, url: canonical, inLanguage: edition.locale,
      name: text.h1, description: text.lead, serviceType: text.offer.map(([name]) => name).join(', '),
      provider: { '@id': `${origin}/#organization` }, areaServed: { '@type': 'Place', name: 'Worldwide' } });
    graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, inLanguage: edition.locale,
      mainEntity: text.faq.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } })) });
    return graph;
  }
  const network = networkPageByPath(edition.path);
  if (network) {
    const genericBreadcrumb = graph.findIndex(item => item['@type'] === 'BreadcrumbList');
    if (genericBreadcrumb >= 0) graph.splice(genericBreadcrumb, 1);
    graph.push(...networkStructuredData(network, origin));
    return graph;
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
      ...(!premium && networkServiceCatalog(edition.locale, origin).itemListElement.length
        ? { hasOfferCatalog: networkServiceCatalog(edition.locale, origin) } : {}),
    });
    if (premium) graph.push({
      '@type': 'FAQPage', inLanguage: edition.locale,
      mainEntity: text.faq.map(([name, answer]) => ({
        '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    });
  }
  if (edition.id !== 'service-local' && (NETWORK_SERVICE_IDS as readonly string[]).includes(edition.id)) {
    const catalog = networkServiceCatalog(edition.locale, origin);
    if (catalog.itemListElement.length) graph.push({
      '@type': 'Service', '@id': `${canonical}#service`, url: canonical, inLanguage: edition.locale,
      name: edition.title.split(' | ')[0], description: edition.description,
      provider: { '@id': `${origin}/#organization` }, areaServed: localBuildingArea, hasOfferCatalog: catalog,
    });
  }
  if (edition.kind === 'article') {
    const historical = historicalInventory.find(page => page.path === edition.path);
    const document = historical && historicalLoaded(historical.locale) ? historicalDocument(historical) : undefined;
    const image = document?.image ?? article?.image;
    const date = document?.publishedOn ?? article?.publishedOn;
    graph.push({
      '@type': 'Article', '@id': `${canonical}#article`,
      headline: edition.visibleTitle ?? historical?.h1 ?? article?.title ?? edition.title.split(' | ')[0],
      inLanguage: edition.contentLanguage, mainEntityOfPage: canonical, url: canonical,
      publisher: { '@id': `${origin}/#organization` },
      ...(image ? { image: new URL(image, origin).href } : {}),
      ...(date && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(date) ? { datePublished: date } : {}),
    });
  }
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
