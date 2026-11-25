import { renderToString } from 'react-dom/server';
import App from './App';
import { loadLocaleCatalog, resetTranslationFindings, setTranslationReviewMode, showsTranslatedCopy, translationFindings, translateText } from './localization/runtime';
import { editions, reviewPathForEdition } from './localization/edition-inventory';
import { articleBySlug } from './content/articles';
import { historicalPage, historicalPending, loadHistorical } from './content/historical';
import type { EditorialActive } from '@workspace/api-client-react';
import { translationCandidate, translationSourceChanged } from './localization/phase2';
import { mergeActiveMetadata, releaseMetadata } from './localization/public-seo.mjs';
import { arabicEditorialByPath } from './content/arabic-editorial';
export { editions, redirects, excludedRoutes, equivalentEditions, canonicalEdition, reviewPathForEdition, reviewHubEdition } from './localization/edition-inventory';
export { companyStructuredData } from './config/contact';
export { editionStructuredData } from './lib/structured-data';
export { historicalInventory } from './content/historical';
export { blockedPublicLocale } from './localization/locales';
export { networkPreviewPage, NETWORK_PAGES, networkPublic } from './content/network';
export { networkStructuredData } from './content/network/schema';

// Translation state is scoped to a document. Serialize server renders so concurrent
// review/public requests cannot share the transient review selection or findings.
let renderQueue: Promise<unknown> = Promise.resolve();
export function render(path: string, locale: string, active: EditorialActive[] = []) {
  const result = renderQueue.then(async () => {
    setTranslationReviewMode(path.startsWith('/__localization-review/'));
    await Promise.all([loadLocaleCatalog(locale), loadHistorical(locale)]);
    resetTranslationFindings();
    const body = renderToString(<App ssrPath={path} editorialActive={active} />);
    const edition = path.startsWith('/__localization-review/') ? editions.find(e => reviewPathForEdition(e) === path) : undefined;
    const suffix = ' | Marenetto Build';
    const metadata = edition ? {
      title: (edition.title.endsWith(suffix) ? translateText(locale, edition.title.slice(0, -suffix.length)) + suffix : translateText(locale, edition.title)),
      description: translateText(locale, edition.description),
    } : undefined;
    const currentEdition = edition ?? editions.find(e => e.path === path);
    const resolvedMetadata = metadata ?? (currentEdition
      ? releaseMetadata(mergeActiveMetadata([currentEdition], active)[0], body, editions)
      : undefined);
    const article = currentEdition ? articleBySlug.get(currentEdition.id) : undefined;
    let fullTextProof;
    const translation = translationCandidate(path);
    const sourceChanged = translation && translationSourceChanged(translation, active);
    const arabicArticle = arabicEditorialByPath(path);
    if (arabicArticle && !active.some(edition => edition.path.replace(/\/+$/, '') === path.replace(/\/+$/, ''))) {
      const blocks = [arabicArticle.h1, arabicArticle.intro,
        ...arabicArticle.sections.flatMap(section => [section.heading, ...section.paragraphs]),
        ...(arabicArticle.faq ?? []).flat()];
      const escaped = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
      const missingBlocks = blocks.filter(block => !body.includes(escaped(block)));
      if (missingBlocks.length) throw new Error(`Arabic adaptation body incomplete at ${path}: ${missingBlocks.length} missing blocks`);
      fullTextProof = { slug: arabicArticle.slug, contentLocale: 'ar', blocks: blocks.length, missingBlocks: 0, originalDate: null, automatedCheckOnly: true };
    } else if (!sourceChanged && !active.some(edition => edition.path.replace(/\/+$/, '') === path.replace(/\/+$/, '')) && article?.approvedFullText && !historicalPage(path) && !historicalPending(path)) {
      const translated = showsTranslatedCopy(locale);
      const text = translated ? translateText(locale, article.approvedFullText) : article.approvedFullText;
      const blocks = text.trim().split(/\n\s*\n/).filter(Boolean).flatMap(block => block.startsWith('- ') ? block.split('\n').map(line => line.slice(2)) : [block.replace(/^## /, '')]);
      const escaped = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
      const missingBlocks = blocks.filter(block => !body.includes(escaped(block)));
      if (missingBlocks.length) throw new Error(`Article body incomplete at ${path}: ${missingBlocks.length} missing blocks`);
      if (translated && text === article.approvedFullText) throw new Error(`Article body is still Italian at ${path}`);
      fullTextProof = { slug: article.slug, contentLocale: translated ? locale : 'it', blocks: blocks.length, missingBlocks: 0, originalDate: article.publishedOn, automatedCheckOnly: true };
    }
    return { body, metadata: resolvedMetadata, fullTextProof, missingTranslations: translationFindings() };
  });
  renderQueue = result.catch(() => undefined);
  return result;
}
