// Pure, SSR-safe extraction of the recovered CMS homepage into presentation
// data. The archived HTML is only read; every text comes from it verbatim
// (tags stripped, entities decoded). Nothing is invented: absent parts are null.

export type HomeArticle = { href: string; title: string; image: string | null; date: string | null };
export type HistoricalHome = {
  intro: { heading: string; paragraphs: string[] } | null;
  support: string | null;
  articles: HomeArticle[];
  news: { heading: string; subtitle: string | null; readLabel: string | null } | null;
  story: { heading: string; text: string; link: { href: string; label: string } | null } | null;
  reviews: { heading: string; names: string[] } | null;
};

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', hellip: '\u2026', ndash: '\u2013', mdash: '\u2014', reg: '\u00ae', egrave: '\u00e8', agrave: '\u00e0', ugrave: '\u00f9', ograve: '\u00f2', igrave: '\u00ec', eacute: '\u00e9' };
export function plainText(html: string): string {
  return html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (all, code: string) => code[0] === '#'
      ? String.fromCodePoint(parseInt(code[1].toLowerCase() === 'x' ? code.slice(2) : code.slice(1), code[1].toLowerCase() === 'x' ? 16 : 10))
      : ENTITIES[code.toLowerCase()] ?? all)
    .replace(/image\/svg\+xml/g, ' ').replace(/\s+/g, ' ').trim();
}
const attr = (value: string) => value.replace(/&amp;/g, '&');

type Hit = { index: number; end: number; inner: string };
function all(html: string, re: RegExp): (Hit & { m: RegExpExecArray })[] {
  const out: (Hit & { m: RegExpExecArray })[] = [];
  for (const m of Array.from(html.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')))) out.push({ index: m.index!, end: m.index! + m[0].length, inner: m[1] ?? '', m: m as RegExpExecArray });
  return out;
}

export function extractHistoricalHome(source: string): HistoricalHome {
  const html = source.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, '');
  const h2s = all(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi).map(h => ({ ...h, text: plainText(h.inner) })).filter(h => h.text);
  const cardHeads = all(html, /<h([45])\b[^>]*>\s*<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h\1>/gi);

  // Articles: each href once, in first-seen order.
  const byHref = new Map<string, HomeArticle>();
  for (const h of cardHeads) {
    const href = attr(h.m[2]);
    if (!byHref.has(href)) byHref.set(href, { href, title: plainText(h.m[3]), image: null, date: null });
  }
  // Thumbnails: an <img src> inside a <picture> belongs to the next card heading.
  for (const pic of all(html, /<picture\b[^>]*>([\s\S]*?)<\/picture>/gi)) {
    const src = pic.inner.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
    const next = cardHeads.find(h => h.index > pic.end);
    const article = next && byHref.get(attr(next.m[2]));
    if (src && article && !article.image) article.image = attr(src);
  }
  // Dates: the short paragraph immediately before a news heading.
  for (const d of all(html, /<p\b[^>]*>([^<]{3,24})<\/p>\s*(?:<\/div>\s*)*<div\b[^>]*>\s*<h[45]\b[^>]*>\s*<a\b[^>]*href="([^"]+)"/gi)) {
    const article = byHref.get(attr(d.m[2]));
    if (article && !article.date) article.date = plainText(d.inner) || null;
  }
  const articles = [...byHref.values()];

  const firstCard = cardHeads[0]?.index ?? html.length;
  const firstH4 = cardHeads.find(h => h.m[1] === '4');
  const introHead = h2s.find(h => h.index < firstCard);
  const intro = introHead ? {
    heading: introHead.text.replace(/\s*->\s*/g, ' \u2013 ').replace(/\s*\u2192\s*/g, ' \u2013 '),
    paragraphs: all(html.slice(introHead.end, firstCard), /<p\b[^>]*>([\s\S]*?)<\/p>/gi).map(p => plainText(p.inner)).filter(Boolean)
      .filter(text => !articles.some(a => a.title === text)),
  } : null;
  const supportRaw = html.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
  const support = supportRaw ? plainText(supportRaw[1]) || null : null;

  let news: HistoricalHome['news'] = null;
  if (firstH4) {
    const head = [...h2s].reverse().find(h => h.index < firstH4.index);
    if (head) {
      const between = html.slice(head.end, firstH4.index);
      const cut = between.search(/<picture\b|<img\b/i);
      const sub = (cut < 0 ? between : between.slice(0, cut)).match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
      const label = html.slice(firstH4.end).match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
      news = { heading: head.text, subtitle: sub ? plainText(sub[1]) || null : null, readLabel: label ? plainText(label[1]) || null : null };
    }
  }

  let story: HistoricalHome['story'] = null;
  const storyLink = html.slice(firstCard).match(/<a\b[^>]*href="([^"]*chi-siamo\/?)"[^>]*>([\s\S]*?)<\/a>/i);
  const storyLinkIndex = storyLink ? firstCard + storyLink.index! : -1;
  if (storyLink) {
    const head = [...h2s].reverse().find(h => h.index < storyLinkIndex && h.index > firstCard);
    // Some locales archived the CMS site-name variable unrendered; show the name it stood for.
    if (head) story = { heading: head.text, text: plainText(html.slice(head.end, storyLinkIndex)).replace(/\{general->website->\{name\}\}?/g, 'Marenetto Build'), link: { href: attr(storyLink[1]), label: plainText(storyLink[2]) } };
  }

  let reviews: HistoricalHome['reviews'] = null;
  const newsHeadIndex = firstH4 ? ([...h2s].reverse().find(h => h.index < firstH4.index)?.index ?? html.length) : html.length;
  const reviewHead = h2s.find(h => h.index > Math.max(storyLinkIndex, firstCard) && h.index < newsHeadIndex);
  if (reviewHead) {
    const names = all(html.slice(reviewHead.end, newsHeadIndex), /<b\b[^>]*>([\s\S]*?)<\/b>/gi).map(b => plainText(b.inner)).filter(Boolean);
    if (names.length) reviews = { heading: reviewHead.text, names };
  }
  return { intro, support, articles, news, story, reviews };
}
