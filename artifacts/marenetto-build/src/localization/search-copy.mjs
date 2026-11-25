// Search presentation only: no mutation of documentary bodies, approvals or
// translation provenance. Topics describe the integrated page, not new claims.
import { detailedDescription } from './search-details.mjs';
const keys = [
  'home','services','process','abroad','request','contact','articles','guides',
  'comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali',
  'impresa-edile-a-cefalu',
  'ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni',
  'garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto',
  'cappotto-termico-vs-intonaco-termico-cefalu',
  'pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete',
  'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam',
  'gestione-manutenzione-immobile','garden-design-esclusivo','opere-in-pietra-e-prospetti',
  'pavimenti-stampati-in-resina','piscine-e-laghetti-zen','cucine-in-muratura-luxury',
  'tecniche-avanzate-gestione-deformazioni-strutture-edili',
  'historical:/recensioni','historical:/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto',
  'historical:/general-contractor','historical:/edilizia-e-ristrutturazioni',
  'historical:/bonus-edilizi-e-permessi','historical:/cantieri-e-lavori',
  'historical:/outdoor-e-garden-design','historical:/assistenza-e-pronto-intervento',
  'service-premium','service-local','legal-privacy','legal-cookies','legal-ai','cookie',
  'zones','custom-furniture','sicily-travel','property-management',
];
const topics = {
  it: 'Costruzioni e ristrutturazioni|Servizi edili e manutenzione|Come organizziamo i lavori|La casa per chi vive all’estero|Parliamo del tuo progetto|Contatti per lavori e manutenzione|Articoli su edilizia e casa|Guide alla ristrutturazione|Acquistare casa: controlli tecnici|Impresa edile e ristrutturazioni|Infiltrazioni e umidità in casa|Polizza decennale: guida e limiti|Cappotto oppure intonaco termico|Pavimenti esterni Isoplam|Microcemento Microverlay Isoplam|Gestione e manutenzione della casa|Giardini e spazi mediterranei|Opere in pietra e facciate|Pavimenti stampati e resine|Piscine e laghetti per esterni|Cucine in muratura su misura|Deformazioni nelle strutture edili|Recensioni e opinioni dei clienti|Ristrutturazioni chiavi in mano|Coordinamento del cantiere edile|Edilizia e ristrutturazioni|Bonus edilizi e permessi: archivio|Cantieri e lavori: archivio|Giardini ed esterni: articoli|Assistenza tecnica per la casa|Arredi su misura nel mondo|Area dei servizi edili locali|Informativa sul trattamento dati|Cookie e consensi separati|Immagini e intelligenza artificiale|Cookie e statistiche del sito|Zone servite: costa e Madonie|Arredi in cemento e microcemento|Sicilia e trasferte su richiesta|Gestione affitti con un partner',
  en: 'Construction and renovation|Building and maintenance services|How we organise building work|Property care for owners abroad|Discuss your building project|Contact for building and upkeep|Building and property articles|Home renovation guides|Buying a home: technical checks|Building company and renovation|Water leaks and damp in the home|Ten-year building insurance guide|Insulation or thermal plaster|Isoplam outdoor flooring guide|Microverlay Isoplam microcement|Home management and maintenance|Mediterranean gardens and outdoors|Stonework and exterior facades|Stamped floors and resin surfaces|Swimming pools and garden ponds|Bespoke masonry kitchen guide|Deformation in building structures|Customer reviews and feedback|Turnkey home renovation guide|Coordinating building projects|Building and renovation articles|Building incentives and permits|Building sites and work archive|Garden and outdoor design articles|Technical support for your home|Bespoke furniture worldwide|Local building service coverage|Personal data and privacy notice|Cookies and separate permissions|Images and artificial intelligence|Website cookies and statistics|Service areas: coast and Madonie|Concrete and microcement furniture|Sicily and project-based travel|Rental management with a partner',
  fr: 'Construction et rénovation|Bâtiment et entretien de la maison|Organisation de vos travaux|Propriétaires vivant à l’étranger|Parlons de votre projet de travaux|Contact pour travaux et entretien|Articles sur le bâtiment et l’habitat|Guides de rénovation de la maison|Achat immobilier : points à vérifier|Entreprise de bâtiment et rénovation|Infiltrations et humidité chez soi|Assurance décennale : guide et limites|Isolation ou enduit thermique|Guide des sols extérieurs Isoplam|Microciment Microverlay Isoplam|Gestion et entretien de la maison|Jardins et espaces méditerranéens|Ouvrages en pierre et façades|Sols imprimés et surfaces en résine|Piscines et bassins de jardin|Cuisines maçonnées sur mesure|Déformations des structures bâties|Avis et témoignages des clients|Rénovation de maison clé en main|Coordination de votre chantier|Construction et rénovation : articles|Aides aux travaux et autorisations|Chantiers et travaux : archives|Jardins et extérieurs : articles|Assistance technique pour la maison|Mobilier sur mesure dans le monde|Zone des services de bâtiment|Protection des données personnelles|Cookies et consentements distincts|Images et intelligence artificielle|Cookies et statistiques du site|Zones desservies : côte et Madonie|Mobilier en béton et microciment|Sicile et déplacements sur demande|Gestion locative avec un partenaire',
  de: 'Bauen und Hausrenovierung|Bauarbeiten und Hauspflege|So organisieren wir Bauarbeiten|Hausbetreuung für Eigentümer im Ausland|Ihr Bauvorhaben besprechen|Kontakt für Bau und Hauspflege|Artikel zu Bauen und Wohnen|Ratgeber zur Hausrenovierung|Hauskauf: technische Prüfungen|Bauunternehmen und Renovierung|Wasserlecks und Feuchtigkeit im Haus|Zehnjährige Bauversicherung erklärt|Dämmung oder wärmedämmender Putz|Isoplam-Böden für Außenbereiche|Microverlay Isoplam Mikrozement|Hausverwaltung und Instandhaltung|Mediterrane Gärten und Außenräume|Natursteinarbeiten und Fassaden|Stempelbeton und Harzböden|Schwimmbecken und Gartenteiche|Gemauerte Küchen nach Maß|Verformungen an Baukonstruktionen|Kundenbewertungen und Erfahrungen|Schlüsselfertige Hausrenovierung|Koordination von Bauprojekten|Bauen und Renovieren: Artikel|Bauförderung und Genehmigungen|Baustellen und Arbeiten: Archiv|Gartenplanung und Außenräume|Technische Hilfe rund ums Haus|Möbel nach Maß weltweit|Einzugsgebiet für Bauarbeiten|Hinweise zum Schutz Ihrer Daten|Cookies und getrennte Einwilligungen|Bilder und künstliche Intelligenz|Cookies und Website-Statistik|Einsatzgebiete: Küste und Madonie|Möbel aus Beton und Mikrozement|Sizilien und Einsätze auf Anfrage|Mietverwaltung mit einem Partner',
  nl: 'Bouwen en woningrenovatie|Bouwwerk en woningonderhoud|Zo organiseren wij het bouwwerk|Woningzorg voor eigenaars in het buitenland|Bespreek uw bouwproject met ons|Contact voor bouw en onderhoud|Artikelen over bouwen en wonen|Gidsen voor woningrenovatie|Een huis kopen: technische controles|Bouwbedrijf en woningrenovatie|Waterlekkage en vocht in huis|Tienjarige bouwverzekering uitgelegd|Isolatie of thermische pleister|Isoplam-vloeren voor buiten|Microverlay Isoplam microcement|Woningbeheer en onderhoud|Mediterrane tuinen en buitenruimtes|Natuursteenwerk en gevels|Stempelbeton en kunstharsvloeren|Zwembaden en tuinvijvers|Gemetselde keukens op maat|Vervorming van bouwconstructies|Klantbeoordelingen en ervaringen|Sleutelklare woningrenovatie|Coördinatie van bouwprojecten|Bouwen en renoveren: artikelen|Bouwsubsidies en vergunningen|Bouwplaatsen en werkzaamheden|Tuinontwerp en buitenruimtes|Technische hulp voor uw woning|Maatwerkmeubels wereldwijd|Werkgebied voor bouwwerkzaamheden|Informatie over persoonsgegevens|Cookies en afzonderlijke toestemming|Beelden en kunstmatige intelligentie|Cookies en websitestatistieken|Werkgebied: kust en Madonie|Beton- en microcementmeubels|Sicilië en werkreizen op aanvraag|Verhuurbeheer met een partner',
  es: 'Construcción y reformas de casas|Obras y mantenimiento de viviendas|Cómo organizamos las obras|Propietarios que viven fuera|Hablemos de tu proyecto de obra|Contacto para obras y mantenimiento|Artículos de construcción y vivienda|Guías para reformar tu casa|Comprar casa: controles técnicos|Empresa constructora y reformas|Filtraciones y humedad en casa|Seguro decenal: guía y límites|Aislamiento o revoco térmico|Pavimentos exteriores Isoplam|Microcemento Microverlay Isoplam|Gestión y mantenimiento del hogar|Jardines y espacios mediterráneos|Trabajos en piedra y fachadas|Hormigón impreso y suelos de resina|Piscinas y estanques de jardín|Cocinas de obra a medida|Deformaciones en estructuras|Reseñas y opiniones de clientes|Reformas integrales llave en mano|Coordinación de obras y proyectos|Construcción y reformas: artículos|Ayudas a obras y permisos|Obras y trabajos: archivo|Jardines y exteriores: artículos|Asistencia técnica para tu casa|Muebles a medida en el mundo|Zona de servicios de construcción|Aviso sobre datos personales|Cookies y permisos independientes|Imágenes e inteligencia artificial|Cookies y estadísticas del sitio|Zonas atendidas: costa y Madonie|Muebles de cemento y microcemento|Sicilia y desplazamientos a petición|Gestión de alquileres con un socio',
  pt: 'Construção e remodelação de casas|Obras e manutenção de habitações|Como organizamos as obras|Proprietários que vivem no estrangeiro|Fale connosco sobre a sua obra|Contacto para obras e manutenção|Artigos de construção e habitação|Guias para remodelar a sua casa|Comprar casa: verificações técnicas|Empresa de construção e remodelação|Infiltrações e humidade em casa|Seguro decenal: guia e limites|Isolamento ou reboco térmico|Pavimentos exteriores Isoplam|Microcimento Microverlay Isoplam|Gestão e manutenção da casa|Jardins e espaços mediterrânicos|Trabalhos em pedra e fachadas|Betão estampado e pisos de resina|Piscinas e lagos de jardim|Cozinhas em alvenaria à medida|Deformações nas estruturas|Avaliações e opiniões de clientes|Remodelação de casas chave na mão|Coordenação de obras e projetos|Construção e remodelação: artigos|Apoios a obras e licenças|Obras e trabalhos: arquivo|Jardins e exteriores: artigos|Assistência técnica para a casa|Mobiliário à medida no mundo|Área dos serviços de construção|Informação sobre dados pessoais|Cookies e permissões separadas|Imagens e inteligência artificial|Cookies e estatísticas do site|Zonas atendidas: costa e Madonie|Móveis em cimento e microcimento|Sicília e deslocações a pedido|Gestão de arrendamentos com parceiro',
  ru: 'Строительство и ремонт домов|Строительные работы и уход за домом|Как мы организуем строительные работы|Дом для владельцев за границей|Обсудим ваш строительный проект|Контакты по ремонту и уходу за домом|Статьи о строительстве и жилье|Руководства по ремонту дома|Покупка дома: технические проверки|Строительная компания и ремонт|Протечки воды и сырость в доме|Десятилетнее страхование: условия|Утепление или тёплая штукатурка|Уличные покрытия Isoplam|Микроцемент Microverlay Isoplam|Управление домом и обслуживание|Средиземноморские сады и участки|Каменные работы и фасады|Печатный бетон и полимерные полы|Бассейны и садовые пруды|Кухни из кладки на заказ|Деформации строительных конструкций|Отзывы и мнения клиентов|Ремонт дома под ключ: руководство|Координация строительных работ|Строительство и ремонт: статьи|Льготы на ремонт и разрешения|Строительные площадки: архив|Дизайн садов и открытых пространств|Техническая помощь для дома|Мебель на заказ по всему миру|Зона местных строительных услуг|Информация о персональных данных|Cookie и раздельные согласия|Изображения и искусственный интеллект|Cookie и статистика сайта|Районы работы: побережье и Мадоние|Мебель из бетона и микроцемента|Сицилия и выезды по запросу|Управление арендой с партнёром',
  pl: 'Budowa i remonty domów|Prace budowlane i utrzymanie domu|Jak organizujemy prace budowlane|Opieka nad domem właściciela za granicą|Porozmawiajmy o Twoim projekcie|Kontakt w sprawie prac i utrzymania|Artykuły o budowie i domu|Poradniki remontu domu|Zakup domu: kontrole techniczne|Firma budowlana i remonty|Przecieki wody i wilgoć w domu|Ubezpieczenie dziesięcioletnie: poradnik|Ocieplenie czy tynk termoizolacyjny|Posadzki zewnętrzne Isoplam|Mikrocement Microverlay Isoplam|Zarządzanie i utrzymanie domu|Śródziemnomorskie ogrody i otoczenie|Prace kamieniarskie i elewacje|Beton stemplowany i posadzki żywiczne|Baseny i stawy ogrodowe|Kuchnie murowane na wymiar|Odkształcenia konstrukcji budowlanych|Opinie i recenzje klientów|Remont domu pod klucz: poradnik|Koordynacja prac budowlanych|Budowa i remonty: artykuły|Ulgi budowlane i pozwolenia|Place budowy i prace: archiwum|Projektowanie ogrodów i otoczenia|Pomoc techniczna dla Twojego domu|Meble na wymiar na całym świecie|Obszar lokalnych usług budowlanych|Informacja o danych osobowych|Pliki cookie i osobne zgody|Obrazy i sztuczna inteligencja|Pliki cookie i statystyki witryny|Obszar działania: wybrzeże i Madonie|Meble z betonu i mikrocementu|Sycylia i wyjazdy na zamówienie|Zarządzanie najmem z partnerem',
  sv: 'Byggnation och husrenovering|Byggtjänster och husunderhåll|Så organiserar vi byggarbetet|Husomsorg för ägare utomlands|Prata med oss om ditt byggprojekt|Kontakt för byggande och underhåll|Artiklar om byggande och bostäder|Guider för renovering av hus|Köpa hus: tekniska kontroller|Byggföretag och husrenovering|Vattenläckor och fukt i huset|Tioårig byggförsäkring: en guide|Isolering eller värmeisolerande puts|Isoplam-golv för utomhusbruk|Microverlay Isoplam mikrocement|Fastighetsförvaltning och underhåll|Medelhavsträdgårdar och utemiljöer|Stenarbeten och fasader|Mönstrad betong och hartsgolv|Pooler och trädgårdsdammar|Murade kök efter mått|Deformationer i byggnadskonstruktioner|Kundrecensioner och omdömen|Nyckelfärdig husrenovering|Samordning av byggprojekt|Byggnation och renovering: artiklar|Byggstöd och tillstånd|Byggarbetsplatser och arbeten|Trädgårdsdesign och utemiljöer|Teknisk hjälp för ditt hus|Måttbeställda möbler i hela världen|Lokalt område för byggtjänster|Information om personuppgifter|Kakor och separata samtycken|Bilder och artificiell intelligens|Kakor och webbplatsstatistik|Arbetsområden: kusten och Madonie|Möbler i betong och mikrocement|Sicilien och resor på förfrågan|Uthyrningsförvaltning med partner',
  no: 'Bygging og boligrenovering|Byggetjenester og boligvedlikehold|Slik organiserer vi byggearbeidet|Boligomsorg for eiere i utlandet|Snakk med oss om byggeprosjektet|Kontakt for bygging og vedlikehold|Artikler om bygging og boliger|Guider til oppussing av hus|Kjøpe bolig: tekniske kontroller|Byggefirma og boligrenovering|Vannlekkasjer og fukt i boligen|Tiårig byggeforsikring: en veileder|Isolasjon eller varmeisolerende puss|Isoplam-gulv til utendørs bruk|Microverlay Isoplam mikrosement|Eiendomsforvaltning og vedlikehold|Middelhavshager og uteområder|Steinarbeider og fasader|Mønstret betong og harpiksgulv|Basseng og hagedammer|Murte kjøkken etter mål|Deformasjoner i bygningskonstruksjoner|Kundeomtaler og erfaringer|Nøkkelferdig boligrenovering|Samordning av byggeprosjekter|Bygging og renovering: artikler|Byggestøtte og tillatelser|Byggeplasser og arbeider: arkiv|Hagedesign og uteområder|Teknisk hjelp til boligen din|Skreddersydde møbler i hele verden|Lokalt område for byggetjenester|Informasjon om personopplysninger|Informasjonskapsler og ulike samtykker|Bilder og kunstig intelligens|Informasjonskapsler og nettstatistikk|Arbeidsområder: kysten og Madonie|Møbler i betong og mikrosement|Sicilia og reiser på forespørsel|Utleieforvaltning med en partner',
  da: 'Byggeri og husrenovering|Byggearbejde og boligvedligehold|Sådan organiserer vi byggearbejdet|Boligpleje for ejere i udlandet|Tal med os om dit byggeprojekt|Kontakt om byggeri og vedligehold|Artikler om byggeri og boliger|Vejledninger til renovering af hus|Boligkøb: tekniske kontroller|Byggefirma og husrenovering|Vandlækager og fugt i boligen|Tiårig byggeforsikring: en vejledning|Isolering eller varmeisolerende puds|Isoplam-gulve til udendørs brug|Microverlay Isoplam mikrocement|Ejendomsforvaltning og vedligehold|Middelhavshaver og uderum|Stenarbejde og facader|Mønstret beton og harpiksgulve|Swimmingpools og havedamme|Murede køkkener efter mål|Deformationer i bygningskonstruktioner|Kundeanmeldelser og erfaringer|Nøglefærdig husrenovering|Koordinering af byggeprojekter|Byggeri og renovering: artikler|Byggestøtte og tilladelser|Byggepladser og arbejder: arkiv|Havedesign og uderum|Teknisk hjælp til din bolig|Møbler efter mål i hele verden|Lokalt område for byggetjenester|Information om personoplysninger|Cookies og adskilte samtykker|Billeder og kunstig intelligens|Cookies og hjemmesidestatistik|Arbejdsområder: kysten og Madonie|Møbler i beton og mikrocement|Sicilien og rejser på forespørgsel|Udlejningsforvaltning med partner',
};

