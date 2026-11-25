// Vite adds cache-busting timestamps to development module URLs after HMR.
// Ignore ONLY that token, never article text, canonical URLs or application JSON.
export function normalizeDevelopmentSSR(html) {
  return html.replace(/<script\b[^>]*\btype="module"[^>]*>/g, tag =>
    tag.replace(/\bsrc="(\/(?:src\/|@)[^"?]+)\?t=\d+"/g, 'src="$1"'));
}
