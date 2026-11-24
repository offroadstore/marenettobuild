import type { TravelCopy } from './travel-types';
import { travelA } from './travel-copy-a';
import { travelB } from './travel-copy-b';
import { travelC } from './travel-copy-c';

export type { TravelCopy } from './travel-types';

/** Native travel/coverage copy for the 12 active locales. */
export const TRAVEL_COPY: Record<string, TravelCopy> = { ...travelA, ...travelB, ...travelC };
export const travelCopy = (locale: string) => TRAVEL_COPY[locale] ?? TRAVEL_COPY.it!;
export const travelLocale = (locale: string) => (TRAVEL_COPY[locale] ? locale : 'it');
export const travelPath = (locale: string) => {
  const l = travelLocale(locale);
  return `${l === 'it' ? '' : `/${l}`}/${TRAVEL_COPY[l]!.slug}`;
};