// Complete sentence alternatives, never character slicing or keyword padding.
const prose = {
  it: {at:'a Cefalù', region:'in Sicilia', detail:'guida pratica', work:'Lavori a', tags:'Articoli su',
    suffix:['Informazioni, ambiti e aspetti da valutare, con collegamenti utili per approfondire e contattare Marenetto Build.',
      'Informazioni e aspetti da valutare, con collegamenti per approfondire e contattare Marenetto Build.',
      'Informazioni e collegamenti per approfondire il tema e contattare Marenetto Build.'],
    legal:['Leggi le informazioni su dati, strumenti e scelte del visitatore, con i riferimenti per approfondire sul sito Marenetto Build.',
      'Informazioni su dati, strumenti e scelte del visitatore, con i riferimenti disponibili sul sito Marenetto Build.',
      'Dati, strumenti e scelte del visitatore: leggi le informazioni disponibili sul sito Marenetto Build.']},
  en: {at:'in Cefalù',region:'in Sicily',detail:'a practical guide',work:'Building work in',tags:'Articles about',
    suffix:['Information, scope and points to consider, with useful links to explore the topic and get in touch with Marenetto Build.',
      'Information and points to consider, with links to explore the topic and contact Marenetto Build.',
      'Information and useful links to explore this topic and get in touch with Marenetto Build.'],
    legal:['Read about data, tools and visitor choices, with links to the relevant information available on the Marenetto Build website.',
      'Read about data, tools and visitor choices, with the relevant information on the Marenetto Build website.',
      'Data, tools and visitor choices: read the information available on the Marenetto Build website.']},
  fr: {at:'à Cefalù',region:'en Sicile',detail:'guide pratique',work:'Travaux à',tags:'Articles sur',
    suffix:['Informations, périmètre et points à examiner, avec des liens utiles pour approfondir le sujet et contacter Marenetto Build.',
      'Informations et points à examiner, avec des liens pour approfondir le sujet et contacter Marenetto Build.',
      'Informations et liens utiles pour approfondir ce sujet et prendre contact avec Marenetto Build.'],
    legal:['Données, outils et choix du visiteur : consultez les informations et les liens disponibles sur le site de Marenetto Build.',
      'Données, outils et choix du visiteur : consultez les informations disponibles sur le site de Marenetto Build.',
      'Consultez les informations sur les données, les outils et vos choix sur le site Marenetto Build.']},
  de: {at:'in Cefalù',region:'auf Sizilien',detail:'ein Ratgeber',work:'Bauarbeiten in',tags:'Artikel über',
    suffix:['Informationen zu Umfang und wichtigen Fragen, mit hilfreichen Links zum Weiterlesen und zur Kontaktaufnahme mit Marenetto Build.',
      'Informationen und wichtige Fragen, mit Links zum Weiterlesen und zur Kontaktaufnahme mit Marenetto Build.',
      'Informationen und hilfreiche Links zum Thema sowie zur Kontaktaufnahme mit Marenetto Build.'],
    legal:['Daten, eingesetzte Dienste und Ihre Wahlmöglichkeiten: Lesen Sie die Informationen und Hinweise auf der Website von Marenetto Build.',
      'Daten, Dienste und Ihre Wahlmöglichkeiten: Lesen Sie die Informationen auf der Website von Marenetto Build.',
      'Informationen zu Daten, Diensten und Ihren Wahlmöglichkeiten auf der Website von Marenetto Build.']},
  nl: {at:'in Cefalù',region:'op Sicilië',detail:'een praktische gids',work:'Bouwwerk in',tags:'Artikelen over',
    suffix:['Informatie over de omvang en aandachtspunten, met nuttige links om verder te lezen en contact op te nemen met Marenetto Build.',
      'Informatie en aandachtspunten, met links om verder te lezen en contact op te nemen met Marenetto Build.',
      'Informatie en nuttige links om verder te lezen over dit onderwerp en Marenetto Build te bereiken.'],
    legal:['Gegevens, hulpmiddelen en keuzes van bezoekers: lees de informatie en verwijzingen op de website van Marenetto Build.',
      'Gegevens, hulpmiddelen en uw keuzes: lees de beschikbare informatie op de website van Marenetto Build.',
      'Lees de informatie over gegevens, hulpmiddelen en uw keuzes op de website van Marenetto Build.']},
  es: {at:'en Cefalù',region:'en Sicilia',detail:'guía práctica',work:'Obras en',tags:'Artículos sobre',
    suffix:['Información, alcance y aspectos que valorar, con enlaces útiles para profundizar en el tema y contactar con Marenetto Build.',
      'Información y aspectos que valorar, con enlaces para profundizar en el tema y contactar con Marenetto Build.',
      'Información y enlaces útiles para profundizar en este tema y ponerte en contacto con Marenetto Build.'],
    legal:['Datos, herramientas y opciones del visitante: consulta la información y los enlaces disponibles en el sitio de Marenetto Build.',
      'Datos, herramientas y opciones del visitante: consulta la información disponible en el sitio Marenetto Build.',
      'Consulta la información sobre datos, herramientas y tus opciones en el sitio web de Marenetto Build.']},
  pt: {at:'em Cefalù',region:'na Sicília',detail:'guia prático',work:'Obras em',tags:'Artigos sobre',
    suffix:['Informações, âmbito e aspetos a avaliar, com ligações úteis para aprofundar o tema e entrar em contacto com a Marenetto Build.',
      'Informações e aspetos a avaliar, com ligações para aprofundar o tema e contactar a Marenetto Build.',
      'Informações e ligações úteis para saber mais sobre este tema e contactar a Marenetto Build.'],
    legal:['Dados, ferramentas e escolhas do visitante: consulte as informações e ligações disponíveis no site da Marenetto Build.',
      'Dados, ferramentas e escolhas do visitante: consulte as informações disponíveis no site da Marenetto Build.',
      'Consulte as informações sobre dados, ferramentas e as suas escolhas no site da Marenetto Build.']},
  ru: {at:'в Чефалу',region:'на Сицилии',detail:'практическое руководство',work:'Строительные работы:',tags:'Статьи по теме:',
    suffix:['Информация, объём работ и вопросы для обсуждения, а также полезные ссылки по теме и способы связаться с Marenetto Build.',
      'Информация и вопросы для обсуждения, ссылки для изучения темы и способы связаться с Marenetto Build.',
      'Информация и полезные ссылки для изучения темы и связи с командой Marenetto Build.'],
    legal:['Данные, инструменты и выбор посетителя: ознакомьтесь с информацией и полезными ссылками на сайте компании Marenetto Build.',
      'Данные, инструменты и выбор посетителя: ознакомьтесь с информацией на сайте компании Marenetto Build.',
      'Информация о данных, инструментах и выборе посетителя доступна на сайте компании Marenetto Build.']},
  pl: {at:'w Cefalù',region:'na Sycylii',detail:'poradnik praktyczny',work:'Prace budowlane:',tags:'Artykuły na temat:',
    suffix:['Informacje, zakres i kwestie do rozważenia oraz przydatne odnośniki do dalszej lektury i kontaktu z zespołem Marenetto Build.',
      'Informacje i kwestie do rozważenia oraz odnośniki do dalszej lektury i kontaktu z Marenetto Build.',
      'Informacje i przydatne odnośniki do dalszej lektury na ten temat oraz do kontaktu z Marenetto Build.'],
    legal:['Dane, narzędzia i wybory odwiedzających: przeczytaj informacje i skorzystaj z odnośników na stronie internetowej Marenetto Build.',
      'Dane, narzędzia i wybory odwiedzających: przeczytaj informacje na stronie internetowej Marenetto Build.',
      'Informacje o danych, narzędziach i wyborach odwiedzających na stronie internetowej Marenetto Build.']},
  sv: {at:'i Cefalù',region:'på Sicilien',detail:'en praktisk guide',work:'Byggarbeten i',tags:'Artiklar om',
    suffix:['Information, omfattning och frågor att tänka igenom, med användbara länkar för vidare läsning och kontakt med Marenetto Build.',
      'Information och frågor att tänka igenom, med länkar för vidare läsning och kontakt med Marenetto Build.',
      'Information och användbara länkar för att läsa vidare om ämnet och kontakta Marenetto Build.'],
    legal:['Uppgifter, verktyg och besökarens val: läs informationen och följ länkarna som finns tillgängliga på Marenetto Builds webbplats.',
      'Uppgifter, verktyg och besökarens val: läs den tillgängliga informationen på Marenetto Builds webbplats.',
      'Läs informationen om uppgifter, verktyg och besökarens val på webbplatsen för Marenetto Build.']},
  no: {at:'i Cefalù',region:'på Sicilia',detail:'en praktisk veileder',work:'Byggearbeid i',tags:'Artikler om',
    suffix:['Informasjon, omfang og spørsmål å vurdere, med nyttige lenker for å lese mer om temaet og ta kontakt med Marenetto Build.',
      'Informasjon og spørsmål å vurdere, med lenker for å lese mer om temaet og kontakte Marenetto Build.',
      'Informasjon og nyttige lenker for å lese mer om dette temaet og kontakte Marenetto Build.'],
    legal:['Opplysninger, verktøy og besøkendes valg: les informasjonen og følg lenkene som er tilgjengelige på nettstedet til Marenetto Build.',
      'Opplysninger, verktøy og besøkendes valg: les informasjonen på nettstedet til Marenetto Build.',
      'Les informasjonen om opplysninger, verktøy og besøkendes valg på nettstedet til Marenetto Build.']},
  da: {at:'i Cefalù',region:'på Sicilien',detail:'en praktisk vejledning',work:'Byggearbejde i',tags:'Artikler om',
    suffix:['Information, omfang og spørgsmål at overveje, med nyttige links til at læse mere om emnet og kontakte Marenetto Build.',
      'Information og spørgsmål at overveje, med links til at læse mere om emnet og kontakte Marenetto Build.',
      'Information og nyttige links til at læse videre om dette emne og kontakte Marenetto Build.'],
    legal:['Oplysninger, værktøjer og besøgendes valg: læs informationen og følg de relevante links på hjemmesiden for Marenetto Build.',
      'Oplysninger, værktøjer og besøgendes valg: læs informationen på hjemmesiden for Marenetto Build.',
      'Læs informationen om oplysninger, værktøjer og besøgendes valg på hjemmesiden for Marenetto Build.']},
};
for (const [locale, text] of Object.entries(topics)) {
  if (text.split('|').length !== keys.length) throw new Error(`Incomplete search topics: ${locale}`);
}
const length = value => [...value.normalize('NFC')].length;
const select = (candidates, min, max) => candidates.find(s => length(s)>=min && length(s)<=max) ??
  candidates.reduce((a,b)=>Math.abs(length(a)-(min+max)/2)<=Math.abs(length(b)-(min+max)/2)?a:b);
