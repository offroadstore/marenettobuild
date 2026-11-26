import inventory from './commercial-release-index.json' with {type:'json'};
const byKey = new Map(inventory.records.map(r=>[`${r.identity}:${r.locale}`,r]));
const norm=p=>p.replace(/\/+$/,'')||'/';
export const RELEASE_IMAGE='/media/editorial/project-diagram.png';
export function commercialRecord(live) {
  const r=byKey.get(`${live.identity}:${live.locale}`);
  return r && live.revisionId!=='withdrawn' && live.revisionHash===r.hash &&
    live.sourceHash===r.sourceHash && norm(live.path)===norm(r.path) &&
    (r.readOnlySeries || live.content?.tags?.includes(inventory.id)) ? r : undefined;
}
export function commercialEntries(active) {
  const italian = new Map(active.filter(live=>live.locale==='it'&&commercialRecord(live)).map(live=>[live.identity,live.revisionHash]));
  return active.flatMap(live=>{
    const r=commercialRecord(live);
    if(!r||(live.locale!=='it'&&italian.get(live.identity)!==live.sourceHash)) return [];
    return [{
      id:live.identity,locale:live.locale,path:r.path,kind:'article',
      title:r.presentation?.seoTitle??live.content.seoTitle,description:r.presentation?.seoDescription??live.content.seoDescription,
      contentLanguage:live.content.contentLanguage,visibleTitle:live.content.title,
      visibleImage:r.readOnlySeries?live.content.image:RELEASE_IMAGE,activeEditorialRevision:live.revisionId,
      activeSeoTitle:true,activeSeoDescription:true,translationSourceStale:false,
      source:'active-editorial:authorized-commercial-release',commercialRelease:inventory.id,
      editorialBody:r.presentation?.body??live.content.body,editorialFAQ:r.presentation?.faq,preparedAt:r.preparedAt,
      revisionCreatedAt:live.revisionCreatedAt,
      state:'published',approval:'Owner-declared internal authorization 2026-11-26; exact revision activated by owner',
      sitemap:true,
    }];
  });
}
export const releaseSourceLabels={
  it:'Fonti',en:'Sources',de:'Quellen',fr:'Sources',nl:'Bronnen',es:'Fuentes',pt:'Fontes',
  ru:'Источники',pl:'Źródła',sv:'Källor',no:'Kilder',da:'Kilder',ar:'المصادر',
};
export function commercialFAQ(body,retained) {
  if(retained)return retained;
  const block=body.match(/<section id="release-faq">([\s\S]*?)<\/section>/)?.[1];
  if(!block) return [];
  const text=s=>s.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').trim();
  return [...block.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)]
    .map(m=>({question:text(m[1]),answer:text(m[2])}));
}
