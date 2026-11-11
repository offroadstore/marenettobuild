import { useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetEditorialQueryKey, getListEditorialQueryKey, useCreateEditorial, useListEditorial,
  type EditorialDetail, type EditorialInputKind, type EditorialSummary,
} from '@workspace/api-client-react';
import { AlertTriangle, ChevronRight, Languages, Plus, Search } from 'lucide-react';
import { EditionWorkspace, Dialog } from './workspace';
import {
  ALL_LOCALES, IDENTITY_RE, KIND_LABELS, ProvenanceTags, QUERY_FRESH, STATE_LABELS, STATE_ORDER, Skeleton, StateBadge,
  apiErrorText, confirmDiscard, emptyContent, localeName, pathError, type EditorialRole, type EditorialState,
} from './shared';
import './editorial.css';

export { editorialHasUnsavedChanges } from './shared';

type Mode = 'articles' | 'languages';
type CreateSeed = { identity?: string; locale?: string; kind?: EditorialInputKind; title?: string } | null;
type Group = { identity: string; kind: EditorialSummary['kind']; title: string; editions: EditorialSummary[] };

function groupByIdentity(items: EditorialSummary[]): Group[] {
  const map = new Map<string, EditorialSummary[]>();
  items.forEach(e => map.set(e.identity, [...(map.get(e.identity) ?? []), e]));
  return [...map.entries()].map(([identity, eds]) => {
    const sorted = [...eds].sort((a, b) => (a.locale === 'it' ? -1 : b.locale === 'it' ? 1 : a.locale.localeCompare(b.locale)) || Number(b.historical) - Number(a.historical));
    const ref = sorted.find(e => e.locale === 'it' && !e.historical) ?? sorted.find(e => e.locale === 'it') ?? sorted[0];
    return { identity, kind: ref.kind, title: ref.title, editions: sorted };
  }).sort((a, b) => a.title.localeCompare(b.title, 'it'));
}

/** The edition opened from a coverage cell: the most advanced rework, otherwise the historical one. */
function primary(eds: EditorialSummary[]) {
  const rank = (e: EditorialSummary) => STATE_ORDER.indexOf(e.state) + (e.historical ? 0 : 10);
  return [...eds].sort((a, b) => rank(b) - rank(a))[0];
}

export function EditorialPanel({ mode, role }: { mode: Mode; role: EditorialRole }) {
  const qc = useQueryClient();
  const list = useListEditorial({ query: { queryKey: getListEditorialQueryKey(), ...QUERY_FRESH } });
  const [openId, setOpenId] = useState<string | null>(null);
  const [seed, setSeed] = useState<CreateSeed>(null);
  const [notice, setNotice] = useState('');
  const canEdit = role === 'owner' || role === 'editor';
  const items = useMemo(() => list.data ?? [], [list.data]);
  const groups = useMemo(() => groupByIdentity(items), [items]);

  const flash = (s: string) => { setNotice(s); window.setTimeout(() => setNotice(n => (n === s ? '' : n)), 4200); };
  const back = () => { if (confirmDiscard()) setOpenId(null); };

  const header = <div className="int-section-intro ed-intro">
    <div><span className="int-kicker">{mode === 'articles' ? 'CONTENUTI / ARCHIVIO EDITORIALE' : 'LINGUE / COPERTURA'}</span>
      <h2>{mode === 'articles' ? 'Articoli, revisione per revisione.' : 'Ogni lingua, approvata da sé.'}</h2>
      <p>{mode === 'articles' ? 'Le edizioni sono raggruppate per identità: originale storico e rielaborazione convivono senza duplicati. Provenienza e approvazione restano distinte.' : `Copertura di ${ALL_LOCALES.length} lingue per identità. Una traduzione storica non è approvata finché il titolare non la conferma.`}</p></div>
    <div className="ed-intro-side"><span className="ed-role">Ruolo: {role === 'owner' ? 'Titolare' : role === 'editor' ? 'Redattore' : 'Lettore'}</span>
      {canEdit && !openId && <button className="int-primary" onClick={() => setSeed({ locale: 'it', kind: 'article' })} data-testid="button-new-edition"><Plus size={15} /> {mode === 'articles' ? 'Nuovo articolo' : 'Nuova edizione'}</button>}</div>
  </div>;

  return <div className="int-content ed-root">
    {header}
    {openId
      ? <EditionWorkspace key={openId} editionId={openId} role={role} onBack={back} onNotice={flash} />
      : list.isLoading ? <Skeleton rows={8} />
        : list.isError ? <div className="ed-error" role="alert"><AlertTriangle size={18} /><div><strong>Archivio editoriale non disponibile</strong><p>{apiErrorText(list.error)}</p><button className="int-small-button" onClick={() => list.refetch()} data-testid="button-retry-list">Riprova</button></div></div>
          : mode === 'articles' ? <ArticlesView groups={groups} total={items.length} onOpen={setOpenId} canEdit={canEdit} onCreate={setSeed} />
            : <LanguagesView groups={groups} onOpen={setOpenId} canEdit={canEdit} onCreate={setSeed} />}
    {seed && <CreateDialog seed={seed} groups={groups} onClose={() => setSeed(null)} onCreated={det => {
      qc.setQueryData(getGetEditorialQueryKey(det.id), det);
      void qc.invalidateQueries({ queryKey: getListEditorialQueryKey() });
      setSeed(null); setOpenId(det.id); flash('Edizione creata in bozza');
    }} />}
    {notice && <div className="int-toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Chiudi avviso">×</button></div>}
  </div>;
}

