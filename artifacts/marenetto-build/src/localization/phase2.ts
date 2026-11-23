import inventory from './phase2/inventory.json';
import supplemental from './phase2/supplemental.json';

export type TranslationCandidate = Omit<typeof inventory.records[number], 'approval'> & {
  approval: null | { revisionSHA256: string; evidence: string; date: string };
};
export const translationCandidates = inventory.records as TranslationCandidate[];
export const supplementalCandidates = supplemental.records as TranslationCandidate[];
export const allTranslationCandidates = [...translationCandidates, ...supplementalCandidates];
const key = (path: string) => path.replace(/\/+$/, '') || '/';
export const translationCandidate = (path: string) => allTranslationCandidates.find(e => key(e.path) === key(path));
export const translationApproved = (e: TranslationCandidate) => Boolean(e.approval &&
  e.approval.revisionSHA256 === e.revisionSHA256 && e.approval.evidence.trim() && e.approval.date);
export const translationSourceChanged = (e: TranslationCandidate, active: { path: string; aliases?: string[] }[]) =>
  active.some(a => [a.path, ...(a.aliases ?? [])].some(path => key(path) === key(e.sourcePath)));

export const translationNotices: Record<string, { review: string; changed: string }> = {
  en: { review: 'Translation awaiting the owner’s approval.', changed: 'The Italian source has changed. This translation requires a new comparison.' },
  fr: { review: 'Traduction en attente de validation par le propriétaire.', changed: 'La source italienne a changé. Cette traduction doit être comparée à nouveau.' },
  de: { review: 'Übersetzung wartet auf die Freigabe des Inhabers.', changed: 'Die italienische Quelle wurde geändert. Diese Übersetzung muss erneut abgeglichen werden.' },
  nl: { review: 'Vertaling wacht op goedkeuring van de eigenaar.', changed: 'De Italiaanse bron is gewijzigd. Deze vertaling moet opnieuw worden vergeleken.' },
  es: { review: 'Traducción pendiente de aprobación por el titular.', changed: 'La fuente italiana ha cambiado. Esta traducción requiere una nueva comparación.' },
  pt: { review: 'Tradução a aguardar aprovação do titular.', changed: 'A fonte italiana foi alterada. Esta tradução requer uma nova comparação.' },
  ru: { review: 'Перевод ожидает одобрения владельца.', changed: 'Итальянский исходный текст изменён. Этот перевод требует повторного сопоставления.' },
  pl: { review: 'Tłumaczenie oczekuje na zatwierdzenie przez właściciela.', changed: 'Włoski tekst źródłowy został zmieniony. Tłumaczenie wymaga ponownego porównania.' },
  sv: { review: 'Översättningen väntar på ägarens godkännande.', changed: 'Den italienska källtexten har ändrats. Översättningen behöver jämföras på nytt.' },
  no: { review: 'Oversettelsen venter på eierens godkjenning.', changed: 'Den italienske kildeteksten er endret. Oversettelsen må sammenlignes på nytt.' },
  da: { review: 'Oversættelsen afventer ejerens godkendelse.', changed: 'Den italienske kildetekst er ændret. Oversættelsen skal sammenlignes på ny.' },
};
