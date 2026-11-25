import { ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { offerPath, requestPath, serviceCopy, localAreaNotes } from '@/content/service-offers';
import { SERVED_PLACES } from '@/content/phase3/places';
import { withCampaignParams } from '@/lib/campaign';
import './service-offer.css';

function copyFor(lang: string) {
  const copy = serviceCopy[lang];
  if (!copy) throw new Error(`Missing service copy: ${lang}`);
  return copy;
}

export function ServiceScopeLinks({ lang }: { lang: string }) {
  const c = copyFor(lang);
  const items = [
    { kind: 'local' as const, title: c.localTitle, n: '01' },
    { kind: 'premium' as const, title: c.premiumTitle, n: '02' },
  ];
  return (
    <nav className="mbs-scope" aria-label={c.scope} data-testid="nav-service-scope">
      <p className="mbs-scope__label">{c.scope}</p>
      <ul className="mbs-scope__list">
        {items.map(item => (
          <li key={item.kind}>
            <Link href={withCampaignParams(offerPath(lang, item.kind))} className="mbs-scope__link" data-testid={`link-scope-${item.kind}`}>
              <span className="mbs-scope__n" aria-hidden="true">{item.n}</span>
              <span className="mbs-scope__title">{item.title}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ServiceOfferPage({ lang }: { lang: string }) {
  const [pathname] = useLocation();
  const c = copyFor(lang);
  const isLocal = pathname.replace(/\/+$/, '') === offerPath(lang, 'local');
  const title = isLocal ? c.localTitle : c.premiumTitle;
  const cta = `${requestPath(lang)}?service=${isLocal ? 'local-building' : 'bespoke-furniture'}`;
  const chapters: [string, string][] = [['01', c.materials], ['02', c.process], ['03', c.travel]];

  return (
    <main className="mbs" data-testid={`page-service-${isLocal ? 'local' : 'premium'}`}>
      <header className="mbs-head">
        <div className="mbh-wrap mbs-head__grid">
          <div>
            <p className="mbh-kicker">{c.scope}</p>
            <h1 className="mbh-h1 mbs-title" data-testid="text-service-title">{title}</h1>
          </div>
          {!isLocal && <p className="mbs-lead">{c.premiumIntro}</p>}
        </div>
        <div className="mbs-slab" aria-hidden="true"><span /><span /><span /></div>
      </header>

      <section className="mbh-section">
        <div className="mbh-wrap">
          <ServiceScopeLinks lang={lang} />
        </div>
      </section>

      {isLocal && <section className="mbh-section"><div className="mbh-wrap article-body">
        <h2 className="mbh-h2">{c.localTitle}</h2>
        <p>{localAreaNotes[lang]}</p>
        <ul>{SERVED_PLACES.map(row =>
          <li key={row.slug}>{row.name}</li>
        )}</ul>
      </div></section>}

      {!isLocal && (
        <>
          <section className="mbh-section mbs-chapters-wrap">
            <div className="mbh-wrap">
              <ol className="mbs-chapters">
                {chapters.map(([n, text]) => (
                  <li key={n} className="mbs-chapter" data-testid={`text-chapter-${n}`}>
                    <span className="mbh-num">{n}</span>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="mbh-section">
            <div className="mbh-wrap">
              <div className="mbs-gallery" data-testid="status-gallery-empty">
                <div className="mbs-gallery__frames" aria-hidden="true">
                  <span /><span /><span />
                </div>
                <p>{c.gallery}</p>
              </div>
            </div>
          </section>

          <section className="mbh-section mbs-faq-wrap">
            <div className="mbh-wrap mbs-faq__grid">
              <h2 className="mbh-h2">{c.faqTitle}</h2>
              <dl className="mbs-faq">
                {c.faq.map(([q, a], i) => (
                  <div key={i} className="mbs-faq__item" data-testid={`faq-item-${i}`}>
                    <dt>{q}</dt>
                    <dd>{a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </>
      )}

      <section className="mbh-strip">
        <div className="mbh-wrap mbh-strip__inner">
          <p className="mbh-strip__title">{title}</p>
          <Link href={withCampaignParams(cta)} className="mbh-btn mbh-btn--primary mbs-cta" data-testid="link-service-request">
            {c.request} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ServiceOfferPage;
