// Documentary previews only. Nothing here registers a public edition or emits
// a datePublished. The existing CMS remains the publication authority.
function visibleText(markdown) {
  return markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\n/g, ' ').trim();
}
export function draftFAQ(record) {
  const blocks = record.markdown.trim().split(/\n\s*\n/);
  const start = blocks.indexOf(`## ${record.labels.faq}`);
  const end = blocks.indexOf(`## ${record.labels.sources}`, start + 1);
  if (start < 0 || end < start) throw new Error('FAQ boundaries not found');
  const faq = [];
  for (const block of blocks.slice(start + 1, end)) {
    if (block.startsWith('### ')) faq.push({ question: block.slice(4), answer: '' });
    else {
      if (!faq.length) throw new Error('FAQ answer without question');
      faq.at(-1).answer += (faq.at(-1).answer ? ' ' : '') + visibleText(block);
    }
  }
  if (faq.length !== 3 || faq.some(f => !f.answer.trim())) throw new Error('Incomplete visible FAQ');
  return faq;
}
export function draftSchemaPreview(record, origin) {
  const canonical = new URL(record.path, origin).href;
  const organization = { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Marenetto Build' };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', '@id': `${canonical}#article`, headline: record.content.title,
        mainEntityOfPage: canonical, inLanguage: record.locale,
        author: organization, publisher: organization,
        dateCreated: record.preparedAt,
      },
      {
        '@type': 'FAQPage', inLanguage: record.locale, mainEntity: draftFAQ(record).map(f => ({
          '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };
}
