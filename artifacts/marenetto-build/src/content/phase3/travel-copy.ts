import type { TravelCopy } from './travel-types';
import { travelA } from './travel-copy-a';
import { travelB } from './travel-copy-b';
import { travelC } from './travel-copy-c';
import { ownerDecisions } from '../owner-decisions';

export type { TravelCopy } from './travel-types';

/** Native travel/coverage copy for the 12 active locales. */
export const TRAVEL_COPY: Record<string, TravelCopy> = { ...travelA, ...travelB, ...travelC };
for (const [locale, decision] of Object.entries(ownerDecisions)) {
  const copy = TRAVEL_COPY[locale];
  copy.intro = copy.zonesIntro = decision.scope;
  copy.metaDescription = `${copy.nav}. ${decision.scope}`;
  copy.zonesMetaDescription = `${copy.ordinary.zonesLink}. ${decision.scope}`;
  copy.zonesNote = decision.scope;
  copy.ordinary.heading = 'Cefalù · Madonie';
  copy.ordinary.text = decision.scope;
  copy.travel.heading = copy.travel.label;
  copy.scale[1] = 'Madonie';
  copy.faq = copy.faq.map(([question, answer]) => [question, /60/.test(answer) ? decision.scope : answer]);
  copy.blockText = copy.indexText = decision.scope;
}
export const travelCopy = (locale: string) => TRAVEL_COPY[locale] ?? TRAVEL_COPY.it!;
export const travelLocale = (locale: string) => (TRAVEL_COPY[locale] ? locale : 'it');
export const travelPath = (locale: string) => {
  const l = travelLocale(locale);
  return `${l === 'it' ? '' : `/${l}`}/${TRAVEL_COPY[l]!.slug}`;
};
