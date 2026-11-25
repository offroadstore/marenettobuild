import { arabicSeo } from './arabic-seo.mjs';
const copy = {
  it: [
    'Guide per ristrutturare casa a Cefalù',
    'Guide per proprietari a Cefalù su ristrutturazione e cura della casa, con fonti, limiti e domande da discutere con i professionisti incaricati.',
    'Cerca articoli su edilizia e ristrutturazioni',
    'Cerca negli articoli e nelle guide di Marenetto Build su costruzioni, ristrutturazioni e cura della proprietà a Cefalù.',
  ],
  en: [
    'Home Renovation Guides for Property Owners in Cefalù',
    'Guides for property owners in Cefalù on renovation and home maintenance, with sources, limitations and questions to discuss with appointed professionals.',
    'Search Building & Renovation Articles',
    'Search Marenetto Build articles and guides on construction, renovation and property care in Cefalù.',
  ],
  de: [
    'Ratgeber zur Hausrenovierung in Cefalù',
    'Ratgeber für Hauseigentümer in Cefalù zu Renovierung und Instandhaltung, mit Quellen, Grenzen und Fragen für die beauftragten Fachleute.',
    'Artikel über Bauen und Renovieren suchen',
    'Durchsuchen Sie Artikel und Ratgeber von Marenetto Build zu Neubau, Renovierung und Immobilienbetreuung in Cefalù.',
  ],
  fr: [
    'Guides pour rénover une maison à Cefalù',
    'Guides pour les propriétaires à Cefalù sur la rénovation et l’entretien, avec sources, limites et questions à aborder avec les professionnels mandatés.',
    'Rechercher des articles sur le bâtiment et la rénovation',
    'Recherchez les articles et guides de Marenetto Build sur la construction, la rénovation et l’entretien des biens à Cefalù.',
  ],
  es: [
    'Guías para reformar una vivienda en Cefalù',
    'Guías para propietarios en Cefalù sobre reformas y mantenimiento, con fuentes, límites y preguntas para los profesionales encargados.',
    'Buscar artículos sobre construcción y reformas',
    'Busca artículos y guías de Marenetto Build sobre construcción, reformas y cuidado de viviendas en Cefalù.',
  ],
  nl: [
    'Gidsen voor woningrenovatie in Cefalù',
    'Gidsen voor huiseigenaren in Cefalù over renovatie en onderhoud, met bronnen, beperkingen en vragen voor de ingeschakelde vakmensen.',
    'Artikelen over bouwen en renoveren zoeken',
    'Doorzoek artikelen en gidsen van Marenetto Build over nieuwbouw, renovatie en woningbeheer in Cefalù.',
  ],
  pt: [
    'Guias para remodelar uma casa em Cefalù',
    'Guias para proprietários em Cefalù sobre remodelação e manutenção, com fontes, limites e perguntas para os profissionais responsáveis.',
    'Pesquisar artigos sobre construção e remodelação',
    'Pesquise artigos e guias da Marenetto Build sobre construção, remodelação e manutenção de imóveis em Cefalù.',
  ],
  ru: [
    'Руководства по ремонту дома в Чефалу',
    'Материалы для владельцев домов в Чефалу о ремонте и уходе за недвижимостью: источники, ограничения и вопросы для привлечённых специалистов.',
    'Поиск статей о строительстве и ремонте',
    'Ищите статьи и руководства Marenetto Build о строительстве, ремонте и уходе за недвижимостью в Чефалу.',
  ],
  pl: [
    'Poradniki remontowe dla właścicieli domów w Cefalù',
    'Poradniki dla właścicieli domów w Cefalù o remontach i utrzymaniu nieruchomości: źródła, ograniczenia i pytania do zatrudnionych specjalistów.',
    'Szukaj artykułów o budowie i remontach',
    'Przeszukaj artykuły i poradniki Marenetto Build o budowie, remontach i utrzymaniu nieruchomości w Cefalù.',
  ],
  sv: [
    'Guider om byggande och husrenovering i Cefalù',
    'Guider för husägare i Cefalù om renovering och underhåll, med källor, begränsningar och frågor att diskutera med anlitade fackpersoner.',
    'Sök artiklar om byggande och renovering',
    'Sök bland Marenetto Builds artiklar och guider om nybyggnation, renovering och fastighetsskötsel i Cefalù.',
  ],
  no: [
    'Guider til bygging og oppussing i Cefalù',
    'Guider for boligeiere i Cefalù om oppussing og vedlikehold, med kilder, begrensninger og spørsmål til fagfolkene som er engasjert.',
    'Finn artikler om bygging og oppussing',
    'Søk i Marenetto Builds artikler og guider om nybygg, oppussing og vedlikehold av eiendom i Cefalù.',
  ],
  da: [
    'Vejledninger til byggeri og renovering i Cefalù',
    'Vejledninger til boligejere i Cefalù om renovering og vedligeholdelse, med kilder, forbehold og spørgsmål til de tilknyttede fagfolk.',
    'Søg artikler om byggeri og renovering',
    'Søg i Marenetto Builds artikler og vejledninger om nybyggeri, renovering og vedligeholdelse af ejendomme i Cefalù.',
  ],
};

export const libraryMetadata = Object.fromEntries(Object.entries(copy).map(([locale, [guidesTitle, guidesDescription, searchTitle, searchDescription]]) => [
  locale, {
    guides: { title: `${guidesTitle} | Marenetto Build`, description: guidesDescription },
    search: { title: `${searchTitle} | Marenetto Build`, description: searchDescription },
  },
]));
libraryMetadata.ar = { guides: arabicSeo.guides, search: arabicSeo.search };
