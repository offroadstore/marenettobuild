import type { Phase3Copy } from './types';
import { SERVED_PLACES, type ServedPlace } from './places';
import { briefsA } from './briefs-a';
import { briefsB } from './briefs-b';
import it from './locales/it';
import en from './locales/en';
import fr from './locales/fr';
import de from './locales/de';
import nl from './locales/nl';
import es from './locales/es';
import pt from './locales/pt';
import ru from './locales/ru';
import pl from './locales/pl';
import sv from './locales/sv';
import no from './locales/no';
import da from './locales/da';
import ar from './locales/ar';
import { briefsAr } from './briefs-ar';
import { TRAVEL_COPY, travelPath } from './travel-copy';

export { TRAVEL_COPY, travelPath, travelCopy } from './travel-copy';

export { SERVED_PLACES, TOPIC_SERVICES } from './places';
export type { ServedPlace } from './places';

export const PHASE3_COPY: Record<string, Phase3Copy> = { it, en, fr, de, nl, es, pt, ru, pl, sv, no, da, ar };
export const PHASE3_LOCALES = Object.keys(PHASE3_COPY);
const briefs: Record<string, Record<string, string>> = { ...briefsA, ...briefsB, ...briefsAr };
export const placeBrief = (locale: string, slug: string) => briefs[locale]![slug]!;

const prefix = (locale: string) => (locale === 'it' ? '' : `/${locale}`);
const ZONES: Record<string, string> = {
  it: 'zone-servite', en: 'areas-served', fr: 'zones-desservies', de: 'einsatzgebiete', nl: 'werkgebied', es: 'zonas-atendidas',
  pt: 'zonas-atendidas', ru: 'rayony-raboty', pl: 'obszar-dzialania', sv: 'omraden', no: 'omrader', da: 'omraader', ar: 'areas-served',
};
const FURNITURE: Record<string, string> = {
  it: 'arredi-su-misura-cemento-microcemento', en: 'custom-concrete-microcement-furniture', fr: 'mobilier-sur-mesure-beton-microciment',
  de: 'moebel-nach-mass-beton-mikrozement', nl: 'meubels-op-maat-beton-microcement', es: 'muebles-a-medida-hormigon-microcemento',
  pt: 'moveis-sob-medida-betao-microcimento', ru: 'mebel-na-zakaz-beton-mikrocement', pl: 'meble-na-wymiar-beton-mikrocement',
  sv: 'mobler-pa-matt-betong-mikrocement', no: 'mobler-pa-mal-betong-mikrosement', da: 'moebler-efter-maal-beton-mikrocement', ar: 'custom-concrete-microcement-furniture',
};
const AI: Record<string, string> = {
  it: 'uso-intelligenza-artificiale', en: 'use-of-artificial-intelligence', fr: 'utilisation-intelligence-artificielle',
  de: 'einsatz-kuenstlicher-intelligenz', nl: 'gebruik-kunstmatige-intelligentie', es: 'uso-inteligencia-artificial',
  pt: 'uso-inteligencia-artificial', ru: 'ispolzovanie-iskusstvennogo-intellekta', pl: 'wykorzystanie-sztucznej-inteligencji',
  sv: 'anvandning-av-artificiell-intelligens', no: 'bruk-av-kunstig-intelligens', da: 'brug-af-kunstig-intelligens', ar: 'use-of-artificial-intelligence',
};
export const zonesPath = (locale: string) => `${prefix(locale)}/${ZONES[locale]}`;
export const placePath = (locale: string, slug: string) => `${zonesPath(locale)}/${slug}`;
export const furniturePath = (locale: string) => `${prefix(locale)}/${FURNITURE[locale]}`;
export const aiUsePath = (locale: string) => `${prefix(locale)}/${AI[locale]}`;

export type Phase3Page =
  | { kind: 'zones'; id: 'zones'; locale: string; path: string; title: string; description: string }
  | { kind: 'place'; id: string; locale: string; path: string; title: string; description: string; place: ServedPlace }
  | { kind: 'furniture'; id: 'custom-furniture'; locale: string; path: string; title: string; description: string }
  | { kind: 'travel'; id: 'sicily-travel'; locale: string; path: string; title: string; description: string }
  | { kind: 'ai'; id: 'ai-use'; locale: string; path: string; title: string; description: string };

const suffix = ' | Marenetto Build';
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const placeHeading = (locale: string, place: ServedPlace) => `${place.name}: ${PHASE3_COPY[locale]!.topics[place.topics[0]].h1}`;

export const PHASE3_PAGES: Phase3Page[] = PHASE3_LOCALES.flatMap(locale => {
  const c = PHASE3_COPY[locale]!;
  return [
    { kind: 'zones' as const, id: 'zones' as const, locale, path: zonesPath(locale), title: c.ui.zonesMetaTitle + suffix, description: TRAVEL_COPY[locale]!.zonesMetaDescription },
    ...SERVED_PLACES.map(place => ({
      kind: 'place' as const, id: `place-${place.slug}`, locale, path: placePath(locale, place.slug), place,
      title: `${place.name}: ${cap(c.topics[place.topics[0]].h1)}${suffix}`,
      description: c.ui.placeDescription(place.name, c.topics[place.topics[0]].h1),
    })),
    { kind: 'furniture' as const, id: 'custom-furniture' as const, locale, path: furniturePath(locale), title: c.furniture.metaTitle + suffix, description: c.furniture.metaDescription },
    { kind: 'travel' as const, id: 'sicily-travel' as const, locale, path: travelPath(locale), title: TRAVEL_COPY[locale]!.metaTitle + suffix, description: TRAVEL_COPY[locale]!.metaDescription },
    { kind: 'ai' as const, id: 'ai-use' as const, locale, path: aiUsePath(locale), title: c.ai.metaTitle + suffix, description: c.ai.metaDescription },
  ];
});
const normalize = (path: string) => path.replace(/\/+$/, '') || '/';
const byPath = new Map(PHASE3_PAGES.map(page => [page.path, page]));
export const phase3PageByPath = (path: string) => byPath.get(normalize(path));
