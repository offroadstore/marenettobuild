import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMonitoring, getGetMonitoringQueryKey, useStartMonitoringGoogle, useDisconnectMonitoringGoogle,
  useListMonitoringProperties, getListMonitoringPropertiesQueryKey, useSelectMonitoringProperty,
  useVerifyMonitoringService, useSaveMonitoringTags,
  type GoogleReportService, type MonitoringService, type MonitoringSettings,
} from '@workspace/api-client-react';
import { Link2, LockKeyhole, RefreshCw, ShieldCheck, Unlink } from 'lucide-react';
import { DASHBOARD_KEY_PREFIX, Notice, StateBadge, errorText, fmtDate, serviceNames, stateHelp } from './shared';
import './monitoring.css';

const callbackMessages: Record<string, { tone: 'ok' | 'warn' | 'error'; text: string }> = {
  connected: { tone: 'ok', text: 'Account Google collegato in sola lettura. Scegliere ora le proprietà da leggere.' },
  cancelled: { tone: 'warn', text: 'Collegamento annullato. Nessuna autorizzazione è stata salvata.' },
  failed: { tone: 'error', text: 'Il collegamento con Google non è riuscito. Nessun dato è stato importato; riprovare.' },
};

export function MonitoringPanel() {
  const qc = useQueryClient();
  const settings = useGetMonitoring({ query: { queryKey: getGetMonitoringQueryKey(), retry: false, staleTime: 60_000, refetchOnMount: true } });
  const [flash, setFlash] = useState<{ tone: 'ok' | 'warn' | 'error' | 'info'; text: string } | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const g = url.searchParams.get('google');
    if (g) {
      setFlash(callbackMessages[g] ?? { tone: 'warn', text: 'Esito del collegamento non riconosciuto.' });
      url.searchParams.delete('google');
      url.searchParams.set('section', 'monitoring');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      void qc.invalidateQueries({ queryKey: getGetMonitoringQueryKey() });
    }
  }, [qc]);
  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: getGetMonitoringQueryKey() });
    void qc.invalidateQueries({ queryKey: DASHBOARD_KEY_PREFIX });
    (['ga4', 'searchConsole'] as const).forEach(s => void qc.invalidateQueries({ queryKey: getListMonitoringPropertiesQueryKey(s) }));
  };
  const s = settings.data;
  return <div className="int-content mon-root">
    <div className="int-section-intro"><div><span className="int-kicker">MONITORAGGIO / FONTI</span><h2>Da dove arrivano i numeri.</h2><p>Autorizzazioni in sola lettura, identificativi pubblici e verifiche sul sito attuale. Nessuno script di tracciamento viene caricato.</p></div>{s && <span className="int-count-pill"><ShieldCheck size={14} /> {s.canManage ? 'Gestione: titolare' : 'Sola consultazione'} · {s.environment === 'production' ? 'produzione' : 'sviluppo'}</span>}</div>
    {flash && <Notice tone={flash.tone}>{flash.text} <button className="int-text-button" onClick={() => setFlash(null)} data-testid="button-dismiss-flash">Chiudi</button></Notice>}
    {settings.isLoading && <><div className="int-skeleton wide" /><div className="int-skeleton" /></>}
    {settings.isError && <Notice tone="error">{errorText(settings.error, 'Impossibile leggere la configurazione del monitoraggio.')} <button className="int-small-button" onClick={() => settings.refetch()} data-testid="button-monitoring-retry"><RefreshCw size={13} /> Riprova</button></Notice>}
    {s && <>
      <Connection s={s} onChanged={invalidateAll} setFlash={setFlash} />
      <div className="mon-two">{s.services.map(svc => <ServiceCard key={svc.service} svc={svc} s={s} onChanged={invalidateAll} setFlash={setFlash} />)}</div>
      <TagsForm s={s} onChanged={invalidateAll} setFlash={setFlash} />
      <Discovery s={s} />
    </>}
  </div>;
}

