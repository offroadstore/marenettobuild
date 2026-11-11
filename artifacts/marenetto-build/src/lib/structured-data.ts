import { companyStructuredData } from '@/config/contact';
import { articleBySlug } from '@/content/articles';
import { canonicalEdition, type Edition } from '@/localization/edition-inventory';

export function editionStructuredData(edition: Edition, origin: string) {
  const canonical = new URL(canonicalEdition(edition).path, origin).href;
  const graph: Record<string, unknown>[] = [
    companyStructuredData(origin),
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Marenetto Build', url: `${origin}/`, publisher: { '@id': `${origin}/#organization` } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Marenetto Build', item: `${origin}/` }, ...(edition.path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: edition.title.split(' | ')[0], item: canonical }])] },
  ];
  const article = articleBySlug.get(edition.id);
  if (article && edition.locale === 'it' && edition.state === 'published') graph.push({
    '@type': 'Article', headline: article.title, inLanguage: 'it', mainEntityOfPage: canonical,
    publisher: { '@id': `${origin}/#organization` }, image: new URL(article.image, origin).href,
    ...(article.publishedOn ? { datePublished: article.publishedOn } : {}),
  });
  return graph;
}

export function updateStructuredData(edition: Edition, origin: string) {
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach(script => script.remove());
  const element = document.createElement('script');
  element.type = 'application/ld+json';
  element.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': editionStructuredData(edition, origin) });
  document.head.appendChild(element);
}
