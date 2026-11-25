import { getLocaleDirection } from '@/localization/locale-direction.mjs';
import { useEffect } from 'react';
import { NETWORK_PUBLIC_PAGES, networkCopy, networkImages, networkPublic, type NetworkPageRecord } from '@/content/network';
import { networkStructuredData } from '@/content/network/schema';
import { PUBLIC_SITE_ORIGIN } from './public-release-meta';

/** Native editorial routes are not legacy library slugs: never rewrite them
 * through articlePath(), or translate already-native metadata a second time. */
export function useNetworkMeta(page: NetworkPageRecord) {
  useEffect(() => {
    const copy = networkCopy(page.locale);
    const article = copy.articles[page.id];
    const eligible = networkPublic(page);
    const canonical = PUBLIC_SITE_ORIGIN + page.path;
    document.documentElement.lang = page.locale;
    document.documentElement.dir = getLocaleDirection(page.locale);
    document.title = article.seoTitle;
    const meta = (attribute: string, name: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.appendChild(element); }
      element.content = content;
    };
    for (const [attribute, name, content] of [
      ['name', 'description', article.description], ['name', 'robots', eligible ? 'index, follow' : 'noindex, nofollow'],
      ['property', 'og:title', article.seoTitle], ['property', 'og:description', article.description],
      ['property', 'og:url', canonical], ['property', 'og:type', 'article'],
      ['name', 'twitter:title', article.seoTitle], ['name', 'twitter:description', article.description],
      ['property', 'og:image', new URL(networkImages(page.id)[0].src, PUBLIC_SITE_ORIGIN).href],
      ['property', 'og:image:alt', `${copy.illustration}: ${article.imageAlts[0]}`],
    ]) meta(attribute, name, content);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(item => item.remove());
    if (eligible) for (const alternate of NETWORK_PUBLIC_PAGES.filter(item => item.id === page.id)) {
      for (const language of alternate.locale === 'it' ? ['it-IT', 'x-default'] : [alternate.locale]) {
        const alternateLink = document.createElement('link');
        alternateLink.rel = 'alternate'; alternateLink.hreflang = language;
        alternateLink.href = PUBLIC_SITE_ORIGIN + alternate.path; document.head.appendChild(alternateLink);
      }
    }
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach(item => item.remove());
    const json = document.createElement('script'); json.type = 'application/ld+json';
    json.dataset.marenettoStructuredData = '';
    json.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': networkStructuredData(page, PUBLIC_SITE_ORIGIN) }).replaceAll('<', '\\u003c');
    document.head.appendChild(json);
  }, [page.id, page.locale, page.path]);
}
