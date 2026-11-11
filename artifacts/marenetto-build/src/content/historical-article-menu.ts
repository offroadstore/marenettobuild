export type HistoricalArticleCategory = {
  label: string;
  path: string;
};

export type HistoricalArticleMenu = {
  label: string;
  path: string;
  categories: HistoricalArticleCategory[];
};

// Labels and paths are copied from the recovered navigation on each locale's
// original home page. Do not derive slugs or add editions without source proof.
export const historicalArticleMenus: Record<string, HistoricalArticleMenu> = {
  it: {
    label: 'Articoli',
    path: '/articoli/',
    categories: [
      { label: 'General Contractor', path: '/general-contractor/' },
      { label: 'Edilizia e Ristrutturazioni', path: '/edilizia-e-ristrutturazioni/' },
      { label: 'Bonus Edilizi e Permessi', path: '/bonus-edilizi-e-permessi/' },
      { label: 'Cantieri e Lavori', path: '/cantieri-e-lavori/' },
      { label: 'Outdoor e Garden Design', path: '/outdoor-e-garden-design/' },
      { label: 'Assistenza e Pronto Intervento', path: '/assistenza-e-pronto-intervento/' },
    ],
  },
  en: {
    label: 'Articles',
    path: '/en/articles/',
    categories: [
      { label: 'General Contractor', path: '/en/general-contractor/' },
      { label: 'Construction and Renovations', path: '/en/construction-and-renovations/' },
      { label: 'Building Bonuses and Permits', path: '/en/building-bonuses-and-permits/' },
      { label: 'Shipyards and Construction', path: '/en/shipyards-and-construction/' },
      { label: 'Outdoor and Garden Design', path: '/en/outdoor-and-garden-design/' },
      { label: 'Support and Emergency Service', path: '/en/support-and-emergency-service/' },
    ],
  },
  fr: {
    label: 'Articles',
    path: '/fr/articles/',
    categories: [
      { label: 'Entrepreneur général', path: '/fr/entrepreneur-general/' },
      { label: 'Construction et Rénovations', path: '/fr/construction-et-renovations/' },
      { label: 'Bonus de Construction et Permis', path: '/fr/bonus-de-construction-et-permis/' },
      { label: 'Chantiers et Travaux', path: '/fr/chantiers-et-travaux/' },
      { label: "Conception d'extérieur et de jardin", path: '/fr/conception-d-exterieur-et-de-jardin/' },
      { label: "Assistance et intervention d'urgence", path: '/fr/assistance-et-intervention-d-urgence/' },
    ],
  },
  de: {
    label: 'Artikel',
    path: '/de/artikel/',
    categories: [
      { label: 'Generalunternehmer', path: '/de/generalunternehmer/' },
      { label: 'Bau und Renovierung', path: '/de/bau-und-renovierung/' },
      { label: 'Bau-Boni und Genehmigungen', path: '/de/bau-boni-und-genehmigungen/' },
      { label: 'Baustellen und Arbeiten', path: '/de/baustellen-und-arbeiten/' },
      { label: 'Außenbereich und Gartengestaltung', path: '/de/aussenbereich-und-gartengestaltung/' },
      { label: 'Support und Notfallhilfe', path: '/de/support-und-notfallhilfe/' },
    ],
  },
  es: {
    label: 'Artículos',
    path: '/es/articulos/',
    categories: [
      { label: 'Contratista General', path: '/es/contratista-general/' },
      { label: 'Construcción y Renovaciones', path: '/es/construccion-y-renovaciones/' },
      { label: 'Bonos de Construcción y Permisos', path: '/es/bonos-de-construccion-y-permisos/' },
      { label: 'Obras y Construcciones', path: '/es/obras-y-construcciones/' },
      { label: 'Diseño de exteriores y jardines', path: '/es/diseno-de-exteriores-y-jardines/' },
      { label: 'Asistencia y Servicio de Emergencia', path: '/es/asistencia-y-servicio-de-emergencia/' },
    ],
  },
  nl: {
    label: 'Artikelen',
    path: '/nl/artikelen/',
    categories: [
      { label: 'Aannemer', path: '/nl/aannemer/' },
      { label: 'Bouw en Renovaties', path: '/nl/bouw-en-renovaties/' },
      { label: 'Bouwbonussen en Vergunningen', path: '/nl/bouwbonussen-en-vergunningen/' },
      { label: 'Scheepswerven en Werken', path: '/nl/scheepswerven-en-werken/' },
      { label: 'Buiten- en Tuinontwerp', path: '/nl/buiten-en-tuinontwerp/' },
      { label: 'Ondersteuning en Spoedhulp', path: '/nl/ondersteuning-en-spoedhulp/' },
    ],
  },
  ru: {
    label: 'Статьи',
    path: '/ru/stati/',
    categories: [
      { label: 'Генеральный подрядчик', path: '/ru/generalnyj-podrjadchik/' },
      { label: 'Строительство и ремонт', path: '/ru/stroitelstvo-i-remont/' },
      { label: 'Строительные бонусы и разрешения', path: '/ru/stroitelnye-bonusy-i-razreshenija/' },
      { label: 'Строительные площадки и работы', path: '/ru/stroitelnye-ploschadki-i-raboty/' },
      { label: 'Дизайн улицы и сада', path: '/ru/dizajn-ulicy-i-sada/' },
      { label: 'Поддержка и экстренное реагирование', path: '/ru/podderzhka-i-ekstrennoe-reagirovanie/' },
    ],
  },
  pt: {
    label: 'Artigos',
    path: '/pt/artigos/',
    categories: [
      { label: 'Empreiteiro Geral', path: '/pt/empreiteiro-geral/' },
      { label: 'Construção e Reformas', path: '/pt/construcao-e-reformas/' },
      { label: 'Bônus de Construção e Licenças', path: '/pt/bonus-de-construcao-e-licencas/' },
      { label: 'Construções e Obras', path: '/pt/construcoes-e-obras/' },
      { label: 'Design para Exterior e Jardim', path: '/pt/design-para-exterior-e-jardim/' },
      { label: 'Assistência e Atendimento Imediato', path: '/pt/assistencia-e-atendimento-imediato/' },
    ],
  },
  pl: {
    label: 'Artykuły',
    path: '/pl/artykuly/',
    categories: [
      { label: 'Główny wykonawca', path: '/pl/glowny-wykonawca/' },
      { label: 'Budownictwo i Remonty', path: '/pl/budownictwo-i-remonty/' },
      { label: 'Bonus Budowlane i Zezwolenia', path: '/pl/bonus-budowlane-i-zezwolenia/' },
      { label: 'Budowy i Prace', path: '/pl/budowy-i-prace/' },
      { label: 'Projektowanie przestrzeni zewnętrznych i ogrodów', path: '/pl/projektowanie-przestrzeni-zewnetrznych-i-ogrodow/' },
      { label: 'Wsparcie i Szybka Interwencja', path: '/pl/wsparcie-i-szybka-interwencja/' },
    ],
  },
};

export function historicalArticleMenu(locale: string) {
  return historicalArticleMenus[locale];
}
