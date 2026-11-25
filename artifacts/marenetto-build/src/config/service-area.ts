/**
 * Desk research, not surveyed distances or an unconditional coverage promise.
 * Source city-to-city road estimates are rounded miles, converted using 1 mi =
 * 1.609344 km. The actual job address and road conditions must still be checked.
 */
export const BUILDING_AREA = {
  origin: 'Cefalù',
  limitKm: 60,
  historicalThresholdOnly: true,
  advertisingReferenceOnly: true,
  metric: 'road',
  verifiedOn: '2026-11-23',
  sourceBase: 'https://www.rome2rio.com/s/Cefal%C3%B9/',
} as const;
type AreaRow = { name: string; sourceSlug: string; miles: number | null; kind: 'comune' | 'frazione' | 'stazione'; municipality?: string };
export const areaResearch: AreaRow[] = [
  { name: 'Cefalù', sourceSlug: '', miles: 0, kind: 'comune' },
  { name: 'Lascari', sourceSlug: 'Lascari', miles: 7, kind: 'comune' },
  { name: 'Campofelice di Roccella', sourceSlug: 'Campofelice-di-Roccella', miles: 9.2, kind: 'comune' },
  { name: 'Collesano', sourceSlug: 'Collesano', miles: 15, kind: 'comune' },
  { name: 'Gratteri', sourceSlug: 'Gratteri', miles: 10.4, kind: 'comune' },
  { name: 'Isnello', sourceSlug: 'Isnello', miles: 11.4, kind: 'comune' },
  { name: 'Castelbuono', sourceSlug: 'Castelbuono', miles: 14.4, kind: 'comune' },
  { name: 'Pollina', sourceSlug: 'Pollina', miles: 11.1, kind: 'comune' },
  { name: 'San Mauro Castelverde', sourceSlug: 'San-Mauro-Castelverde', miles: 23.1, kind: 'comune' },
  { name: 'Castel di Tusa', sourceSlug: 'Castel-di-Tusa', miles: 15.1, kind: 'frazione', municipality: 'Tusa' },
  { name: 'Termini Imerese', sourceSlug: 'Termini-Imerese', miles: 21.9, kind: 'comune' },
  { name: 'Caccamo', sourceSlug: 'Caccamo', miles: 25, kind: 'comune' },
  { name: 'Polizzi Generosa', sourceSlug: 'Polizzi-Generosa', miles: 31.2, kind: 'comune' },
  { name: 'Petralia Sottana', sourceSlug: 'Petralia-Sottana', miles: 36.4, kind: 'comune' },
  { name: 'Petralia Soprana', sourceSlug: 'Petralia-Soprana', miles: 35.3, kind: 'comune' },
  { name: 'Finale', sourceSlug: 'Finale-Sicily', miles: 9.1, kind: 'frazione', municipality: 'Pollina' },
  { name: 'Tusa', sourceSlug: 'Tusa', miles: 16.4, kind: 'comune' },
  { name: 'Trabia', sourceSlug: 'Trabia', miles: 24.1, kind: 'comune' },
  { name: 'Aliminusa', sourceSlug: 'Aliminusa', miles: 23.2, kind: 'comune' },
  { name: 'Scillato', sourceSlug: 'Scillato', miles: 25.5, kind: 'comune' },
  { name: 'Cerda', sourceSlug: 'Cerda', miles: 18.3, kind: 'comune' },
  { name: 'Caltavuturo', sourceSlug: 'Caltavuturo', miles: 29.2, kind: 'comune' },
  { name: 'Sclafani Bagni', sourceSlug: 'Sclafani-Bagni', miles: 30.9, kind: 'comune' },
  { name: 'Montemaggiore Belsito', sourceSlug: 'Montemaggiore-Belsito', miles: 24.9, kind: 'comune' },
  { name: 'Geraci Siculo', sourceSlug: 'Geraci-Siculo', miles: 27.8, kind: 'comune' },
  { name: 'Gangi', sourceSlug: 'Gangi', miles: 36, kind: 'comune' },
  { name: 'Reitano', sourceSlug: 'Reitano', miles: 23.1, kind: 'comune' },
  { name: 'Santo Stefano di Camastra', sourceSlug: 'Santo-Stefano-di-Camastra', miles: 22.1, kind: 'comune' },
  { name: 'San Nicola l’Arena', sourceSlug: 'San-Nicola-l-Arena', miles: 26.1, kind: 'frazione', municipality: 'Trabia' },
  { name: 'Lascari stazione', sourceSlug: 'Lascari-Stazione', miles: 6.3, kind: 'stazione', municipality: 'Lascari' },
  { name: 'Alimena', sourceSlug: 'Alimena', miles: 46.3, kind: 'comune' },
  { name: 'Bompietro', sourceSlug: 'Bompietro', miles: 43.1, kind: 'comune' },
  { name: 'Campofelice di Fitalia', sourceSlug: 'Campofelice-di-Fitalia', miles: 44.5, kind: 'comune' },
];
export const areaKm = (row: AreaRow) => row.miles === null ? null : Math.round(row.miles * 1.609344 * 10) / 10;
export const areaStatus = (row: AreaRow) => {
  return row.miles === null ? 'distance-unverified' : 'historical-distance-not-a-service-boundary';
};
// Do not encode the worldwide furniture offer on the contractor organization.
export const localBuildingArea = {
  '@type': 'Place',
  name: 'Construction and renovation mainly within about 60 km of Cefalù, Madonie and coast; projects beyond on request and individual quotation',
};
