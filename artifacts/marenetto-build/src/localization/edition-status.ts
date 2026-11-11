type StatusEdition = {
  state: 'draft' | 'translated' | 'reviewed' | 'published';
  locale: string;
  contentLanguage: string;
};
type HistoricalStatus = {
  state: string;
  editorialCorrection: unknown;
};

// Display provenance separately from approval. This helper never changes either.
export function editionStatusLabel(edition: StatusEdition, original?: HistoricalStatus): string {
  const language = edition.contentLanguage !== edition.locale
    ? ` · testo ${edition.contentLanguage.toUpperCase()}` : '';
  if (original?.editorialCorrection) {
    return (edition.locale === 'it' ? 'Modifiche da approvare' : 'Traduzione da approvare') + language;
  }
  if (original) {
    return (original.state === 'restored'
      ? 'Originale storico recuperato'
      : 'Originale recuperato · verifica da completare') + language;
  }
  if (edition.state === 'published') return '';
  if (edition.contentLanguage !== edition.locale) return `Testo originale ${edition.contentLanguage.toUpperCase()} · non tradotto`;
  if (edition.state === 'reviewed') return 'Verificata · non attivata';
  return edition.locale === 'it' ? 'Modifiche da approvare' : 'Traduzione da approvare';
}
