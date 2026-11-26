import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadPhase5, markdownBody, phase5Guides, escapeHTML as e } from '../phase5/package.mjs';
import { PHASE5_LOCALES, historicalPurchasePaths } from '../phase5/locales.mjs';
import { sources } from '../phase5/sources.mjs';
import { draftFAQ } from '../phase5/draft-schema.mjs';
import { COPY } from './copy.mjs';
import arabicGuides from './guides-ar.mjs';
import { GUIDE_TITLES, GUIDE_DESCRIPTION } from './guide-seo.mjs';
import { AUTHORIZATION, LOCALES, NEW_ARTICLES, GUIDE_AREAS, RELEASE_ID, PURCHASE } from './scope.mjs';

export const sha = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const root = new URL('../../../', import.meta.url);
const json = async relative => JSON.parse(await readFile(new URL(relative, root), 'utf8'));
const section = ([heading, body]) => `<h2>${e(heading)}</h2><p>${e(body)}</p>`;
const renderFaq = (faq, title) => `<section id="release-faq"><h2>${e(title)}</h2>${faq.map(([q,a]) => `<h3>${e(q)}</h3><p>${e(a)}</p>`).join('')}</section>`;
const sourceIds = [
  ['sicily','sue','dpr-9bis','landscape-notice'],
  ['sicily','sue','landscape-notice'],
  ['sicily','sue','landscape-code','landscape-simplified'],
  ['sicily','sue','landscape-notice','landscape-simplified'],
  ['sicily','sue','landscape-notice'],
  ['purchase','dpr-9bis','sicily','sue'],
  ['sue','office'],
  ['sicily','sue','management'],
];
const headingsToOmit = new Set([
  'Come iniziare il confronto', 'How to start the conversation',
  'So beginnt das Gespräch', 'Comment commencer', 'Hoe het gesprek te beginnen',
]);

