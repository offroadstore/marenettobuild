import { ArrowRight, Clock3, FileText, MapPin } from 'lucide-react';
import { Link } from 'wouter';
import { professionalCopy, professionalPath, professionalDownloadsPath } from '@/content/professionals';
import { openCallRequest } from '@/components/CallRequestAccess';
import { withCampaignParams } from '@/lib/campaign';
import publicPages from '@/localization/public-pages.json';
import { networkCopy, networkImages } from '@/content/network';
import '@/styles/professionals.css';

/** Existing inventoried AI-generated WebPs (network inventory). Illustrative only, never completed work. */
const PRO_IMAGES = [['stone', 0], ['stone', 1], ['bespoke', 1]] as const;
function proImages(locale: string) {
  const copy = networkCopy(locale);
  return PRO_IMAGES.flatMap(([id, n]) => {
    const image = networkImages(id).find(item => item.n === n);
    return image ? [{ ...image, alt: copy.articles[id].imageAlts[n], label: copy.illustration }] : [];
  });
}
type ProImage = ReturnType<typeof proImages>[number];
function ProFigure({ image, eager, className }: { image: ProImage; eager?: boolean; className?: string }) {
  return <figure className={`pro-figure ${className ?? ''}`} data-testid={`img-pro-${image.id}-${image.n}`}>
    <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 860px) 100vw, 45vw" width={image.width} height={image.height} alt={image.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  </figure>;
}

const pages = publicPages as unknown as Record<string, Record<string, { path: string }>>;
const pad = (n: number) => String(n + 1).padStart(2, '0');

function Crumbs({ locale, last, middle }: { locale: string; last: string; middle?: [string, string] }) {
  const c = professionalCopy[locale];
  const home = pages[locale]?.home?.path;
  const services = pages[locale]?.services?.path;
  if (!home) return null;
  return <nav className="pro-crumbs pro-wrap" aria-label={[c.breadcrumbHome, c.breadcrumbServices, ...(middle ? [middle[0]] : []), last].join(' / ')}>
    <ol>
      <li><Link href={withCampaignParams(home)}>{c.breadcrumbHome}</Link></li>
      {services && <li><Link href={withCampaignParams(services)}>{c.breadcrumbServices}</Link></li>}
      {middle && <li><Link href={withCampaignParams(middle[1])}>{middle[0]}</Link></li>}
      <li aria-current="page">{last}</li>
    </ol>
  </nav>;
}

/** Cross-link card for services/atelier pages. */
export function ProfessionalsLink({ locale }: { locale: string }) {
  const c = professionalCopy[locale];
  if (!c) return null;
  return <Link href={withCampaignParams(professionalPath(locale))} className="pro-entry" data-testid="link-professionals">
    <span className="pro-entry__tag">{c.nav}</span><span>{c.entry}</span><ArrowRight size={18} aria-hidden="true" />
  </Link>;
}

function DownloadList({ locale }: { locale: string }) {
  const c = professionalCopy[locale];
  return <>
    <ul className="pro-dl">{c.dl.map(([name, text], i) => <li key={name} data-testid={`item-pro-download-${i}`}>
      <FileText size={18} aria-hidden="true" />
      <div><h3>{name}</h3><p>{text}</p></div>
      <span className="pro-pill" data-testid={`status-pro-download-${i}`}>{c.comingSoon}</span>
    </li>)}</ul>
    <p className="pro-note">{c.normsNote}</p>
  </>;
}

