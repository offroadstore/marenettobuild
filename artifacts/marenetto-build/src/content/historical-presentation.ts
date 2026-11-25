import { imageDescription } from './image-descriptions';

const escapeAttribute = (text: string) => text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');

/** Accessible public representation; acquired documents and revision hashes stay unchanged. */
export function historicalPresentation(html: string, locale: string) {
  const levels = [{ source:1, target:1 }];
  return html.replace(/<h([2-6])(\b[^>]*)>([\s\S]*?)<\/h\1>/gi, (_tag, level, attributes, content) => {
    const source = Number(level);
    while (levels.length > 1 && levels[levels.length - 1].source >= source) levels.pop();
    const next = Math.min(source, levels[levels.length - 1].target + 1);
    levels.push({ source, target:next });
    return `<h${next}${attributes}>${content}</h${next}>`;
  }).replace(/<img\b[^>]*>/gi, tag => {
    if (tag.includes('data-historical-logo')) return tag;
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
    if (!src) return tag;
    const alt = imageDescription(src, locale);
    if (!alt) return tag;
    const attribute = `alt="${escapeAttribute(alt)}"`;
    return /\balt="/i.test(tag) ? tag.replace(/\balt="[^"]*"/i, attribute) : tag.replace('<img', `<img ${attribute}`);
  });
}