/** Read-only compiler. It never writes to a database or grants publication. */
export async function loadRelease() {
  const previous = await loadPhase5({locales: PHASE5_LOCALES});
  const pages = await json('artifacts/marenetto-build/src/localization/public-pages.json');
  const historical = await json('artifacts/marenetto-build/src/content/historical/index.json');
  const management = (await json('docs/editorial/phase5/management-links.json')).links;
  const atelierPaths = {};
  for(const file of ['copy-west.ts','copy-north.ts']) {
    const text=await readFile(new URL(`artifacts/marenetto-build/src/content/atelier/${file}`,root),'utf8');
    for(const m of text.matchAll(/(?:^|\n)  ([a-z]{2}):\s*\{\s*\n\s*slug:\s*'([^']+)'/g)) atelierPaths[m[1]]=`${m[1]==='it'?'':`/${m[1]}`}/${m[2]}`;
  }
  const propertyPages = await readFile(new URL('artifacts/marenetto-build/src/content/property-management/index.ts', root), 'utf8');
  if (!propertyPages.includes('propertyPath')) throw new Error('Property routes must be inspected again');
  const arabicManagement = '/ar/short-let-property-management-cefalu';
  // Path comes from the integrated Arabic service, checked against the renderer
  // in the matrix. It is never inferred from a translation of the Italian slug.
  const records = [];
  const purchasePaths = {...historicalPurchasePaths, ar:'/ar/articles/buying-renovating-five-checks'};
  const publicPurchasePaths = Object.fromEntries(Object.entries(purchasePaths).map(([locale,path])=>[
    locale,historical.find(p=>p.locale===locale&&p.path.replace(/\/+$/,'')===path)?.path??path,
  ]));
  function oldArticlePath(locale, identity) {
    if (locale === 'ar') return '/ar/articles/pools-and-ornamental-ponds';
    return historical.find(p => p.locale === locale && p.kind === 'article' && p.family === `/${identity}`)?.path ??
      `${locale === 'it' ? '' : `/${locale}/articles`}/${identity}`;
  }
  for (const locale of LOCALES) {
    const copy = COPY[locale];
    const articles = (await import(`./articles/${locale}.mjs`)).default;
    if (articles.length !== 8) throw new Error(`Eight articles required: ${locale}`);
    for (let i=0; i<14; i++) {
      const guide = i >= 8 ? phase5Guides[i-8] : undefined;
      const item = guide
        ? locale === 'ar' ? arabicGuides[i-8] : previous.records.find(r => r.identity === guide.identity && r.locale === locale)
        : articles[i];
      if (!item) throw new Error(`Missing edition ${locale}/${i}`);
      const identity = guide?.identity ?? NEW_ARTICLES[i][0];
      const area = guide ? GUIDE_AREAS[identity] : NEW_ARTICLES[i][1];
      let body, title, summary, faq, path, ids, sourceManuscriptSHA256;
      if (guide && locale !== 'ar') {
        ({title,summary} = item.content);
        path = item.path;
        ids = guide.sourceIds;
        sourceManuscriptSHA256 = item.sourceManuscriptSHA256;
        faq = draftFAQ(item).map(f => [f.question,f.answer]);
        // Remove only commercial/contact paragraphs. Preserve the full manuscript,
        // FAQ, documentary limitations and private source separately in phase5.
        const blocks = item.markdown.trim().split(/\n\s*\n/);
        const filtered = blocks.filter((b,n) => n > 1 && !b.includes('mailto:') &&
          !headingsToOmit.has(b.replace(/^## /,'')));
        // An orphan heading after removing a contact paragraph has no public use.
        const kept = filtered.filter((b,n) => !/^## /.test(b) || (filtered[n+1] && !/^## /.test(filtered[n+1])));
        // Contents are regenerated, not stale links to removed contact headings.
        body = markdownBody(kept.join('\n\n'), item.labels);
        const faqHeading = body.indexOf(`>${e(item.labels.faq)}</h2>`);
        const faqStart = body.lastIndexOf('<h2',faqHeading);
        const faqEnd = body.indexOf('<h2',faqHeading+1);
        if(faqHeading<0||faqStart<0||faqEnd<0) throw new Error(`FAQ non individuate: ${locale}/${identity}`);
        body = body.slice(0,faqStart)+`<section id="release-faq">${body.slice(faqStart,faqEnd)}</section>`+body.slice(faqEnd);
      } else {
        ({title,summary,faq} = item);
        body = item.sections.map(section).join('\n') + renderFaq(faq,copy[5]);
        path = guide?.mode === 'revise-existing' ? purchasePaths[locale]
          : `${locale === 'it' ? '' : `/${locale}`}/${item.slug}`;
        if (guide && locale === 'ar' && guide.mode !== 'revise-existing') path = `/ar/${item.slug}`;
        ids = guide?.sourceIds ?? sourceIds[i];
      }
      if (identity === PURCHASE && path !== purchasePaths[locale]) throw new Error('Historical purchase URL changed');
      const request = pages[locale].request.path;
      const managementPath = locale === 'ar' ? arabicManagement : new URL(management[locale]).pathname;
      const links = [];
      if (i === 3) {
        links.push([oldArticlePath(locale,'piscine-e-laghetti-zen'), locale === 'ar' ? 'المسابح والمسطحات المائية' : articles[3].title]);
        if(!atelierPaths[locale]) throw new Error(`Atelier locale non trovato: ${locale}`);
        links.push([atelierPaths[locale], locale === 'ar' ? 'أتيليه: مطابخ خارجية حسب الطلب' : 'Atelier']);
      }
      if (i === 5) links.push([publicPurchasePaths[locale],GUIDE_TITLES[locale][0]]);
      if (i === 7 || (guide && [3,5].includes(i-8))) links.push([managementPath,'Cefalù Apartments']);
      const notice = `<blockquote id="release-technical-notice"><p><strong>${e(copy[3])}</strong></p><p>${e(copy[4])}</p></blockquote>`;
      const illustration = `<figure><img src="/media/editorial/project-diagram.png" alt="${e(copy[8])}" width="960" height="320" loading="lazy" /><figcaption>${e(copy[7])}</figcaption></figure>`;
      const linked = links.length ? `<section id="release-reading"><h2>${e(copy[10])}</h2><ul>${links.map(([href,label]) => `<li><a href="${e(href)}">${e(label)}</a></li>`).join('')}</ul></section>` : '';
      const selectedSources = ids.map(id => {
        const source = sources.find(s => s.id === id);
        if (!source) throw new Error(`Unknown source: ${id}`);
        return source;
      });
      const citations = `<section id="release-sources"><h2>${e(copy[6])}</h2><p>${e(copy[4])}</p><ul>${selectedSources.map(s => `<li><a href="${e(s.url)}">${e(s.title)}</a> (${s.consultedOn})</li>`).join('')}</ul></section>`;
      // The existing form, one closing content CTA, explicit provenance. Global
      // controls remain unchanged; campaign parameters are added by the renderer.
      const cta = `<p id="release-request"><a href="${e(`${request}?service=${area === 'surfaces' ? 'bespoke-furniture' : 'local-building'}&source=${RELEASE_ID}&article=${identity}`)}">${e(copy[9])}</a></p>`;
      const seoTitle = guide ? GUIDE_TITLES[locale][i-8] : title;
      const seoDescription = guide ? `${seoTitle}. ${GUIDE_DESCRIPTION[locale]}` : summary;
      const content = {
        title, summary,
        body: `${notice}\n${illustration}\n${body}\n${section([copy[0],copy[1]])}\n<p>${e(copy[11])}</p><p>${e(copy[2])}</p>\n${linked}\n${citations}\n${cta}`,
        category: area, tags:[RELEASE_ID,guide ? 'secondary-guide' : 'commercial-insight'],
        image:'', imageAlt:'',
        sources:selectedSources.map(s => ({title:s.title,url:s.url})),
        seoTitle, seoDescription, contentLanguage:locale,
      };
      records.push({
        identity,locale,path,canonicalPath:identity===PURCHASE?publicPurchasePaths[locale]:path,kind:'article',mode:guide?.mode ?? 'create',area,content,faq,
        preparedAt:guide && locale !== 'ar' ? '2026-11-25' : '2026-11-26',
        revisedAt:'2026-11-26',
        sourceManuscriptSHA256,
        candidateContentSHA256:sha(content),
        review: {method:'AI-assisted-authoring-and-documentary-linguistic-review',professionalOpinion:false,authorization:AUTHORIZATION},
        ...(identity===PURCHASE&&locale!=='ar'?{authorizedSupplement:illustration+section([copy[0],copy[1]])+`<p>${e(copy[11])}</p><p>${e(copy[2])}</p>`+cta}:{}),
      });
    }
  }
  // Source is the exact new Italian revision, not the older private draft.
  for (const record of records) {
    const source = records.find(r => r.identity === record.identity && r.locale === 'it');
    record.sourceContentSHA256 = source.candidateContentSHA256;
  }
  if (records.length !== 182 || new Set(records.map(r=>r.path.replace(/\/+$/,''))).size !== 182) throw new Error('Incomplete/colliding release');
  return { id:RELEASE_ID, authorization:AUTHORIZATION, records,
    rootSHA256:sha(records.map(r=>[r.identity,r.locale,r.path,r.canonicalPath,r.candidateContentSHA256,r.sourceContentSHA256,r.presentationSHA256??null])),
    publicStatus:'not-deployed-by-this-task',
  };
}