type Flash = (f: { tone: 'ok' | 'warn' | 'error' | 'info'; text: string } | null) => void;

function Connection({ s, onChanged, setFlash }: { s: MonitoringSettings; onChanged: () => void; setFlash: Flash }) {
  const start = useStartMonitoringGoogle();
  const disconnect = useDisconnectMonitoringGoogle();
  return <section className="int-panel mon-block" aria-labelledby="mon-conn"><div className="mon-source-head"><div><span className="int-kicker">AUTORIZZAZIONE DI LETTURA</span><h3 id="mon-conn">Account Google</h3></div><span className={`mon-state ${s.connected ? 's-ready' : 's-disconnected'}`} data-testid="status-google-connection">{s.connected ? 'Collegato' : 'Non collegato'}</span></div>
    <p className="mon-copy">Il collegamento autorizza soltanto la lettura dei report di Analytics e Search Console. È diverso dagli identificativi di misurazione qui sotto, e diverso dal consenso dei visitatori: il consenso al contatto nel modulo non è consenso all’analisi statistica.</p>
    {!s.oauthConfigured && <Notice>La connessione Google non è ancora configurata sul server. La dashboard resta utilizzabile con i soli dati operativi.</Notice>}
    {!s.canManage && <Notice><LockKeyhole size={14} /> Solo il titolare può collegare, scollegare o modificare le fonti.</Notice>}
    {(start.isError || disconnect.isError) && <Notice tone="error">{errorText(start.error || disconnect.error, 'Operazione non riuscita. Riprovare.')}</Notice>}
    {s.canManage && <div className="mon-actions">
      {!s.connected && <button className="int-primary" disabled={!s.oauthConfigured || start.isPending} onClick={() => { if (!start.isPending) start.mutate(undefined, { onSuccess: ({ url }) => window.location.assign(url) }); }} data-testid="button-google-connect"><Link2 size={14} /> {start.isPending ? 'Apertura di Google…' : 'Collega Google in sola lettura'}</button>}
      {s.connected && <button className="int-small-button" disabled={!s.oauthConfigured || start.isPending} onClick={() => { if (start.isPending) return; if (!window.confirm('Ricollegare Google? Verrà richiesta di nuovo l’autorizzazione in sola lettura e le proprietà selezionate verranno azzerate: andranno scelte di nuovo.')) return; start.mutate(undefined, { onSuccess: ({ url }) => window.location.assign(url) }); }} data-testid="button-google-reconnect"><RefreshCw size={14} /> {start.isPending ? 'Apertura di Google…' : 'Ricollega Google'}</button>}
      {s.connected && <button className="int-small-button danger" disabled={disconnect.isPending} onClick={() => { if (!window.confirm('Scollegare l’account Google? I report Google smetteranno di aggiornarsi finché non verrà ricollegato.')) return; disconnect.mutate(undefined, { onSuccess: r => { setFlash({ tone: 'ok', text: r.message || 'Account scollegato.' }); onChanged(); } }); }} data-testid="button-google-disconnect"><Unlink size={14} /> {disconnect.isPending ? 'Scollegamento…' : 'Scollega'}</button>}
    </div>}
  </section>;
}

