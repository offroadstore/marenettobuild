import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { CreateEditorialBody, SaveEditorialBody, ActEditorialBody, ListEditorialResponse, GetEditorialResponse, GetActiveEditorialResponse } from '@workspace/api-zod';
import { requireInternalAccess, requirePermission } from '../middlewares/internalAccess';
import { EditorialError, revision, transition, validateContent, event } from '../lib/editorial-content';
import { ensureEditorial, editorialLocales, allRows, publicRows, detail, getRow, normalizedPath, reservedPath, isCatalogPath, sourceFor, summary, withEditorialLock, type Row } from '../lib/editorial-store';

const router: IRouter = Router();
const handler = (fn: (req: Request, res: Response) => Promise<void>) => async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  try { await ensureEditorial(); await fn(req, res); }
  catch (error) {
    if (error instanceof EditorialError) { res.status(error.status).json({ error: error.message }); return; }
    if ((error as {code?: string}).code === '23505') { res.status(409).json({ error: 'Questo percorso o questa edizione esiste già.' }); return; }
    req.log.error({ name: error instanceof Error ? error.name : 'Error' }, 'Editorial operation failed');
    res.status(503).json({ error: 'Archivio editoriale non disponibile. Verificare database e migrazione editoriale; nessun salvataggio simulato.' });
  }
};
router.get('/editorial/active', handler(async (_req, res) => {
  const rows = await publicRows();
  const active = rows.flatMap(row => {
    const rev = row.data.revisions.find(rev => rev.id === row.data.activeRevisionId);
    return rev ? [{ aliases: row.data.aliases ?? [], identity: row.identity, locale: row.locale, path: row.path, kind: row.kind, revisionId: rev.id, content: rev.content }] : row.data.withdrawn ? [{ aliases: row.data.aliases ?? [], identity: row.identity, locale: row.locale, path: row.path, kind: row.kind, revisionId: 'withdrawn', content: { title: 'Contenuto ritirato', summary: '', body: '', sources: [], category: '', tags: [], image: '', imageAlt: '', seoTitle: '', seoDescription: '', contentLanguage: row.locale } }] : [];
  });
  res.json(GetActiveEditorialResponse.parse(active));
}));
router.use('/internal/editorial', requireInternalAccess, requirePermission('cms:read'));
router.get('/internal/editorial', handler(async (_req, res) => {
  const rows = await allRows();
  res.json(ListEditorialResponse.parse(rows.map(row => summary(row, rows))));
}));
router.get('/internal/editorial/:editionId', handler(async (req, res) => {
  const rows = await allRows();
  res.json(GetEditorialResponse.parse(detail(getRow(rows, req.params.editionId), rows)));
}));
router.post('/internal/editorial', requirePermission('cms:write'), handler(async (req, res) => {
  const parsed = CreateEditorialBody.safeParse(req.body);
  if (!parsed.success) throw new EditorialError(400, 'Campi articolo non validi o troppo lunghi.');
  const input = parsed.data;
  const path = normalizedPath(input.path);
  if (!editorialLocales.includes(input.locale) || reservedPath(path) || (input.locale !== 'it' && !path.startsWith(`/${input.locale}/`)) || (input.locale === 'it' && editorialLocales.some(locale => locale !== 'it' && path.startsWith(`/${locale}/`)))) throw new EditorialError(400, 'Lingua o percorso non valido; usare il prefisso della lingua, senza percorsi riservati.');
  const content = validateContent(input.content, editorialLocales);
  const result = await withEditorialLock(async client => {
    const rows = await allRows(client);
    const source = rows.find(row => row.identity === input.identity && row.locale === 'it');
    if (input.locale !== 'it' && !source) throw new EditorialError(400, 'Creare prima l’edizione sorgente italiana.');
    // Existing historical families and static routes may only be edited through
    // their existing identity; a new article cannot take over a core route.
    if (isCatalogPath(path) || rows.some(row => row.path === path || row.data.aliases?.some(alias => normalizedPath(alias) === path) || (row.identity === input.identity && row.locale === input.locale))) throw new EditorialError(409, 'Percorso o edizione già presente. Aprire l’edizione esistente senza sostituirne l’identità.');
    if (source && source.kind !== input.kind) throw new EditorialError(400, 'Il tipo deve corrispondere alla sorgente.');
    const rev = revision(content, source?.data.revisions.at(-1)?.hash ?? '', req.internalMember!.email);
    if (input.locale === 'it') rev.sourceHash = rev.hash;
    const row: Row = { id: randomUUID(), identity: input.identity, locale: input.locale, path, kind: input.kind, version: 1, data: { state: 'draft', historical: false, correction: false, activeRevisionId: null, revisions: [rev], events: [], originals: [] } };
    event(row.data, 'create', rev, req.internalMember!.email);
    await client.query('INSERT INTO editorial_editions(id,identity,locale,path,kind,version,data) VALUES($1,$2,$3,$4,$5,$6,$7)', [row.id,row.identity,row.locale,row.path,row.kind,row.version,row.data]);
    return detail(row, [...rows,row]);
  });
  res.status(201).json(GetEditorialResponse.parse(result));
}));
router.put('/internal/editorial/:editionId', requirePermission('cms:write'), handler(async (req, res) => {
  const parsed = SaveEditorialBody.safeParse(req.body);
  if (!parsed.success) throw new EditorialError(400, 'Campi della revisione non validi o troppo lunghi.');
  const content = validateContent(parsed.data.content, editorialLocales);
  const result = await withEditorialLock(async client => {
    const rows = await allRows(client); const row = getRow(rows, req.params.editionId);
    if (row.version !== parsed.data.version) throw new EditorialError(409, 'Un’altra persona ha salvato questa edizione. Ricaricare e confrontare prima di salvare.');
    const rev = revision(content, sourceFor(row,rows)?.hash ?? '', req.internalMember!.email);
    if (row.locale === 'it') rev.sourceHash = rev.hash;
    row.data.revisions.push(rev); row.data.state = 'draft';
    event(row.data, 'save', rev, req.internalMember!.email);
    row.version++;
    await client.query('UPDATE editorial_editions SET data=$1,version=$2 WHERE id=$3', [row.data,row.version,row.id]);
    return detail(row,rows);
  });
  res.json(GetEditorialResponse.parse(result));
}));
router.post('/internal/editorial/:editionId/action', requirePermission('cms:write'), handler(async (req, res) => {
  const parsed = ActEditorialBody.safeParse(req.body);
  if (!parsed.success) throw new EditorialError(400, 'Azione non valida.');
  if (['approve','activate','withdraw'].includes(parsed.data.action) && req.internalMember!.role !== 'owner') throw new EditorialError(403, 'Solo il titolare può approvare, attivare o ritirare.');
  if (parsed.data.action === 'activate' && !(
    process.env.MARENETTO_PRIVACY_APPROVED === 'true' &&
    process.env.MARENETTO_PROVIDERS_APPROVED === 'true' &&
    process.env.MARENETTO_TESTING_APPROVED === 'true'
  )) throw new EditorialError(503, 'Attivazione bloccata: mancano i via libera privacy, fornitori o verifiche. La bozza e l’approvazione restano conservate.');
  const result = await withEditorialLock(async client => {
    const rows = await allRows(client); const row = getRow(rows, req.params.editionId);
    if (parsed.data.action === 'activate' && /^\/(?:[a-z]{2}\/)?translation-ok$/.test(row.path)) throw new EditorialError(409, 'Questo percorso storico è un test ritirato, non una pagina pubblicabile.');
    if (row.version !== parsed.data.version) throw new EditorialError(409, 'L’edizione è cambiata. Ricaricare prima di procedere.');
    const rev = row.data.revisions.find(rev => rev.id === parsed.data.revisionId);
    const sourceHash = row.locale === 'it' ? (parsed.data.action === 'restore' ? rev?.hash ?? '' : row.data.revisions.at(-1)!.hash) : sourceFor(row, rows)?.hash ?? '';
    transition(row.data, parsed.data.action, parsed.data.revisionId, sourceHash, row.locale, req.internalMember!.email, req.internalMember!.role === 'owner');
    row.version++;
    await client.query('UPDATE editorial_editions SET data=$1,version=$2 WHERE id=$3', [row.data,row.version,row.id]);
    return detail(row,rows);
  });
  res.json(GetEditorialResponse.parse(result));
}));
export default router;
