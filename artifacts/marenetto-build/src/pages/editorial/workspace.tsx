import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetEditorialQueryKey, getListEditorialQueryKey, useActEditorial, useGetEditorial, useSaveEditorial,
  type EditorialActionAction, type EditorialContent, type EditorialDetail, type EditorialRevision,
} from '@workspace/api-client-react';
import { AlertTriangle, ArrowLeft, Archive, BadgeCheck, Eye, History, Plus, RotateCcw, Save, Send, ShieldCheck, Trash2, Undo2, X, Zap } from 'lucide-react';
import { RichEditor } from './rich-editor';
import { GuideFields } from './guide-fields';
import {
  ACTION_LABELS, KIND_LABELS, ProvenanceTags, QUERY_FRESH, SafeFrame, Skeleton, StateBadge, apiErrorText, contentDocument,
  emptyContent, fmtDate, imageError, localeDir, localeName, rawDocument, setEditorialDirty, shortHash, urlError, type EditorialRole,
} from './shared';

type Loaded = { id: string; version: number; content: EditorialContent };
type Pending = { action: EditorialActionAction; revision: EditorialRevision };

const clone = (c: EditorialContent): EditorialContent => JSON.parse(JSON.stringify(c));
const ACTION_COPY: Record<EditorialActionAction, { title: string; verb: string; text: string }> = {
  submit: { title: 'Inviare in revisione', verb: 'Invia in revisione', text: 'La revisione selezionata passa al titolare per la verifica. Il contenuto non cambia.' },
  approve: { title: 'Approvare questa revisione', verb: 'Approva revisione', text: 'Stai registrando un’approvazione esplicita per questa lingua e questa revisione. La provenienza storica non vale come approvazione.' },
  activate: { title: 'Attivare sul sito pubblico', verb: 'Attiva', text: 'La revisione approvata diventa la versione pubblica per questa lingua. Il server può rifiutare l’attivazione per vincoli operativi.' },
  withdraw: { title: 'Ritirare dalla pubblicazione', verb: 'Ritira', text: 'L’edizione non sarà più servita come attiva. Le revisioni restano nell’archivio.' },
  restore: { title: 'Ripristinare come nuova bozza', verb: 'Ripristina come bozza', text: 'Viene creata una nuova revisione in bozza con questo contenuto. La cronologia non viene riscritta.' },
};