const qualifiers = {
  it:['informazioni','ambiti e contatti','sul sito'],
  en:['overview','scope and contact','information'],
  fr:['informations','repères et contact','sur le site'],
  de:['Hinweise','Umfang und Kontakt','im Überblick'],
  nl:['informatie','aanbod en contact','op de website'],
  es:['información','alcance y contacto','en la web'],
  pt:['informações','âmbito e contacto','no site'],
  ru:['информация','обзор и контакты','на сайте'],
  pl:['informacje','zakres i kontakt','na stronie'],
  sv:['information','innehåll och kontakt','på webbplatsen'],
  no:['informasjon','omfang og kontakt','på nettstedet'],
  da:['information','omfang og kontakt','på hjemmesiden'],
};
const middle = {
  it:'Informazioni sul tema, domande da approfondire e collegamenti utili per parlare della tua richiesta con Marenetto Build.',
  en:'Read about the topic and the questions to consider, with useful links for your next conversation with Marenetto Build.',
  fr:'Informations sur le sujet et les questions à examiner, avec des liens utiles pour échanger avec Marenetto Build.',
  de:'Informationen zum Thema und wichtige Fragen, mit nützlichen Links zum Weiterlesen und zum Kontakt mit Marenetto Build.',
  nl:'Informatie over het onderwerp en nuttige links om verder te lezen en contact op te nemen met Marenetto Build.',
  es:'Información sobre el tema y cuestiones que valorar, con enlaces útiles para hablar con Marenetto Build.',
  pt:'Informações sobre o tema e questões a avaliar, com ligações úteis para falar com a equipa da Marenetto Build.',
  ru:'Информация по теме и вопросы для обсуждения, полезные ссылки и контакты местной команды Marenetto Build.',
  pl:'Informacje na ten temat, kwestie do omówienia i przydatne odnośniki ułatwiające kontakt z zespołem Marenetto Build.',
  sv:'Information om ämnet och frågor att överväga, med användbara länkar för samtal och kontakt med Marenetto Build.',
  no:'Informasjon om temaet og spørsmål å vurdere, med nyttige lenker for en samtale med teamet i Marenetto Build.',
  da:'Information om emnet og spørgsmål at overveje, med nyttige links til en samtale med teamet hos Marenetto Build.',
};
const revisedTopics = {
  it:{'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam':'Microcemento Isoplam: rivestimenti'},
  en:{'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam':'Microcement flooring: Microverlay'},
  nl:{abroad:'Woningzorg voor eigenaars op afstand',
    'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam':'Microcementvloeren met Microverlay'},
  da:{abroad:'Boligpleje for boligejere i udlandet','service-premium':'Møbler efter mål til hele verden','legal-ai':'Billeder og brug af kunstig intelligens',
    'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam':'Mikrocementgulve med Microverlay',
    'service-local':'Lokalt område for byggearbejder'},
  sv:{'legal-privacy':'Så behandlas dina personuppgifter','custom-furniture':'Möbler av betong och mikrocement','sicily-travel':'Sicilien och arbetsresor på förfrågan',
    'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam':'Mikrocementgolv med Microverlay'},
  pl:{'sicily-travel':'Sycylia i wyjazdy zespołu na zamówienie'},
  no:{'custom-furniture':'Møbler laget i betong og mikrosement'},
};
const placeDetails = {
  it:'Scopri gli aspetti da valutare per la casa, gli interventi collegati e come avviare un confronto sulle tue esigenze con Marenetto Build.',
  en:'Explore the questions to consider for your property, related building work and how to discuss your requirements with Marenetto Build.',
  fr:'Découvrez les points à examiner pour votre maison, les travaux associés et comment parler de vos besoins avec Marenetto Build.',
  de:'Lesen Sie, welche Fragen für Ihr Haus und die Arbeiten wichtig sind und wie Sie Ihr Vorhaben mit Marenetto Build besprechen können.',
  nl:'Lees welke vragen van belang zijn voor uw woning en het bouwwerk en hoe u uw wensen kunt bespreken met het team van Marenetto Build.',
  es:'Descubre las cuestiones que valorar para tu casa, las obras relacionadas y cómo hablar de tus necesidades con Marenetto Build.',
  pt:'Conheça as questões a avaliar para a sua casa, as obras relacionadas e como falar das suas necessidades com a Marenetto Build.',
  ru:'Узнайте, какие вопросы стоит обсудить по дому и строительным работам и как рассказать о своих потребностях команде Marenetto Build.',
  pl:'Sprawdź, jakie kwestie warto omówić w sprawie domu i prac budowlanych oraz jak porozmawiać o swoich potrzebach z Marenetto Build.',
  sv:'Läs om frågor att överväga för ditt hus, relaterade byggarbeten och hur du kan diskutera dina behov med teamet på Marenetto Build.',
  no:'Les om spørsmål å vurdere for boligen, aktuelle byggearbeider og hvordan du kan diskutere behovene dine med teamet i Marenetto Build.',
  da:'Læs om spørgsmål at overveje for boligen, relevante byggearbejder og hvordan du kan drøfte dine behov med teamet hos Marenetto Build.',
};
const legalMiddle = {
  no:'Les om opplysninger, verktøy og besøkendes valg, med relevante henvisninger og kontaktinformasjon på Marenetto Builds nettsted.',
  pl:'Dane, narzędzia i wybory odwiedzających: poznaj informacje i przydatne odnośniki dostępne na stronie Marenetto Build.',
};
const specificDescriptions = {
  'property-management': {
    it:'Affitti brevi a Cefalù con il partner Cefalù Apartments: CIN, portali, pulizie e check-in. Marenetto Build segue lavori e manutenzione, con ruoli distinti.',
    en:'Short lets in Cefalù with partner Cefalù Apartments: CIN, listings, cleaning and check-in. Marenetto Build handles building work and upkeep, in a separate role.',
    fr:'Locations à Cefalù avec le partenaire Cefalù Apartments : CIN, annonces, ménage et accueil. Marenetto Build intervient pour les travaux et l’entretien.',
    de:'Ferienvermietung in Cefalù mit Partner Cefalù Apartments: CIN, Portale, Reinigung und Check-in. Marenetto Build übernimmt Bauarbeiten und Instandhaltung.',
    nl:'Vakantieverhuur in Cefalù met partner Cefalù Apartments: CIN, platforms, schoonmaak en inchecken. Marenetto Build verzorgt bouwwerk en onderhoud aan de woning.',
    es:'Alquiler vacacional en Cefalù con el socio Cefalù Apartments: CIN, portales, limpieza y entradas. Marenetto Build se ocupa de obras y mantenimiento.',
    pt:'Arrendamento de férias em Cefalù com o parceiro Cefalù Apartments: CIN, portais, limpeza e check-in. A Marenetto Build trata de obras e manutenção.',
    ru:'Аренда в Чефалу с партнёром Cefalù Apartments: CIN, порталы, уборка и заселение. Marenetto Build занимается строительными работами и обслуживанием дома.',
    pl:'Najem wakacyjny w Cefalù z partnerem Cefalù Apartments: CIN, portale, sprzątanie i przyjazdy. Marenetto Build zajmuje się pracami budowlanymi i utrzymaniem.',
    sv:'Semesteruthyrning i Cefalù med partnern Cefalù Apartments: CIN, portaler, städning och incheckning. Marenetto Build sköter byggarbeten och husunderhåll.',
    no:'Ferieutleie i Cefalù med partneren Cefalù Apartments: CIN, portaler, renhold og innsjekking. Marenetto Build tar seg av byggearbeider og boligvedlikehold.',
    da:'Ferieudlejning i Cefalù med partneren Cefalù Apartments: CIN, portaler, rengøring og indtjekning. Marenetto Build tager sig af byggearbejde og vedligehold.',
  },
};
const descriptionExceptions = {
  'sv:legal-privacy':'Så behandlas dina personuppgifter. Läs om uppgifter, verktyg och dina val som besökare, med relevanta hänvisningar på webbplatsen för Marenetto Build.',
  'no:legal-privacy':'Informasjon om personopplysninger. Les om data, verktøy og besøkendes valg, med relevante henvisninger på det offisielle nettstedet til Marenetto Build.',
  'no:legal-cookies':'Informasjonskapsler og ulike samtykker. Les om statistikk, markedsføring og dine valg på nettstedet, med utfyllende informasjon om Marenetto Build.',
  'da:legal-ai':'Billeder og brug af kunstig intelligens. Læs om illustrative billeder, deres mærkning og oplysninger om brugen af AI på Marenetto Builds hjemmeside.',
};

