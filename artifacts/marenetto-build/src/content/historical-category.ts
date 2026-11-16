// Pure, SSR-safe extraction of the six recovered CMS category pages into
// presentation data. The archived HTML is only read: every label, excerpt,
// link and image comes from it verbatim (tags stripped, entities decoded), in
// document order. Nothing is invented or translated; absent parts are null/[].
import { plainText } from './historical-home';

/** Italian family keys of the six editorial categories (page.family). */
export const CATEGORY_FAMILIES = new Set([
  '/general-contractor',
  '/edilizia-e-ristrutturazioni',
  '/bonus-edilizi-e-permessi',
  '/cantieri-e-lavori',
  '/outdoor-e-garden-design',
  '/assistenza-e-pronto-intervento',
]);
export const isCategoryFamily = (family: string) => CATEGORY_FAMILIES.has(family);

export type CategoryLink = { href: string; label: string };
export type CategoryArticle = { href: string; title: string; image: string | null; excerpt: string | null; readLabel: string | null };
export type CategoryGroup = { heading: string; links: CategoryLink[] };
export type HistoricalCategory = {
  breadcrumb: { href: string | null; label: string }[];
  articles: CategoryArticle[];
  /** Original "no contents" sentence when the category has no articles. */
  emptyMessage: string | null;
  categories: CategoryGroup | null;
  latest: CategoryGroup | null;
  tags: CategoryGroup | null;
};

const attr = (value: string) => value.replace(/&amp;/g, '&');
const ANCHOR = /<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

export function extractHistoricalCategory(html: string): HistoricalCategory {
  const crumbs = html.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
  const crumbsEnd = crumbs ? crumbs.index! + crumbs[0].length : 0;
  const breadcrumb = crumbs ? Array.from(crumbs[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)).map(li => {
    const href = li[1].match(/<a\b[^>]*\bhref="([^"]+)"/i)?.[1];
    return { href: href ? attr(href) : null, label: plainText(li[1]) };
  }).filter(c => c.label) : [];

  // Widget headings are bare <h4>TEXT</h4>; article headings wrap an anchor.
  const widgets = Array.from(html.matchAll(/<h4\b[^>]*>(?!\s*<a\b)([\s\S]*?)<\/h4>/gi));
  const resultsEnd = widgets[0]?.index ?? html.length;
  const results = html.slice(crumbsEnd, resultsEnd);

  const heads = Array.from(results.matchAll(/<h4\b[^>]*>\s*<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h4>/gi));
  const seen = new Set<string>();
  const articles: CategoryArticle[] = [];
  heads.forEach((h, i) => {
    const href = attr(h[1]);
    if (seen.has(href)) return;
    seen.add(href);
    const before = results.slice(i ? heads[i - 1].index! + heads[i - 1][0].length : 0, h.index!);
    const after = results.slice(h.index! + h[0].length, heads[i + 1]?.index ?? results.length);
    const src = before.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
    const readAt = after.search(/<a\b/i);
    const excerpt = plainText(readAt < 0 ? after : after.slice(0, readAt)) || null;
    const read = readAt < 0 ? null : after.slice(readAt).match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
    articles.push({ href, title: plainText(h[2]), image: src ? attr(src) : null, excerpt, readLabel: read ? plainText(read[1]) || null : null });
  });
  const emptyMessage = articles.length ? null
    : plainText(results.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '') || null;

  const groups: CategoryGroup[] = widgets.map((w, i) => {
    const body = html.slice(w.index! + w[0].length, widgets[i + 1]?.index ?? html.length);
    const links: CategoryLink[] = [];
    for (const a of Array.from(body.matchAll(ANCHOR))) {
      const label = plainText(a[2]);
      if (label) links.push({ href: attr(a[1]), label });
    }
    return { heading: plainText(w[1]), links };
  }).filter(g => g.heading);
  // The archived CMS always orders the side widgets categories, latest, tags.
  return { breadcrumb, articles, emptyMessage, categories: groups[0] ?? null, latest: groups[1] ?? null, tags: groups[2] ?? null };
}
