import { readFile } from 'node:fs/promises';
import { pool } from '@workspace/db';
import { CreateEditorialBody } from '@workspace/api-zod';
import { allRows, ensureEditorial, isCatalogPath, reservedPath, withEditorialLock } from '../src/lib/editorial-store';
import { planDraftImport, type DraftProposal } from '../src/lib/editorial-draft-import';
import { fingerprint, validateContent } from '../src/lib/editorial-content';

// Explicit development-only operation, never part of a build, web request or
// production startup. It reuses the existing CMS aggregate, sanitiser and lock.
if (process.env.NODE_ENV === 'production') throw new Error('Importazione disabilitata nel processo di produzione.');
const input = JSON.parse(await readFile(process.argv[2]!, 'utf8')) as { records: DraftProposal[] };
const apply = process.argv.includes('--apply');
try {
  if (apply) await ensureEditorial();
  const report = await withEditorialLock(async client => {
    const rows = await allRows(client);
    const changes = [];
    const locales = ['it','en','de','nl','fr','es','pt','pl','ru','sv','no','da'];
    for (const proposal of input.records) {
      const parsed = CreateEditorialBody.parse(proposal);
      if (reservedPath(parsed.path) || (proposal.mode === 'create' && isCatalogPath(parsed.path))) throw new Error('Percorso riservato: aprire l’identità esistente.');
      const sourceProposal = input.records.find(record => record.identity === proposal.identity && record.locale === 'it');
      if (proposal.locale !== 'it' && !sourceProposal) throw new Error('Includere il testo italiano nel pacchetto di traduzione.');
      const sourceHash = sourceProposal ? fingerprint(validateContent(sourceProposal.content, locales)) : undefined;
      const change = planDraftImport({ ...proposal, sourceHash, updateOwnDraft: process.argv.includes('--update-own-drafts') }, rows, locales);
      const row = change.row;
      if (apply && change.operation === 'insert') {
        await client.query('INSERT INTO editorial_editions(id,identity,locale,path,kind,version,data) VALUES($1,$2,$3,$4,$5,$6,$7)',
          [row.id,row.identity,row.locale,row.path,row.kind,row.version,row.data]);
      } else if (apply && change.operation === 'append') {
        await client.query('UPDATE editorial_editions SET data=$1,version=$2 WHERE id=$3', [row.data,row.version,row.id]);
      }
      if (change.operation === 'insert') rows.push(row);
      else if (change.operation === 'append') rows[rows.findIndex(r => r.id === row.id)] = row;
      changes.push({
        identity: row.identity, locale: row.locale, operation: change.operation, state: row.data.state,
        activeRevisionPreserved: row.data.activeRevisionId, revisionId: row.data.revisions.at(-1)!.id,
        hash: row.data.revisions.at(-1)!.hash, version: row.version,
        sourceHash: row.data.revisions.at(-1)!.sourceHash,
      });
    }
    return { mode: apply ? 'applied-to-development-cms' : 'dry-run-no-content-written', changes };
  });
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} finally { await pool.end(); }
