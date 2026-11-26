// Runs ONLY in an already authenticated owner browser, using the existing CMS.
// No cookie, key, owner identity or release-gate bypass is accepted as input.
export async function applyRelease({pack,transport,apply=false,digest=sha256,onProgress=()=>{}}) {
  if(pack.id!=='editorial-2026-11-26'||pack.records.length!==182) throw new Error('Pacchetto editoriale non valido.');
  const root = await digest(pack.records.map(r=>[r.identity,r.locale,r.path,r.canonicalPath,r.candidateContentSHA256,r.sourceContentSHA256,r.presentationSHA256??null]));
  if(root!==pack.rootSHA256) throw new Error('Impronta del pacchetto diversa.');
  const ordered = [...pack.records].sort((a,b)=>(a.locale==='it'?0:1)-(b.locale==='it'?0:1));
  const key = r => `${r.identity}:${r.locale}`;
  const summaries = await transport('/internal/editorial');
  const publicActive = await transport('/editorial/active');
  const plan = [];
  const norm = p=>p.replace(/\/+$/,'');
  // Preflight the WHOLE package before the first write. Later mutations still
  // use server version checks; any conflict stops rather than overwriting.
  for(const r of ordered) {
    if(r.presentationSHA256&&(!r.presentation||await digest({presentation:r.presentation,readOnlySeries:r.readOnlySeries})!==r.presentationSHA256))throw new Error(`Presentazione alterata: ${key(r)}`);
    if(await digest(r.content)!==r.candidateContentSHA256) throw new Error(`Testo alterato: ${key(r)}`);
    const italian=pack.records.find(s=>s.identity===r.identity&&s.locale==='it');
    if(r.sourceContentSHA256!==italian?.candidateContentSHA256) throw new Error(`Sorgente diversa: ${key(r)}`);
    const summary=summaries.find(s=>key(s)===key(r));
    if(!summary && r.mode==='revise-existing') throw new Error(`Famiglia storica mancante: ${key(r)}`);
    if(summaries.some(s=>key(s)!==key(r)&&norm(s.path)===norm(r.path))) throw new Error(`Collisione: ${r.path}`);
    if(publicActive.some(s=>key(s)!==key(r)&&[s.path,...(s.aliases??[])].some(p=>norm(p)===norm(r.path))))
      throw new Error(`Collisione con percorso o alias attivo: ${r.path}`);
    const existing=summary ? await transport(`/internal/editorial/${summary.id}`) : null;
    if(existing && (norm(existing.path)!==norm(r.path)||existing.kind!==r.kind)) throw new Error(`Percorso storico diverso: ${key(r)}`);
    const last=existing?.revisions.at(-1);
    if(r.readOnlySeries&&(!last||last.hash!==r.candidateContentSHA256||existing.activeRevisionId!==last.id||existing.state!=='active'||last.sourceHash!==r.sourceContentSHA256))
      throw new Error(`Revisione successiva della serie da conservare/confrontare: ${key(r)}`);
    if(last && last.hash!==r.candidateContentSHA256) {
      const imported = /^(?:Importazione catalogo; nessuna approvazione|Fase 5 — bozza IA, nessuna approvazione)$/.test(last.actor);
      const approved = existing.events.some(e=>e.revisionId===last.id&&['approve','activate','withdraw','restore'].includes(e.action));
      if(!imported||approved||!r.allowedBaseHashes.includes(last.hash)) throw new Error(`Revisione successiva da confrontare nel CMS: ${key(r)}`);
    }
    const lastWithdrawal=existing?.events.findLastIndex(e=>e.action==='withdraw')??-1;
    const explicitlyResumed=lastWithdrawal>=0&&existing.events.slice(lastWithdrawal+1).some(e=>['restore','activate'].includes(e.action));
    // A withdrawal can refer to the previously active revision, not the latest
    // draft. Saving/submitting that draft must not silently cancel the tombstone.
    if(existing?.withdrawn || (lastWithdrawal>=0&&!explicitlyResumed)) throw new Error(`Ritiro da rispettare: ${key(r)}`);
    plan.push({record:r,existing});
  }
  const report=[];
  for(const {record:r,existing} of plan) {
    if(!apply) {report.push({identity:r.identity,locale:r.locale,operation:r.readOnlySeries?'retain-active-series':existing?'compare-and-append':'create',active:Boolean(r.readOnlySeries)});continue;}
    let row=existing;
    // Never save from a stale preflight version. Even an identical-text newer
    // revision requires explicit reconciliation, not silent acceptance.
    if(row) {
      const current=await transport(`/internal/editorial/${row.id}`);
      if(current.version!==row.version) throw new Error(`Conflitto prima del salvataggio: ${key(r)}`);
    }
    if(!row) row=await transport('/internal/editorial','POST',{identity:r.identity,locale:r.locale,path:r.path,kind:r.kind,content:r.content});
    else if(row.revisions.at(-1).hash!==r.candidateContentSHA256) row=await transport(`/internal/editorial/${row.id}`,'PUT',{version:row.version,content:r.content});
    const rev=row.revisions.at(-1);
    if(rev.hash!==r.candidateContentSHA256||rev.sourceHash!==r.sourceContentSHA256) throw new Error(`Revisione/sorgente non corrispondente: ${key(r)}`);
    if(row.activeRevisionId!==rev.id||row.state!=='active') {
      if(row.state==='draft') row=await act('submit');
      if(row.state==='review') row=await act('approve');
      if(row.state==='approved') row=await act('activate');
    }
    if(row.activeRevisionId!==rev.id||row.state!=='active') throw new Error(`Non attiva: ${key(r)}`);
    const receipt={identity:r.identity,locale:r.locale,path:row.path,canonicalPath:r.canonicalPath,revisionId:rev.id,hash:rev.hash,sourceHash:rev.sourceHash,retainedExistingSeries:Boolean(r.readOnlySeries),presentationHash:r.presentationSHA256??null,
      state:row.state,authorization:pack.authorization,events:row.events.filter(e=>e.revisionId===rev.id)};
    report.push(receipt); onProgress(receipt,report.length);
    async function act(action) {
      return transport(`/internal/editorial/${row.id}/action`,'POST',{version:row.version,revisionId:rev.id,action});
    }
  }
  return {rootSHA256:pack.rootSHA256,mode:apply?'owner-authenticated-activation':'read-only-preflight',report};
}
async function sha256(value) {
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function ownerBrowserTransport(path,method='GET',body) {
  const response=await fetch(`/api${path}`,{method,credentials:'same-origin',cache:'no-store',
    headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();
  if(!response.ok) throw new Error(`${response.status}: ${data.error??'Operazione rifiutata'}`);
  return data;
}
