import { useEffect } from 'react';
import { Link } from 'wouter';
import { PHASE3_COPY, aiUsePath, furniturePath, zonesPath, type Phase3Page } from '@/content/phase3';
import { withCampaignParams } from '@/lib/campaign';
import { ZonesIndexPage, PlacePage } from './ZonesPages';
import { FurniturePage, AiUsePage } from './FurnitureAiPages';
import { TravelPage } from './TravelPages';
import { travelCopy, travelPath } from '@/content/phase3/travel-copy';
export { TravelCoverageBlock, TravelIndexBlock } from './TravelPages';
import '@/styles/phase3.css';

/** Native-locale page body. Rendered outside localizeNode: never re-translated. */
export function Phase3Content({ page }: { page: Phase3Page }) {
  useEffect(() => {
    // Preview/client navigation fallback; production metadata is applied by public-release-meta.
    if (document.documentElement.dataset.publicIndexing === 'true') return;
    document.title = page.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description);
  }, [page]);
  if (page.kind === 'zones') return <ZonesIndexPage locale={page.locale} />;
  if (page.kind === 'place') return <PlacePage locale={page.locale} place={page.place} />;
  if (page.kind === 'travel') return <TravelPage locale={page.locale} />;
  if (page.kind === 'furniture') return <FurniturePage locale={page.locale} />;
  return <AiUsePage locale={page.locale} />;
}

/** Footer links for all locales with native copy; Italian otherwise. */
export function Phase3FooterLinks({ lang }: { lang: string }) {
  const locale = PHASE3_COPY[lang] ? lang : 'it';
  const c = PHASE3_COPY[locale]!.ui;
  return <div className="footer-links footer-phase3" lang={locale}>
    <h3 className="footer-subheading">{c.footerHeading}</h3>
    <Link href={withCampaignParams(zonesPath(locale))} data-testid="link-footer-zones">{c.zonesNav}</Link>
    <Link href={withCampaignParams(travelPath(locale))} data-testid="link-footer-travel">{travelCopy(locale).nav}</Link>
    <Link href={withCampaignParams(furniturePath(locale))} data-testid="link-footer-furniture">{c.furnitureNav}</Link>
    <Link href={withCampaignParams(aiUsePath(locale))} data-testid="link-footer-ai">{c.aiNav}</Link>
  </div>;
}
