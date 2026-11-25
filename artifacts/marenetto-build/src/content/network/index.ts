import it from './it';
import en from './en';
import de from './de';
import nl from './nl';
import fr from './fr';
import es from './es';
import pt from './pt';
import pl from './pl';
import ru from './ru';
import sv from './sv';
import no from './no';
import da from './da';
import reviewsJSON from './reviews.json';
import imagesJSON from './images.json';
import { NETWORK_IDS, type NetworkCopy, type NetworkId } from './types';
import { networkSourcesFor } from './sources';
import { regulatoryNotice } from './regulatory-notice';
export { NETWORK_IDS } from './types';
export type { NetworkCopy, NetworkId } from './types';

export const NETWORK_COPY: Record<string, NetworkCopy> = { it, en, de, nl, fr, es, pt, pl, ru, sv, no, da };
export const NETWORK_LOCALES = Object.keys(NETWORK_COPY);
export const networkCopy = (locale: string) => {
  const copy = NETWORK_COPY[locale];
  if (!copy) throw new Error(`Missing network locale: ${locale}`);
  return copy;
};
const roots: Record<string, string> = {
  it: 'rete-professionisti', en: 'professional-network', de: 'fachleute-netzwerk',
  nl: 'netwerk-vakmensen', fr: 'reseau-professionnels', es: 'red-profesionales',
  pt: 'rede-profissionais', pl: 'siec-specjalistow', ru: 'set-specialistov',
  sv: 'natverk-yrkespersoner', no: 'nettverk-fagfolk', da: 'netvaerk-fagfolk',
};
export const networkPath = (locale: string, id: NetworkId = 'network') => {
  const article = networkCopy(locale).articles[id];
  return `${locale === 'it' ? '' : `/${locale}`}/${roots[locale]}${id === 'network' ? '' : `/${article.slug}`}`;
};
export const networkPreviewPath = (locale: string, id: NetworkId = 'network') => `/__network-review/${locale}/${id}`;
export type NetworkPageRecord = { id: NetworkId; locale: string; path: string; title: string; description: string };
export const NETWORK_PAGES: NetworkPageRecord[] = NETWORK_LOCALES.flatMap(locale =>
  NETWORK_IDS.map(id => {
    const a = networkCopy(locale).articles[id];
    return { id, locale, path: networkPath(locale, id), title: a.seoTitle, description: a.description };
  }));
export const networkPageByPath = (path: string) => NETWORK_PAGES.find(page => page.path === path.replace(/\/+$/, ''));
export const networkPreviewPage = (path: string) => {
  const match = path.match(/^\/__network-review\/([a-z]{2})\/([a-z]+)\/?$/);
  return match ? NETWORK_PAGES.find(page => page.locale === match[1] && page.id === match[2]) : undefined;
};

export type NetworkImage = {
  id: NetworkId; n: number; src: string; srcSet: string; width: number; height: number;
  sha256: string; prompt: string; generatedAt: string;
  review: 'pending' | 'accepted'; reviewEvidence?: string;
};
export const networkImageInventory = imagesJSON as NetworkImage[];
export const networkImages = (id: NetworkId) => networkImageInventory.filter(image => image.id === id).sort((a, b) => a.n - b.n);

const related: Record<NetworkId, NetworkId[]> = {
  network: NETWORK_IDS.filter(id => id !== 'network'), design: ['network', 'buying', 'ground'],
  systems: ['comfort', 'design', 'outdoors'], comfort: ['systems', 'bespoke', 'glazing'],
  roofs: ['glazing', 'stone', 'design'], ground: ['design', 'outdoors', 'systems'],
  outdoors: ['ground', 'roofs', 'craft'], glazing: ['roofs', 'comfort', 'bespoke'],
  craft: ['bespoke', 'roofs', 'stone'], stone: ['design', 'roofs', 'bespoke'],
  bespoke: ['comfort', 'craft', 'glazing'], buying: ['design', 'network', 'stone'],
};
export const networkRelated = (id: NetworkId) => related[id];

type Evidence = { reviewer: string; at: string; evidence: string };
type NetworkReview = {
  // Exact serialized snapshot: an edit to any dependency revokes eligibility.
  reviewedContent: string; createdAt: string; modifiedAt: string; publishedAt?: string;
  checks: { seo: Evidence; linguistic: Evidence; technical: Evidence; ai: Evidence };
};
export const networkReviews = reviewsJSON as Record<string, NetworkReview>;
export function networkRevisionPayload(page: NetworkPageRecord) {
  const { articles, ...shared } = networkCopy(page.locale);
  return JSON.stringify({ page, shared, article: articles[page.id], notice: regulatoryNotice(page.locale), sources: networkSourcesFor(page.id), images: networkImages(page.id) });
}
function networkEditionVerified(page: NetworkPageRecord) {
  const record = networkReviews[`${page.locale}:${page.id}`];
  const images = networkImages(page.id);
  if (!record || record.reviewedContent !== networkRevisionPayload(page)) return false;
  if (images.length !== (page.id === 'network' ? 1 : 3) || images.some(image => image.review !== 'accepted' || !image.reviewEvidence)) return false;
  return [record.createdAt, record.modifiedAt].every(value => /^\d{4}-\d{2}-\d{2}/.test(value) && Number.isFinite(Date.parse(value))) &&
    ['seo', 'linguistic', 'technical', 'ai'].every(key => {
      const e = record.checks?.[key as keyof NetworkReview['checks']];
      return e && e.reviewer.trim() && e.evidence.trim() && Number.isFinite(Date.parse(e.at));
    });
}
export function networkPublic(page: NetworkPageRecord) {
  // A locale is released as a coherent cluster. Related links must not lead
  // from a verified article to an unreviewed draft, even in a partial release.
  const cluster = NETWORK_PAGES.filter(candidate => candidate.locale === page.locale);
  return cluster.length === NETWORK_IDS.length && cluster.every(networkEditionVerified);
}

/** Only eligible editions reach the normal public inventory; no bulk approval
 * of existing languages can promote these drafts accidentally. */
export const NETWORK_PUBLIC_PAGES = NETWORK_PAGES.filter(networkPublic);
