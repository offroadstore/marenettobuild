import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { travelCopy, travelLocale, travelPath } from '@/content/phase3/travel-copy';
import { zonesPath } from '@/content/phase3';
import { getEdition } from '@/localization/edition-inventory';
import { withCampaignParams } from '@/lib/campaign';
import { ContactBlock } from './ContactBlock';
import '@/styles/phase3.css';

/** Full native page: ordinary area versus team mobilisation. */
export function TravelPage({ locale }: { locale: string }) {
  const t = travelCopy(locale);
  const links: [string, string | undefined, string][] = [
    ['services', getEdition(locale, 'services')?.path, t.links.services],
    ['request', getEdition(locale, 'request')?.path, t.links.request],
    ['zones', zonesPath(locale), t.links.zones],
    ['contact', getEdition(locale, 'contact')?.path, t.links.contact],
  ];
  return <main id="main" className="mbh p3" data-testid="page-travel">
    <header className="p3-hero">
      <div className="mbh-wrap">
        <p className="mbh-kicker mbh-kicker--light">{t.kicker}</p>
        <h1 className="mbh-h1 p3-hero__title">{t.title}</h1>
        <p className="p3-hero__lead">{t.intro}</p>
        <ol className="p3-scale" aria-hidden="true">{t.scale.map((s, i) => <li key={s} className={i < 2 ? 'is-ordinary' : undefined}>{s}</li>)}</ol>
      </div>
    </header>

    <section className="mbh-wrap mbh-section" aria-label={`${t.ordinary.label} / ${t.travel.label}`}>
      <div className="p3-split">
        <article className="p3-split__col p3-split__col--home" data-testid="section-ordinary-area">
          <p className="p3-split__label">{t.ordinary.label}</p>
          <h2 className="mbh-h2">{t.ordinary.heading}</h2>
          <p>{t.ordinary.text}</p>
          <ul className="p3-check__list">{t.ordinary.points.map(p => <li key={p}><Check size={16} aria-hidden="true" /><span>{p}</span></li>)}</ul>
          <Link href={withCampaignParams(zonesPath(locale))} className="mbh-link" data-testid="link-travel-zones">{t.ordinary.zonesLink}<ArrowRight size={15} aria-hidden="true" /></Link>
        </article>
        <article className="p3-split__col p3-split__col--away" data-testid="section-mobilisation">
          <p className="p3-split__label">{t.travel.label}</p>
          <h2 className="mbh-h2">{t.travel.heading}</h2>
          <p>{t.travel.text}</p>
          <ul className="p3-check__list">{t.travel.points.map(p => <li key={p}><Check size={16} aria-hidden="true" /><span>{p}</span></li>)}</ul>
        </article>
      </div>
    </section>

    <section className="p3-materials" aria-labelledby="dest-h">
      <div className="mbh-wrap">
        <h2 id="dest-h" className="mbh-h2">{t.destHeading}</h2>
        <dl className="p3-materials__grid p3-dest">{t.dest.map(([h, d]) => <div key={h}><dt>{h}</dt><dd>{d}</dd></div>)}</dl>
        <p className="p3-note" data-testid="text-destinations-note">{t.destNote}</p>
      </div>
    </section>

    <section className="mbh-wrap mbh-section" aria-labelledby="info-h">
      <div className="p3-check">
        <div><h2 id="info-h" className="mbh-h2">{t.infoHeading}</h2><p className="mbh-intro">{t.infoIntro}</p></div>
        <ol className="p3-info">{t.info.map((q, i) => <li key={q}><span className="mbh-num">{String(i + 1).padStart(2, '0')}</span><span>{q}</span></li>)}</ol>
      </div>
    </section>

    <section className="mbh-wrap mbh-section p3-quote" aria-labelledby="quote-h">
      <div className="p3-check">
        <div><h2 id="quote-h" className="mbh-h2">{t.quoteHeading}</h2><p className="mbh-intro">{t.quoteText}</p></div>
        <ul className="p3-check__list">{t.quote.map(q => <li key={q}><Check size={16} aria-hidden="true" /><span>{q}</span></li>)}</ul>
      </div>
    </section>

    <section className="mbh-wrap mbh-section" aria-labelledby="law-h">
      <div className="p3-law">
        <h2 id="law-h" className="mbh-h2">{t.complianceHeading}</h2>
        <p className="mbh-intro">{t.complianceText}</p>
        <ol className="p3-ai">{t.compliance.map((c, i) => <li key={c}><span className="mbh-num">{String(i + 1).padStart(2, '0')}</span><div><p>{c}</p></div></li>)}</ol>
      </div>
    </section>

    <section className="mbh-wrap mbh-section p3-faq" aria-labelledby="faq-h">
      <h2 id="faq-h" className="mbh-h2">{t.faqHeading}</h2>
      <div>{t.faq.map(([q, a], i) => <details key={q} open={i === 0} data-testid={`faq-travel-${i}`}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>

    <section className="mbh-strip" aria-labelledby="travel-links-h">
      <div className="mbh-wrap p3-services">
        <h2 id="travel-links-h" className="mbh-strip__title">{t.linksHeading}</h2>
        <ul>{links.map(([id, href, label]) => href ? <li key={id}><Link href={withCampaignParams(href)} className="mbh-link" data-testid={`link-travel-${id}`}>{label}<ArrowRight size={15} aria-hidden="true" /></Link></li> : null)}</ul>
      </div>
    </section>

    <ContactBlock id="travel" locale={locale} heading={t.contactHeading} text={t.contactText} subject={t.mailSubject} message={t.mailSubject} />
  </main>;
}

/** Larger block for home and the zones index. */
export function TravelIndexBlock({ locale }: { locale: string }) {
  const l = travelLocale(locale);
  const t = travelCopy(l);
  return <section className="p3-reach" lang={l} aria-labelledby="reach-h" data-testid="section-travel-index">
    <div className="mbh-wrap p3-reach__grid">
      <div>
        <p className="mbh-kicker">{t.indexKicker}</p>
        <h2 id="reach-h" className="mbh-h2">{t.indexTitle}</h2>
      </div>
      <div>
        <p className="p3-reach__text">{t.indexText}</p>
        <ol className="p3-scale p3-scale--ink" aria-hidden="true">{t.scale.map((s, i) => <li key={s} className={i < 2 ? 'is-ordinary' : undefined}>{s}</li>)}</ol>
        <Link href={withCampaignParams(travelPath(l))} className="mbh-btn mbh-btn--primary" data-testid="link-travel-index">{t.cta}<ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>
  </section>;
}

/** Compact coverage note for place, furniture and service pages. */
export function TravelCoverageBlock({ locale }: { locale: string }) {
  const l = travelLocale(locale);
  const t = travelCopy(l);
  return <aside className="mbh-wrap p3-coverage" lang={l} aria-label={t.blockTitle} data-testid="block-travel-coverage">
    <div>
      <p className="p3-coverage__title">{t.blockTitle}</p>
      <p className="p3-coverage__text">{t.indexText}</p>
    </div>
    <Link href={withCampaignParams(travelPath(l))} className="mbh-link" data-testid="link-travel-coverage">{t.cta}<ArrowRight size={15} aria-hidden="true" /></Link>
  </aside>;
}