function ServiceCard({ svc, s, onChanged, setFlash }: { svc: MonitoringService; s: MonitoringSettings; onChanged: () => void; setFlash: Flash }) {
  const service = svc.service as GoogleReportService;
  const props = useListMonitoringProperties(service, { query: { queryKey: getListMonitoringPropertiesQueryKey(service), enabled: s.canManage && s.connected, retry: false, staleTime: 5 * 60_000 } });
  const select = useSelectMonitoringProperty();
  const verify = useVerifyMonitoringService();
  const [choice, setChoice] = useState('');
  const current = choice || svc.property || '';
  const err = select.error || verify.error;
  return <section className="int-panel mon-block" aria-labelledby={`svc-${service}`} data-testid={`card-service-${service}`}>
    <div className="mon-source-head"><div><span className="int-kicker">FONTE DI REPORT</span><h3 id={`svc-${service}`}>{serviceNames[service]}</h3></div><StateBadge state={svc.state} /></div>
    <p className="mon-copy">{stateHelp[svc.state]}</p>
    <dl className="mon-meta"><div><dt>Proprietà</dt><dd>{svc.property || 'nessuna'}</dd></div><div><dt>Ultima verifica</dt><dd>{fmtDate(svc.lastCheckedAt, true)}</dd></div><div><dt>Ultimo successo</dt><dd>{fmtDate(svc.lastSuccessAt, true)}</dd></div></dl>
    {svc.error && <Notice tone="warn">L’ultima verifica ha segnalato un problema. Stato attuale: {stateHelp[svc.state]}</Notice>}
    {err && <Notice tone="error">{errorText(err, 'Operazione non riuscita. Riprovare.')}</Notice>}
    {s.canManage && s.connected && <div className="mon-prop">
      {props.isLoading && <div className="int-skeleton" />}
      {props.isError && <Notice tone="error">{errorText(props.error, 'Impossibile elencare le proprietà disponibili.')} <button className="int-text-button" onClick={() => props.refetch()}>Riprova</button></Notice>}
      {props.data && (props.data.length ? <label>Proprietà da leggere<select value={current} onChange={e => setChoice(e.target.value)} data-testid={`select-property-${service}`}><option value="">Scegliere…</option>{props.data.map(p => <option key={p.id} value={p.id}>{p.label} · {p.timezone}</option>)}</select></label> : <p className="mon-note">L’account collegato non ha proprietà accessibili per questa fonte.</p>)}
      <div className="mon-actions">
        <button className="int-primary" disabled={!current || current === svc.property || select.isPending} onClick={() => select.mutate({ service, data: { property: current } }, { onSuccess: r => { setChoice(''); setFlash({ tone: 'ok', text: r.message || 'Proprietà salvata.' }); onChanged(); } })} data-testid={`button-save-property-${service}`}>{select.isPending ? 'Salvataggio…' : 'Salva proprietà'}</button>
        <button className="int-small-button" disabled={!svc.property || verify.isPending} onClick={() => verify.mutate({ service }, { onSuccess: r => { setFlash({ tone: 'ok', text: r.message || 'Verifica completata.' }); onChanged(); } })} data-testid={`button-verify-${service}`}><RefreshCw size={13} /> {verify.isPending ? 'Verifica…' : 'Verifica accesso'}</button>
      </div>
    </div>}
  </section>;
}

const TAG_RE = { measurementId: /^(|G-[A-Z0-9]{4,20})$/, containerId: /^(|GTM-[A-Z0-9]{4,20})$/ };

