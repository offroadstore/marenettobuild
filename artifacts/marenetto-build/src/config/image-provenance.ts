import { noticeCopy } from '@/content/legal-notices';

/** Evidence: public/media/home/README.md. Encoding alone is not AI editing. */
export function imageClassification(url: string) {
  if (/\/media\/home\/approved-hero-/.test(url)) return 'ai-generated';
  if (/\/media\/home\/cefalu-hero-/.test(url)) return 'ai-edited';
  if (/\/brand\/|\/favicon(?:\.|\/)/i.test(url)) return 'brand';
  return 'uncertain';
}
export function discloseHTMLImages(html: string, locale: string) {
  const copy = noticeCopy[locale];
  if (!copy) return html;
  return html.replace(/<img\b[^>]*>/gi, tag => {
    if (tag.includes('data-historical-logo') || tag.includes('data-image-labelled')) return tag;
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || imageClassification(src) === 'brand') return tag;
    const classification = imageClassification(src);
    const text = classification.startsWith('ai-') ? copy.aiLabel : copy.unknownLabel;
    return tag.replace(/^<img\b/i, '<img data-image-labelled=""') +
      `<span class="image-disclosure" lang="${locale}" data-image-disclosure="${classification}">${text}</span>`;
  });
}
