// Some Framework360 lazy images were archived as bare <img> elements.
// Recover only article cards with an unambiguous following heading/link and
// an already acquired cover. Do not fill unknown inline article placeholders.
export function recoverArticleThumbnails(html: string, covers: Record<string, string>): string {
  return html.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>[\s\S]*?(?=<picture\b|$)/gi, block => {
    const end = block.indexOf('</picture>') + '</picture>'.length;
    const picture = block.slice(0, end);
    const heading = block.slice(end).match(/<h[2-6]\b[^>]*>\s*<a\b[^>]*href="([^"]+)"/i);
    if (!heading || !/<img\s*\/?>/i.test(picture)) return block;
    const path = heading[1].replace(/\/+$/, '') || '/';
    const cover = covers[path];
    if (!cover || !/^(https:\/\/|\/api\/historical-media\/)/.test(cover)) return block;
    const safe = cover.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
    return picture.replace(/<img\s*\/?>/gi, `<img src="${safe}" alt="" loading="lazy">`) + block.slice(end);
  });
}