export function searchCopy(edition) {
  const c=prose[edition.locale];
  if (!c || !edition.id) return undefined; // Never open or substitute an unactivated language.
  let topic=topics[edition.locale].split('|')[keys.indexOf(edition.id)];
  topic=revisedTopics[edition.locale]?.[edition.id] ?? topic;
  const place=edition.id.startsWith('place-') ? edition.title.split(':')[0].trim() : undefined;
  if (place) topic=`${edition.locale==='ru' ? 'Работы в' : edition.locale==='da' ? 'Byggearbejder i' : c.work} ${place}`;
  if (edition.id.startsWith('historical:/tag/')) {
    // The original native tag label is documentary evidence of the topic.
    const tag=edition.title.split(/\s*[|—]\s*/)[0].trim();
    topic=`${c.tags} ${tag}`;
  }
  if (!topic) return undefined;
  const legal=edition.kind==='legal' || edition.id.startsWith('legal-');
  const nonlocal=legal || ['service-premium','custom-furniture','sicily-travel','abroad'].includes(edition.id);
  // Do not put a different town "in Cefalù". Place names identify coverage,
  // not a local office, a delivered job, or a second location within Cefalù.
  const candidates=nonlocal || place
    ? [topic, ...(place ? [`${topic} ${c.region}`] : []), ...qualifiers[edition.locale].map(q=>`${topic}: ${q}`)]
    : [topic, `${topic} ${c.at}`, `${topic} ${c.region}`, ...qualifiers[edition.locale].map(q=>`${topic}: ${q}`)];
  const title=edition.locale==='da' && edition.id==='place-termini-imerese'
    ? 'Byggeri i Termini Imerese på Sicilien | Marenetto Build'
    : select(candidates.map(t=>t+' | Marenetto Build'),50,60);
  const alternatives=legal ? [...c.legal,...(legalMiddle[edition.locale]?[legalMiddle[edition.locale]]:[])] :
    [...c.suffix,middle[edition.locale],...(place?[placeDetails[edition.locale]]:[])];
  // Keep already useful, specific editorial descriptions rather than replacing
  // them merely to impose a uniform formula. Never preserve an ellipsis cut.
  const original=String(edition.description??'').trim();
  const safeOriginal=length(original)>=140 && length(original)<=160 && !/[.…]…$|…$/.test(original) &&
    ['custom-furniture','sicily-travel'].includes(edition.id);
  const description=specificDescriptions[edition.id]?.[edition.locale] ?? descriptionExceptions[edition.locale+':'+edition.id] ??
    (safeOriginal ? original : detailedDescription(edition,topic) ?? select(alternatives.map(t=>`${topic}. ${t}`),140,160));
  return {title,description};
}
