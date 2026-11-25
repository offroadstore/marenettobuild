import { Link } from 'wouter';
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { COMPANY_CONTACT, COMPANY_PHONE, emailHref, telHref, whatsappHref } from '@/config/contact';
import { getEdition } from '@/localization/edition-inventory';
import { withCampaignParams } from '@/lib/campaign';
import { PHASE3_COPY } from '@/content/phase3';

export function ContactBlock({ locale, heading, text, subject, message, id }: { locale: string; heading: string; text: string; subject: string; message: string; id: string }) {
  const c = PHASE3_COPY[locale]!.ui;
  const request = getEdition(locale, 'request')?.path;
  return <section className="p3-contact" aria-labelledby={`${id}-contact`} data-testid="section-contact">
    <div className="mbh-wrap p3-contact__grid">
      <div>
        <h2 id={`${id}-contact`} className="mbh-h2 p3-contact__title">{heading}</h2>
        <p className="p3-contact__text">{text}</p>
        {request && <Link href={withCampaignParams(request)} className="mbh-btn mbh-btn--board" data-testid="link-p3-request">{c.request}<ArrowRight size={15} aria-hidden="true" /></Link>}
      </div>
      <ul className="p3-contact__list">
        <li><Phone size={17} aria-hidden="true" /><span><small>{c.call}</small><a href={telHref} dir="ltr" data-testid="link-p3-phone">{COMPANY_PHONE.display}</a></span></li>
        <li><Mail size={17} aria-hidden="true" /><span><small>{c.write}</small><a href={emailHref(subject)} dir="ltr" data-testid="link-p3-email">{COMPANY_CONTACT.email}</a></span></li>
        <li><MessageCircle size={17} aria-hidden="true" /><span><small>{c.whatsapp}</small><a href={whatsappHref(message)} target="_blank" rel="noopener noreferrer" dir="ltr" data-testid="link-p3-whatsapp">{COMPANY_PHONE.display}</a></span></li>
        <li><MapPin size={17} aria-hidden="true" /><span><small>{c.addressLabel}</small><span lang="it" dir="ltr">{COMPANY_CONTACT.streetAddress}<br />{COMPANY_CONTACT.localityLine}</span></span></li>
      </ul>
    </div>
  </section>;
}
