import { createHash } from 'node:crypto';
import authorization from '../../../../docs/editorial/release-2026-11/deployment-authorization.json';
import privateImports from '../../../../docs/editorial/release-2026-11/private-import-authorization.json';
import { fingerprint, validateContent, revision, transition, event, type EditorialData } from './editorial-content';
import { verifySeries, hasExactEvent, sameEditorialContent, type SeriesSeed, type SeriesAuthorization } from './series-release';
import type { EditorialContent } from '@workspace/api-zod';
import type { Row } from './editorial-store';

type CommercialRecord = SeriesSeed & {
  canonicalPath:string;kind:'article';readOnlySeries?:boolean;allowedBaseHashes:string[];
  candidateContentSHA256:string;sourceContentSHA256:string;presentationSHA256?:string;
  presentation?:unknown;
};
export type DeploymentCatalog = {
  locales:string[];records:SeriesSeed[];seriesDrafts:SeriesSeed[];seriesRelease:SeriesAuthorization;
  deploymentSeries:(SeriesSeed & {seoTitle?:string})[];
  commercialRelease:{id:string;rootSHA256:string;authorization:unknown;records:CommercialRecord[]};
};
const norm=(s:string)=>s.replace(/\/+$/,'')||'/';
const key=(r:{identity:string;locale:string})=>`${r.identity}:${r.locale}`;
export function verifyDeployment(catalog:DeploymentCatalog) {
  verifySeries(catalog.seriesDrafts,catalog.seriesRelease);
  const pack=catalog.commercialRelease;
  if(authorization.id!=='deployment-owner-2026-11-26'||authorization.decisionDate!=='2026-11-26'||
    catalog.seriesRelease.contentDigest!==authorization.seriesDigest||
    fingerprint(catalog.deploymentSeries)!==authorization.seriesPayloadDigest||
    pack?.id!=='editorial-2026-11-26'||pack.rootSHA256!==authorization.commercialDigest||
    fingerprint(pack)!==authorization.commercialPayloadDigest||
    pack.records.length!==182||new Set(pack.records.map(key)).size!==182||
    new Set(pack.records.map(r=>r.identity)).size!==14||
    pack.records.filter(r=>r.readOnlySeries).length!==12)throw new Error('Deploy: autorizzazione/payload non coincidente');
  const privateLocales=['it','en','de','nl','fr','es','pt','pl','ru','ar'];
  if(privateImports.id!=='owner-private-import-reconciliation-2026-11-26'||
    privateImports.decisionDate!=='2026-11-26'||privateImports.decision!=='Autorizza i dieci casi esatti'||
    privateImports.records.length!==10||fingerprint(privateImports.records)!==privateImports.digest||
    authorization.privateImportsDigest!==fingerprint(privateImports)||
    privateLocales.some(locale=>!privateImports.records.some(r=>r.locale===locale&&r.identity==='comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali')))
    throw new Error('Deploy: autorizzazione dei dieci import privati non coincidente');
  for(const record of privateImports.records) {
    const target=deploymentTargets(catalog).find(r=>key(r)===key(record));
    if(!target||target.path!==record.targetPath||fingerprint(validateContent(target.content,catalog.locales))!==record.targetHash)
      throw new Error(`Deploy: destinazione import privato non coincidente ${key(record)}`);
  }
  const locales=['it','en','de','fr','nl','es','pt','ru','pl','sv','no','da','ar'];
  const entries=pack.records.map(r=>[r.identity,r.locale,r.path,r.canonicalPath,r.candidateContentSHA256,r.sourceContentSHA256,r.presentationSHA256??null]);
  if(fingerprint(entries)!==pack.rootSHA256)throw new Error('Deploy: digest radice non coincidente');
  for(const r of pack.records) {
    if(fingerprint(r.content)!==r.candidateContentSHA256||
      fingerprint(validateContent(r.content,locales))!==r.candidateContentSHA256||
      r.sourceContentSHA256!==pack.records.find(s=>s.identity===r.identity&&s.locale==='it')?.candidateContentSHA256||
      (r.presentationSHA256&&fingerprint({presentation:r.presentation,readOnlySeries:r.readOnlySeries})!==r.presentationSHA256)||
      locales.some(locale=>!pack.records.some(s=>s.identity===r.identity&&s.locale===locale)))
      throw new Error(`Deploy: contenuto/sorgente/presentazione non coincidente ${key(r)}`);
  }
  return authorization;
}
// Recreate historical insertion order using the original approved schema.
// jsonb changes key ordering, not array ordering or the original hash algorithm.
function orderedLike(value:unknown, template:unknown):unknown {
  if(Array.isArray(value))return value.map((v,i)=>orderedLike(v,Array.isArray(template)?template[i]??template[0]:undefined));
  if(value&&typeof value==='object') {
    const object=value as Record<string,unknown>, model=template&&typeof template==='object'?template as Record<string,unknown>:{};
    return Object.fromEntries([...Object.keys(model).filter(k=>k in object),...Object.keys(object).filter(k=>!(k in model))].map(k=>[k,orderedLike(object[k],model[k])]));
  }
  return value;
}
export function intactRevision(data:EditorialData,rev:EditorialData['revisions'][number],template:EditorialContent) {
  // New owner approvals also bind a semantic digest; old approvals must
  // reproduce their original hash, never just a plausible actor/tag/event.
  return fingerprint(orderedLike(rev.content,template))===rev.hash ||
    data.events.some(e=>e.action===`semantic-content:${fingerprint(semanticValue(rev.content))}`&&e.revisionId===rev.id&&e.hash===rev.hash&&e.sourceHash===rev.sourceHash);
}
export function semanticValue(value:unknown):unknown {
  return Array.isArray(value)?value.map(semanticValue):value&&typeof value==='object'?
    Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,semanticValue(v)])):value;
}
function withdrawn(data:EditorialData) {
  let i=-1;data.events.forEach((e,index)=>{if(e.action==='withdraw')i=index;});
  return data.withdrawn || i>=0&&!data.events.slice(i+1).some(e=>e.action==='activate');
}
export function deploymentTargets(catalog:DeploymentCatalog) {
  return [...catalog.deploymentSeries,...catalog.commercialRelease.records.filter(r=>!r.readOnlySeries).map(r=>({...r,path:r.canonicalPath}))];
}
function exactPrivateImport(row:Row|undefined) {
  if(!row||row.kind!=='article'||row.data.state!=='draft'||row.data.activeRevisionId||withdrawn(row.data)||
    row.data.revisions.length!==1||row.data.events.length!==1)return undefined;
  const rev=row.data.revisions[0],entry=row.data.events[0];
  return privateImports.records.find(r=>key(r)===key(row)&&norm(r.path)===norm(row.path)&&r.hash===rev.hash&&
    r.sourceHash===rev.sourceHash&&r.contentSHA256===fingerprint(semanticValue(rev.content))&&
    entry.action==='import'&&entry.revisionId===rev.id&&entry.hash===r.hash&&entry.sourceHash===r.importSourceHash);
}
/** Pure complete preflight on cloned rows. Caller persists only after success
 * under the existing transaction/advisory lock. No alternative HTTP boundary. */
