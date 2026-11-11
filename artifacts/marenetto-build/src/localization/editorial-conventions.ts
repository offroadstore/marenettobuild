/** Script normalization is mechanical, not linguistic approval. URLs and brands stay intact. */
export function serbianCyrillic(text: string): string {
  const letters: Record<string, string> = { a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', z: 'з', ž: 'ж' };
  const convert = (part: string) => part.replace(/Dž|DŽ|dž|Lj|LJ|lj|Nj|NJ|nj|[a-zčćđšž]/gi, token => {
    const lower = token.toLowerCase();
    const value = ({ dž: 'џ', lj: 'љ', nj: 'њ' } as Record<string, string>)[lower] ?? letters[lower] ?? token;
    return token[0] === token[0].toUpperCase() ? value.toUpperCase() : value;
  });
  return text.split(/(https?:\/\/\S+|Marenetto(?: Build)?|Cefalù|WhatsApp|Isoplam|Microverlay|Skyconcrete|\bIT\b)/g)
    .map((part, index) => index % 2 ? part : convert(part)).join('');
}

/** Proposed pt-PT terminology for review only; never rewrites an approved catalog. */
export function portugueseReviewTerms(text: string): string {
  return text.replace(/\bcontato\b/g, 'contacto').replace(/\bContato\b/g, 'Contacto')
    .replace(/\bcontatos\b/g, 'contactos').replace(/\bescopo\b/g, 'âmbito')
    .replace(/\bcompartilhado\b/g, 'partilhado').replace(/\bcompartilhar\b/g, 'partilhar')
    .replace(/\bvocê mora\b/g, 'vive');
}
