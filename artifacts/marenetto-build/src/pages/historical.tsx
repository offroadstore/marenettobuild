import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { historicalDocument, type HistoricalPage } from '@/content/historical';
import { HeroPhoto } from '@/components/home/Media';
import { HistoricalHomeSections } from '@/components/home/HistoricalHomeSections';
import { extractHistoricalHome } from '@/content/historical-home';
import { editionByPath } from '@/localization/edition-inventory';
import { updateStructuredData } from '@/lib/structured-data';
import pendingMessages from '@/content/pending-content.json';
import { withCampaignParams } from '@/lib/campaign';
const PUBLIC_SITE_ORIGIN = new URL(import.meta.env.VITE_PUBLIC_SITE_URL || 'https://preview.invalid').origin;

// Keep the recovered document untouched on the server. Carry only permitted
// campaign fields when a visitor follows one of its native internal anchors.
function preserveCampaign(event: MouseEvent<HTMLElement>) {
  const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
  if (!anchor) return;
  const target = new URL(anchor.href, window.location.href);
  if (target.origin !== window.location.origin || !['http:', 'https:'].includes(target.protocol)) return;
  anchor.setAttribute('href', withCampaignParams(`${target.pathname}${target.search}${target.hash}`));
}

export function HistoricalContents({ page, actions }: { page: HistoricalPage; actions?: ReactNode }) {
  const document = historicalDocument(page);
  const home = page.family === '/';
  const homeData = home ? extractHistoricalHome(document.html) : null;
  const pendingMessage = pendingMessages[page.locale as keyof typeof pendingMessages] ?? pendingMessages.it;
  const held = page.state === 'awaiting-confirmation' && page.kind !== 'article' && !page.editorialCorrection;
  const sourceLanguageLabels: Record<string, string> = { en: 'Text in Italian', nl: 'Tekst in het Italiaans', pt: 'Texto em italiano', fr: 'Texte en italien', de: 'Text auf Italienisch', es: 'Texto en italiano', pl: 'Tekst w języku włoskim', ru: 'Текст на итальянском языке' };
  useEffect(() => {
    window.document.title = page.title;
    for (const [selector, value] of [
      ['meta[name="description"]', held ? pendingMessage : page.description],
      ['meta[property="og:title"]', page.title],
      ['meta[property="og:description"]', held ? pendingMessage : page.description],
      ['meta[property="og:url"]', new URL(page.path, PUBLIC_SITE_ORIGIN).href],
      ['meta[property="og:locale"]', page.contentLanguage],
      ['meta[property="og:type"]', page.kind === 'article' ? 'article' : 'website'],
      ['meta[name="twitter:title"]', page.title],
      ['meta[name="twitter:description"]', held ? pendingMessage : page.description],
    ]) {
      let meta = window.document.head.querySelector<HTMLMetaElement>(selector);
      if (!meta) { meta = window.document.createElement('meta'); const [, attribute, content] = selector.match(/\[(name|property)="([^"]+)"/)!; meta.setAttribute(attribute, content); window.document.head.appendChild(meta); }
      meta.content = value;
    }
    if (held) {
      window.document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang], script[type="application/ld+json"]').forEach(node => node.remove());
      window.document.documentElement.lang = page.locale === 'it' ? 'it-IT' : page.locale;
      return;
    }
    let canonical = window.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = window.document.createElement('link'); canonical.rel = 'canonical'; window.document.head.appendChild(canonical); }
    canonical.href = new URL(page.path, PUBLIC_SITE_ORIGIN).href;
    window.document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
    window.document.documentElement.lang = page.locale === 'it' ? 'it-IT' : page.locale;
    const edition = page.state === 'awaiting-confirmation' ? undefined : editionByPath.get(page.path);
    if (edition) updateStructuredData(edition, PUBLIC_SITE_ORIGIN);
    else window.document.head.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
  }, [page, pendingMessage, held]);
  if (held) return <section className="page-hero"><div className="container">
    <h1 className="display-title">{page.h1}</h1>
    <p lang={page.locale} role="status">{pendingMessage}</p>
  </div></section>;
  if (home) return <div className="mb-home mbh historical-home" data-historical-body="" lang={page.contentLanguage} onClick={preserveCampaign}>
    <section className="mbh-opening"><HeroPhoto><div className="mbh-hero__copy">
      <h1 className="mbh-h1">{page.h1}</h1><div data-preserved-ui="">{actions}</div>
    </div></HeroPhoto></section>{' '}
    {homeData && <HistoricalHomeSections home={homeData} />}
  </div>;
  return <section className="section"><div className="container">
    {page.kind === 'article' && <><h1 className="display-title">{page.h1}</h1>{document.dateLabel ? <span>{document.dateLabel}</span> : document.publishedOn && <time dateTime={document.publishedOn}>{document.publishedOn.slice(0, 10)}</time>}{document.image && <figure><img className="historical-cover" src={document.image} alt={document.imageAlt} loading="eager" />{document.imageCaption && <figcaption>{document.imageCaption}</figcaption>}</figure>}</>}
    {page.locale !== 'it' && page.contentLanguage === 'it' && <p lang={page.locale} data-source-language="it">{sourceLanguageLabels[page.locale] ?? 'Testo in italiano'}</p>}
    <article className={`historical-content${page.kind === 'article' ? ' article-body' : ''}`} data-historical-body="" data-editorial-state={page.state === 'awaiting-confirmation' ? 'review-pending' : undefined} data-correction-state={page.editorialCorrection ? page.locale === 'it' ? 'owner-authorized-preview' : 'translation-draft' : undefined} lang={page.contentLanguage} onClick={preserveCampaign} dangerouslySetInnerHTML={{ __html: document.html }} />
  </div></section>;
}
