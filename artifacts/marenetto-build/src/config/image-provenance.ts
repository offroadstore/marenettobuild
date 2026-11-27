
/** Evidence: public/media/home/README.md. Encoding alone is not AI editing. */
export function imageClassification(url: string) {
  // Original AI-authored vector diagram, rasterized locally; no third-party
  // photo or real property is depicted. Visible schematic caption is in body.
  if (url === '/media/editorial/project-diagram.png') return 'ai-generated';
  if (/\/api\/network-media\/[a-z]+-[0-2]-[a-f0-9]{16}-\d+\.webp$/.test(url)) return 'ai-generated';
  if (/\/media\/home\/approved-hero-/.test(url)) return 'ai-generated';
  if (/\/media\/home\/cefalu-hero-/.test(url)) return 'ai-edited';
  if (/\/brand\/|\/favicon(?:\.|\/)/i.test(url)) return 'brand';
  return 'uncertain';
}
export function discloseHTMLImages(html: string, _locale: string) {
  // Per-image labels removed at the owner's request; footer note remains.
  return html;
}
