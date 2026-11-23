import fonts from '../src/config/font-preloads.json' with { type: 'json' };

// One critical subset only. All other weights/scripts remain demand-loaded by CSS.
export function withFontPreload(html, locale = 'it', pathname = '/') {
  const key = /^\/(?:internal|sign-in|sign-up)(?:\/|$)/.test(pathname)
    ? 'internal'
    : ['ru', 'uk', 'bg', 'sr', 'mk', 'be'].includes(locale) ? 'cyrillic'
      : locale === 'el' ? 'greek' : ['ar', 'he'].includes(locale) ? locale : 'latin';
  return html.replace(/(<link\b(?=[^>]*\bdata-site-font\b)[^>]*\bhref=")[^"]*(")/g, (match, start, end) => {
    const href = match.match(/href="([^"]*)"/)?.[1] ?? '';
    const base = href.slice(0, href.indexOf('assets/fonts/'));
    return `${start}${base}assets/fonts/${fonts[key]}${end}`;
  });
}
