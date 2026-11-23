import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAiVisibility, getGetAiVisibilityQueryKey, useSaveAiVisibility, useStartAiVisibility, type AiCampaign, type AiQuestion } from '@workspace/api-client-react';
import { ArrowDown, ArrowUp, Play, RefreshCw } from 'lucide-react';
import { DASHBOARD_KEY_PREFIX, Notice, errorText, fmtDate } from './shared';
import { MethodNote, obsStatusLabels, providerNames } from './ai-evidence';

type Flash = (f: { tone: 'ok' | 'warn' | 'error' | 'info'; text: string } | null) => void;
const usd = (v: number | null | undefined) => v === null || v === undefined ? 'non indicato' : v.toLocaleString('it-IT', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
export const campaignActive = (c: AiCampaign) => ['queued', 'pending', 'running'].includes(c.state) && c.completed < c.total;
type Form = { budget: string; weekly: boolean; questions: AiQuestion[] };

/** Mounted only when MonitoringSettings.canManage is true. */
export function AiSettings({ setFlash }: { setFlash: Flash }) {
  const qc = useQueryClient();
  const ai = useGetAiVisibility({ query: { queryKey: getGetAiVisibilityQueryKey(), retry: false, staleTime: 30_000, refetchInterval: q => (q.state.data?.campaigns.some(campaignActive) ? 4000 : false) } });
  const save = useSaveAiVisibility();
  const start = useStartAiVisibility();
  const [form, setForm] = useState<Form | null>(() => ai.data ? {
    budget: String(ai.data.budgetUsd), weekly: ai.data.weeklyEnabled, questions: ai.data.questions.map(q => ({ ...q })),
  } : null);
  const dirty = useRef(false);
  const initRev = useRef<string | null>(null);
  const v = ai.data;
  useEffect(() => {
    if (v && initRev.current !== v.revision && !dirty.current) {
      initRev.current = v.revision;
      setForm({ budget: String(v.budgetUsd), weekly: v.weeklyEnabled, questions: v.questions.map(q => ({ ...q })) });
    }
  }, [v]);
  const refresh = () => { void qc.invalidateQueries({ queryKey: getGetAiVisibilityQueryKey() }); void qc.invalidateQueries({ queryKey: DASHBOARD_KEY_PREFIX }); };
  const edit = (f: (x: Form) => Form) => { dirty.current = true; setForm(x => (x ? f(x) : x)); };

  if (ai.isLoading || (v && !form)) return <section className="int-panel mon-block"><div className="int-skeleton wide" /><div className="int-skeleton" /></section>;
  if (ai.isError || !v || !form) return <section className="int-panel mon-block"><Notice tone="error">{errorText(ai.error, 'Impossibile leggere la configurazione della visibilità IA.')} <button className="int-small-button" onClick={() => ai.refetch()} data-testid="button-ai-retry"><RefreshCw size={13} /> Riprova</button></Notice></section>;

  const budget = Number(form.budget);
  const budgetBad = form.budget.trim() === '' || !Number.isFinite(budget) || budget < 0 || budget > 10000;
  const qBad = form.questions.map(q => q.text.trim().length < 10 || q.text.trim().length > 240);
  const weeklyBlocked = budget <= 0 || v.blockers.some(b => /Anteprima|sviluppo/i.test(b));
  const isDirty = dirty.current;
  const active = v.campaigns.find(campaignActive);
  const configured = v.providers.filter(p => p.configured && !p.blockers.length);
  const runBlock = isDirty ? 'Salvare prima le modifiche.' : v.budgetUsd <= 0 ? 'Budget a zero: nessuna chiamata IA possibile.' : v.blockers.length ? 'Ci sono prerequisiti mancanti.' : !configured.length ? 'Nessun fornitore configurato senza blocchi.' : active ? 'Un controllo è già in coda.' : '';
  const move = (i: number, d: -1 | 1) => edit(f => { const qs = [...f.questions]; const j = i + d; if (j < 0 || j >= qs.length) return f; [qs[i], qs[j]] = [qs[j], qs[i]]; return { ...f, questions: qs }; });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (save.isPending || budgetBad || qBad.some(Boolean) || form.questions.length !== 10) return;
    save.mutate({ data: { revision: v.revision, budgetUsd: budget, weeklyEnabled: form.weekly && !weeklyBlocked, questions: form.questions.map(q => ({ ...q, text: q.text.trim() })) } }, {
      onSuccess: r => { dirty.current = false; setFlash({ tone: 'ok', text: r.message || 'Impostazioni IA salvate.' }); refresh(); },
    });
  };
  const runNow = () => {
    if (runBlock || start.isPending) return;
    if (!window.confirm(`Avviare ora un controllo IA dal server? Stima ${usd(v.campaignEstimateUsd)}, massimo prudenziale ${usd(v.campaignMaximumUsd)}. Residuo ${usd(v.remainingUsd)}: se insufficiente, il controllo può terminare parzialmente bloccato. Nessun superamento del budget.`)) return;
    start.mutate(undefined, { onSuccess: r => { setFlash({ tone: 'info', text: r.message || 'Controllo messo in coda.' }); refresh(); }, onSettled: refresh });
  };

  return <section className="int-panel mon-block" aria-labelledby="mon-ai" data-testid="section-ai-settings">
    <div className="mon-source-head"><div><span className="int-kicker">VISIBILITÀ IA / SOLO TITOLARE</span><h3 id="mon-ai">Visibilità nelle IA</h3></div><span className="mon-state s-not_configured" data-testid="status-ai-weekly">{v.weeklyEnabled ? 'Calendario autorizzato · scheduler da verificare' : 'Calendario spento'}</span></div>
    <MethodNote />
    <dl className="mon-meta" data-testid="list-ai-budget"><div><dt>Budget mensile</dt><dd>{usd(v.budgetUsd)}</dd></div><div><dt>Spesa riconciliata ({v.month})</dt><dd>{usd(v.spentUsd)}</dd></div><div><dt>Riservato / costo incerto</dt><dd>{usd(v.reservedUsd)}</dd></div><div><dt>Residuo</dt><dd>{usd(v.remainingUsd)}</dd></div><div><dt>Esecuzione manuale</dt><dd>Server del sito · nessun worker esterno richiesto</dd></div></dl>
    <div data-testid="ai-campaign-cost">
      <p className="mon-copy"><strong>Controllo completo: {v.questionCount ?? v.questions.filter(q => q.enabled).length} domande × 2 provider</strong> · stima {usd(v.campaignEstimateUsd)} · massimo prudenziale {usd(v.campaignMaximumUsd)}.</p>
      <p className="mon-note">Stima illustrativa: due passaggi da 6.000 token in ingresso e 512 in uscita, una ricerca per domanda. Non è una garanzia: il contenuto restituito dalla ricerca può aumentare il costo. Gemini resta bloccato.</p>
      {(v.campaignMaximumUsd ?? 0) > v.remainingUsd && <Notice tone="warn">Il massimo prudenziale supera il residuo: alcune domande potrebbero essere bloccate. Il tetto completo sotto 1 USD non è garantibile con i limiti documentati; non usiamo la stima per autorizzare la spesa.</Notice>}
    </div>
    <p className="mon-note">{v.calendarStatus ?? 'Calendario da predisporre separatamente.'} L’avvio manuale non richiede calendario, firma o heartbeat. Il costo della Scheduled Deployment è separato dal budget API.</p>
    {v.blockers.length > 0 && <div className="mon-blockers" data-testid="list-ai-blockers"><strong>Prerequisiti mancanti</strong><ul>{v.blockers.map(b => <li key={b}>{b}</li>)}</ul></div>}
    <div className="mon-providers">{v.providers.map(p => <div key={p.provider} className="mon-provider" data-testid={`card-ai-provider-${p.provider}`}>
      <div className="mon-summary-head"><strong>{providerNames[p.provider] ?? p.provider}</strong><span className={`mon-state ${p.configured && !p.blockers.length ? 's-ready' : 's-not_configured'}`}>{!p.configured ? 'Non configurato' : p.blockers.length ? 'Bloccato' : 'Configurato'}</span></div>
      <p className="mon-note">{p.model || 'modello non indicato'} · {p.method || 'metodo non indicato'} · per domanda: stima {usd(p.estimatedUsd)}, tetto {usd(p.maximumUsd)}</p>
      {p.blockers.length > 0 && <ul className="mon-findings">{p.blockers.map(b => <li key={b}>{b}</li>)}</ul>}
    </div>)}</div>
    <form className="mon-ai-form" onSubmit={submit}>
      <div className="mon-filter-grid">
        <label>Budget mensile (USD)<input type="number" min={0} max={10000} step="0.01" inputMode="decimal" value={form.budget} aria-invalid={budgetBad} onChange={e => edit(f => ({ ...f, budget: e.target.value }))} data-testid="input-ai-budget" /><small>{budgetBad ? 'Valore tra 0 e 10.000.' : 'Con 0 nessuna chiamata parte.'}</small></label>
        <label className="mon-check"><input type="checkbox" checked={form.weekly && !weeklyBlocked} disabled={weeklyBlocked} onChange={e => edit(f => ({ ...f, weekly: e.target.checked }))} data-testid="checkbox-ai-weekly" /> Controllo settimanale ({v.schedule || 'lunedì 09:00 Europe/Rome'})</label>
      </div>
      {weeklyBlocked && <p className="mon-note" data-testid="text-ai-weekly-blocked">Il calendario richiede produzione e budget positivo; il comando programmato va configurato separatamente. Nessun worker esterno è necessario per “Controlla ora”.</p>}
      <ol className="mon-questions">{form.questions.map((q, i) => <li key={q.id} data-testid={`row-ai-question-${q.id}`}>
        <span className="mon-qid">{q.id.toUpperCase()} <small>v{q.version}</small></span>
        <textarea value={q.text} rows={2} maxLength={240} aria-label={`Testo domanda ${q.id}`} aria-invalid={qBad[i]} onChange={e => edit(f => ({ ...f, questions: f.questions.map(x => x.id === q.id ? { ...x, text: e.target.value } : x) }))} data-testid={`input-ai-question-${q.id}`} />
        <div className="mon-qtools">
          <label className="mon-check"><input type="checkbox" checked={q.enabled} onChange={e => edit(f => ({ ...f, questions: f.questions.map(x => x.id === q.id ? { ...x, enabled: e.target.checked } : x) }))} data-testid={`checkbox-ai-question-${q.id}`} /> Attiva</label>
          <button type="button" className="int-small-button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Sposta ${q.id} in alto`} data-testid={`button-ai-up-${q.id}`}><ArrowUp size={12} /></button>
          <button type="button" className="int-small-button" disabled={i === form.questions.length - 1} onClick={() => move(i, 1)} aria-label={`Sposta ${q.id} in basso`} data-testid={`button-ai-down-${q.id}`}><ArrowDown size={12} /></button>
        </div>
      </li>)}</ol>
      <p className="mon-note">Modificare il testo crea una nuova versione lato server: le osservazioni precedenti restano legate alla versione originale.</p>
      <p className="mon-note">Per escludere dati personali, le modifiche ammettono soltanto un vocabolario limitato di argomenti edili e località approvate. Nessun nome, recapito o indirizzo. Le prenotazioni incerte restano impegnate; il limite copre solo questa applicazione, non altri usi delle stesse chiavi.</p>
      <div className="mon-actions">
        <button className="int-primary" type="submit" disabled={save.isPending || !isDirty || budgetBad || qBad.some(Boolean)} data-testid="button-ai-save">{save.isPending ? 'Salvataggio…' : 'Salva impostazioni IA'}</button>
        <button type="button" className="int-small-button" disabled={!!runBlock || start.isPending} onClick={runNow} title={runBlock || undefined} data-testid="button-ai-run"><Play size={13} /> {start.isPending ? 'Avvio…' : 'Controlla ora'}</button>
        {runBlock && <span className="mon-note" data-testid="text-ai-run-block">{runBlock}</span>}
      </div>
    </form>
    {(save.isError || start.isError) && <Notice tone="error">{errorText(save.error || start.error, 'Operazione non riuscita. Nessuna chiamata è considerata eseguita.')}</Notice>}
    {v.campaigns.length > 0 && <div className="mon-table-wrap"><strong>Controlli recenti</strong><ul className="mon-campaigns">{v.campaigns.map(c => <li key={c.id} data-testid={`row-ai-campaign-${c.id}`}><span>{fmtDate(c.at, true)} · {c.state}</span><span className="mon-progress" role="progressbar" aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.completed} aria-label={`Avanzamento ${c.completed} su ${c.total}`}><i style={{ transform: `scaleX(${c.total ? c.completed / c.total : 0})` }} /></span><span>{c.completed}/{c.total}</span></li>)}</ul>{active && <p className="mon-note" data-testid="text-ai-polling">Controllo in corso: lo stato si aggiorna ogni pochi secondi fino al termine.</p>}</div>}
    {v.results.length > 0 && <details className="mon-limits"><summary>Ultimi esiti ({v.results.length})</summary><div className="mon-scroll"><table className="mon-table"><thead><tr><th scope="col">Domanda</th><th scope="col">Fornitore</th><th scope="col">Esito</th><th scope="col">Data</th></tr></thead><tbody>{v.results.map(r => <tr key={r.id}><th scope="row">{r.question.id.toUpperCase()} v{r.question.version}</th><td>{providerNames[r.provider] ?? r.provider}</td><td>{obsStatusLabels[r.status]}</td><td>{fmtDate(r.at, true)}</td></tr>)}</tbody></table></div></details>}
  </section>;
}
