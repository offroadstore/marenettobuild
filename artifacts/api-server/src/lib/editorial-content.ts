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
  const body = cleanBody(content.body);
  if (!content.title.trim() || content.sources.some(source => !source.title.trim())) throw new EditorialError(400, 'Titolo dell’edizione e titoli delle fonti non possono essere vuoti.');
  if (!locales.includes(content.contentLanguage)) throw new EditorialError(400, 'Lingua effettiva non prevista.');
  if (!safeUrl(content.image, true) || content.sources.some(source => !source.url || !safeUrl(source.url))) throw new EditorialError(400, 'URL non sicuro: usare HTTPS o immagini pubbliche già disponibili.');
  if (content.image && !content.imageAlt.trim()) throw new EditorialError(400, 'Inserire il testo alternativo dell’immagine.');
  if (content.guide) {
    const images = [...body.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
    if ([content.image, ...images].some(src => src && !/^\/(?:media|brand|api\/historical-media)\//.test(src) && !/^\/api\/network-media\/[a-z]+-[0-2]-[a-f0-9]{16}-\d+\.webp$/.test(src))) {
      throw new EditorialError(400, 'Per le guide usare esclusivamente immagini locali autorizzate, mai miniature remote di YouTube.');
    }
  }
  const video = content.guide?.video;
  if (video && (!/^\/media\/[a-zA-Z0-9/_\-.]+$/.test(video.thumbnail) || video.thumbnail.includes('..') ||
    !video.title.trim() || !video.description.trim() || !video.author.trim() || !video.rights.trim() ||
    !video.transcript.trim() || !video.transcriptReviewed ||
    !locales.includes(video.spokenLanguage) || !locales.includes(video.transcriptLanguage) ||
    !Number.isFinite(Date.parse(`${video.uploadDate}T00:00:00Z`)) ||
    new Date(`${video.uploadDate}T00:00:00Z`).toISOString().slice(0,10) !== video.uploadDate ||
    video.uploadDate > new Date().toISOString().slice(0,10))) {
    throw new EditorialError(400, 'Video incompleto: copertina locale autorizzata, data reale, diritti e trascrizione revisionata sono obbligatori.');
  }
  return { ...content, body };
}
export function revision(content: EditorialContent, sourceHash: string, actor: string): EditorialRevision {
  return { id: randomUUID(), content, hash: fingerprint(content), sourceHash, actor, createdAt: new Date().toISOString() };
}
/** Public snapshots contain the approved article, not reviewers' private notes
 * or rights agreements. Preserve credits and the reviewed transcript. */
export function publicContent(content: EditorialContent): EditorialContent {
  if (!content.guide) return content;
  const { guide } = content;
  return {...content,guide:{...guide,technicalReview:'',editorialReview:'',languageReview:'',documentaryReview:'',
    ...(guide.video ? {video:{...guide.video,rights:'Rights documentation held privately by the publisher'}} : {})}};
}
export function reviewedRevision(previous: EditorialContent, next: EditorialContent): EditorialContent {
  if (previous.guide && !next.guide) throw new EditorialError(400, 'Conservare la scheda della serie nella nuova revisione.');
  if (!next.guide) return next;
  const stable = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>`${JSON.stringify(key)}:${stable(v)}`).join(',')}}`;
    return JSON.stringify(value) ?? 'undefined';
  };
  const narrative = (content: EditorialContent) => ({...content,...(content.guide ? {guide:{...content.guide,technicalReview:'',editorialReview:'',languageReview:'',documentaryReview:'',sourcesCurrent:false,searchConsoleVerified:false}} : {})});
  if (stable(narrative(previous)) === stable(narrative(next))) return next;
  // Review evidence belongs to the exact text/FAQ/sources/video, not its family.
  // Save content first, then register newly performed reviews in a later save.
  return {...next,guide:{...next.guide,technicalReview:'',editorialReview:'',languageReview:'',documentaryReview:'',sourcesCurrent:false}};
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
    const guide = rev.content.guide;
    const assisted = guide?.reviewBasis === 'ai-assisted-internal';
    const documented = assisted
      ? Boolean(guide.documentaryReview?.trim() && guide.technicalHeading?.trim() && guide.technicalNotice?.trim() && guide.reviewDisclosure?.trim())
      : Boolean(guide?.sourcesCurrent && guide.technicalReview.trim());
    if (guide && (!documented || !guide.editorialReview.trim() || !guide.languageReview.trim())) {
      throw new EditorialError(409, 'Serie di guide: registrare verifica delle fonti vigenti e revisioni tecnica, editoriale e linguistica realmente svolte prima di approvare.');
    }
    data.state = 'approved';
  } else if (action === 'activate') {
    const approval = [...data.events].reverse().find(e => e.action === 'approve' && e.revisionId === rev.id && e.hash === rev.hash && e.sourceHash === sourceHash);
    if (!approval || data.state !== 'approved' || rev.sourceHash !== sourceHash) throw new EditorialError(409, 'Occorre una nuova approvazione del titolare su questi testi esatti.');
    // The owner's dated internal-review policy authorizes content activation,
    // not a claim that Search Console ownership has been verified.
    if (rev.content.guide && rev.content.guide.reviewBasis !== 'ai-assisted-internal' && !rev.content.guide.searchConsoleVerified) throw new EditorialError(409, 'Verifica Search Console non attestata: il solo file Google non prova la proprietà verificata.');
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