export function planDeployment(existing:Row[],catalog:DeploymentCatalog) {
  verifyDeployment(catalog);
  const rows=structuredClone(existing);
  const targets=deploymentTargets(catalog);
  if(targets.length!==290||new Set(targets.map(key)).size!==290||new Set(targets.map(r=>norm(r.path))).size!==290)throw new Error('Deploy: allowlist non univoca');
  const report:{identity:string;locale:string;operation:string;path:string}[]=[];
  if(targets.some(t=>existing.some(r=>key(r)===key(t)&&withdrawn(r.data))))
    return {rows,report:targets.map(t=>({identity:t.identity,locale:t.locale,path:t.path,operation:'blocked-withdrawal'}))};
  const sources=new Map<string,string>();
  const actor=`Sistema automatico; autorizzazione dichiarata dal titolare 2026-11-26; ${authorization.id}; revisione interna assistita da IA, non parere professionale; limiti documentali conservati`;
  for(const target of [...targets].sort((a,b)=>Number(b.locale==='it')-Number(a.locale==='it'))) {
    const original=catalog.seriesDrafts.find(s=>key(s)===key(target));
    const commercial=catalog.commercialRelease.records.find(s=>key(s)===key(target));
    let row=rows.find(s=>key(s)===key(target));
    const reconciled=exactPrivateImport(row);
    const permitted=[target.path,original?.path,commercial?.path,reconciled?.path].filter(Boolean).map(p=>norm(p!));
    if(row&&(row.kind!=='article'||!permitted.includes(norm(row.path))))throw new Error(`Deploy: identità/percorso in conflitto ${key(target)}`);
    const aliases=[...new Set([...(row?.data.aliases??[]),...(original&&norm(original.path)!==norm(target.path)?[original.path]:[]),
      ...(reconciled&&norm(reconciled.path)!==norm(target.path)?[reconciled.path]:[])])];
    const claims=[target.path,...aliases].map(norm);
    if(rows.some(r=>key(r)!==key(target)&&[r.path,...(r.data.aliases??[])].some(p=>claims.includes(norm(p)))))
      throw new Error(`Deploy: collisione percorso/alias ${key(target)}`);
    if(row&&withdrawn(row.data)) {report.push({...target,operation:'withdrawn'});continue;}
    const content=validateContent(target.content,catalog.locales);
    const hash=fingerprint(content);
    const sourceHash=target.locale==='it'?hash:sources.get(target.identity);
    if(!sourceHash)throw new Error(`Deploy: sorgente italiana non attiva ${key(target)}`);
    const active=row?.data.revisions.find(r=>r.id===row!.data.activeRevisionId);
    const validActive=active&&hasExactEvent(row!.data,'approve',active)&&hasExactEvent(row!.data,'activate',active)&&intactRevision(row!.data,active,content);
    let operation='retained';
    if(active&&!validActive)throw new Error(`Deploy: approvazione/integrità attiva non valida ${key(target)}`);
    const base=catalog.records.find(b=>key(b)===key(target));
    const baseHash=base&&fingerprint(validateContent(base.content,catalog.locales));
    const obsoleteBase=validActive&&active.hash!==hash&&(active.hash===baseHash||commercial?.allowedBaseHashes.includes(active.hash));
    if(validActive&&!obsoleteBase) {
      if(active.sourceHash!==(target.locale==='it'?active.hash:sourceHash))throw new Error(`Deploy: traduzione non coincidente con sorgente attiva ${key(target)}`);
      // An exact active revision or a genuinely later approved revision wins
      // over any later draft. No old manuscript is reimported on restart.
      if(target.locale==='it')sources.set(target.identity,active.hash);
    } else {
      const last=row?.data.revisions.at(-1);
      const exact=last&&last.hash===hash&&sameEditorialContent(last.content,content)&&last.sourceHash===sourceHash;
      const untouched=last&&base&&row!.data.revisions.length===1&&
        sameEditorialContent(last.content,validateContent(base.content,catalog.locales))&&
        last.hash===fingerprint(validateContent(base.content,catalog.locales))&&row!.data.events.every(e=>e.action==='import');
      const phase5=last&&commercial?.allowedBaseHashes.includes(last.hash)&&
        intactRevision(row!.data,last,content)&&!row!.data.events.some(e=>e.revisionId===last.id&&['approve','activate','withdraw','restore'].includes(e.action));
      const publicBase=obsoleteBase&&last?.id===active?.id;
      if(last&&!exact&&!untouched&&!phase5&&!publicBase&&!reconciled)throw new Error(`Deploy: revisione candidata successiva da conservare ${key(target)}`);
      const authorizedSource=fingerprint(validateContent(targets.find(s=>s.identity===target.identity&&s.locale==='it')!.content,catalog.locales));
      if(sourceHash!==(target.locale==='it'?hash:authorizedSource))
        throw new Error(`Deploy: sorgente successiva richiede traduzione approvata ${key(target)}`);
      if(!row) {
        row={id:createHash('sha256').update(key(target)).digest('hex').slice(0,32),identity:target.identity,locale:target.locale,path:norm(target.path),kind:'article',version:1,
          data:{state:'draft',historical:false,correction:false,activeRevisionId:null,revisions:[],events:[],originals:[]}};
        rows.push(row);
      }
      const approved=exact?last!:revision(content,sourceHash,actor);
      if(!exact)row.data.revisions.push(approved);
      row.data.state='draft';
      for(const action of ['submit','approve','activate'])transition(row.data,action,approved.id,sourceHash,row.locale,actor,true);
      event(row.data,authorization.id,approved,actor);
      if(reconciled)event(row.data,`${privateImports.id}:${reconciled.hash}`,approved,
        `${actor}; autorizzazione aggiuntiva esplicita: Autorizza i dieci casi esatti; vecchia revisione conservata`);
      operation=reconciled?'activate-reconciled-private-import':'activate';
      if(target.locale==='it')sources.set(target.identity,approved.hash);
    }
    row!.path=norm(target.path);
    if(aliases.length||row!.data.aliases)row!.data.aliases=aliases;
    report.push({identity:target.identity,locale:target.locale,path:target.path,operation});
  }
  return {rows,report};
}