function TagsForm({ s, onChanged, setFlash }: { s: MonitoringSettings; onChanged: () => void; setFlash: Flash }) {
  const save = useSaveMonitoringTags();
  const [form, setForm] = useState(s.tags);
  const dirty = useRef({ measurementId: false, containerId: false });
  useEffect(() => {
    setForm(f => ({ measurementId: dirty.current.measurementId ? f.measurementId : s.tags.measurementId, containerId: dirty.current.containerId ? f.containerId : s.tags.containerId }));
  }, [s.tags.measurementId, s.tags.containerId]);
  const invalid = { measurementId: !TAG_RE.measurementId.test(form.measurementId), containerId: !TAG_RE.containerId.test(form.containerId) };
  const unchanged = form.measurementId === s.tags.measurementId && form.containerId === s.tags.containerId;
  const set = (k: 'measurementId' | 'containerId', v: string) => { dirty.current[k] = true; setForm(f => ({ ...f, [k]: v.trim().toUpperCase() })); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (save.isPending || invalid.measurementId || invalid.containerId || unchanged) return;
    const sent = { ...form };
    save.mutate({ data: sent }, { onSuccess: r => { dirty.current = { measurementId: false, containerId: false }; setFlash({ tone: 'ok', text: r.message || 'Identificativi salvati.' }); onChanged(); }, onError: () => setForm(sent) });
  };
  return <section className="int-panel mon-block" aria-labelledby="mon-tags">
    <div className="mon-source-head"><div><span className="int-kicker">IDENTIFICATIVI PUBBLICI</span><h3 id="mon-tags">Misurazione sul sito</h3></div><span className="mon-state s-not_configured" data-testid="status-tracking">Tracciamento disattivato</span></div>
    <p className="mon-copy">Sono codici pubblici, non credenziali. Salvarli registra solo la configurazione: nessuno script viene caricato sul sito. Il contenitore GTM non è una fonte di report.</p>
    <p className="mon-note">Ultimo aggiornamento della configurazione servizi: {fmtDate(s.updatedAt, true)}. Per GTM è verificato solo il formato dell’identificativo; nessun collegamento o controllo dei tag installati è dichiarato riuscito.</p>
    <form className="mon-tags" onSubmit={submit}>
      <label>ID misurazione GA4<input value={form.measurementId} onChange={e => set('measurementId', e.target.value)} disabled={!s.canManage || save.isPending} placeholder="G-XXXXXXX" maxLength={23} aria-invalid={invalid.measurementId} aria-describedby="tag-ga-help" spellCheck={false} autoComplete="off" data-testid="input-measurement-id" /><small id="tag-ga-help">{invalid.measurementId ? 'Formato atteso: G- seguito da 4–20 lettere maiuscole o cifre.' : 'Lasciare vuoto se non usato.'}</small></label>
      <label>ID contenitore GTM<input value={form.containerId} onChange={e => set('containerId', e.target.value)} disabled={!s.canManage || save.isPending} placeholder="GTM-XXXXXX" maxLength={24} aria-invalid={invalid.containerId} aria-describedby="tag-gtm-help" spellCheck={false} autoComplete="off" data-testid="input-container-id" /><small id="tag-gtm-help">{invalid.containerId ? 'Formato atteso: GTM- seguito da 4–20 lettere maiuscole o cifre.' : 'Lasciare vuoto se non usato.'}</small></label>
      {s.canManage && <button className="int-primary" type="submit" disabled={save.isPending || unchanged || invalid.measurementId || invalid.containerId} data-testid="button-save-tags">{save.isPending ? 'Salvataggio…' : 'Salva configurazione'}</button>}
    </form>
    {save.isError && <Notice tone="error">{errorText(save.error, 'Identificativi non salvati. Controllare il formato e riprovare.')}</Notice>}
    <div className="mon-blockers"><strong>Perché il tracciamento resta spento</strong>{s.trackingBlockers.length ? <ul>{s.trackingBlockers.map(b => <li key={b}>{b}</li>)}</ul> : <p className="mon-note">Nessun motivo indicato dal server; il tracciamento resta comunque disattivato.</p>}</div>
  </section>;
}

function Discovery({ s }: { s: MonitoringSettings }) {
  const d = s.discovery;
  return <section className="int-panel mon-block" aria-labelledby="mon-disc">
    <div className="mon-source-head"><div><span className="int-kicker">VERIFICA STATICA DEL SITO ATTUALE</span><h3 id="mon-disc">Cosa abbiamo trovato</h3></div></div>
    <dl className="mon-meta"><div><dt>Pagina controllata</dt><dd className="mon-break">{d.url}</dd></div><div><dt>Data del controllo</dt><dd>{fmtDate(d.checkedAt, true)}</dd></div></dl>
    {d.findings.length ? <ul className="mon-findings">{d.findings.map(f => <li key={f}>{f}</li>)}</ul> : <p className="mon-note">Nessun elemento rilevato.</p>}
    <Notice>Framework360 rilevato sul sito attuale non significa che i suoi dati siano stati migrati qui. Se non compaiono identificativi GA o GTM, non è una prova definitiva della loro assenza: il controllo legge solo l’HTML statico.</Notice>
    {d.limitations && <p className="mon-note">{d.limitations}</p>}
  </section>;
}
