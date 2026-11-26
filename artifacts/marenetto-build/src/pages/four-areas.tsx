import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { ImageDisclosure } from '@/components/ImageDisclosure';
import { imageDescription } from '@/content/image-descriptions';
import { withCampaignParams } from '@/lib/campaign';
import { usePageMeta } from '@/lib/meta';
import {
  AREA_IDS, AREA_STRUCTURE, areaCopy, areaPage, areaPath, articleArea, isAreaLocale,
  professionalPath, resolveAreaLink, type AreaId, type FourAreaPage, type ProjectPage,
} from '@/content/four-areas';
import { propertyPath } from '@/content/property-management';
import { atelierPath } from '@/content/atelier';
import { professionalCopy } from '@/content/professionals';
import { useActiveEditorial } from '@/lib/editorial-runtime';
import { commercialRecord } from '@/content/commercial-release.mjs';
import '@/styles/four-areas.css';

const firstLink = (locale: string, keys: string[]) => {
  for (const key of keys) { const href = resolveAreaLink(locale, key); if (href) return href; }
  return undefined;
};

/** Localized pillar page: offer, process, visible FAQ, price-on-assessment, one CTA. */
export function FourAreaPillar({ page }: { page: FourAreaPage }) {
  const { locale, area } = page;
  const c = areaCopy(locale);
  const t = c.areas[area];
  const s = AREA_STRUCTURE[area];
  const releasedArticles = useActiveEditorial().filter(entry=>entry.locale===locale && commercialRecord(entry)?.area===area);
  usePageMeta({ title: page.title, description: page.description, path: page.path });
  return <main className="fa" lang={locale} data-testid={`page-pillar-${area}`}>
    <section className="fa-hero">
      <div className="fa-wrap fa-hero__grid">
        <div className="fa-hero__copy">
          <nav aria-label={c.ui.breadcrumbLabel} className="fa-crumbs"><Link href={withCampaignParams(locale === 'it' ? '/' : `/${locale}`)}>{c.ui.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{t.nav}</span></nav>
          <p className="fa-kicker">{c.ui.areasLabel}</p>
          <h1 className="fa-h1">{t.h1}</h1>
          <p className="fa-lede">{t.lede}</p>
          <p className="fa-scope">{t.scope}</p>
        </div>
        <figure className="fa-hero__media">
          <img src={s.image} alt={imageDescription(s.image, locale)} width={960} height={720} loading="eager" />
          <figcaption><ImageDisclosure src={s.image} lang={locale} /></figcaption>
        </figure>
      </div>
    </section>

    <section className="fa-section" aria-labelledby="fa-offer">
      <div className="fa-wrap">
        <h2 id="fa-offer" className="fa-h2">{c.ui.offerHeading}</h2>
        <ol className="fa-offer">
          {t.offer.map(([title, text], i) => {
            const href = firstLink(locale, s.offer[i] ?? []);
            return <li key={title}>
              <span className="fa-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div><h3>{title}</h3><p>{text}</p>
                {href && <Link href={withCampaignParams(href)} className="fa-link">{c.ui.readMore}<ArrowRight size={14} aria-hidden="true" /></Link>}
              </div>
            </li>;
          })}
        </ol>
      </div>
    </section>

    <section className="fa-section fa-section--tint" aria-labelledby="fa-process">
      <div className="fa-wrap">
        <h2 id="fa-process" className="fa-h2">{c.ui.processHeading}</h2>
        <ol className="fa-steps">{t.process.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol>
        <div className="fa-price"><h3>{c.ui.priceHeading}</h3><p>{c.ui.priceText}</p></div>
      </div>
    </section>

    <section className="fa-section" aria-labelledby="fa-faq">
      <div className="fa-wrap fa-faq">
        <h2 id="fa-faq" className="fa-h2">{c.ui.faqHeading}</h2>
        <dl>{t.faq.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
      </div>
    </section>

    {releasedArticles.length>0 && <section className="fa-section" aria-labelledby="fa-reading">
      <div className="fa-wrap"><h2 id="fa-reading" className="fa-h2">{c.ui.readMore}</h2>
        <ul>{releasedArticles.map(entry=><li key={entry.identity}><Link href={withCampaignParams(entry.path)}>{entry.content.title}</Link></li>)}</ul>
      </div>
    </section>}
    <section className="fa-cta" aria-labelledby="fa-cta-h">
      <div className="fa-wrap fa-cta__inner">
        <div><h2 id="fa-cta-h" className="fa-h2">{c.ui.ctaHeading}</h2><p>{c.ui.ctaText}</p></div>
        <Link href={withCampaignParams(page.requestPath)} className="mbh-btn mbh-btn--board" data-testid="pillar-request">{c.ui.request}<ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </section>
  </main>;
}

/** Hidden preparatory page: noindex, never linked from navigation. */
export function ProjectsPage({ page }: { page: ProjectPage }) {
  usePageMeta({ title: page.title, description: page.description, path: page.path });
  useEffect(() => {
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    const previous = meta.content;
    meta.content = 'noindex, nofollow';
    return () => { if (meta) meta.content = previous; };
  }, []);
  return <main className="fa" lang={page.locale} data-testid="page-projects">
    <section className="fa-section"><div className="fa-wrap fa-narrow">
      <h1 className="fa-h1">{page.h1}</h1><p className="fa-lede">{page.text}</p>
    </div></section>
  </main>;
}

/** Home: four photographic areas + three customer needs. */
export function FourAreasHome({ locale }: { locale: string }) {
  const active=useActiveEditorial();
  if (!isAreaLocale(locale)) return null;
  const c = areaCopy(locale);
  const unavailable=active.filter(entry=>entry.revisionId==='withdrawn').flatMap(entry=>[entry.path,...(entry.aliases??[])]);
  const needHrefs = [areaPath(locale, 'investment'), professionalPath(locale,unavailable), propertyPath(locale)];
  const dedicatedProfessionals=needHrefs[1]!==atelierPath(locale)?professionalCopy[locale]:undefined;
  return <>
    <section className="fa-section" aria-labelledby="fa-areas-h" data-testid="section-four-areas">
      <div className="fa-wrap">
        <div className="fa-head"><h2 id="fa-areas-h" className="fa-h2">{c.ui.fourAreasHeading}</h2><p>{c.ui.fourAreasIntro}</p></div>
        <ul className="fa-areas">
          {AREA_IDS.map((area, i) => {
            const t = c.areas[area]; const img = AREA_STRUCTURE[area].image;
            return <li key={area} className={`fa-area fa-area--${i}`}>
              <Link href={withCampaignParams(areaPath(locale, area))} data-testid={`card-area-${area}`}>
                <img src={img} alt={imageDescription(img, locale)} loading="eager" decoding="async" width={960} height={720} />
                <span className="fa-area__body"><span className="fa-area__title">{t.nav}</span><span className="fa-area__tag">{t.tagline}</span><ArrowRight size={18} aria-hidden="true" /></span>
              </Link>
              <ImageDisclosure src={img} lang={locale} />
            </li>;
          })}
        </ul>
      </div>
    </section>
    <section className="fa-section fa-section--tint" aria-labelledby="fa-needs-h" data-testid="section-needs">
      <div className="fa-wrap">
        <h2 id="fa-needs-h" className="fa-h2">{c.ui.needsHeading}</h2>
        <ol className="fa-needs">{c.ui.needs.map(([title, text], i) => needHrefs[i] && <li key={title}>
          <h3>{title}</h3><p>{i===1&&dedicatedProfessionals?dedicatedProfessionals.entry:text}</p>
          <Link href={withCampaignParams(needHrefs[i]!)} className="fa-link" data-testid={`link-need-${i}`}>{i===1&&dedicatedProfessionals?dedicatedProfessionals.nav:c.ui.needsCta[i]}<ArrowRight size={14} aria-hidden="true" /></Link>
        </li>)}</ol>
      </div>
    </section>
  </>;
}

/** Article breadcrumb (Home / Area / Article) plus a local pillar link. Renders nothing for unmapped articles. */
export function AreaBreadcrumb({ locale, article, title }: { locale: string; article: string; title: string }) {
  const area: AreaId | undefined = articleArea(article);
  if (!area || !isAreaLocale(locale)) return null;
  const c = areaCopy(locale); const page = areaPage(locale, area)!;
  return <div className="fa-article-area" data-testid="article-area">
    <nav aria-label={c.ui.breadcrumbLabel} className="fa-crumbs">
      <Link href={withCampaignParams(locale === 'it' ? '/' : `/${locale}`)}>{c.ui.home}</Link><span aria-hidden="true">/</span>
      <Link href={withCampaignParams(page.path)}>{page.nav}</Link><span aria-hidden="true">/</span>
      <span aria-current="page">{title}</span>
    </nav>
  </div>;
}

export function AreaPillarLink({ locale, article }: { locale: string; article: string }) {
  const area = articleArea(article);
  if (!area || !isAreaLocale(locale)) return null;
  const c = areaCopy(locale); const page = areaPage(locale, area)!;
  return <aside className="fa-pillar-link" data-testid="article-pillar-link">
    <p className="fa-kicker">{c.ui.articleArea}</p>
    <Link href={withCampaignParams(page.path)} className="fa-link">{c.ui.pillarLink}: {page.nav}<ArrowRight size={14} aria-hidden="true" /></Link>
  </aside>;
}
