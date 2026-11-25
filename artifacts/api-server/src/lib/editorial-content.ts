import { createHash, randomUUID } from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import type { EditorialContent, EditorialRevision, EditorialEvent, EditorialOriginal } from '@workspace/api-zod';

export type EditorialData = {
  state: 'draft' | 'review' | 'approved' | 'active';
  historical: boolean; correction: boolean; activeRevisionId: string | null;
  withdrawn?: boolean;
  aliases?: string[];
  revisions: EditorialRevision[]; events: EditorialEvent[]; originals: EditorialOriginal[];
};
export const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function safeUrl(value: string, image = false): boolean {
  if (!value) return true;
  if (/[\u0000-\u0020\\]/.test(value)) return false;
  if (value.startsWith('/')) return /^\/(?:media|brand|api\/historical-media|api\/network-media)\//.test(value) && !value.includes('..') && !value.includes('?');
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !/\/(?:internal|private|attachments)(?:\/|$)/i.test(url.pathname) && !/[?&](?:x-goog-|x-amz-|token=|signature=)/i.test(url.search) && (!image || !/\.(?:svg|html?)(?:$|\?)/i.test(url.pathname));
  } catch { return false; }
}
export function cleanBody(body: string): string {
  return sanitizeHtml(body, {
    allowedTags: ['p','br','h1','h2','h3','h4','strong','b','em','i','u','ul','ol','li','blockquote','a','img','figure','figcaption','div','span','section','article','time'],
    allowedAttributes: { a: ['href','title'], img: ['src','alt','loading','width','height'], '*': ['lang','dir','id'] },
    allowedSchemes: ['https','mailto','tel'], allowProtocolRelative: false,
    transformTags: { a: (_tag, attrs) => ({ tagName: 'a', attribs: safeUrl(attrs.href ?? '') || (/^\/(?!\/)[^\\\s]*$/.test(attrs.href ?? '') && !/^\/(?:api\/internal|internal|private|__)/.test(attrs.href ?? '')) || /^#[a-zA-Z0-9_-]+$/.test(attrs.href ?? '') || /^(?:mailto:[a-zA-Z0-9.!+_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|tel:\+?[0-9()-]{3,30})$/.test(attrs.href ?? '') ? attrs : {} }),
      img: (_tag, attrs) => ({ tagName: 'img', attribs: safeUrl(attrs.src ?? '', true) ? attrs : { alt: attrs.alt ?? '' } }) },
  });
}
export function validateContent(content: EditorialContent, locales: string[]): EditorialContent {
  if (!content.title.trim() || content.sources.some(source => !source.title.trim())) throw new EditorialError(400, 'Titolo dell’edizione e titoli delle fonti non possono essere vuoti.');
  if (!locales.includes(content.contentLanguage)) throw new EditorialError(400, 'Lingua effettiva non prevista.');
  if (!safeUrl(content.image, true) || content.sources.some(source => !source.url || !safeUrl(source.url))) throw new EditorialError(400, 'URL non sicuro: usare HTTPS o immagini pubbliche già disponibili.');
  if (content.image && !content.imageAlt.trim()) throw new EditorialError(400, 'Inserire il testo alternativo dell’immagine.');
  return { ...content, body: cleanBody(content.body) };
}
export function revision(content: EditorialContent, sourceHash: string, actor: string): EditorialRevision {
  return { id: randomUUID(), content, hash: fingerprint(content), sourceHash, actor, createdAt: new Date().toISOString() };
}
export class EditorialError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function event(data: EditorialData, action: string, rev: EditorialRevision, actor: string) {
  data.events.push({ action, revisionId: rev.id, actor, at: new Date().toISOString(), hash: rev.hash, sourceHash: rev.sourceHash });
}
export function transition(data: EditorialData, action: string, revisionId: string, sourceHash: string, locale: string, actor: string, owner: boolean) {
  const rev = data.revisions.find(rev => rev.id === revisionId);
  if (!rev) throw new EditorialError(404, 'Revisione non trovata.');
  const latest = data.revisions.at(-1)!;
  if (['approve','activate','withdraw'].includes(action) && !owner) throw new EditorialError(403, 'Solo il titolare può approvare, attivare o ritirare.');
  if (action === 'restore') {
    const restored = revision(rev.content, sourceHash, actor);
    data.revisions.push(restored); data.state = 'draft'; event(data, action, restored, actor); return;
  }
  if (rev.id !== latest.id && action !== 'withdraw') throw new EditorialError(409, 'Selezionare l’ultima revisione oppure ripristinare come nuova bozza.');
  if (action === 'submit') data.state = 'review';
  else if (action === 'approve') {
    if (data.state !== 'review') throw new EditorialError(409, 'Inviare prima la bozza in revisione.');
    if (!rev.content.body.replace(/<[^>]*>/g, '').trim()) throw new EditorialError(409, 'Il corpo è vuoto: completare il testo prima dell’approvazione.');
    if (locale !== 'it' && !sourceHash) throw new EditorialError(409, 'Manca l’edizione sorgente italiana da confrontare.');
    if (rev.sourceHash !== sourceHash) throw new EditorialError(409, 'La sorgente è cambiata: salvare una nuova bozza e revisionarla.');
    if (rev.content.contentLanguage !== locale) throw new EditorialError(409, 'La lingua effettiva non corrisponde all’edizione.');
    data.state = 'approved';
  } else if (action === 'activate') {
    const approval = [...data.events].reverse().find(e => e.action === 'approve' && e.revisionId === rev.id && e.hash === rev.hash && e.sourceHash === sourceHash);
    if (!approval || data.state !== 'approved' || rev.sourceHash !== sourceHash) throw new EditorialError(409, 'Occorre una nuova approvazione del titolare su questi testi esatti.');
    data.activeRevisionId = rev.id; data.state = 'active'; data.withdrawn = false;
  } else if (action === 'withdraw') {
    // Imported catalog content can still be served by the immutable fallback.
    // Withdrawing it must not require approving/activating a new composition.
    const active = data.revisions.find(saved => saved.id === data.activeRevisionId)
      ?? (!data.withdrawn && data.events.some(e => e.action === 'import') ? data.revisions[0] : undefined);
    if (!active) throw new EditorialError(409, 'Questa edizione non ha una revisione attiva da ritirare.');
    data.activeRevisionId = null; data.state = 'draft'; data.withdrawn = true;
    event(data, action, active, actor); return;
  } else throw new EditorialError(400, 'Azione non valida.');
  event(data, action, rev, actor);
}
