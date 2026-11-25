import { networkCopy, networkImages, networkPath, networkPublic, networkRevisionPayload, type NetworkPageRecord } from './index';
import { networkSourcesFor } from './sources';
import { networkPreviewPath } from './index';
import { NETWORK_IDS } from './types';
import { regulatoryNotice } from './regulatory-notice';

const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
/** Narrative only: CMS's public shell supplies its own H1. */
export function networkCMSRecord(page: NetworkPageRecord) {
  const c = networkCopy(page.locale);
  const a = c.articles[page.id];
  const images = networkImages(page.id);
  const p = (text: string) => `<p>${escape(text)}</p>`;
  const figure = (n: number) => {
    const image = images[n];
    return image ? `<figure><img src="${escape(image.src)}" alt="${escape(a.imageAlts[n])}" width="${image.width}" height="${image.height}" loading="lazy"><figcaption>${escape(c.illustration)}</figcaption></figure>` : '';
  };
  const body = [
    p(regulatoryNotice(page.locale).reviewSummary), p(a.lead), figure(0),
    ...a.sections.map((section, n) => `<section id="s-${n + 1}"><h2>${escape(section.heading)}</h2>${section.paragraphs.map(p).join('')}${page.id !== 'network' && n < 2 ? figure(n + 1) : ''}</section>`),
    `<h2>${escape(c.directHeading)}</h2>`, p(c.direct), `<h2>${escape(c.coordinatedHeading)}</h2>`, p(c.coordinated), p(c.scope),
    `<h2>${escape(c.checklist)}</h2><ul>${a.checklist.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`,
    `<h2>${escape(c.faq)}</h2>${a.faq.map(([q, answer]) => `<h3>${escape(q)}</h3>${p(answer)}`).join('')}`,
    `<h2>${escape(c.sources)}</h2><aside><h3>${escape(regulatoryNotice(page.locale).heading)}</h3>${p(regulatoryNotice(page.locale).body)}</aside><ul>${networkSourcesFor(page.id).map(source => `<li lang="it"><a href="${escape(source.url)}">${escape(source.title)}</a></li>`).join('')}</ul>`,
    `<h2>${escape(c.related)}</h2><ul>${NETWORK_IDS.filter(id => id !== page.id).map(id => `<li><a href="${networkPublic(page) ? networkPath(page.locale, id) : networkPreviewPath(page.locale, id)}">${escape(c.articles[id].title)}</a></li>`).join('')}</ul>`,
    p(a.nextStep),
  ].join('');
  return {
    identity: `network-${page.id}`, locale: page.locale, path: page.path, kind: 'article',
    historical: false, correction: false, releaseReady: Boolean(networkPublic(page)),
    reviewPayload: networkRevisionPayload(page),
    content: {
      title: a.title, summary: a.description, body, contentLanguage: page.locale,
      category: c.nav, tags: ['network-editorial'], image: images[0]?.src ?? '', imageAlt: a.imageAlts[0],
      sources: networkSourcesFor(page.id).map(({ title, url }) => ({ title, url })),
      seoTitle: a.seoTitle, seoDescription: a.description,
    },
  };
}