export function EditionWorkspace({ editionId, role, onBack, onNotice }: { editionId: string; role: EditorialRole; onBack: () => void; onNotice: (s: string) => void }) {
  const qc = useQueryClient();
  const detailQ = useGetEditorial(editionId, { query: { queryKey: getGetEditorialQueryKey(editionId), ...QUERY_FRESH } });
  const save = useSaveEditorial();
  const act = useActEditorial();
  const d = detailQ.data;
  const canEdit = role === 'owner' || role === 'editor';
  const isOwner = role === 'owner';

  const [form, setForm] = useState<EditorialContent | null>(null);
  const [tagsText, setTagsText] = useState('');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mutError, setMutError] = useState('');
  const [selectedRev, setSelectedRev] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [preview, setPreview] = useState<EditorialRevision | null>(null);
  const [lower, setLower] = useState<'revisions' | 'events' | 'originals'>('revisions');

  const dirty = !!form && !!loaded && JSON.stringify(form) !== JSON.stringify(loaded.content);
  const latest = d?.revisions[d.revisions.length - 1];

  const apply = useCallback((det: EditorialDetail) => {
    const last = det.revisions[det.revisions.length - 1];
    const content = last ? clone(last.content) : emptyContent(det.contentLanguage);
    setForm(clone(content));
    setTagsText(content.tags.join(', '));
    setLoaded({ id: det.id, version: det.version, content });
    setSelectedRev(last?.id ?? null);
    setErrors({});
    setEditorKey(k => k + 1);
  }, []);

  // Init once per edition; passive refetches re-sync only when there are no local edits.
  useEffect(() => {
    if (!d) return;
    if (loaded && loaded.id === d.id && (loaded.version === d.version || dirty)) return;
    apply(d);
  }, [d, loaded, dirty, apply]);

  useEffect(() => { setEditorialDirty(dirty); }, [dirty]);
  useEffect(() => () => setEditorialDirty(false), []);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    const click = (e: MouseEvent) => {
      const anchor = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || anchor.target === '_blank' || anchor.href === window.location.href) return;
      if (!window.confirm('Ci sono modifiche non salvate. Uscire e perderle?')) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    };
    window.addEventListener('beforeunload', h);
    document.addEventListener('click', click, true);
    return () => { window.removeEventListener('beforeunload', h); document.removeEventListener('click', click, true); };
  }, [dirty]);

  const afterMutation = (det: EditorialDetail, msg: string) => {
    qc.setQueryData(getGetEditorialQueryKey(det.id), det);
    void qc.invalidateQueries({ queryKey: getGetEditorialQueryKey(det.id) });
    void qc.invalidateQueries({ queryKey: getListEditorialQueryKey() });
    setEditorialDirty(false);
    apply(det);
    setMutError('');
    onNotice(msg);
  };

  const set = <K extends keyof EditorialContent>(k: K, v: EditorialContent[K]) => setForm(f => (f ? { ...f, [k]: v } : f));

  const validate = (c: EditorialContent) => {
    const e: Record<string, string> = {};
    if (!c.title.trim()) e.title = 'Il titolo è obbligatorio.';
    if (c.title.length > 200) e.title = 'Massimo 200 caratteri.';
    if (c.summary.length > 2000) e.summary = 'Massimo 2000 caratteri.';
    const ie = imageError(c.image); if (ie) e.image = ie;
    if (c.image.trim() && !c.imageAlt.trim()) e.imageAlt = 'Descrivi l’immagine per chi usa un lettore di schermo.';
    if (!/^[a-z]{2}$/.test(c.contentLanguage)) e.contentLanguage = 'Codice lingua di due lettere minuscole.';
    if (c.tags.length > 30 || c.tags.some(t => t.length > 80)) e.tags = 'Al massimo 30 etichette da 80 caratteri.';
    c.sources.forEach((s, i) => { if (!s.title.trim()) e[`src-t-${i}`] = 'Titolo mancante.'; const ue = urlError(s.url); if (ue) e[`src-u-${i}`] = ue; });
    if (c.seoTitle.length > 200) e.seoTitle = 'Massimo 200 caratteri.';
    if (c.seoDescription.length > 500) e.seoDescription = 'Massimo 500 caratteri.';
    return e;
  };

  const doSave = () => {
    if (!form || !loaded || !d) return;
    const content: EditorialContent = { ...form, tags: tagsText.split(',').map(t => t.trim()).filter(Boolean), image: form.image.trim(), sources: form.sources.map(s => ({ title: s.title.trim(), url: s.url.trim() })) };
    const e = validate(content);
    setErrors(e);
    if (Object.keys(e).length) { setMutError('Correggi i campi evidenziati prima di salvare.'); return; }
    save.mutate({ editionId: d.id, data: { version: loaded.version, content } }, {
      onSuccess: det => afterMutation(det, 'Nuova revisione salvata'),
      onError: err => setMutError(apiErrorText(err, 'Salvataggio non riuscito.')),
    });
  };

  const runAction = () => {
    if (!pending || !d) return;
    act.mutate({ editionId: d.id, data: { version: d.version, action: pending.action, revisionId: pending.revision.id } }, {
      onSuccess: det => { setPending(null); afterMutation(det, ACTION_LABELS[pending.action] ?? 'Azione registrata'); },
      onError: err => setMutError(apiErrorText(err, 'Azione non riuscita.')),
    });
  };

  const discard = () => { if (d && window.confirm('Scartare le modifiche locali e ricaricare la versione salvata?')) apply(d); };

  const rev = useMemo(() => d?.revisions.find(r => r.id === selectedRev) ?? latest, [d, selectedRev, latest]);
  const lastApproval = useMemo(() => [...(d?.events ?? [])].reverse().find(e => e.action === 'approve'), [d]);

  if (detailQ.isLoading) return <div className="ed-workspace"><Skeleton rows={9} /></div>;
  if (detailQ.isError || !d) return <div className="ed-workspace"><button className="ed-back" onClick={onBack} data-testid="button-back"><ArrowLeft size={14} /> Elenco</button><div className="ed-error" role="alert"><AlertTriangle size={18} /><div><strong>Impossibile aprire l’edizione</strong><p>{apiErrorText(detailQ.error)}</p><button className="int-small-button" onClick={() => detailQ.refetch()}>Riprova</button></div></div></div>;
  if (!form || !loaded) return <div className="ed-workspace"><Skeleton rows={9} /></div>;

  const dir = localeDir(d.locale);
  const remoteChanged = loaded.id === d.id && loaded.version !== d.version && dirty;
  const readOnly = !canEdit;
  const isLatest = rev?.id === latest?.id;
  const actions: { action: EditorialActionAction; show: boolean; icon: typeof Send; tone?: string }[] = [
    { action: 'submit', show: canEdit && d.state === 'draft' && isLatest, icon: Send },
    { action: 'approve', show: isOwner && d.state === 'review' && isLatest, icon: BadgeCheck, tone: 'approve' },
    { action: 'activate', show: isOwner && d.state === 'approved' && isLatest, icon: Zap, tone: 'activate' },
    { action: 'withdraw', show: isOwner && (d.state === 'active' || !!d.activeRevisionId || (d.events.some(e => e.action === 'import') && !d.events.some(e => e.action === 'withdraw'))), icon: Archive, tone: 'danger' },
    { action: 'restore', show: canEdit && !!rev && !isLatest, icon: Undo2 },
  ];

  return <div className="ed-workspace" data-testid={`workspace-${d.id}`}>
    <div className="ed-ws-head">
      <button className="ed-back" onClick={onBack} data-testid="button-back"><ArrowLeft size={14} /> Elenco</button>
      <div className="ed-ws-title">
        <span className="ed-mono">{d.identity}</span>
        <h2 dir={dir}>{d.title || 'Senza titolo'}</h2>
        <div className="ed-ws-meta"><span className="ed-locale">{d.locale.toUpperCase()}</span><span>{localeName(d.locale)}</span><span>·</span><span>{KIND_LABELS[d.kind]}</span><span>·</span><code>{d.path}</code><StateBadge state={d.state} /><ProvenanceTags s={d} /></div>
      </div>
      <dl className="ed-ledger">
        <div><dt>Versione</dt><dd className="ed-mono">v{d.version}</dd></div>
        <div><dt>Revisioni</dt><dd className="ed-mono">{d.revisions.length}</dd></div>
        <div><dt>Attiva</dt><dd className="ed-mono">{d.activeRevisionId ? shortHash(d.activeRevisionId) : 'nessuna'}</dd></div>
        <div><dt>Ultima approvazione</dt><dd>{lastApproval ? `${fmtDate(lastApproval.at)} · ${lastApproval.actor}` : 'mai approvata'}</dd></div>
      </dl>
    </div>

    {d.historical && <div className="ed-note historical"><History size={15} /> Edizione proveniente dal sito storico. La provenienza documenta l’origine del testo, <strong>non è un’approvazione</strong>: ogni lingua richiede un’approvazione esplicita del titolare.</div>}
    {d.stale && <div className="ed-note stale"><AlertTriangle size={15} /> La sorgente italiana è cambiata dopo questa traduzione (hash sorgente diverso). Rivedi il confronto prima di inviarla.</div>}
    {remoteChanged && <div className="ed-note conflict" role="alert"><AlertTriangle size={15} /> Sul server esiste una versione più recente (v{d.version}). Le tue modifiche locali sono intatte: salvare ora genererà un conflitto. <button className="int-small-button" onClick={discard}>Scarta e ricarica</button></div>}
    {mutError && <div className="ed-error" role="alert"><AlertTriangle size={16} /><div><p>{mutError}</p></div><button aria-label="Chiudi errore" onClick={() => setMutError('')}><X size={14} /></button></div>}

    <div className="ed-compare">
      <section className="ed-source" aria-label="Sorgente di riferimento">
        <header><span className="int-kicker">SORGENTE · SOLO LETTURA</span>{d.source?.hash && <code title="Hash sorgente">{shortHash(d.source.hash)}</code>}</header>
        {d.source?.content
          ? <SafeFrame srcDoc={contentDocument(d.source.content, d.source.content.contentLanguage || 'it')} title="Sorgente di riferimento" className="tall" testId="frame-source" />
          : <div className="ed-empty small"><strong>Nessuna sorgente collegata</strong><p>Questa edizione è il testo di riferimento della propria identità.</p></div>}
      </section>

      <section className="ed-form" aria-label="Modifica edizione">
        <header><span className="int-kicker">EDIZIONE {d.locale.toUpperCase()} · {readOnly ? 'SOLA LETTURA' : 'MODIFICA'}</span>{dirty ? <span className="ed-dirty" data-testid="status-dirty">Modifiche non salvate</span> : <span className="ed-clean">Salvato · v{loaded.version}</span>}</header>
        <fieldset disabled={readOnly || save.isPending} dir={dir} lang={form.contentLanguage}>
          <Field label="Titolo" error={errors.title} count={`${form.title.length}/200`}><input value={form.title} maxLength={200} onChange={e => set('title', e.target.value)} data-testid="input-title" /></Field>
          <Field label="Sommario" error={errors.summary}><textarea rows={3} value={form.summary} maxLength={2000} onChange={e => set('summary', e.target.value)} data-testid="input-summary" /></Field>
          <div className="ed-field"><span className="ed-label" id={`body-${d.id}`}>Corpo del testo</span><RichEditor key={editorKey} value={form.body} onChange={v => set('body', v)} dir={dir} lang={form.contentLanguage} disabled={readOnly} labelId={`body-${d.id}`} /></div>
          <div className="ed-row3">
            <Field label="Categoria"><input value={form.category} maxLength={100} onChange={e => set('category', e.target.value)} data-testid="input-category" /></Field>
            <Field label="Etichette (separate da virgola)" error={errors.tags}><input value={tagsText} onChange={e => { setTagsText(e.target.value); set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean)); }} data-testid="input-tags" /></Field>
            <Field label="Lingua del contenuto" error={errors.contentLanguage}><input value={form.contentLanguage} maxLength={2} dir="ltr" onChange={e => set('contentLanguage', e.target.value.toLowerCase())} data-testid="input-content-language" /></Field>
          </div>
          <div className="ed-image-row">
            <div>
              <Field label="Immagine (percorso pubblico /… o URL https)" error={errors.image}><input dir="ltr" value={form.image} maxLength={2000} placeholder="/media/cefalu-terrazza.webp" onChange={e => set('image', e.target.value)} data-testid="input-image" /></Field>
              <Field label="Testo alternativo" error={errors.imageAlt}><input value={form.imageAlt} maxLength={500} onChange={e => set('imageAlt', e.target.value)} data-testid="input-image-alt" /></Field>
              <small className="ed-hint">Solo immagini già pubbliche. Nessun caricamento di file privati.</small>
            </div>
            <div className="ed-thumb">{form.image && !imageError(form.image) ? <img src={form.image} alt={form.imageAlt} referrerPolicy="no-referrer" /> : <span>Nessuna anteprima</span>}</div>
          </div>
          <div className="ed-field"><span className="ed-label">Fonti</span>
            <div className="ed-sources">{form.sources.map((s, i) => <div className="ed-source-row" key={i}>
              <span className="ed-mono">{String(i + 1).padStart(2, '0')}</span>
              <input aria-label={`Titolo fonte ${i + 1}`} placeholder="Titolo" value={s.title} maxLength={300} onChange={e => set('sources', form.sources.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} aria-invalid={!!errors[`src-t-${i}`]} />
              <input aria-label={`URL fonte ${i + 1}`} dir="ltr" placeholder="https://" value={s.url} maxLength={2000} onChange={e => set('sources', form.sources.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} aria-invalid={!!errors[`src-u-${i}`]} />
              <button type="button" aria-label={`Rimuovi fonte ${i + 1}`} onClick={() => set('sources', form.sources.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              {(errors[`src-t-${i}`] || errors[`src-u-${i}`]) && <small className="ed-field-error">{errors[`src-t-${i}`] || errors[`src-u-${i}`]}</small>}
            </div>)}
              {form.sources.length < 50 && <button type="button" className="ed-add" onClick={() => set('sources', [...form.sources, { title: '', url: '' }])} data-testid="button-add-source"><Plus size={13} /> Aggiungi fonte</button>}
            </div>
          </div>
          <div className="ed-row2">
            <Field label="Titolo SEO" error={errors.seoTitle} count={`${form.seoTitle.length}/200`}><input value={form.seoTitle} maxLength={200} onChange={e => set('seoTitle', e.target.value)} data-testid="input-seo-title" /></Field>
            <Field label="Descrizione SEO" error={errors.seoDescription} count={`${form.seoDescription.length}/500`}><textarea rows={2} value={form.seoDescription} maxLength={500} onChange={e => set('seoDescription', e.target.value)} data-testid="input-seo-description" /></Field>
          </div>
          {form.guide && <GuideFields guide={form.guide} onChange={guide => set('guide', guide)} />}
        </fieldset>
        {canEdit && <div className="ed-savebar">
          <span>{dirty ? 'Il salvataggio crea una nuova revisione immutabile.' : 'Nessuna modifica da salvare.'}</span>
          <button className="int-small-button" disabled={!dirty || save.isPending} onClick={discard} data-testid="button-discard"><RotateCcw size={13} /> Scarta</button>
          <button className="int-primary" disabled={!dirty || save.isPending} onClick={doSave} data-testid="button-save"><Save size={14} /> {save.isPending ? 'Salvataggio…' : 'Salva revisione'}</button>
        </div>}
      </section>
    </div>

    <section className="ed-lower">
      <div className="ed-seg" role="tablist" aria-label="Archivio dell’edizione">
        {([['revisions', `Revisioni (${d.revisions.length})`], ['events', `Eventi (${d.events.length})`], ['originals', `Originali storici (${d.originals.length})`]] as const).map(([id, label]) =>
          <button key={id} role="tab" aria-selected={lower === id} className={lower === id ? 'on' : ''} onClick={() => setLower(id)} data-testid={`tab-${id}`}>{label}</button>)}
      </div>

      {lower === 'revisions' && <div className="ed-revs">
        <div className="ed-actions-bar">
          <span>Revisione selezionata: <code>{shortHash(rev?.id)}</code>{isLatest ? ' (più recente)' : ''}</span>
          {dirty && <small>Salva o scarta le modifiche per usare le azioni.</small>}
          {actions.filter(a => a.show).map(a => <button key={a.action} className={`ed-act ${a.tone ?? ''}`} disabled={dirty || act.isPending || !rev} onClick={() => rev && setPending({ action: a.action, revision: rev })} data-testid={`button-action-${a.action}`}><a.icon size={14} /> {ACTION_COPY[a.action].verb}</button>)}
          {!canEdit && <small>Accesso in sola lettura.</small>}
        </div>
        <ol className="ed-rev-list">{[...d.revisions].reverse().map((r, i) => {
          const n = d.revisions.length - i;
          return <li key={r.id} className={`${r.id === rev?.id ? 'sel' : ''} ${r.id === d.activeRevisionId ? 'live' : ''}`}>
            <button className="ed-rev-pick" onClick={() => setSelectedRev(r.id)} aria-pressed={r.id === rev?.id} data-testid={`button-select-revision-${r.id}`}>
              <span className="ed-rev-n">R{n}</span>
              <span className="ed-rev-body"><strong dir={dir}>{r.content.title || 'Senza titolo'}</strong><small>{fmtDate(r.createdAt)} · {r.actor}</small></span>
              <span className="ed-rev-hash"><code title={r.hash}>{shortHash(r.hash)}</code><code title={`Sorgente ${r.sourceHash}`} className="muted">src {shortHash(r.sourceHash)}</code></span>
              {r.id === d.activeRevisionId && <span className="ed-state active"><i />Pubblica</span>}
            </button>
            <button className="int-small-button" onClick={() => setPreview(r)} data-testid={`button-preview-${r.id}`}><Eye size={13} /> Anteprima</button>
          </li>;
        })}</ol>
        {!d.revisions.length && <div className="ed-empty small"><strong>Nessuna revisione</strong><p>Salva il primo contenuto per creare la revisione R1.</p></div>}
      </div>}

      {lower === 'events' && <ol className="ed-timeline">{[...d.events].reverse().map((e, i) => <li key={`${e.at}-${i}`} className={`ev-${e.action}`}>
        <span className="ed-tl-dot" /><div><strong>{ACTION_LABELS[e.action] ?? e.action}</strong><small>{fmtDate(e.at)} · {e.actor}</small><span className="ed-mono">rev {shortHash(e.revisionId)} · hash {shortHash(e.hash)} · src {shortHash(e.sourceHash)}</span></div>
      </li>)}{!d.events.length && <div className="ed-empty small"><strong>Nessun evento</strong><p>Invii, approvazioni e attivazioni verranno registrati qui.</p></div>}</ol>}

      {lower === 'originals' && <div className="ed-originals">
        <p className="ed-hint"><ShieldCheck size={13} /> Gli originali sono resi in un riquadro isolato senza script. Sono documenti di provenienza in sola lettura, non contenuti approvati.</p>
        {d.originals.map((o, i) => <article key={`${o.hash}-${i}`} className="ed-original">
          <header><strong>{o.label}</strong><code title={o.hash}>{shortHash(o.hash)}</code></header>
          <span className="ed-mono ed-url">{o.url}</span>
          {o.metadata && <pre className="ed-meta">{o.metadata}</pre>}
          <SafeFrame srcDoc={rawDocument(o.body)} title={`Originale storico: ${o.label}`} testId={`frame-original-${i}`} />
        </article>)}
        {!d.originals.length && <div className="ed-empty small"><strong>Nessun originale storico</strong><p>Questa edizione non deriva da una pagina del sito storico.</p></div>}
      </div>}
    </section>

    {preview && <Dialog label="Anteprima riservata della revisione" onClose={() => setPreview(null)} wide>
      <div className="ed-dlg-meta"><span>Anteprima interna · non è un URL pubblico</span><code>{shortHash(preview.hash)}</code><span>{fmtDate(preview.createdAt)} · {preview.actor}</span></div>
      <SafeFrame srcDoc={contentDocument(preview.content, d.locale)} title="Anteprima revisione" className="tall" testId="frame-preview" />
    </Dialog>}

    {pending && <ConfirmAction d={d} pending={pending} busy={act.isPending} error={act.isError ? apiErrorText(act.error) : ''} onCancel={() => { setPending(null); act.reset(); }} onConfirm={runAction} />}
  </div>;
}

function Field({ label, error, count, children }: { label: string; error?: string; count?: string; children: ReactNode }) {
  return <label className={`ed-field ${error ? 'invalid' : ''}`}><span className="ed-label">{label}{count && <em>{count}</em>}</span>{children}{error && <small className="ed-field-error">{error}</small>}</label>;
}

export function Dialog({ label, onClose, children, wide }: { label: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); prev?.focus(); };
  }, []);
  return <div className="int-modal-backdrop ed-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={ref} tabIndex={-1} className={`ed-dialog ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
      <header><h3>{label}</h3><button onClick={onClose} aria-label="Chiudi" data-testid="button-close-dialog"><X size={16} /></button></header>
      {children}
    </section>
  </div>;
}

