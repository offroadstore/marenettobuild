import { randomUUID } from 'node:crypto';
import { event, fingerprint, revision, validateContent, type EditorialData } from './editorial-content';
import type { Row } from './editorial-store';
import type { EditorialContent } from '@workspace/api-zod';

export type DraftProposal = {
  identity: string; locale: string; path: string; kind: 'article';
  mode: 'revise-existing' | 'create'; content: EditorialContent; sourceHash?: string;
  updateOwnDraft?: boolean;
};
const ALLOWED_LOCALES = ['it','en','de','nl','fr','es','pt','pl','ru','sv','no','da'];
export const DRAFT_ACTOR = 'Fase 5 — bozza IA, nessuna approvazione';
export type DraftChange = { operation: 'insert' | 'append' | 'unchanged'; row: Row };

/** Pure planning step. The caller must hold the same lock as the ordinary CMS.
 * This deliberately cannot approve, activate, restore a withdrawal or alter a
 * catalog route. No running/public app imports the private manuscript package.
 */
export function planDraftImport(proposal: DraftProposal, rows: Row[], locales: string[]): DraftChange {
  if (!ALLOWED_LOCALES.includes(proposal.locale) || !locales.includes(proposal.locale) || proposal.kind !== 'article') throw new Error('Lingua o tipo non autorizzato per la Fase 5.');
  if (!['revise-existing', 'create'].includes(proposal.mode)) throw new Error('Modalità della bozza non valida.');
  const content = validateContent(proposal.content, locales);
  if (content.contentLanguage !== proposal.locale) throw new Error('Lingua effettiva diversa dalla bozza.');
  const source = rows.find(row => row.identity === proposal.identity && row.locale === 'it')?.data.revisions.at(-1);
  if (proposal.locale !== 'it' && (!proposal.sourceHash || proposal.sourceHash !== source?.hash)) throw new Error('Sorgente italiana assente o cambiata: revisionare prima la traduzione.');
  const existing = rows.find(row => row.identity === proposal.identity && row.locale === proposal.locale);
  if (proposal.mode === 'revise-existing' && !existing) throw new Error('Famiglia storica mancante: non creare un duplicato.');
  const path = proposal.path.replace(/\/+$/, '');
  if (existing && (existing.path.replace(/\/+$/, '') !== path || existing.kind !== proposal.kind)) throw new Error('Percorso o tipo diverso dalla famiglia esistente.');
  if (rows.some(row => row.id !== existing?.id && (row.path.replace(/\/+$/, '') === path || row.data.aliases?.some(alias => alias.replace(/\/+$/, '') === path)))) throw new Error('Percorso già occupato da un’altra famiglia.');
  const hash = fingerprint(content);
  // A later human edit or an older imported draft must not be replaced merely
  // because the command is rerun. History, not just latest content, is checked.
  if (existing?.data.revisions.some(r => r.hash === hash && (proposal.locale === 'it' || r.sourceHash === proposal.sourceHash))) return { operation: 'unchanged', row: existing };
  if (existing && (proposal.mode === 'create' || proposal.updateOwnDraft)) {
    const latest = existing.data.revisions.at(-1)!;
    const ownUnapprovedDraft = proposal.updateOwnDraft && existing.data.state === 'draft'
      && latest.actor === DRAFT_ACTOR
      && !existing.data.events.some(e => e.revisionId === latest.id && ['approve','activate'].includes(e.action));
    if (!ownUnapprovedDraft) throw new Error('Famiglia già presente e contenuto diverso: confrontare nel CMS, senza sovrascrittura automatica.');
  }
  const rev = revision(content, '', DRAFT_ACTOR);
  rev.sourceHash = proposal.locale === 'it' ? rev.hash : proposal.sourceHash!;
  if (existing) {
    const row = structuredClone(existing);
    row.data.revisions.push(rev);
    row.data.state = 'draft';
    row.version++;
    event(row.data, 'save', rev, DRAFT_ACTOR);
    return { operation: 'append', row };
  }
  const data: EditorialData = {
    state: 'draft', historical: false, correction: false,
    activeRevisionId: null, revisions: [rev], events: [], originals: [],
  };
  event(data, 'create', rev, DRAFT_ACTOR);
  return { operation: 'insert', row: { id: randomUUID(), identity: proposal.identity, locale: proposal.locale, path, kind: 'article', version: 1, data } };
}
