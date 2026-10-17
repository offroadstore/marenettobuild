import { useEffect } from 'react';

export type PageMeta = { title: string; description: string; path: string; type?: 'website' | 'article'; lang?: string };

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

export function usePageMeta({ title, description, path, type = 'website', lang = 'it' }: PageMeta) {
  useEffect(() => {
    document.title = title;
    document.documentElement.lang = lang;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const href = `${window.location.origin}${base}${path}`;
    setMeta('property', 'og:url', href);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', href);
  }, [title, description, path, type, lang]);
}
