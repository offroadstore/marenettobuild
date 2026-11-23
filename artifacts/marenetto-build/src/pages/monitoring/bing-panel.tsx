import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetBingSettings, getGetBingSettingsQueryKey, useListBingSites, getListBingSitesQueryKey, useSaveBingSettings } from '@workspace/api-client-react';
import { KeyRound, ListChecks, RefreshCw } from 'lucide-react';
import { DASHBOARD_KEY_PREFIX, Notice, errorText } from './shared';

type Flash = (f: { tone: 'ok' | 'warn' | 'error' | 'info'; text: string } | null) => void;

/** Mounted only when MonitoringSettings.canManage is true. Sites are fetched only on explicit click. */
export function BingPanel({ setFlash }: { setFlash: Flash }) {
  const qc = useQueryClient();
  const b = useGetBingSettings({ query: { queryKey: getGetBingSettingsQueryKey(), retry: false, staleTime: 60_000 } });
  const sites = useListBingSites({ query: { queryKey: getListBingSitesQueryKey(), enabled: false, retry: false } });
  const save = useSaveBingSettings();
  const [choice, setChoice] = useState('');
  const s = b.data;
  const current = choice || s?.property || '';
  return <section className="int-panel mon-block" aria-labelledby="mon-bing" data-testid="section-bing-settings">
    <div className="mon-source-head"><div><span className="int-kicker">FONTE MICROSOFT / RICERCA</span><h3 id="mon-bing">Bing Webmaster Tools</h3></div>{s && <span className={`mon-state ${s.configured ? 's-ready' : 's-not_configured'}`} data-testid="status-bing">{s.configured ? 'Configurato' : 'Non configurato'}</span>}</div>
    {b.isLoading && <div className="int-skeleton" />}
    {b.isError && <Notice tone="error">{errorText(b.error, 'Impossibile leggere la configurazione Bing.')} <button className="int-text-button" onClick={() => b.refetch()} data-testid="button-bing-retry">Riprova</button></Notice>}
    {s && <>
      <dl className="mon-meta"><div><dt>Sito selezionato</dt><dd className="mon-break" data-testid="text-bing-property">{s.property || 'nessuno'}</dd></div></dl>
      <Notice><KeyRound size={14} /> <span data-testid="text-bing-instructions">{s.instructions || 'La chiave API Bing si imposta solo nei Secrets del progetto, mai in questa pagina.'}</span></Notice>
      <div className="mon-prop">
        <div className="mon-actions"><button className="int-small-button" disabled={!s.configured || sites.isFetching} onClick={() => void sites.refetch()} data-testid="button-bing-load-sites"><ListChecks size={13} /> {sites.isFetching ? 'Caricamento…' : 'Carica siti verificati'}</button></div>
        {sites.isError && <Notice tone="error">{errorText(sites.error, 'Impossibile elencare i siti verificati.')} <button className="int-text-button" onClick={() => void sites.refetch()}><RefreshCw size={12} /> Riprova</button></Notice>}
        {sites.data && (sites.data.length ? <label>Sito da leggere<select value={current} onChange={e => setChoice(e.target.value)} data-testid="select-bing-site"><option value="">Scegliere…</option>{sites.data.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label> : <p className="mon-note">Nessun sito verificato per questa chiave.</p>)}
        {sites.data && <div className="mon-actions"><button className="int-primary" disabled={!current || current === s.property || save.isPending} onClick={() => save.mutate({ data: { property: current } }, { onSuccess: r => { setChoice(''); setFlash({ tone: 'ok', text: r.message || 'Sito Bing salvato.' }); void qc.invalidateQueries({ queryKey: getGetBingSettingsQueryKey() }); void qc.invalidateQueries({ queryKey: DASHBOARD_KEY_PREFIX }); } })} data-testid="button-bing-save">{save.isPending ? 'Salvataggio…' : 'Salva sito'}</button></div>}
        {save.isError && <Notice tone="error">{errorText(save.error, 'Sito non salvato. Riprovare.')}</Notice>}
      </div>
    </>}
  </section>;
}

export function MetaUnavailable() {
  return <section className="int-panel mon-block" aria-labelledby="mon-meta-src" data-testid="section-meta">
    <div className="mon-source-head"><div><span className="int-kicker">FONTE SOCIAL</span><h3 id="mon-meta-src">Meta</h3></div><span className="mon-state s-not_configured" data-testid="status-meta">Non configurata</span></div>
    <p className="mon-copy">Nessuna integrazione Meta è attiva: non vengono letti né mostrati dati da Facebook o Instagram.</p>
  </section>;
}
