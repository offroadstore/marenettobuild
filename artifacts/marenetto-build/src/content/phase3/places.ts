import type { ServiceLink, Setting, Topic } from './types';

export type ServedPlace = {
  slug: string; name: string; setting: Setting; topics: [Topic, Topic, Topic];
  /** Castel di Tusa is a locality (frazione), not a municipality. */
  schemaType: 'City' | 'Place';
};

// Owner-authorised list. No distances or local regulations are asserted.
export const SERVED_PLACES: ServedPlace[] = [
  { slug: 'cefalu', name: 'Cefalù', setting: 'coast', topics: ['remote', 'surfaces', 'rental'], schemaType: 'City' },
  { slug: 'lascari', name: 'Lascari', setting: 'coast', topics: ['outdoor', 'damp', 'purchase'], schemaType: 'City' },
  { slug: 'campofelice-di-roccella', name: 'Campofelice di Roccella', setting: 'coast', topics: ['rental', 'outdoor', 'roof'], schemaType: 'City' },
  { slug: 'collesano', name: 'Collesano', setting: 'hill', topics: ['stone', 'roof', 'access'], schemaType: 'City' },
  { slug: 'gratteri', name: 'Gratteri', setting: 'hill', topics: ['access', 'stone', 'winter'], schemaType: 'City' },
  { slug: 'isnello', name: 'Isnello', setting: 'hill', topics: ['winter', 'stone', 'remote'], schemaType: 'City' },
  { slug: 'castelbuono', name: 'Castelbuono', setting: 'hill', topics: ['stone', 'rental', 'surfaces'], schemaType: 'City' },
  { slug: 'pollina', name: 'Pollina', setting: 'hill', topics: ['outdoor', 'access', 'remote'], schemaType: 'City' },
  { slug: 'san-mauro-castelverde', name: 'San Mauro Castelverde', setting: 'hill', topics: ['roof', 'access', 'purchase'], schemaType: 'City' },
  { slug: 'castel-di-tusa', name: 'Castel di Tusa', setting: 'coast', topics: ['surfaces', 'remote', 'damp'], schemaType: 'Place' },
  { slug: 'termini-imerese', name: 'Termini Imerese', setting: 'coast', topics: ['purchase', 'roof', 'access'], schemaType: 'City' },
  { slug: 'caccamo', name: 'Caccamo', setting: 'hill', topics: ['access', 'purchase', 'stone'], schemaType: 'City' },
  { slug: 'polizzi-generosa', name: 'Polizzi Generosa', setting: 'mountain', topics: ['winter', 'roof', 'purchase'], schemaType: 'City' },
  { slug: 'petralia-sottana', name: 'Petralia Sottana', setting: 'mountain', topics: ['remote', 'winter', 'stone'], schemaType: 'City' },
  { slug: 'petralia-soprana', name: 'Petralia Soprana', setting: 'mountain', topics: ['access', 'roof', 'winter'], schemaType: 'City' },
  { slug: 'gangi', name: 'Gangi', setting: 'mountain', topics: ['stone', 'purchase', 'access'], schemaType: 'City' },
  { slug: 'geraci-siculo', name: 'Geraci Siculo', setting: 'mountain', topics: ['winter', 'remote', 'roof'], schemaType: 'City' },
  { slug: 'cerda', name: 'Cerda', setting: 'hill', topics: ['purchase', 'outdoor', 'roof'], schemaType: 'City' },
  { slug: 'sciara', name: 'Sciara', setting: 'hill', topics: ['roof', 'damp', 'outdoor'], schemaType: 'City' },
  { slug: 'trabia', name: 'Trabia', setting: 'coast', topics: ['damp', 'outdoor', 'remote'], schemaType: 'City' },
];

export const TOPIC_SERVICES: Record<Topic, ServiceLink[]> = {
  access: ['services', 'process'], stone: ['services', 'process'], damp: ['services', 'request'],
  roof: ['services', 'request'], remote: ['abroad', 'process'], outdoor: ['services', 'furniture'],
  rental: ['services', 'abroad'], purchase: ['services', 'process'], surfaces: ['furniture', 'services'],
  winter: ['services', 'abroad'],
};