function ConfirmAction({ d, pending, busy, error, onCancel, onConfirm }: { d: EditorialDetail; pending: Pending; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const [ack, setAck] = useState(false);
  const copy = ACTION_COPY[pending.action];
  const needsAck = pending.action === 'approve' || pending.action === 'activate' || pending.action === 'withdraw';
  const r = pending.revision;
  const idx = d.revisions.findIndex(x => x.id === r.id) + 1;
  return <Dialog label={copy.title} onClose={onCancel}>
    <p className="ed-dlg-text">{copy.text}</p>
    <dl className="ed-confirm-grid">
      <div><dt>Identità</dt><dd className="ed-mono">{d.identity}</dd></div>
      <div><dt>Lingua</dt><dd>{d.locale.toUpperCase()} · {localeName(d.locale)}</dd></div>
      <div><dt>Percorso</dt><dd className="ed-mono">{d.path}</dd></div>
      <div><dt>Revisione</dt><dd className="ed-mono">R{idx} · {r.id}</dd></div>
      <div><dt>Data</dt><dd>{fmtDate(r.createdAt)} · {r.actor}</dd></div>
      <div><dt>Hash contenuto</dt><dd className="ed-mono break">{r.hash}</dd></div>
      <div><dt>Hash sorgente</dt><dd className="ed-mono break">{r.sourceHash || '—'}</dd></div>
      <div><dt>Provenienza</dt><dd><ProvenanceTags s={d} /></dd></div>
      <div><dt>Stato attuale</dt><dd><StateBadge state={d.state} /> · v{d.version}</dd></div>
    </dl>
    {d.historical && pending.action === 'approve' && <div className="ed-note historical">Testo di origine storica: approvandolo confermi personalmente questa lingua e questa revisione.</div>}
    {needsAck && <label className="ed-ack"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} data-testid="checkbox-confirm-action" /> Ho verificato identità, lingua, revisione e hash indicati sopra.</label>}
    {error && <div className="ed-error" role="alert"><AlertTriangle size={16} /><div><p>{error}</p></div></div>}
    <div className="ed-dlg-actions">
      <button className="int-small-button" onClick={onCancel}>Annulla</button>
      <button className={`int-primary ed-confirm ${pending.action}`} disabled={busy || (needsAck && !ack)} onClick={onConfirm} data-testid="button-confirm-action">{busy ? 'Registrazione…' : copy.verb}</button>
    </div>
  </Dialog>;
}
