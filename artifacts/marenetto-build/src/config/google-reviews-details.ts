type ReviewCopy = {
  all: string; write: string; count: string; rating: string; source: string;
  order: string; privacy: string; terms: string; policy: string;
};
// Interface labels only. Google review text and author names are never translated.
export const googleReviewsDetails: Record<string, ReviewCopy> = {
  it: {
    all: 'Leggi tutte le recensioni su Google', write: 'Lascia una recensione', count: '{count} recensioni',
    rating: 'Voto medio', source: 'Vedi questa recensione su Google Maps',
    order: 'Fino a cinque recensioni, nell’ordine di pertinenza restituito da Google, senza selezioni per voto. Testi originali, non tradotti.',
    privacy: 'Recensioni e foto sono caricate tramite il nostro server. I collegamenti aprono Google solo al clic.',
    terms: 'Termini di Google Maps', policy: 'Privacy di Google',
  },
  en: {
    all: 'Read all reviews on Google', write: 'Leave a review', count: '{count} reviews',
    rating: 'Average rating', source: 'View this review on Google Maps',
    order: 'Up to five reviews, in Google’s relevance order, without filtering by rating. Original, untranslated text.',
    privacy: 'Reviews and photos are loaded through our server. Links open Google only when clicked.',
    terms: 'Google Maps terms', policy: 'Google privacy',
  },
  de: {
    all: 'Alle Bewertungen auf Google lesen', write: 'Bewertung schreiben', count: '{count} Bewertungen',
    rating: 'Durchschnittliche Bewertung', source: 'Diese Bewertung auf Google Maps ansehen',
    order: 'Bis zu fünf Bewertungen in der von Google gelieferten Relevanzreihenfolge, ohne Auswahl nach Bewertung. Unübersetzte Originaltexte.',
    privacy: 'Bewertungen und Fotos werden über unseren Server geladen. Links öffnen Google erst beim Anklicken.',
    terms: 'Google Maps-Nutzungsbedingungen', policy: 'Google-Datenschutzerklärung',
  },
  fr: {
    all: 'Lire tous les avis sur Google', write: 'Laisser un avis', count: '{count} avis',
    rating: 'Note moyenne', source: 'Voir cet avis sur Google Maps',
    order: 'Jusqu’à cinq avis, dans l’ordre de pertinence fourni par Google, sans sélection selon la note. Textes originaux non traduits.',
    privacy: 'Les avis et photos sont chargés via notre serveur. Les liens ouvrent Google uniquement après un clic.',
    terms: 'Conditions de Google Maps', policy: 'Confidentialité Google',
  },
  es: {
    all: 'Leer todas las reseñas en Google', write: 'Escribir una reseña', count: '{count} reseñas',
    rating: 'Valoración media', source: 'Ver esta reseña en Google Maps',
    order: 'Hasta cinco reseñas, en el orden de relevancia devuelto por Google, sin selección por puntuación. Textos originales sin traducir.',
    privacy: 'Las reseñas y fotos se cargan a través de nuestro servidor. Los enlaces abren Google solo al hacer clic.',
    terms: 'Condiciones de Google Maps', policy: 'Privacidad de Google',
  },
  nl: {
    all: 'Alle beoordelingen op Google lezen', write: 'Een beoordeling schrijven', count: '{count} beoordelingen',
    rating: 'Gemiddelde beoordeling', source: 'Deze beoordeling op Google Maps bekijken',
    order: 'Maximaal vijf beoordelingen in de relevantievolgorde van Google, zonder selectie op score. Originele, onvertaalde teksten.',
    privacy: 'Beoordelingen en foto’s worden via onze server geladen. Links openen Google pas na een klik.',
    terms: 'Voorwaarden van Google Maps', policy: 'Privacy van Google',
  },
  pt: {
    all: 'Ler todas as avaliações no Google', write: 'Escrever uma avaliação', count: '{count} avaliações',
    rating: 'Classificação média', source: 'Ver esta avaliação no Google Maps',
    order: 'Até cinco avaliações, na ordem de relevância devolvida pelo Google, sem seleção por classificação. Textos originais, não traduzidos.',
    privacy: 'As avaliações e fotos são carregadas através do nosso servidor. Os links abrem o Google apenas ao clicar.',
    terms: 'Termos do Google Maps', policy: 'Privacidade do Google',
  },
  pl: {
    all: 'Przeczytaj wszystkie opinie w Google', write: 'Napisz opinię', count: '{count} — liczba opinii',
    rating: 'Średnia ocena', source: 'Zobacz tę opinię w Mapach Google',
    order: 'Do pięciu opinii w kolejności trafności zwróconej przez Google, bez wybierania według oceny. Oryginalne teksty bez tłumaczenia.',
    privacy: 'Opinie i zdjęcia są ładowane przez nasz serwer. Linki otwierają Google dopiero po kliknięciu.',
    terms: 'Warunki Google Maps', policy: 'Prywatność Google',
  },
  ru: {
    all: 'Читать все отзывы в Google', write: 'Оставить отзыв', count: '{count} — количество отзывов',
    rating: 'Средняя оценка', source: 'Посмотреть этот отзыв в Google Maps',
    order: 'До пяти отзывов в порядке релевантности Google, без отбора по оценке. Оригинальные тексты без перевода.',
    privacy: 'Отзывы и фотографии загружаются через наш сервер. Ссылки открывают Google только при нажатии.',
    terms: 'Условия Google Maps', policy: 'Конфиденциальность Google',
  },
  sv: {
    all: 'Läs alla omdömen på Google', write: 'Skriv ett omdöme', count: '{count} omdömen',
    rating: 'Genomsnittligt betyg', source: 'Visa detta omdöme på Google Maps',
    order: 'Upp till fem omdömen i Googles relevansordning, utan urval efter betyg. Ursprungliga, oöversatta texter.',
    privacy: 'Omdömen och foton hämtas via vår server. Länkar öppnar Google först när du klickar.',
    terms: 'Villkor för Google Maps', policy: 'Googles integritetspolicy',
  },
  no: {
    all: 'Les alle anmeldelser på Google', write: 'Skriv en anmeldelse', count: '{count} anmeldelser',
    rating: 'Gjennomsnittlig vurdering', source: 'Se denne anmeldelsen på Google Maps',
    order: 'Opptil fem anmeldelser i Googles relevansrekkefølge, uten utvalg etter vurdering. Originale tekster uten oversettelse.',
    privacy: 'Anmeldelser og bilder lastes gjennom serveren vår. Lenker åpner Google først når du klikker.',
    terms: 'Vilkår for Google Maps', policy: 'Googles personvernregler',
  },
  da: {
    all: 'Læs alle anmeldelser på Google', write: 'Skriv en anmeldelse', count: '{count} anmeldelser',
    rating: 'Gennemsnitlig bedømmelse', source: 'Se denne anmeldelse på Google Maps',
    order: 'Op til fem anmeldelser i Googles relevansrækkefølge uden udvælgelse efter bedømmelse. Originale tekster uden oversættelse.',
    privacy: 'Anmeldelser og billeder indlæses via vores server. Links åbner først Google, når du klikker.',
    terms: 'Vilkår for Google Maps', policy: 'Googles privatlivspolitik',
  },
  ar: {
    all: 'اقرأ جميع التقييمات على Google', write: 'اكتب تقييمًا', count: '{count} تقييمات',
    rating: 'متوسط التقييم', source: 'اعرض هذا التقييم على خرائط Google',
    order: 'حتى خمسة تقييمات، بترتيب الصلة الذي تُرجعه Google، من دون انتقاء بحسب الدرجة. النصوص أصلية وغير مترجمة.',
    privacy: 'تُحمَّل التقييمات والصور عبر خادمنا. ولا تفتح الروابط Google إلا عند النقر عليها.',
    terms: 'شروط خرائط Google', policy: 'سياسة الخصوصية لدى Google',
  },
};
