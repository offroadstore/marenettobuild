import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { atelierCopy, atelierPath } from '@/content/atelier';
import { openCallRequest } from '@/components/CallRequestAccess';
import { withCampaignParams } from '@/lib/campaign';
import publicPages from '@/localization/public-pages.json';
import { networkCopy, networkImages } from '@/content/network';
import '@/styles/atelier.css';

/** Existing AI-generated illustrative WebPs (network inventory, review accepted). Never shown as completed work. */
const ATELIER_IMAGES = [['bespoke', 2], ['bespoke', 0], ['outdoors', 2]] as const;
function atelierImages(locale: string) {
  const copy = networkCopy(locale);
  return ATELIER_IMAGES.flatMap(([id, n]) => {
    const image = networkImages(id).find(item => item.n === n);
    return image ? [{ ...image, alt: copy.articles[id].imageAlts[n], label: copy.illustration }] : [];
  });
}
function AtelierFigure({ image, className, eager }: { image: ReturnType<typeof atelierImages>[number]; className?: string; eager?: boolean }) {
  return <figure className={`mat-figure ${className ?? ''}`} data-testid={`img-atelier-${image.id}-${image.n}`}>
    <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 860px) 100vw, 40vw" width={image.width} height={image.height} alt={image.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  </figure>;
}

const pages = publicPages as unknown as Record<string, Record<string, { path: string }>>;
const pad = (n: number) => String(n + 1).padStart(2, '0');

/** Cross-link from services, network and furniture pages; never a claim of executed work. */
export function AtelierLink({ locale }: { locale: string }) {
  const c = atelierCopy[locale];
  if (!c) return null;
  return <Link href={withCampaignParams(atelierPath(locale))} className="mat-entry" data-testid="link-atelier">
    <span className="mat-entry__tag">{c.nav}</span>
    <span className="mat-entry__text">{c.entry}</span>
    <ArrowRight size={18} aria-hidden="true" />
  </Link>;
}

export function AtelierPage({ locale }: { locale: string }) {
  const c = atelierCopy[locale];
  if (!c) throw new Error(`Missing Atelier copy: ${locale}`);
  const home = pages[locale]?.home?.path;
  const services = pages[locale]?.services?.path;
  const request = pages[locale]?.request?.path;
  const enquire = () => openCallRequest('atelier_international');
  const images = atelierImages(locale);
  return (
    <main className="mat" data-testid="page-atelier">
      {home && services && <nav className="mat-crumbs mbh-wrap" aria-label="Breadcrumb">
        <ol><li><Link href={withCampaignParams(home)}>{c.breadcrumbHome}</Link></li><li><Link href={withCampaignParams(services)}>{c.breadcrumbServices}</Link></li><li aria-current="page">{c.nav}</li></ol>
      </nav>}
      <header className="mat-head">
        <div className="mbh-wrap mat-head__grid">
          <div className="mat-reveal">
            <p className="mat-kicker">{c.kicker}</p>
            <h1 className="mat-h1" data-testid="text-atelier-title">{c.h1}</h1>
            <p className="mat-lead">{c.lead}</p>
            <div className="mat-actions">
              <button type="button" className="button" onClick={enquire} data-testid="button-atelier-enquiry">{c.ctaButton}<ArrowRight size={14} aria-hidden="true" /></button>
              <span className="mat-onrequest" data-testid="text-atelier-on-request">{c.onRequest}</span>
            </div>
          </div>
          <div className="mat-hero-media">
            {images[0] && <AtelierFigure image={images[0]} eager />}
          </div>
        </div>
      </header>

      <section className="mbh-section mat-section">
        <div className="mbh-wrap">
          <h2 className="mat-h2">{c.offerHeading}</h2>
          <ol className="mat-offer">{c.offer.map(([name, text], i) => <li key={name} data-testid={`card-atelier-offer-${i}`}><span className="mat-num">{pad(i)}</span><h3>{name}</h3><p>{text}</p></li>)}</ol>
          <p className="mat-settings"><strong>{c.settingsHeading}</strong>{c.settings.map(s => <span key={s}>{s}</span>)}</p>
        </div>
      </section>

      <section className="mbh-section mat-section mat-materials">
        <div className="mbh-wrap">
          <h2 className="mat-h2">{c.materialsHeading}</h2>
          {images.length > 1 && <div className="mat-gallery">{images.slice(1).map(image => <AtelierFigure key={image.src} image={image} />)}</div>}
          <dl className="mat-matlist">{c.materials.map(([name, text]) => <div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}</dl>
        </div>
      </section>

      <section className="mbh-section mat-section" aria-labelledby="atelier-steps">
        <div className="mbh-wrap">
          <h2 className="mat-h2" id="atelier-steps">{c.stepsHeading}</h2>
          <p className="mat-note">{c.stepsIntro}</p>
          <ol className="mat-steps">{c.steps.map(([title, text], i) => <li key={title} data-testid={`step-atelier-${i + 1}`}><span className="mat-num">{pad(i)}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
        </div>
      </section>

      <section className="mbh-section mat-section">
        <div className="mbh-wrap">
          <h2 className="mat-h2">{c.territoryHeading}</h2>
          <div className="mat-territory">
            {[c.near, c.far].map(([h, p], i) => <div key={h} className={i ? 'is-far' : ''}><h3>{h}</h3><p>{p}</p></div>)}
          </div>
          <p className="mat-markets"><strong>{c.marketsLabel}</strong> <span>{c.markets}</span></p>
          <p className="mat-note">{c.marketsNote}</p>
        </div>
      </section>

      <section className="mbh-section mat-section">
        <div className="mbh-wrap mat-two">
          <div><h2 className="mat-h2">{c.complianceHeading}</h2><ul className="mat-list">{c.compliance.map(t => <li key={t}>{t}</li>)}</ul></div>
          <div><h2 className="mat-h2">{c.lexiconHeading}</h2><dl className="mat-lexicon">{c.lexicon.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl></div>
        </div>
      </section>

      <section className="mbh-section mat-section">
        <div className="mbh-wrap">
          <h2 className="mat-h2">{c.faqHeading}</h2>
          <div className="mat-faq">{c.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>

      <section className="mbh-section mat-cta">
        <div className="mbh-wrap">
          <h2 className="mat-h2">{c.ctaHeading}</h2>
          <p>{c.ctaText}</p>
          <div className="mat-actions">
            <button type="button" className="button light" onClick={enquire} data-testid="button-atelier-enquiry-bottom">{c.ctaButton}<ArrowRight size={14} aria-hidden="true" /></button>
            {request && <Link href={withCampaignParams(request)} className="text-link" data-testid="link-atelier-request">{c.requestLink}<ArrowRight size={13} aria-hidden="true" /></Link>}
          </div>
        </div>
      </section>
    </main>
  );
}