function ArticlesView({ groups, total, onOpen, canEdit, onCreate }: { groups: Group[]; total: number; onOpen: (id: string) => void; canEdit: boolean; onCreate: (s: CreateSeed) => void }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [state, setState] = useState('all');
  const [prov, setProv] = useState('all');
  const all = groups.flatMap(g => g.editions);
  const counts = { draft: 0, review: 0, approved: 0, active: 0 } as Record<EditorialState, number>;
  all.forEach(e => { counts[e.state] += 1; });
  const match = (e: EditorialSummary) =>
    (kind === 'all' || e.kind === kind) && (state === 'all' || e.state === state) &&
    (prov === 'all' || (prov === 'historical' && e.historical) || (prov === 'rework' && !e.historical) || (prov === 'correction' && e.correction) || (prov === 'stale' && e.stale));
  const needle = q.trim().toLowerCase();
  const shown = groups.map(g => ({ ...g, editions: g.editions.filter(match) }))
    .filter(g => g.editions.length && (!needle || g.identity.includes(needle) || g.title.toLowerCase().includes(needle) || g.editions.some(e => e.title.toLowerCase().includes(needle) || e.path.toLowerCase().includes(needle))));

  return <>
    <div className="ed-counters">
      <div><strong>{groups.length}</strong><span>identità</span></div>
      <div><strong>{total}</strong><span>edizioni</span></div>
      {STATE_ORDER.map(s => <button key={s} className={`ed-counter ${s} ${state === s ? 'on' : ''}`} onClick={() => setState(state === s ? 'all' : s)} aria-pressed={state === s} data-testid={`filter-count-${s}`}><strong>{counts[s]}</strong><span>{STATE_LABELS[s]}</span></button>)}
      <div className="stale"><strong>{all.filter(e => e.stale).length}</strong><span>obsolete</span></div>
    </div>
    <div className="ed-filters">
      <label className="ed-search"><Search size={14} /><input type="search" placeholder="Cerca titolo, identità o percorso" value={q} onChange={e => setQ(e.target.value)} aria-label="Cerca" data-testid="input-search" /></label>
      <select value={kind} onChange={e => setKind(e.target.value)} aria-label="Tipo" data-testid="select-kind"><option value="all">Tutti i tipi</option><option value="article">Articoli</option><option value="page">Pagine</option></select>
      <select value={state} onChange={e => setState(e.target.value)} aria-label="Stato" data-testid="select-state"><option value="all">Tutti gli stati</option>{STATE_ORDER.map(s => <option key={s} value={s}>{STATE_LABELS[s]}</option>)}</select>
      <select value={prov} onChange={e => setProv(e.target.value)} aria-label="Provenienza" data-testid="select-provenance"><option value="all">Ogni provenienza</option><option value="historical">Storico</option><option value="rework">Rielaborazione</option><option value="correction">Correzioni</option><option value="stale">Obsolete</option></select>
      <span className="ed-result">{shown.length} di {groups.length} identità</span>
    </div>
    {!groups.length ? <div className="ed-empty"><strong>Archivio vuoto</strong><p>Non ci sono ancora edizioni registrate.</p>{canEdit && <button className="int-primary" onClick={() => onCreate({ locale: 'it', kind: 'article' })}><Plus size={14} /> Crea il primo articolo</button>}</div>
      : !shown.length ? <div className="ed-empty"><strong>Nessun risultato</strong><p>Nessuna edizione corrisponde ai filtri attivi.</p><button className="int-small-button" onClick={() => { setQ(''); setKind('all'); setState('all'); setProv('all'); }}>Azzera filtri</button></div>
        : <div className="ed-groups">{shown.map(g => <article key={g.identity} className="ed-group" data-testid={`group-${g.identity}`}>
          <header>
            <div><span className="ed-mono">{g.identity}</span><h3>{g.title || 'Senza titolo'}</h3></div>
            <span className="ed-kind">{KIND_LABELS[g.kind]}</span>
            <span className="ed-locales-strip" aria-label="Lingue presenti">{[...new Set(groups.find(x => x.identity === g.identity)?.editions.map(e => e.locale))].map(l => <i key={l}>{l}</i>)}</span>
            {canEdit && <button className="int-small-button" onClick={() => onCreate({ identity: g.identity, kind: g.kind, title: g.title })} data-testid={`button-add-edition-${g.identity}`}><Languages size={13} /> Aggiungi lingua</button>}
          </header>
          <ul>{g.editions.map(e => <li key={e.id}>
            <button className="ed-edition" onClick={() => onOpen(e.id)} data-testid={`button-open-edition-${e.id}`}>
              <span className="ed-locale">{e.locale.toUpperCase()}</span>
              <span className="ed-ed-title"><strong>{e.title || 'Senza titolo'}</strong><code>{e.path}</code></span>
              <ProvenanceTags s={e} />
              <StateBadge state={e.state} />
              <span className="ed-mono muted">v{e.version}</span>
              <ChevronRight size={15} />
            </button>
          </li>)}</ul>
        </article>)}</div>}
  </>;
}

