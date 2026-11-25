import { ArrowRight, ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'wouter';
import { propertyCopy, propertyPath, propertyRequestPath, publicPagePath, PARTNER_URL } from '@/content/property-management';
import { COMPANY_CONTACT, emailHref, whatsappHref } from '@/config/contact';
import { withCampaignParams } from '@/lib/campaign';
import '@/styles/property-management.css';

function copyFor(locale: string) {
  const c = propertyCopy[locale];
  if (!c) throw new Error(`Missing property-management copy: ${locale}`);
  return c;
}

export function PropertyManagementLink({ locale }: { locale: string }) {
  if (!propertyCopy[locale]) return null;
  const c = copyFor(locale);
  return (
    <Link href={withCampaignParams(propertyPath(locale))} className="mpm-entry" data-testid="link-property-management">
      <span className="mpm-entry__tag">{c.kicker}</span>
      <span className="mpm-entry__text">{c.entry}</span>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
}

export function PropertyManagementPage({ locale }: { locale: string }) {
  const c = copyFor(locale);
  const request = withCampaignParams(propertyRequestPath(locale));
  const pad = (n: number) => String(n + 1).padStart(2, '0');

  return (
    <main className="mbs mpm" data-testid="page-property-management">
      <header className="mbs-head">
        <div className="mbh-wrap mbs-head__grid">
          <div>
            <p className="mbh-kicker">{c.kicker}</p>
            <h1 className="mbh-h1 mbs-title mpm-title" data-testid="text-property-title">{c.h1}</h1>
          </div>
          <p className="mbs-lead">{c.intro}</p>
        </div>
        <div className="mbs-slab" aria-hidden="true"><span /><span /><span /></div>
      </header>

      <section className="mbh-section">
        <div className="mbh-wrap">
          <div className="mpm-split" data-testid="section-role-split">
            {[c.splitBuild, c.splitPartner].map(([name, text], i) => (
              <div key={name} className={`mpm-split__col${i ? ' mpm-split__col--partner' : ''}`}>
                <span className="mpm-split__mark" aria-hidden="true">{i ? 'B' : 'A'}</span>
                <p className="mpm-split__name">{name}</p>
                <p className="mpm-split__text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mbh-section">
        <div className="mbh-wrap">
          <ol className="mpm-sections">
            {c.sections.map((s, i) => (
              <li key={s.heading} className="mpm-sec" data-testid={`section-property-${i}`}>
                <span className="mbh-num mpm-sec__n">{pad(i)}</span>
                <div>
                  <h2 className="mpm-sec__h">{s.heading}</h2>
                  {s.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mbh-section">
        <div className="mbh-wrap">
          <a href={PARTNER_URL} target="_blank" rel="noopener" className="mpm-partner" data-testid="link-partner-site">
            <span className="mpm-partner__note">{c.partnerNote}</span>
            <span className="mpm-partner__name">Cefalù Apartments</span>
            <span className="mpm-partner__cta">{c.partnerLink} <ArrowUpRight size={18} aria-hidden="true" /></span>
          </a>
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

      <section className="mbh-section">
        <div className="mbh-wrap">
          <nav className="mpm-related" aria-label={c.related}>
            <p className="mbs-scope__label">{c.related}</p>
            <Link href={withCampaignParams(publicPagePath(locale, 'services'))} className="mpm-related__link" data-testid="link-related-services">{c.servicesLink} <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href={withCampaignParams(publicPagePath(locale, 'abroad'))} className="mpm-related__link" data-testid="link-related-abroad">{c.abroadLink} <ArrowRight size={16} aria-hidden="true" /></Link>
          </nav>
        </div>
      </section>

      <section className="mbh-strip">
        <div className="mbh-wrap mbh-strip__inner mpm-cta">
          <div>
            <p className="mbh-strip__title">{c.nav}</p>
            <p className="mpm-cta__mail">{c.emailLabel} <a href={emailHref(c.nav)} data-testid="link-property-email">{COMPANY_CONTACT.email}</a></p>
          </div>
          <div className="mpm-cta__actions">
            <Link href={request} className="mbh-btn mbh-btn--primary" data-testid="link-property-request">
              {c.request} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href={whatsappHref(c.whatsappMessage)} target="_blank" rel="noopener" className="mbh-btn mpm-btn-ghost" data-testid="link-property-whatsapp">
              <MessageCircle size={18} aria-hidden="true" /> {c.whatsapp}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PropertyManagementPage;
