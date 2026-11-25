import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
process.env.NODE_ENV = 'production';
const vite = await createServer({ configFile: new URL('../vite.config.ts', import.meta.url).pathname, optimizeDeps: {noDiscovery:true,entries:[]}, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { BUILDING_AREA: area, areaResearch, areaKm, areaStatus } = await vite.ssrLoadModule('/src/config/service-area.ts');
  const rows = areaResearch.map(row => ({
    name: row.name, kind: row.kind, municipality: row.municipality ?? row.name,
    origin: 'Cefalù (origine generica del motore; non la sede aziendale)',
    criterion: 'Stima stradale città-città, non misurazione indipendente',
    sourceMiles: row.miles, approximateKm: areaKm(row), status: areaStatus(row),
    source: row.sourceSlug ? area.sourceBase + row.sourceSlug : 'Origine, distanza nominale zero',
    verifiedOn: area.verifiedOn,
  }));
  const dir = new URL('../../../generated-artifacts/services/', import.meta.url);
  await mkdir(dir, {recursive:true});
  await writeFile(new URL('area-matrix.json', dir), JSON.stringify({metric:'road',historicalThresholdKm:60,advertisingReferenceKm:60,coverageDecision:'2026-11-25, latest owner clarification: construction and renovation mainly within about 60 km of Cefalù, Madonie and coast; projects beyond on request. Advertising reference, not a strict service boundary or a measured radius.',conversion:'1 mile = 1.609344 km; rounded to 0.1 km, not extra accuracy',rows},null,2));
  const columns = Object.keys(rows[0]);
  await writeFile(new URL('area-matrix.csv', dir), [columns.join(','), ...rows.map(row => columns.map(col => `"${String(row[col] ?? '').replaceAll('"','""')}"`).join(','))].join('\n'));
  console.log(`Matrice storica di ${rows.length} località; nessuna esclusione commerciale dedotta dai km.`);
} finally { await vite.close(); }
