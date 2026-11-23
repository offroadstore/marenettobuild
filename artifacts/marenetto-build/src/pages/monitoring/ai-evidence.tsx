import { useMemo, useState } from 'react';
import type { AiObservation, AiObservationStatus } from '@workspace/api-client-react';
import { ExternalLink } from 'lucide-react';
import { Notice, fmtDate } from './shared';

export const providerNames: Record<string, string> = { openai: 'OpenAI', gemini: 'Google Gemini', anthropic: 'Anthropic' };
export const obsStatusLabels: Record<AiObservationStatus, string> = {
  mention: 'Menzionata', citation: 'Citata come fonte', absent: 'Assente', ungrounded: 'Senza grounding (escluso)',
  error: 'Errore (escluso)', blocked: 'Bloccata', uncertain: 'Incerta',
};

/** Only http(s) URLs become links; anything else is shown as plain text. */
export function safeHref(u: string): string | null {
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; }
}

export function SafeLink({ url, label }: { url: string; label: string }) {
  const href = safeHref(url);
  if (!href) return <span className="mon-break">{label}</span>;
  return <a className="mon-link mon-break" href={href} target="_blank" rel="noopener noreferrer nofollow" referrerPolicy="no-referrer" data-testid="link-ai-source">{label} <ExternalLink size={11} aria-hidden /></a>;
}

export function MethodNote() {
  return <Notice><span data-testid="text-ai-method">Metodo: domande inviate via API dei fornitori con ricerca web attiva. Non è il ranking delle app consumer, che possono rispondere in modo diverso. Menzioni e citazioni sono contate separatamente. Risposte senza grounding ed errori sono esclusi dal denominatore; il campione valido è indicato dal server. I collegamenti aprono solo il dominio, non la pagina originale: percorsi e titoli sono scartati per privacy.</span></Notice>;
}

export function AiEvidence({ observations }: { observations: AiObservation[] }) {
  const [status, setStatus] = useState<'all' | AiObservationStatus>('all');
  const shown = status === 'all' ? observations : observations.filter(o => o.status === status);
  const { competitors, directories } = useMemo(() => {
    const comp = new Map<string, number>(), dir = new Map<string, number>();
    for (const o of observations) {
      const seenC = new Set<string>(), seenD = new Set<string>();
      for (const s of o.sources) { if (s.kind === 'competitor') seenC.add(s.host); if (s.kind === 'directory') seenD.add(s.host); }
      seenC.forEach(h => comp.set(h, (comp.get(h) ?? 0) + 1)); seenD.forEach(h => dir.set(h, (dir.get(h) ?? 0) + 1));
    }
    const sort = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { competitors: sort(comp), directories: sort(dir) };
  }, [observations]);
  return <section className="int-panel mon-source" aria-labelledby="ai-evidence-title" data-testid="section-ai-evidence">
    <header className="mon-source-head"><div><span className="int-kicker">EVIDENZE IA / OSSERVAZIONI REALI</span><h3 id="ai-evidence-title">Cosa hanno risposto i fornitori</h3></div><span className="int-count-pill">{observations.length} osservazioni</span></header>
    <MethodNote />
    <div className="mon-two">
      <div className="mon-blockers" data-testid="list-ai-competitors"><strong>Concorrenti citati</strong><p className="mon-note">Elenco parziale e indicativo: dominio edilizio e titolo della fonte che dichiara settore e forma societaria. Non è una verifica del registro imprese né una classifica; altre fonti sono omesse per privacy.</p>{competitors.length ? <ul>{competitors.map(([h, n]) => <li key={h}>{h} · in {n} risposte</li>)}</ul> : <p className="mon-note">Nessun concorrente classificato nelle osservazioni.</p>}</div>
      <div className="mon-blockers" data-testid="list-ai-directories"><strong>Directory e portali</strong><p className="mon-note">Tenuti separati dai concorrenti.</p>{directories.length ? <ul>{directories.map(([h, n]) => <li key={h}>{h} · in {n} risposte</li>)}</ul> : <p className="mon-note">Nessuna directory citata.</p>}</div>
    </div>
    {observations.length === 0 ? <div className="int-empty"><span>—</span><strong>Nessuna osservazione</strong><p>Nel periodo non ci sono controlli IA completati. I valori non vengono stimati.</p></div> : <>
      <label className="mon-inline-label">Esito<select value={status} onChange={e => setStatus(e.target.value as typeof status)} data-testid="select-ai-status"><option value="all">Tutti ({observations.length})</option>{(Object.keys(obsStatusLabels) as AiObservationStatus[]).map(s => <option key={s} value={s}>{obsStatusLabels[s]}</option>)}</select></label>
      <ol className="mon-obs">{shown.map(o => <li key={o.id} className={`mon-obs-item st-${o.status}`} data-testid={`card-ai-observation-${o.id}`}>
        <div className="mon-obs-head"><span className="mon-state">{obsStatusLabels[o.status]}</span><b>{o.question.id.toUpperCase()} v{o.question.version}</b><span className="mon-note">{providerNames[o.provider] ?? o.provider} · {o.model} · {o.method} · {fmtDate(o.at, true)}</span></div>
        <p className="mon-obs-q">{o.question.text}</p>
        <div className="mon-chips"><span className={`mon-chip ${o.mentioned ? 'ok' : ''}`}>Menzione: {o.mentioned ? 'sì' : 'no'}</span><span className={`mon-chip ${o.cited ? 'ok' : ''}`}>Citazione: {o.cited ? 'sì' : 'no'}</span><span className={`mon-chip ${o.grounded ? 'ok' : 'no'}`}>Grounding: {o.grounded ? 'sì' : 'no'}</span></div>
        {o.excerpt && <blockquote className="mon-excerpt">{o.excerpt}</blockquote>}
        {o.sources.length > 0 && <ul className="mon-obs-src">{o.sources.map((s, i) => <li key={`${s.url}-${i}`}><span className={`mon-kind k-${s.kind}`}>{s.kind === 'brand' ? 'nostro sito' : s.kind === 'competitor' ? 'concorrente' : s.kind === 'directory' ? 'directory' : 'non classificata'}</span><SafeLink url={s.url} label={s.host || s.url} /></li>)}</ul>}
      </li>)}</ol>
    </>}
  </section>;
}
