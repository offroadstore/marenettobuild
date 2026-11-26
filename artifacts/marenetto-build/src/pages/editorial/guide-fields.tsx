import type { EditorialGuide, EditorialVideo } from '@workspace/api-client-react';

/** Review evidence is never inferred from a title, a translation or a file. */
export function GuideFields({ guide, onChange }: { guide: EditorialGuide; onChange: (g: EditorialGuide) => void }) {
  const set = <K extends keyof EditorialGuide>(key: K, value: EditorialGuide[K]) => onChange({ ...guide, [key]: value });
  const video = guide.video;
  const setVideo = <K extends keyof EditorialVideo>(key: K, value: EditorialVideo[K]) => video && set('video', { ...video, [key]: value });
  return <section className="ed-field" data-testid="guide-fields">
    <h3>Costruire a Cefalù e nelle Madonie · {guide.episode}/10</h3>
    <p>Se modifichi testo, FAQ, fonti o video, salva prima la bozza: le revisioni pregresse vengono azzerate. Registra poi soltanto le nuove verifiche effettivamente svolte.</p>
    <p className="ed-hint">Registrare soltanto controlli realmente svolti. La decisione interna del 26/11/2026 ammette il controllo assistito da IA con limiti visibili, non un parere professionale. Ogni modifica richiede una nuova approvazione del titolare sulla revisione esatta.</p>
    <label className="ed-field"><span>Base della revisione</span>
      <select value={guide.reviewBasis ?? 'professional'} onChange={e => set('reviewBasis', e.target.value as 'professional' | 'ai-assisted-internal')}>
        <option value="professional">Revisione tecnica professionale documentata</option>
        <option value="ai-assisted-internal">Controllo assistito da IA e approvazione interna</option>
      </select>
    </label>
    {guide.reviewBasis === 'ai-assisted-internal' && <>
      <label className="ed-field"><span>Controllo documentale effettivo, data e limiti</span><textarea value={guide.documentaryReview ?? ''} maxLength={2000} onChange={e => set('documentaryReview', e.target.value)} /></label>
      {(['technicalHeading','technicalNotice','reviewDisclosure'] as const).map((key,i) => <label key={key} className="ed-field">
        <span>{['Titolo del riquadro tecnico visibile','Aspetti da verificare con il tecnico incaricato','Dichiarazione visibile della revisione assistita'][i]}</span>
        <textarea value={guide[key] ?? ''} maxLength={key === 'technicalHeading' ? 300 : key === 'technicalNotice' ? 4000 : 2000} onChange={e => set(key,e.target.value)} />
      </label>)}
    </>}
    {(['technicalReview', 'editorialReview', 'languageReview'] as const).map((key, i) => <label key={key} className="ed-field">
      <span>{['Parere tecnico professionale, solo se realmente acquisito', 'Controllo editoriale, indicare il metodo effettivo', 'Controllo linguistico, indicare il metodo effettivo'][i]}</span>
      <textarea value={guide[key]} maxLength={2000} onChange={e => set(key, e.target.value)} />
    </label>)}
    <label><input type="checkbox" checked={guide.sourcesCurrent} onChange={e => set('sourcesCurrent', e.target.checked)} /> Verificati testo vigente, successive modifiche e applicabilità delle fonti citate.</label>
    <label><input type="checkbox" checked={guide.searchConsoleVerified} onChange={e => set('searchConsoleVerified', e.target.checked)} /> Verifica della proprietà confermata nell’account Search Console, non dedotta dal file Google.</label>
    <h3>Domande e risposte visibili</h3>
    {guide.faq.map((faq, i) => <div key={i} className="ed-field">
      <input aria-label={`Domanda ${i + 1}`} value={faq.question} maxLength={500} onChange={e => set('faq', guide.faq.map((f, n) => n === i ? { ...f, question: e.target.value } : f))} />
      <textarea aria-label={`Risposta ${i + 1}`} value={faq.answer} maxLength={4000} onChange={e => set('faq', guide.faq.map((f, n) => n === i ? { ...f, answer: e.target.value } : f))} />
      <button type="button" className="int-small-button" onClick={() => set('faq', guide.faq.filter((_, n) => n !== i))}>Rimuovi domanda</button>
    </div>)}
    {guide.faq.length < 15 && <button type="button" className="int-small-button" onClick={() => set('faq', [...guide.faq, { question: '', answer: '' }])}>Aggiungi domanda</button>}
    <h3>Video reale e trascrizione</h3>
    {!video ? <><p>Video non ancora disponibile. Nessun player, consenso media o VideoObject viene creato per il segnaposto.</p>
      <button type="button" className="int-small-button" onClick={() => set('video', {
        youtubeId: '', title: '', description: '', thumbnail: '', uploadDate: '', spokenLanguage: '',
        author: '', rights: '', transcriptLanguage: '', transcript: '', transcriptReviewed: false,
      })}>Inserisci un video reale</button></> : <>
      <p className="ed-hint">Tutti i dati obbligatori devono essere reali. Copertina già autorizzata in /media/. Nessuna immagine o player YouTube è caricato in questa anteprima.</p>
      {([
        ['youtubeId', 'ID YouTube (11 caratteri)'], ['title', 'Titolo del filmato'],
        ['description', 'Descrizione del filmato'], ['thumbnail', 'Copertina locale autorizzata /media/…'],
        ['uploadDate', 'Data di caricamento YYYY-MM-DD'], ['duration', 'Durata ISO 8601, solo se nota'],
        ['spokenLanguage', 'Lingua parlata (codice)'], ['author', 'Autore effettivo'],
        ['rights', 'Provenienza e autorizzazione dei diritti'], ['transcriptLanguage', 'Lingua della trascrizione (codice)'],
      ] as const).map(([key, label]) => <label className="ed-field" key={key}><span>{label}</span><input
        value={video[key] ?? ''} onChange={e => {
          if (key === 'duration' && !e.target.value) { const { duration: _, ...rest } = video; set('video', rest); }
          else setVideo(key, e.target.value);
        }} /></label>)}
      <label className="ed-field"><span>Trascrizione reale (testo leggibile senza avviare il video)</span>
        <textarea rows={8} value={video.transcript} maxLength={100000} onChange={e => setVideo('transcript', e.target.value)} /></label>
      <label><input type="checkbox" checked={video.transcriptReviewed} onChange={e => setVideo('transcriptReviewed', e.target.checked)} /> Trascrizione effettivamente revisionata.</label>
      <button type="button" className="int-small-button" onClick={() => { const { video: _, ...rest } = guide; onChange(rest); }}>Rimuovi video e torna al segnaposto</button>
    </>}
  </section>;
}
