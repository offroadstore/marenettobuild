import { pool } from '@workspace/db';
import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import catalogJSON from 'marenetto-editorial-catalog';
import { cleanBody, event, fingerprint, revision, transition, validateContent, type EditorialData, EditorialError } from './editorial-content';
import type { EditorialContent } from '@workspace/api-zod';
import { verifySeries, releaseSeries, hasExactEvent, sameEditorialContent } from './series-release';

type SeedRecord = { identity: string; locale: string; path: string; kind: string; historical: boolean; correction: boolean; content: EditorialContent; aliases?: string[]; originalBody?: string; originalMetadata?: Record<string, unknown>; rework?: EditorialContent; releaseReady?: boolean };
const catalog = catalogJSON as unknown as { locales: string[]; records: SeedRecord[]; reservedPaths?: string[]; seriesDrafts?: SeedRecord[]; seriesRelease?: {id:string; decisionDate:string; contentDigest:string} };

export function assertSeriesRelease() {
  const seeds = catalog.seriesDrafts ?? [];
  return verifySeries(seeds, catalog.seriesRelease);
}
export const editorialLocales = catalog.locales;
export const isCatalogPath = (path: string) => (catalog.reservedPaths ?? []).some(reserved => normalizedPath(reserved) === normalizedPath(path));
export function assertNetworkActivation(row: Row, content: EditorialContent) {
  if (!row.identity.startsWith('network-')) return;
  const seed = catalog.records.find(record => record.identity === row.identity && record.locale === row.locale && normalizedPath(record.path) === normalizedPath(row.path));
  if (!seed?.releaseReady || fingerprint({ ...seed.content, body: cleanBody(seed.content.body) }) !== fingerprint(content)) {
    throw new EditorialError(409, 'Rete di professionisti: questa revisione richiede ancora le verifiche linguistiche, tecniche, SEO e immagini. L’approvazione resta conservata; nessuna attivazione automatica.');
  }
}
export type Row = { id: string; identity: string; locale: string; path: string; kind: 'article' | 'page'; version: number; data: EditorialData };
export const normalizedPath = (path: string) => path.replace(/\/+$/, '') || '/';
// Storage keys are normalized; public canonical URLs keep the approved spelling.
// A later deliberate URL edit must still win over the original seed.
export function publicEditionPath(row: Pick<Row, 'identity' | 'locale' | 'path'>) {
  const seed = catalog.seriesDrafts?.find(record => record.identity === row.identity && record.locale === row.locale && normalizedPath(record.path) === normalizedPath(row.path));
  return seed?.path ?? row.path;
}
let imported: Promise<void> | undefined;
export function ensureEditorial() {
  if (!imported) imported = importCatalog().catch(error => { imported = undefined; throw error; });
  return imported;
}
export async function importCatalog() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Both import and all mutations take the same transaction lock: source
    // fingerprints and translated approvals cannot race across different rows.
    await client.query("SELECT pg_advisory_xact_lock(5511055)");
    for (const seed of catalog.records) {
      const initial = revision({ ...seed.content, body: cleanBody(seed.content.body) }, '', 'Importazione catalogo; nessuna approvazione');
      const originals = [];
      if (seed.historical) {
        const snapshot = seed.originalMetadata?.immutableSnapshot as Record<string, unknown> | undefined;
        originals.push({ label: 'Originale storico immutabile', url: String(snapshot?.source ?? seed.originalMetadata?.source ?? ''), hash: String(snapshot?.sourceSHA256 ?? seed.originalMetadata?.sourceSHA256 ?? fingerprint(seed.originalBody)), body: seed.originalBody ?? '', metadata: JSON.stringify(seed.originalMetadata) });
        const update = seed.originalMetadata?.datedSourceUpdate as Record<string, unknown> | undefined;
        if (update) originals.push({ label: 'Acquisizione successiva della fonte, separata dall’originale', url: String(snapshot?.source ?? ''), hash: String(update.sourceSHA256), body: String(update.sourceBody ?? ''), metadata: JSON.stringify(update) });
      }
      if (seed.correction) originals.push({ label: 'Correzioni autorizzate separate (non approvazione linguistica)', url: seed.path, hash: fingerprint(seed.content), body: seed.content.body, metadata: JSON.stringify(seed.originalMetadata?.editorialCorrection ?? {}) });
      if (seed.rework) originals.push({ label: 'Rielaborazione di progetto, non copia storica', url: seed.path, hash: fingerprint(seed.rework), body: seed.rework.body, metadata: 'Composizione preesistente di progetto; non autorizza una nuova edizione.' });
      const data: EditorialData = { state: 'draft', historical: seed.historical, correction: seed.correction, activeRevisionId: null, aliases: seed.aliases ?? [], revisions: [initial], events: [], originals };
      event(data, 'import', initial, initial.actor);
      const id = createHash('sha256').update(`${seed.identity}:${seed.locale}`).digest('hex').slice(0,32);
      await client.query('INSERT INTO editorial_editions(id,identity,locale,path,kind,data) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [id, seed.identity, seed.locale, normalizedPath(seed.path), seed.kind, data]);
      // Additional acquired evidence can only be appended, never replace an
      // existing original, draft, approval or active revision.
      const existing = (await client.query<Row>('SELECT * FROM editorial_editions WHERE id=$1', [id])).rows[0];
      if (existing) {
        const additions = originals.filter(original => !existing.data.originals.some(saved => saved.label === original.label && saved.hash === original.hash && saved.body === original.body));
        const aliases = [...new Set([...(existing.data.aliases ?? []), ...(seed.aliases ?? [])])];
        if (additions.length || aliases.length !== (existing.data.aliases ?? []).length) {
          existing.data.originals.push(...additions);
          existing.data.aliases = aliases;
          await client.query('UPDATE editorial_editions SET data=$1,version=version+1 WHERE id=$2',[existing.data,id]);
        }
      }
    }
    // Initialize source references only on never-edited import revisions.
    await client.query(`UPDATE editorial_editions e SET data=jsonb_set(e.data,'{revisions,0,sourceHash}',to_jsonb(
      COALESCE((SELECT s.data->'revisions'->0->>'hash' FROM editorial_editions s WHERE s.identity=e.identity AND s.locale='it'),'')
    )) WHERE version=1 AND data->'events'->0->>'action'='import'`);
    // Separate private draft channel. Never mark a series draft as a catalog
    // import: that event has special historical-publication semantics.
    // Italian is imported first so translations bind to its actual revision.
    const rows = await allRows(client);
    for (const seed of catalog.seriesDrafts ?? []) {
      const existing = rows.find(row => row.identity === seed.identity && row.locale === seed.locale);
      // Activation is the only writer of series revisions. Keep newer candidates,
      // active revisions and withdrawal markers untouched until full preflight.
      if (existing) continue;
      // Never take over an unrelated route or silently relocate an existing family.
      if (!existing && rows.some(row => normalizedPath(row.path) === normalizedPath(seed.path))) throw new Error('Series draft path collision');
      const source = rows.find(row => row.identity === seed.identity && row.locale === 'it')?.data.revisions.at(-1);
      const draft = revision(validateContent(seed.content, catalog.locales), seed.locale === 'it' ? '' : source?.hash ?? '', 'Preparazione serie; revisioni umane non registrate');
      if (seed.locale === 'it') draft.sourceHash = draft.hash;
      {
        const data: EditorialData = { state: 'draft', historical: false, correction: false, activeRevisionId: null, revisions: [draft], events: [], originals: [] };
        event(data, 'series-draft', draft, draft.actor);
        const id = createHash('sha256').update(`${seed.identity}:${seed.locale}`).digest('hex').slice(0,32);
        await client.query('INSERT INTO editorial_editions(id,identity,locale,path,kind,data) VALUES($1,$2,$3,$4,$5,$6)', [id,seed.identity,seed.locale,normalizedPath(seed.path),'article',data]);
        rows.push({id,identity:seed.identity,locale:seed.locale,path:normalizedPath(seed.path),kind:'article',data,version:1});
      }
    }
    // Dated, owner-authorized release. This is not an evergreen permission to
    // activate future edits: the complete 120-edition payload is hash-bound.
    const release = assertSeriesRelease();
    // A conflict blocks this release, not reads of the preceding valid public
    // revision. Readiness independently checks all exact expected active hashes.
    let operations: ReturnType<typeof releaseSeries> = [];
    try { operations = releaseSeries(rows, catalog.seriesDrafts ?? [], release, catalog.records); }
    catch (error) {
      if (!(error instanceof Error) || !/^Serie: (?:identità\/percorso in conflitto|collisione percorso\/alias|revisione\/sorgente successiva)/.test(error.message)) throw error;
    }
    for (const operation of operations.filter(o => o.operation === 'activate')) {
      const row = rows.find(r => r.identity === operation.identity && r.locale === operation.locale)!;
      await client.query('UPDATE editorial_editions SET data=$1,version=version+1 WHERE id=$2', [row.data,row.id]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function allRows(client: Pick<PoolClient,'query'> = pool): Promise<Row[]> {
  return (await client.query<Row>('SELECT * FROM editorial_editions ORDER BY identity,locale')).rows;
}
export async function publicRows(): Promise<Row[]> {
  // Do not transfer the private catalog/history for inactive editions on every
  // public request. No positive cache can hide an activation or a withdrawal.
  const rows = (await pool.query<Row>(`SELECT * FROM editorial_editions
    WHERE data->>'activeRevisionId' IS NOT NULL OR data->>'withdrawn'='true'
    ORDER BY identity,locale`)).rows;
  return rows.filter(row => {
    if (!row.data.withdrawn && row.data.activeRevisionId) {
      const active = row.data.revisions.find(r => r.id === row.data.activeRevisionId);
      if (!active || !hasExactEvent(row.data,'approve',active) || !hasExactEvent(row.data,'activate',active))
        throw new EditorialError(503,'Stato della revisione attiva non verificabile; nessuna copia statica sostitutiva.');
      const seed = catalog.seriesDrafts?.find(s => s.identity === row.identity && s.locale === row.locale);
      const expected = seed && validateContent(seed.content, catalog.locales);
      if (expected && active.hash === fingerprint(expected) && !sameEditorialContent(active.content, expected))
        throw new EditorialError(503,'Contenuto della serie non coincidente con la revisione registrata.');
      // Keep stale active translations in the verified snapshot. Omitting them
      // would restore a historical fallback at exactly the same URL. The shared
      // SEO policy compares ACTIVE source hashes and excludes stale editions.
    }
    if (!row.identity.startsWith('network-') || row.data.withdrawn || !row.data.activeRevisionId) return true;
    const active = row.data.revisions.find(rev => rev.id === row.data.activeRevisionId);
    if (!active) return false;
    try { assertNetworkActivation(row, active.content); return true; }
    catch (error) {
      if (error instanceof EditorialError && error.status === 409) return false;
      throw error;
    }
  });
}
export async function seriesReady() {
  assertSeriesRelease();
  const rows = await publicRows();
  return (catalog.seriesDrafts ?? []).every(seed => {
    const row = rows.find(r => r.identity === seed.identity && r.locale === seed.locale);
    const active = row?.data.revisions.find(rev => rev.id === row.data.activeRevisionId);
    const italian = catalog.seriesDrafts!.find(s => s.identity === seed.identity && s.locale === 'it')!;
    const expected = validateContent(seed.content, catalog.locales);
    return row && !row.data.withdrawn && publicEditionPath(row) === seed.path &&
      active?.hash === fingerprint(expected) && sameEditorialContent(active.content, expected) &&
      active?.sourceHash === fingerprint(validateContent(italian.content, catalog.locales));
  });
}
export function sourceFor(row: Row, rows: Row[]) {
  return rows.find(source => source.identity === row.identity && source.locale === 'it')?.data.revisions.at(-1) ?? null;
}
export function summary(row: Row, rows: Row[]) {
  const rev = row.data.revisions.at(-1)!;
  const source = sourceFor(row, rows);
  return { id: row.id, identity: row.identity, locale: row.locale, path: row.path, kind: row.kind, version: row.version, title: rev.content.title || `Senza titolo · ${row.path}`, contentLanguage: rev.content.contentLanguage, historical: row.data.historical, correction: row.data.correction, activeRevisionId: row.data.activeRevisionId, state: row.data.state, stale: row.locale !== 'it' && Boolean(source && source.hash !== rev.sourceHash) };
}
export function detail(row: Row, rows: Row[]) {
  const source = sourceFor(row, rows);
  return { ...summary(row, rows), revisions: row.data.revisions, events: row.data.events, originals: row.data.originals, source: source ? { hash: source.hash, content: source.content } : null };
}
export async function withEditorialLock<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(5511055)");
    const result = await work(client); await client.query('COMMIT'); return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export function getRow(rows: Row[], id: unknown) {
  const row = rows.find(row => row.id === id);
  if (!row) throw new EditorialError(404, 'Edizione non trovata.');
  return row;
}
export const reservedPath = (path: string) => path.startsWith('/__') || /^\/(?:api|internal|owner-demo|sign-in|sign-up|content|assets|media|brand|documents|robots\.txt|sitemap\.xml)(?:\/|$)/.test(path) || !/^\/(?:[a-zA-Z0-9_\-\p{L}]|\/)*$/u.test(path) || path.includes('//');
