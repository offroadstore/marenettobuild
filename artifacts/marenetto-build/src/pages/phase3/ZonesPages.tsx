import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { PHASE3_COPY, SERVED_PLACES, TOPIC_SERVICES, placeBrief, placeHeading, placePath, zonesPath, furniturePath, type ServedPlace } from '@/content/phase3';
import type { ServiceLink, Setting } from '@/content/phase3/types';
import { getEdition } from '@/localization/edition-inventory';
import { withCampaignParams } from '@/lib/campaign';
import { ContactBlock } from './ContactBlock';
import { travelCopy } from '@/content/phase3/travel-copy';
import { TravelCoverageBlock, TravelIndexBlock } from './TravelPages';

const SETTINGS: Setting[] = ['coast', 'hill', 'mountain'];

function serviceHref(locale: string, link: ServiceLink) {
  if (link === 'furniture') return furniturePath(locale);
  return getEdition(locale, link)?.path;
}

export function ZonesIndexPage({ locale }: { locale: string }) {
  const c = PHASE3_COPY[locale]!;
  return <main id="main" className="mbh p3" data-testid="page-zones">
    <header className="p3-hero">
      <div className="mbh-wrap">
        <p className="mbh-kicker mbh-kicker--light">{c.ui.zonesKicker}</p>
        <h1 className="mbh-h1 p3-hero__title">{c.ui.zonesTitle}</h1>
        <p className="p3-hero__lead">{travelCopy(locale).zonesIntro}</p>
        <ol className="p3-route" aria-hidden="true">{SETTINGS.map(s => <li key={s}>{c.settings[s].label}</li>)}</ol>
      </div>
    </header>
    <div className="mbh-wrap mbh-section">
      <div className="p3-zones">
        {SETTINGS.map(setting => <section key={setting} className="p3-zones__group" aria-labelledby={`zones-${setting}`}>
          <h2 id={`zones-${setting}`} className="mbh-h3 p3-zones__label">{c.settings[setting].label}</h2>
          <p className="p3-zones__text">{c.settings[setting].text}</p>
          <ul className="p3-zones__list">
            {SERVED_PLACES.filter(p => p.setting === setting).map(place => <li key={place.slug}>
              <Link href={withCampaignParams(placePath(locale, place.slug))} className="p3-zone-link" data-testid={`link-zone-${place.slug}`}>
                <span className="p3-zone-link__name">{place.name}</span>
                <span className="p3-zone-link__topic">{c.topics[place.topics[0]].h1}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>)}
          </ul>
        </section>)}
      </div>
      <p className="p3-note" data-testid="text-zones-note">{travelCopy(locale).zonesNote}</p>
    </div>
    <TravelIndexBlock locale={locale} />
    <ContactBlock id="zones" locale={locale} heading={c.ui.contactHeading} text={c.ui.contactText} subject="Marenetto Build" message={c.ui.whatsappMessage('Cefalù')} />
  </main>;
}

export function PlacePage({ locale, place }: { locale: string; place: ServedPlace }) {
  const c = PHASE3_COPY[locale]!;
  const [primary, ...secondary] = place.topics;
  const services = [...new Set(place.topics.flatMap(t => TOPIC_SERVICES[t]))];
  const neighbours = SERVED_PLACES.filter(p => p.setting === place.setting && p.slug !== place.slug).slice(0, 5);
  return <main id="main" className="mbh p3" data-testid={`page-place-${place.slug}`}>
    <header className="p3-hero p3-hero--place">
      <div className="mbh-wrap">
        <nav className="p3-crumb" aria-label="Breadcrumb"><Link href={withCampaignParams(zonesPath(locale))} data-testid="link-back-zones">{c.ui.backToZones}</Link><span aria-hidden="true">/</span><span>{c.settings[place.setting].label}</span></nav>
        <h1 className="mbh-h1 p3-hero__title">{placeHeading(locale, place)}</h1>
        <p className="p3-hero__lead">{c.ui.placeIntro(place.name)}</p>
        {place.schemaType === 'Place' && <p className="p3-hero__aside">{c.ui.localityNote}</p>}
      </div>
    </header>
    <section className="mbh-wrap mbh-section p3-brief" aria-label={place.name}>
      <p className="p3-brief__lead" data-testid="text-place-brief">{placeBrief(locale, place.slug)}</p>
      <p className="p3-brief__setting"><span>{c.settings[place.setting].label}</span>{c.settings[place.setting].text}</p>
    </section>
    <section className="mbh-wrap p3-focus" aria-labelledby="focus-h">
      <h2 id="focus-h" className="mbh-h2">{c.ui.focusHeading}</h2>
      <div className="p3-focus__grid">
        <article className="p3-focus__main">
          <h3 className="mbh-h3">{c.topics[primary].h1.charAt(0).toUpperCase() + c.topics[primary].h1.slice(1)}</h3>
          <p>{c.topics[primary].text}</p>
        </article>
        {secondary.map(t => <article key={t} className="p3-focus__side">
          <h3 className="mbh-h3">{c.topics[t].h1.charAt(0).toUpperCase() + c.topics[t].h1.slice(1)}</h3>
          <p>{c.topics[t].text}</p>
        </article>)}
      </div>
    </section>
    <section className="mbh-wrap mbh-section" aria-labelledby="check-h">
      <div className="p3-check">
        <div><h2 id="check-h" className="mbh-h2">{c.ui.checklistHeading}</h2><p className="mbh-intro">{c.ui.checklistIntro}</p></div>
        <ul className="p3-check__list">
          {place.topics.flatMap(t => c.topics[t].checks.slice(0, t === primary ? 3 : 2)).map(q => <li key={q}><Check size={16} aria-hidden="true" /><span>{q}</span></li>)}
        </ul>
      </div>
    </section>
    <section className="mbh-strip" aria-labelledby="svc-h">
      <div className="mbh-wrap p3-services">
        <h2 id="svc-h" className="mbh-strip__title">{c.ui.servicesHeading}</h2>
        <ul>{services.map(s => { const href = serviceHref(locale, s); return href ? <li key={s}><Link href={withCampaignParams(href)} className="mbh-link" data-testid={`link-service-${s}`}>{c.serviceLabels[s]}<ArrowRight size={15} aria-hidden="true" /></Link></li> : null; })}</ul>
      </div>
    </section>
    <TravelCoverageBlock locale={locale} />
    <ContactBlock id="place" locale={locale} heading={c.ui.contactHeading} text={c.ui.contactText} subject={`${place.name} — Marenetto Build`} message={c.ui.whatsappMessage(place.name)} />
    <nav className="mbh-wrap mbh-section p3-more" aria-labelledby="more-h">
      <h2 id="more-h" className="mbh-h3">{c.ui.otherZones}</h2>
      <ul>{neighbours.map(p => <li key={p.slug}><Link href={withCampaignParams(placePath(locale, p.slug))} data-testid={`link-neighbour-${p.slug}`}>{p.name}</Link></li>)}
        <li><Link href={withCampaignParams(zonesPath(locale))}>{c.ui.backToZones}</Link></li></ul>
    </nav>
  </main>;
}
