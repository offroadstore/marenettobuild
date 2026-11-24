import { Link } from 'wouter';
import { ArrowRight, Camera } from 'lucide-react';
import { PHASE3_COPY } from '@/content/phase3';
import { emailHref } from '@/config/contact';
import { withCampaignParams } from '@/lib/campaign';
import { ContactBlock } from './ContactBlock';
import { TravelCoverageBlock } from './TravelPages';

export function FurniturePage({ locale }: { locale: string }) {
  const f = PHASE3_COPY[locale]!.furniture;
  return <main id="main" className="mbh p3" data-testid="page-furniture">
    <header className="p3-hero p3-hero--slab">
      <div className="mbh-wrap p3-slab">
        <div>
          <p className="mbh-kicker mbh-kicker--light">{f.kicker}</p>
          <h1 className="mbh-h1 p3-hero__title">{f.title}</h1>
          <p className="p3-hero__lead">{f.intro}</p>
          <a href={emailHref(f.mailSubject)} className="mbh-btn mbh-btn--board" data-testid="cta-furniture-email">{f.cta}<ArrowRight size={15} aria-hidden="true" /></a>
        </div>
        <p className="p3-slab__world">{f.worldwide}</p>
      </div>
    </header>
    <section className="mbh-wrap mbh-section">
      <ul className="mbh-steps p3-three">{f.blocks.map(([h, t], i) => <li key={h} className="mbh-step"><span className="mbh-num">0{i + 1}</span><h2 className="mbh-h3">{h}</h2><p>{t}</p></li>)}</ul>
    </section>
    <section className="p3-materials" aria-labelledby="mat-h">
      <div className="mbh-wrap">
        <h2 id="mat-h" className="mbh-h2">{f.materialsHeading}</h2>
        <dl className="p3-materials__grid">{f.materials.map(([h, t]) => <div key={h}><dt>{h}</dt><dd>{t}</dd></div>)}</dl>
      </div>
    </section>
    <section className="mbh-wrap mbh-section" aria-labelledby="photos-h">
      <div className="mbh-head"><div><h2 id="photos-h" className="mbh-h2">{f.photosHeading}</h2><p className="mbh-intro">{f.photosText}</p></div></div>
      <ul className="p3-slots">{[1, 2, 3].map(n => <li key={n} className="p3-slot" data-testid={`placeholder-photo-${n}`}><Camera size={22} aria-hidden="true" /><span>{f.photoSlot}</span></li>)}</ul>
    </section>
    <section className="mbh-wrap mbh-section p3-steps" aria-labelledby="steps-h">
      <h2 id="steps-h" className="mbh-h2">{f.stepsHeading}</h2>
      <ol className="mbh-steps">{f.steps.map(([n, t]) => <li key={n} className="mbh-step"><span className="mbh-num">{n}</span><p>{t}</p></li>)}</ol>
    </section>
    <section className="mbh-wrap mbh-section p3-faq" aria-labelledby="faq-h">
      <h2 id="faq-h" className="mbh-h2">{f.faqHeading}</h2>
      <div>{f.faq.map(([q, a], i) => <details key={q} open={i === 0} data-testid={`faq-${i}`}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>
    <TravelCoverageBlock locale={locale} />
    <ContactBlock id="furniture" locale={locale} heading={f.contactHeading} text={f.contactText} subject={f.mailSubject} message={f.mailSubject} />
  </main>;
}

export function AiUsePage({ locale }: { locale: string }) {
  const a = PHASE3_COPY[locale]!.ai;
  return <main id="main" className="mbh p3" data-testid="page-ai-use">
    <header className="p3-hero">
      <div className="mbh-wrap">
        <p className="mbh-kicker mbh-kicker--light">{a.kicker}</p>
        <h1 className="mbh-h1 p3-hero__title">{a.title}</h1>
        <p className="p3-hero__lead">{a.intro}</p>
      </div>
    </header>
    <div className="mbh-wrap mbh-section">
      <ol className="p3-ai">{a.sections.map(([h, t], i) => <li key={h}><span className="mbh-num">{String(i + 1).padStart(2, '0')}</span><div><h2 className="mbh-h3">{h}</h2><p>{t}</p></div></li>)}</ol>
      <p className="p3-note">{a.privacyText} <Link href={withCampaignParams('/privacy')} className="mbh-link" data-testid="link-ai-privacy">{a.privacyLink}<ArrowRight size={14} aria-hidden="true" /></Link></p>
    </div>
    <ContactBlock id="ai" locale={locale} heading={a.contactHeading} text={a.contactText} subject={a.mailSubject} message={a.mailSubject} />
  </main>;
}