export function ProfessionalsPage({ locale }: { locale: string }) {
  const c = professionalCopy[locale];
  if (!c) throw new Error(`Missing professional copy: ${locale}`);
  const images = proImages(locale);
  const samples = () => openCallRequest('professional_studio', ['samples']);
  const block = () => openCallRequest('professional_studio', ['block_selection']);
  const generic = () => openCallRequest('professional_studio');
  return (
    <main className="pro" data-testid="page-professionals">
      <Crumbs locale={locale} last={c.nav} />

      {/* 1 · Opening */}
      <header className="pro-head">
        <div className="pro-wrap pro-head__grid">
          <div className="pro-reveal">
            <p className="pro-kicker">{c.kicker}</p>
            <h1 className="pro-h1" data-testid="text-professionals-title">{c.h1}</h1>
            <p className="pro-lead">{c.lead}</p>
            <div className="pro-actions">
              <button type="button" className="button" onClick={samples} data-testid="button-pro-samples">{c.ctaSamples}<ArrowRight size={14} aria-hidden="true" /></button>
              <button type="button" className="button outline" onClick={block} data-testid="button-pro-block">{c.ctaBlock}<ArrowRight size={14} aria-hidden="true" /></button>
            </div>
            <dl className="pro-facts">
              <div><dt>{c.contactLabel}</dt><dd data-testid="text-pro-contact">{c.contactPending}</dd></div>
              <div><dt><Clock3 size={14} aria-hidden="true" /> {c.response}</dt><dd>{c.responseNote}</dd></div>
            </dl>
            <p className="pro-note">{c.contactNote}</p>
            <p className="pro-scope"><MapPin size={14} aria-hidden="true" /> {c.scopeNote}</p>
          </div>
          {images[0] && <ProFigure image={images[0]} eager className="pro-hero-media" />}
        </div>
      </header>

      {/* 2 · Five steps */}
      <section className="pro-section" aria-labelledby="pro-steps">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-steps">{c.stepsHeading}</h2>
          <p className="pro-note">{c.stepsIntro}</p>
          <ol className="pro-steps">{c.steps.map(([t, p], i) => <li key={t} data-testid={`step-pro-${i + 1}`}><span className="pro-num">{pad(i)}</span><h3>{t}</h3><p>{p}</p></li>)}</ol>
        </div>
      </section>

      {/* 3 · Materials */}
      <section className="pro-section pro-materials" aria-labelledby="pro-materials">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-materials">{c.materialsHeading}</h2>
          <p className="pro-intro">{c.materialsIntro}</p>
          <div className="pro-cards">{c.materials.map((m, i) => <article key={m.name} className="pro-card" data-testid={`card-pro-material-${i}`}>
            <h3>{m.name}</h3>
            <dl>{c.fields.map((f, j) => <div key={f}><dt>{f}</dt><dd className={m.values[j] ? '' : 'is-pending'}>{m.values[j] ?? c.pending}</dd></div>)}</dl>
          </article>)}</div>
          <p className="pro-caveat">{c.materialsCaveat}</p>
          {images.length > 1 && <div className="pro-gallery">{images.slice(1).map(image => <ProFigure key={image.src} image={image} />)}</div>}
        </div>
      </section>

      {/* 4 · Downloads */}
      <section className="pro-section" aria-labelledby="pro-downloads">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-downloads">{c.downloadsHeading}</h2>
          <p className="pro-intro">{c.downloadsIntro}</p>
          <DownloadList locale={locale} />
          <Link href={withCampaignParams(professionalDownloadsPath(locale))} className="text-link" data-testid="link-pro-downloads">{c.downloadsLink}<ArrowRight size={13} aria-hidden="true" /></Link>
        </div>
      </section>

      {/* 5 · Projects placeholder */}
      <section className="pro-section" aria-labelledby="pro-projects">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-projects">{c.projectsHeading}</h2>
          <p className="pro-intro">{c.projectsText}</p>
          <div className="pro-slot" data-testid="placeholder-pro-project">
            <strong>{c.projectSlot}</strong>
            <dl>{c.projectFields.map(f => <div key={f}><dt>{f}</dt><dd>—</dd></div>)}</dl>
          </div>
        </div>
      </section>

      {/* 6 · Traceability */}
      <section className="pro-section pro-trace" aria-labelledby="pro-trace">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-trace">{c.traceHeading}</h2>
          <p className="pro-motto">{c.traceMotto}</p>
          <p className="pro-intro">{c.traceText}</p>
          <dl className="pro-trace__fields">{c.traceFields.map(f => <div key={f}><dt>{f}</dt><dd>{c.traceEmpty}</dd></div>)}</dl>
          <p className="pro-note">{c.traceCaveat}</p>
        </div>
      </section>

      {/* 7 · Trade programme */}
      <section className="pro-section" aria-labelledby="pro-program">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-program">{c.programHeading}</h2>
          <p className="pro-formula" data-testid="text-pro-formula">{c.programFormula}</p>
          <ul className="pro-program">{c.program.map(([t, p]) => <li key={t}><h3>{t}</h3><p>{p}</p></li>)}</ul>
          <blockquote className="pro-principle" data-testid="text-pro-principle"><p>{c.codeSentence}</p><footer>{c.codeCaveat}</footer></blockquote>
        </div>
      </section>

      {/* 8 · Private visits */}
      <section className="pro-section pro-visits" aria-labelledby="pro-visits">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-visits">{c.visitsHeading}</h2>
          <p className="pro-stand" data-testid="text-pro-stand">{c.standSentence}</p>
          <p className="pro-note">{c.visitsText}</p>
        </div>
      </section>

      {/* 9 · Request */}
      <section className="pro-section pro-request" aria-labelledby="pro-request">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-request">{c.requestHeading}</h2>
          <p>{c.requestText}</p>
          <p className="pro-response"><Clock3 size={15} aria-hidden="true" /> <strong>{c.response}</strong> — {c.responseNote}</p>
          <div className="pro-actions">
            <button type="button" className="button light" onClick={generic} data-testid="button-pro-request">{c.requestButton}<ArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </div>
      </section>

      {/* 10 · FAQ */}
      <section className="pro-section" aria-labelledby="pro-faq">
        <div className="pro-wrap">
          <h2 className="pro-h2" id="pro-faq">{c.faqHeading}</h2>
          <div className="pro-faq">{c.faq.map(([q, a], i) => <details key={q} open={i === 0} data-testid={`faq-pro-${i}`}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>
    </main>
  );
}

/** No-login downloads page: noindex, outside sitemap/hreflang, no fake files. */
export function ProfessionalDownloadsPage({ locale }: { locale: string }) {
  const c = professionalCopy[locale];
  if (!c) throw new Error(`Missing professional copy: ${locale}`);
  return <main className="pro" data-testid="page-professional-downloads">
    <Crumbs locale={locale} last={c.dlH1} middle={[c.nav, professionalPath(locale)]} />
    <section className="pro-section">
      <div className="pro-wrap">
        <p className="pro-kicker">{c.kicker}</p>
        <h1 className="pro-h1 pro-h1--sm">{c.dlH1}</h1>
        <p className="pro-lead">{c.dlLead}</p>
        <DownloadList locale={locale} />
        <p className="pro-note">{c.dlAsk}</p>
        <div className="pro-actions">
          <button type="button" className="button" onClick={() => openCallRequest('professional_studio')} data-testid="button-pro-dl-request">{c.requestButton}<ArrowRight size={14} aria-hidden="true" /></button>
          <Link href={withCampaignParams(professionalPath(locale))} className="text-link" data-testid="link-pro-dl-back">{c.dlBack}</Link>
        </div>
      </div>
    </section>
  </main>;
}
