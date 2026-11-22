/** SEGNAPOSTO TITOLARE: inserire qui l'URL ufficiale alle recensioni della scheda.
 * Nessuna scheda verificata è stata trovata nelle fonti del progetto.
 * Vedere docs/production-readiness/GOOGLE_REVIEWS_LINK.md. */
export const GOOGLE_REVIEWS_OFFICIAL_URL: string = '';
export const GOOGLE_REVIEWS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=Marenetto%20Build%20Cefal%C3%B9';
export const GOOGLE_REVIEWS_URL = GOOGLE_REVIEWS_OFFICIAL_URL || GOOGLE_REVIEWS_SEARCH_URL;

export const googleReviewsCopy: Record<string, { heading: string; button: string }> = {
  it: { heading: 'Leggi le recensioni dei nostri clienti su Google', button: 'Leggi le recensioni su Google' },
  en: { heading: 'Read our customers’ reviews on Google', button: 'Read reviews on Google' },
  fr: { heading: 'Lisez les avis de nos clients sur Google', button: 'Lire les avis sur Google' },
  de: { heading: 'Lesen Sie die Bewertungen unserer Kunden auf Google', button: 'Bewertungen auf Google lesen' },
  es: { heading: 'Lee las opiniones de nuestros clientes en Google', button: 'Leer opiniones en Google' },
  nl: { heading: 'Lees de beoordelingen van onze klanten op Google', button: 'Lees beoordelingen op Google' },
  pt: { heading: 'Leia as avaliações dos nossos clientes no Google', button: 'Ler avaliações no Google' },
  pl: { heading: 'Przeczytaj opinie naszych klientów w Google', button: 'Przeczytaj opinie w Google' },
  ru: { heading: 'Читайте отзывы наших клиентов в Google', button: 'Читать отзывы в Google' },
  sv: { heading: 'Läs våra kunders omdömen på Google', button: 'Läs omdömen på Google' },
  no: { heading: 'Les kundenes anmeldelser på Google', button: 'Les anmeldelser på Google' },
  da: { heading: 'Læs vores kunders anmeldelser på Google', button: 'Læs anmeldelser på Google' },
  // Also cover the private locale previews without changing their publication gates.
  ro: { heading: 'Citiți recenziile clienților noștri pe Google', button: 'Citiți recenziile pe Google' },
  uk: { heading: 'Читайте відгуки наших клієнтів у Google', button: 'Читати відгуки в Google' },
  cs: { heading: 'Přečtěte si recenze našich zákazníků na Googlu', button: 'Přečíst recenze na Googlu' },
  sk: { heading: 'Prečítajte si recenzie našich zákazníkov na Googli', button: 'Prečítať recenzie na Googli' },
  sl: { heading: 'Preberite mnenja naših strank v Googlu', button: 'Preberite mnenja v Googlu' },
  hr: { heading: 'Pročitajte recenzije naših klijenata na Googleu', button: 'Pročitajte recenzije na Googleu' },
  sr: { heading: 'Прочитајте рецензије наших клијената на Google-у', button: 'Прочитајте рецензије на Google-у' },
  bg: { heading: 'Прочетете отзивите на нашите клиенти в Google', button: 'Прочетете отзивите в Google' },
  bs: { heading: 'Pročitajte recenzije naših klijenata na Googleu', button: 'Pročitajte recenzije na Googleu' },
  mk: { heading: 'Прочитајте ги рецензиите на нашите клиенти на Google', button: 'Прочитајте ги рецензиите на Google' },
  be: { heading: 'Чытайце водгукі нашых кліентаў у Google', button: 'Чытаць водгукі ў Google' },
  ar: { heading: 'اقرأ آراء عملائنا على Google', button: 'اقرأ الآراء على Google' },
  he: { heading: 'קראו את ביקורות הלקוחות שלנו ב-Google', button: 'קראו ביקורות ב-Google' },
  fi: { heading: 'Lue asiakkaidemme arvostelut Googlessa', button: 'Lue arvostelut Googlessa' },
  hu: { heading: 'Olvassa el ügyfeleink értékeléseit a Google-on', button: 'Értékelések a Google-on' },
  el: { heading: 'Διαβάστε τις κριτικές των πελατών μας στο Google', button: 'Διαβάστε κριτικές στο Google' },
  tr: { heading: 'Müşterilerimizin Google yorumlarını okuyun', button: 'Google yorumlarını okuyun' },
};