type Cell = 'missing' | EditorialState;
const STATUS_FILTERS: [string, string][] = [['all', 'Tutti gli stati'], ['missing', 'Mancante'], ['draft', 'Bozza'], ['review', 'In revisione'], ['approved', 'Approvata'], ['active', 'Attiva'], ['historical', 'Storico non rielaborato'], ['foreign', 'Contenuto in altra lingua'], ['stale', 'Obsoleta']];

function LanguagesView({ groups, onOpen, canEdit, onCreate }: { groups: Group[]; onOpen: (id: string) => void; canEdit: boolean; onCreate: (s: CreateSeed) => void }) {
  const [lang, setLang] = useState('all');
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const cols = lang === 'all' ? ALL_LOCALES : [lang];
  const cellMatch = (eds: EditorialSummary[], loc: string) => {
    if (status === 'all') return true;
    if (status === 'missing') return eds.length === 0;
    if (!eds.length) return false;
    if (status === 'historical') return eds.every(e => e.historical);
    if (status === 'foreign') return eds.some(e => e.contentLanguage !== loc);
    if (status === 'stale') return eds.some(e => e.stale);
    return primary(eds).state === status;
  };
  const needle = q.trim().toLowerCase();
  const rows = groups.filter(g => (kind === 'all' || g.kind === kind) && (!needle || g.identity.includes(needle) || g.title.toLowerCase().includes(needle)))
    .filter(g => cols.some(l => cellMatch(g.editions.filter(e => e.locale === l), l)));
  const coverage = (l: string) => groups.filter(g => g.editions.some(e => e.locale === l && e.state === 'active')).length;

  return <>
    <div className="ed-filters">
      <label className="ed-search"><Search size={14} /><input type="search" placeholder="Cerca identità o titolo" value={q} onChange={e => setQ(e.target.value)} aria-label="Cerca" data-testid="input-matrix-search" /></label>
      <select value={lang} onChange={e => setLang(e.target.value)} aria-label="Lingua" data-testid="select-matrix-language"><option value="all">Tutte le lingue ({ALL_LOCALES.length})</option>{ALL_LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()} · {localeName(l)}</option>)}</select>
      <select value={kind} onChange={e => setKind(e.target.value)} aria-label="Tipo" data-testid="select-matrix-kind"><option value="all">Tutti i tipi</option><option value="article">Articoli</option><option value="page">Pagine</option></select>
      <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Stato" data-testid="select-matrix-status">{STATUS_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <span className="ed-result">{rows.length} di {groups.length} identità</span>
    </div>
    <div className="ed-legend" aria-label="Legenda">
      {(['active', 'approved', 'review', 'draft', 'missing'] as Cell[]).map(c => <span key={c}><b className={`ed-cell-swatch ${c}`} />{c === 'missing' ? 'Mancante' : STATE_LABELS[c as EditorialState]}</span>)}
      <span><b className="ed-cell-swatch draft hist" />Solo storico</span><span><b className="ed-mark stale" />Obsoleta</span><span><b className="ed-mark foreign" />Altra lingua</span>
    </div>
    {!groups.length ? <div className="ed-empty"><strong>Nessuna identità</strong><p>Crea un articolo per iniziare a misurare la copertura.</p></div>
      : !rows.length ? <div className="ed-empty"><strong>Nessuna riga corrisponde</strong><p>Prova un altro filtro di lingua o stato.</p></div>
        : <div className="ed-matrix-wrap" tabIndex={0} aria-label="Matrice di copertura linguistica">
          <table className="ed-matrix">
            <thead><tr><th scope="col" className="ed-sticky">Identità</th>{cols.map(l => <th key={l} scope="col" title={localeName(l)}><span>{l.toUpperCase()}</span><small>{coverage(l)}/{groups.length}</small></th>)}</tr></thead>
            <tbody>{rows.map(g => <tr key={g.identity}>
              <th scope="row" className="ed-sticky"><span className="ed-mono">{g.identity}</span><strong>{g.title}</strong></th>
              {cols.map(l => {
                const eds = g.editions.filter(e => e.locale === l);
                const dim = !cellMatch(eds, l);
                if (!eds.length) return <td key={l} className={dim ? 'dim' : ''}>{canEdit
                  ? <button className="ed-cell missing" aria-label={`Crea edizione ${l.toUpperCase()} per ${g.identity}`} onClick={() => onCreate({ identity: g.identity, locale: l, kind: g.kind, title: g.title })} data-testid={`cell-create-${g.identity}-${l}`}><Plus size={11} /></button>
                  : <span className="ed-cell missing" aria-label="Mancante">—</span>}</td>;
                const p = primary(eds);
                const histOnly = eds.every(e => e.historical);
                const label = `${l.toUpperCase()} · ${STATE_LABELS[p.state]}${histOnly ? ' · solo storico' : ''}${eds.some(e => e.stale) ? ' · obsoleta' : ''}${eds.length > 1 ? ` · ${eds.length} edizioni` : ''}`;
                return <td key={l} className={dim ? 'dim' : ''}><button className={`ed-cell ${p.state} ${histOnly ? 'hist' : ''}`} title={label} aria-label={label} onClick={() => onOpen(p.id)} data-testid={`cell-open-${g.identity}-${l}`}>
                  {p.state === 'active' ? 'A' : p.state === 'approved' ? 'OK' : p.state === 'review' ? 'R' : 'B'}
                  {eds.some(e => e.stale) && <i className="ed-mark stale" />}
                  {eds.some(e => e.contentLanguage !== l) && <i className="ed-mark foreign" />}
                  {eds.length > 1 && <sup>{eds.length}</sup>}
                </button></td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>}
  </>;
}

function CreateDialog({ seed, groups, onClose, onCreated }: { seed: NonNullable<CreateSeed>; groups: Group[]; onClose: () => void; onCreated: (d: EditorialDetail) => void }) {
  const create = useCreateEditorial();
  const [identity, setIdentity] = useState(seed.identity ?? '');
  const [locale, setLocale] = useState(seed.locale ?? 'it');
  const [kind, setKind] = useState<EditorialInputKind>(seed.kind ?? 'article');
  const [path, setPath] = useState('');
  const [title, setTitle] = useState(seed.title ?? '');
  const [lang, setLang] = useState(seed.locale ?? 'it');
  const [touched, setTouched] = useState(false);
  const refs = groups.find(g => g.identity === identity.trim())?.editions ?? [];
  const taken = refs.some(e => e.locale === locale && !e.historical);
  const errs = {
    identity: IDENTITY_RE.test(identity.trim()) ? '' : 'Minuscole, cifre, - e /; inizia con lettera o cifra.',
    path: pathError(path),
    title: title.trim() ? '' : 'Titolo obbligatorio.',
    lang: /^[a-z]{2}$/.test(lang) ? '' : 'Due lettere minuscole.',
  };
  const valid = !Object.values(errs).some(Boolean);
  const submit = (e: FormEvent) => {
    e.preventDefault(); setTouched(true);
    if (!valid) return;
    create.mutate({ data: { identity: identity.trim(), locale, kind, path: path.trim(), content: { ...emptyContent(lang), title: title.trim() } } }, { onSuccess: onCreated });
  };
  const show = (k: keyof typeof errs) => touched && errs[k] ? <small className="ed-field-error">{errs[k]}</small> : null;
  return <Dialog label={seed.identity ? 'Nuova edizione linguistica' : 'Nuovo articolo'} onClose={onClose}>
    <form className="ed-create" onSubmit={submit} noValidate>
      <label className="ed-field"><span className="ed-label">Identità</span><input value={identity} onChange={e => setIdentity(e.target.value.toLowerCase())} readOnly={!!seed.identity} placeholder="manutenzione/infiltrazioni-terrazzo" dir="ltr" data-testid="input-create-identity" />{show('identity')}</label>
      <div className="ed-row3">
        <label className="ed-field"><span className="ed-label">Lingua dell’edizione</span><select value={locale} onChange={e => { setLocale(e.target.value); setLang(e.target.value); }} data-testid="select-create-locale">{ALL_LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()} · {localeName(l)}</option>)}</select></label>
        <label className="ed-field"><span className="ed-label">Tipo</span><select value={kind} onChange={e => setKind(e.target.value as EditorialInputKind)} disabled={!!seed.identity} data-testid="select-create-kind"><option value="article">Articolo</option><option value="page">Pagina</option></select></label>
        <label className="ed-field"><span className="ed-label">Lingua del contenuto</span><input value={lang} maxLength={2} onChange={e => setLang(e.target.value.toLowerCase())} dir="ltr" data-testid="input-create-content-language" />{show('lang')}</label>
      </div>
      <label className="ed-field"><span className="ed-label">Percorso pubblico (esplicito)</span><input value={path} onChange={e => setPath(e.target.value)} placeholder={locale === 'it' ? '/articoli/…' : `/${locale}/…`} dir="ltr" data-testid="input-create-path" />{show('path')}
        <small className="ed-hint">Scrivi il percorso completo. Non viene generato né dedotto alcun URL storico.</small></label>
      <label className="ed-field"><span className="ed-label">Titolo iniziale</span><input value={title} maxLength={200} onChange={e => setTitle(e.target.value)} data-testid="input-create-title" />{show('title')}</label>
      {refs.length > 0 && <div className="ed-refs"><span className="int-kicker">PERCORSI ESISTENTI PER QUESTA IDENTITÀ · SOLO RIFERIMENTO</span>{refs.map(r => <div key={r.id}><span className="ed-locale">{r.locale.toUpperCase()}</span><code>{r.path}</code>{r.historical && <span className="ed-prov historical">Storico</span>}</div>)}</div>}
      {taken && <div className="ed-note stale">Esiste già una rielaborazione {locale.toUpperCase()} per questa identità: il server potrebbe rifiutare il duplicato.</div>}
      {create.isError && <div className="ed-error" role="alert"><AlertTriangle size={16} /><div><p>{apiErrorText(create.error, 'Creazione non riuscita.')}</p></div></div>}
      <div className="ed-dlg-actions"><button type="button" className="int-small-button" onClick={onClose}>Annulla</button><button className="int-primary" disabled={create.isPending} data-testid="button-create-submit">{create.isPending ? 'Creazione…' : 'Crea bozza'}</button></div>
    </form>
  </Dialog>;
}
