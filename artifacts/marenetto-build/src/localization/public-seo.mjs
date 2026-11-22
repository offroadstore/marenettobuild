// Language wrappers around Italian copy are not independent translations.
export function isNativeEdition(edition) {
  return edition.contentLanguage === edition.locale;
}

export function mergeActiveMetadata(entries, active) {
  return entries.map(entry => {
    const live = active.find(item => item.path === entry.path && item.revisionId !== 'withdrawn');
    return live?.content ? { ...entry,
      title: live.content.seoTitle || live.content.title || entry.title,
      description: live.content.seoDescription || live.content.summary || entry.description,
      contentLanguage: live.content.contentLanguage || entry.contentLanguage,
    } : entry;
  });
}

const archiveNames = {
  it: ['Articoli su edilizia e ristrutturazioni', 'Recensioni dei clienti'],
  en: ['Construction and renovation articles', 'Customer reviews'],
  fr: ['Articles sur la construction et la rénovation', 'Avis des clients'],
  de: ['Artikel über Bau und Renovierung', 'Kundenbewertungen'],
  es: ['Artículos sobre construcción y reformas', 'Opiniones de clientes'],
  nl: ['Artikelen over bouw en renovatie', 'Klantbeoordelingen'],
  pt: ['Artigos sobre construção e renovação', 'Avaliações de clientes'],
  ru: ['Статьи о строительстве и ремонте', 'Отзывы клиентов'],
  pl: ['Artykuły o budowie i remontach', 'Opinie klientów'],
  sv: ['Artiklar om byggnation och renovering', 'Kundomdömen'],
  no: ['Artikler om bygg og renovering', 'Kundeomtaler'],
  da: ['Artikler om byggeri og renovering', 'Kundeanmeldelser'],
};
const text = value => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();

export function releaseMetadata(edition, html = '', entries = []) {
  let title = edition.title;
  const names = archiveNames[edition.locale];
  const legacyArchiveTitle = /^(?:Articoli|Articles|Artikel|Artikelen|Artículos|Artigos|Recensioni)\s*\|/i.test(title);
  if (names && legacyArchiveTitle && (edition.id === 'articles' || edition.id === 'historical:/recensioni')) {
    title = `${names[edition.id === 'articles' ? 0 : 1]} — Cefalù | Marenetto Build`;
  }
  if (edition.id === 'contact' && title === 'Kontakt Marenetto Build i Cefalù') {
    if (edition.locale === 'no') title = 'Kontakt oss i Cefalù | Marenetto Build';
    if (edition.locale === 'da') title = 'Kontakt os i Cefalù | Marenetto Build';
  }
  const content = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const paragraph = [...content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => text(match[1])).find(value => value.length >= 70);
  let description = text(edition.description) || paragraph || `${title.split('|')[0].trim()} — Marenetto Build.`;
  const duplicate = !edition.description || entries.some(other =>
    other.path !== edition.path && other.description === edition.description);
  const topic = title.split('|')[0].trim();
  if (duplicate && !description.toLowerCase().startsWith(topic.toLowerCase())) description = `${topic}. ${description}`;
  if (description.length > 170) description = description.slice(0, 167).replace(/\s+\S*$/, '') + '…';
  return { title, description };
}
