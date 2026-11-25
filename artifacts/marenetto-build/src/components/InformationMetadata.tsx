import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { editionByPath } from '@/localization/edition-inventory';
import { updateStructuredData } from '@/lib/structured-data';
import { applyPublicReleaseMetadata, PUBLIC_SITE_ORIGIN } from '@/lib/public-release-meta';
import { useActiveEditorial } from '@/lib/editorial-runtime';
import { getLocaleDirection } from '@/localization/locales';

/** Exact new edition paths: do not apply the legacy article-path rewrite. */
export function InformationMetadata({lang}: {lang:string}) {
  const [path] = useLocation();
  const active = useActiveEditorial();
  useEffect(()=>{
    // The release metadata path may return early; language must still follow
    // client navigation, not just the document's server-rendered first route.
    document.documentElement.lang=lang === 'it' ? 'it-IT' : lang;
    document.documentElement.dir=getLocaleDirection(lang);
    if (applyPublicReleaseMetadata(path,active)) return;
    const edition=editionByPath.get(path.replace(/\/+$/,''));
    if(!edition) return;
    document.title=edition.title;
    const set=(attr:string,key:string,value:string)=>{
      let element=document.head.querySelector(`meta[${attr}="${key}"]`);
      if(!element){element=document.createElement('meta');element.setAttribute(attr,key);document.head.appendChild(element);}
      element.setAttribute('content',value);
    };
    set('name','robots','noindex, nofollow');
    for(const prefix of ['og','twitter']) {
      const attr=prefix==='og'?'property':'name';
      set(attr,`${prefix}:title`,edition.title);set(attr,`${prefix}:description`,edition.description);
    }
    set('name','description',edition.description);
    set('property','og:url',PUBLIC_SITE_ORIGIN+edition.path);
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link=>link.remove());
    let canonical=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}
    canonical.href=PUBLIC_SITE_ORIGIN+edition.path;
    updateStructuredData(edition,PUBLIC_SITE_ORIGIN);
  },[path,lang,active]);
  return null;
}
