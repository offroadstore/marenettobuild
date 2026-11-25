import { arabicEditorialByPath, arabicEditorialPath } from './index';

export function arabicEditorialSchema(path: string, origin: string) {
  const article = arabicEditorialByPath(path);
  if (!article) return [];
  const canonical = new URL(arabicEditorialPath(article.slug), origin).href;
  return [
    {
      '@type': 'Article', '@id': `${canonical}#article`, url: canonical, mainEntityOfPage: canonical,
      inLanguage: 'ar', headline: article.h1, description: article.description,
      author: { '@id': `${origin}/#organization` }, publisher: { '@id': `${origin}/#organization` },
      isBasedOn: new URL(article.sourcePath, origin).href,
      // Neither the old source date nor the translation date is a publication event.
    },
    {
      '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${origin}/ar/` },
        { '@type': 'ListItem', position: 2, name: 'المقالات', item: `${origin}/ar/articles` },
        { '@type': 'ListItem', position: 3, name: article.h1, item: canonical },
      ],
    },
    ...(article.faq ? [{
      '@type': 'FAQPage', '@id': `${canonical}#faq`, inLanguage: 'ar',
      mainEntity: article.faq.map(([name, text]) => ({
        '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text },
      })),
    }] : []),
  ];
}
