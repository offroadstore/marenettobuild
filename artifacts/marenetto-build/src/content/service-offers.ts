import pages from '@/localization/public-pages.json';
import { ownerDecisions } from './owner-decisions';

/** New copy is a release candidate, not an inherited translation approval. */
export const SERVICE_LOCALES = ['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da'] as const;
export type ServiceCopy = {
  premiumTitle: string; localTitle: string; scope: string; premiumIntro: string;
  materials: string; process: string; travel: string; gallery: string;
  request: string; faqTitle: string; faq: [string, string][];
};
export const serviceCopy: Record<string, ServiceCopy> = {
  it: {
    premiumTitle: 'Arredi premium su misura, nel mondo',
    localTitle: 'Costruzioni e ristrutturazioni a Cefalù',
    scope: 'Due ambiti distinti: lavori edili entro circa 60 km stradali da Cefalù, previa verifica dell’indirizzo; arredi premium su misura in tutto il mondo, con trasferta del team.',
    premiumIntro: 'Tavoli esclusivi in cemento e microcemento e pezzi di design su misura. Partiamo dall’ambiente, dall’uso e dalle tue esigenze per definire un arredo, non un prodotto standard a catalogo.',
    materials: 'Cemento, microcemento e finiture si valutano per il singolo pezzo. Forma, dimensioni, supporto, peso, protezione e manutenzione vanno definiti nel progetto e nel preventivo: non attribuiamo prestazioni generiche a tutti i materiali.',
    process: 'Invia misure indicative, fotografie dell’ambiente, destinazione d’uso e riferimenti del risultato desiderato. Chiariremo fattibilità, materiali, dettagli, accessi e condizioni prima di formulare una proposta su richiesta.',
    travel: 'L’offerta di arredi è mondiale e comprende la possibilità di trasferta del team. Trasporto, accesso, posa, viaggio ed eventuali adempimenti locali sono da definire per destinazione. Questo non estende all’estero il servizio edile.',
    gallery: 'La raccolta dei lavori documentati è in preparazione. Qui non mostriamo immagini illustrative come opere realizzate. Puoi chiedere informazioni sul tuo progetto senza un catalogo di prodotti fittizi.',
    request: 'Richiedi una proposta su misura', faqTitle: 'Domande sugli arredi',
    faq: [
      ['Quali sono i tempi?', 'Tempi di studio, realizzazione, trasporto e posa si concordano dopo aver definito il progetto. Non è disponibile una scadenza standard valida per ogni pezzo e destinazione.'],
      ['Il team può venire all’estero?', 'Sì, per gli arredi premium su misura è prevista la trasferta del team, con modalità e costi da concordare. I lavori edili restano locali, entro circa 60 km stradali da Cefalù.'],
      ['Quali materiali posso scegliere?', 'Valutiamo cemento, microcemento e finiture in relazione all’uso e al progetto. Campioni, protezioni, limiti e manutenzione devono essere concordati per la soluzione proposta.'],
      ['Come ricevo un preventivo?', 'Invia destinazione, misure, uso, immagini dell’ambiente e priorità. Il preventivo è su richiesta e chiarirà lavorazioni e logistica; non pubblichiamo prezzi o disponibilità inventati.'],
    ],
  },
  en: {
    premiumTitle: 'Premium bespoke furniture, worldwide', localTitle: 'Building and renovation in Cefalù',
    scope: 'Two distinct services: building work within about 60 km by road of Cefalù, subject to address checks; premium bespoke furniture worldwide, with team travel.',
    premiumIntro: 'Exclusive cement and microcement tables and bespoke design pieces. We start with the space, intended use and your needs to define a piece of furniture, not a standard catalogue product.',
    materials: 'Cement, microcement and finishes are assessed for each piece. Shape, dimensions, substrate, weight, protection and maintenance must be defined in the project and quotation; no blanket material performance is assumed.',
    process: 'Send approximate measurements, photographs of the space, intended use and references for the result you want. Feasibility, materials, details, access and terms are clarified before a proposal is prepared on request.',
    travel: 'Furniture is offered worldwide, with the option of the team travelling. Transport, access, installation, travel and local requirements are defined for each destination. This does not extend building services abroad.',
    gallery: 'The collection of documented work is being prepared. We do not present illustrative images as completed projects. You can discuss your project without a fictitious product catalogue.',
    request: 'Request a bespoke proposal', faqTitle: 'Furniture questions',
    faq: [
      ['What are the lead times?', 'Design, production, transport and installation schedules are agreed after the project is defined. There is no standard deadline for every piece and destination.'],
      ['Can the team travel abroad?', 'Yes, team travel is available for premium bespoke furniture, with arrangements and costs agreed individually. Building work remains local, within about 60 km by road of Cefalù.'],
      ['Which materials can I choose?', 'We assess cement, microcement and finishes according to use and design. Samples, protection, limitations and maintenance must be agreed for the proposed solution.'],
      ['How do I get a quotation?', 'Send the destination, dimensions, use, photographs of the space and priorities. Quotations are on request and clarify work and logistics; we do not publish invented prices or availability.'],
    ],
  },
  de: {
    premiumTitle: 'Maßgefertigte Premium-Möbel, weltweit', localTitle: 'Bauen und Renovieren in Cefalù',
    scope: 'Zwei getrennte Angebote: Bauarbeiten bis etwa 60 Straßenkilometer ab Cefalù nach Prüfung der Adresse; maßgefertigte Premium-Möbel weltweit mit Anreise des Teams.',
    premiumIntro: 'Exklusive Tische aus Zement und Mikrozement sowie maßgefertigte Designstücke. Ausgangspunkt sind Raum, Nutzung und Ihre Wünsche, nicht ein Standardprodukt aus einem Katalog.',
    materials: 'Zement, Mikrozement und Oberflächen werden je Möbelstück bewertet. Form, Maße, Untergrund, Gewicht, Schutz und Pflege werden im Projekt und Angebot festgelegt. Pauschale Materialeigenschaften werden nicht versprochen.',
    process: 'Senden Sie ungefähre Maße, Fotos des Raums, den Verwendungszweck und Vorstellungen zum Ergebnis. Machbarkeit, Materialien, Details, Zugang und Bedingungen klären wir vor einem individuellen Angebot.',
    travel: 'Das Möbelangebot gilt weltweit und ermöglicht die Anreise des Teams. Transport, Zugang, Montage, Reise und örtliche Anforderungen werden je Ziel vereinbart. Bauleistungen im Ausland sind damit nicht verbunden.',
    gallery: 'Eine Sammlung dokumentierter Arbeiten wird vorbereitet. Illustrationen werden hier nicht als ausgeführte Projekte dargestellt. Anfragen sind auch ohne erfundenen Produktkatalog möglich.',
    request: 'Individuelles Angebot anfragen', faqTitle: 'Fragen zu Möbeln',
    faq: [
      ['Welche Lieferzeiten gelten?', 'Planung, Herstellung, Transport und Montage werden nach Festlegung des Projekts terminiert. Es gibt keine einheitliche Frist für jedes Stück und jedes Ziel.'],
      ['Reist das Team ins Ausland?', 'Ja, bei maßgefertigten Premium-Möbeln ist eine Anreise möglich; Ablauf und Kosten werden vereinbart. Bauarbeiten bleiben auf etwa 60 Straßenkilometer ab Cefalù begrenzt.'],
      ['Welche Materialien sind möglich?', 'Zement, Mikrozement und Oberflächen werden nach Nutzung und Entwurf bewertet. Muster, Schutz, Grenzen und Pflege sind für die konkrete Lösung zu vereinbaren.'],
      ['Wie erhalte ich ein Angebot?', 'Senden Sie Zielort, Maße, Nutzung, Raumfotos und Prioritäten. Das Angebot auf Anfrage klärt Arbeiten und Logistik; erfundene Preise oder Verfügbarkeiten gibt es nicht.'],
    ],
  },
  fr: {
    premiumTitle: 'Mobilier haut de gamme sur mesure, dans le monde', localTitle: 'Construction et rénovation à Cefalù',
    scope: 'Deux offres distinctes : travaux dans un périmètre d’environ 60 km par la route depuis Cefalù, après vérification de l’adresse ; mobilier haut de gamme sur mesure dans le monde, avec déplacement de l’équipe.',
    premiumIntro: 'Tables exclusives en ciment et microciment et pièces de design sur mesure. Nous partons du lieu, de l’usage et de vos besoins, pas d’un produit standard de catalogue.',
    materials: 'Ciment, microciment et finitions sont étudiés pour chaque pièce. Forme, dimensions, support, poids, protection et entretien sont définis dans le projet et le devis, sans promesse générale de performance.',
    process: 'Envoyez des mesures indicatives, des photos du lieu, l’usage prévu et vos références. Faisabilité, matériaux, détails, accès et conditions sont précisés avant une proposition sur demande.',
    travel: 'Le mobilier est proposé dans le monde avec déplacement possible de l’équipe. Transport, accès, pose, voyage et formalités locales sont définis pour chaque destination. Cela n’étend pas les travaux de construction à l’étranger.',
    gallery: 'La collection de travaux documentés est en préparation. Aucune illustration n’est présentée comme une réalisation. Vous pouvez nous parler de votre projet sans catalogue fictif.',
    request: 'Demander une proposition sur mesure', faqTitle: 'Questions sur le mobilier',
    faq: [
      ['Quels sont les délais ?', 'Étude, fabrication, transport et pose sont planifiés après définition du projet. Il n’existe pas de délai standard pour chaque pièce et destination.'],
      ['L’équipe se déplace-t-elle à l’étranger ?', 'Oui, pour le mobilier haut de gamme sur mesure, selon des modalités et coûts convenus. Les travaux de construction restent locaux, à environ 60 km par la route de Cefalù.'],
      ['Quels matériaux choisir ?', 'Nous étudions ciment, microciment et finitions selon l’usage et le projet. Échantillons, protections, limites et entretien sont à convenir pour la solution proposée.'],
      ['Comment obtenir un devis ?', 'Indiquez destination, dimensions, usage, photos du lieu et priorités. Le devis sur demande précise travaux et logistique, sans prix ni disponibilités inventés.'],
    ],
  },
  es: {
    premiumTitle: 'Muebles prémium a medida, en todo el mundo', localTitle: 'Construcción y reformas en Cefalù',
    scope: 'Dos ofertas distintas: obras a unos 60 km por carretera de Cefalù, previa comprobación de la dirección; muebles prémium a medida en todo el mundo, con desplazamiento del equipo.',
    premiumIntro: 'Mesas exclusivas de cemento y microcemento y piezas de diseño a medida. Partimos del espacio, el uso y tus necesidades, no de un producto estándar de catálogo.',
    materials: 'El cemento, el microcemento y los acabados se valoran para cada pieza. Forma, medidas, soporte, peso, protección y mantenimiento se definen en el proyecto y el presupuesto, sin prestaciones genéricas prometidas.',
    process: 'Envía medidas aproximadas, fotos del espacio, uso previsto y referencias del resultado deseado. Aclaramos viabilidad, materiales, detalles, acceso y condiciones antes de una propuesta bajo petición.',
    travel: 'Ofrecemos muebles en todo el mundo, con posibilidad de desplazamiento del equipo. Transporte, acceso, instalación, viaje y requisitos locales se acuerdan para cada destino. Esto no amplía las obras al extranjero.',
    gallery: 'Estamos preparando la colección de trabajos documentados. No presentamos ilustraciones como obras realizadas. Puedes consultar tu proyecto sin un catálogo ficticio.',
    request: 'Solicitar una propuesta a medida', faqTitle: 'Preguntas sobre muebles',
    faq: [
      ['¿Cuáles son los plazos?', 'Diseño, fabricación, transporte e instalación se acuerdan tras definir el proyecto. No existe un plazo estándar para todas las piezas y destinos.'],
      ['¿El equipo viaja al extranjero?', 'Sí, para muebles prémium a medida, con condiciones y costes acordados. Las obras siguen siendo locales, a unos 60 km por carretera de Cefalù.'],
      ['¿Qué materiales puedo elegir?', 'Valoramos cemento, microcemento y acabados según el uso y el diseño. Muestras, protecciones, límites y mantenimiento deben acordarse para cada solución.'],
      ['¿Cómo recibo un presupuesto?', 'Envía destino, medidas, uso, fotos del espacio y prioridades. El presupuesto bajo petición detalla trabajos y logística; no publicamos precios ni disponibilidad inventados.'],
    ],
  },
  nl: {
    premiumTitle: 'Premium maatwerkmeubels, wereldwijd', localTitle: 'Bouwen en renoveren in Cefalù',
    scope: 'Twee aparte diensten: bouwwerk binnen ongeveer 60 km over de weg vanaf Cefalù, na controle van het adres; premium maatwerkmeubels wereldwijd, waarbij het team kan meereizen.',
    premiumIntro: 'Exclusieve tafels van cement en microcement en designstukken op maat. De ruimte, het gebruik en uw wensen vormen het uitgangspunt, niet een standaard catalogusproduct.',
    materials: 'Cement, microcement en afwerkingen worden per meubel beoordeeld. Vorm, maten, ondergrond, gewicht, bescherming en onderhoud worden in ontwerp en offerte vastgelegd, zonder algemene materiaalbeloften.',
    process: 'Stuur globale maten, foto’s van de ruimte, het beoogde gebruik en voorbeelden van het gewenste resultaat. Haalbaarheid, materialen, details, toegang en voorwaarden worden vóór een voorstel op aanvraag verduidelijkt.',
    travel: 'Meubels worden wereldwijd aangeboden, met de mogelijkheid dat het team reist. Vervoer, toegang, plaatsing, reis en lokale eisen worden per bestemming afgesproken. Dit breidt de bouwdiensten niet uit naar het buitenland.',
    gallery: 'De verzameling gedocumenteerde projecten wordt voorbereid. Illustraties worden niet als uitgevoerd werk getoond. U kunt uw project bespreken zonder een verzonnen productcatalogus.',
    request: 'Vraag een voorstel op maat', faqTitle: 'Vragen over meubels',
    faq: [
      ['Wat zijn de levertijden?', 'Ontwerp, productie, vervoer en plaatsing worden na projectbepaling gepland. Er is geen standaardtermijn voor elk meubel en elke bestemming.'],
      ['Reist het team naar het buitenland?', 'Ja, voor premium maatwerkmeubels, met afgesproken voorwaarden en kosten. Bouwwerk blijft lokaal, binnen ongeveer 60 km over de weg vanaf Cefalù.'],
      ['Welke materialen kan ik kiezen?', 'We beoordelen cement, microcement en afwerkingen op gebruik en ontwerp. Monsters, bescherming, beperkingen en onderhoud worden per oplossing afgesproken.'],
      ['Hoe krijg ik een offerte?', 'Stuur bestemming, maten, gebruik, ruimtefoto’s en prioriteiten. De offerte op aanvraag verduidelijkt werk en logistiek; we publiceren geen verzonnen prijzen of beschikbaarheid.'],
    ],
  },
  pt: {
    premiumTitle: 'Mobiliário premium por medida, em todo o mundo', localTitle: 'Construção e renovação em Cefalù',
    scope: 'Duas ofertas distintas: obras num percurso de cerca de 60 km por estrada a partir de Cefalù, após verificação da morada; mobiliário premium por medida em todo o mundo, com deslocação da equipa.',
    premiumIntro: 'Mesas exclusivas em cimento e microcimento e peças de design por medida. Partimos do espaço, da utilização e das suas necessidades, não de um produto de catálogo.',
    materials: 'Cimento, microcimento e acabamentos são avaliados para cada peça. Forma, dimensões, suporte, peso, proteção e manutenção são definidos no projeto e no orçamento, sem promessas genéricas de desempenho.',
    process: 'Envie medidas indicativas, fotografias do espaço, utilização prevista e referências do resultado desejado. Esclarecemos viabilidade, materiais, detalhes, acessos e condições antes da proposta a pedido.',
    travel: 'O mobiliário é proposto em todo o mundo, com possibilidade de deslocação da equipa. Transporte, acesso, instalação, viagem e requisitos locais são definidos por destino. As obras não passam a ser oferecidas no estrangeiro.',
    gallery: 'A coleção de trabalhos documentados está em preparação. Não apresentamos ilustrações como obras realizadas. Pode falar do seu projeto sem um catálogo fictício.',
    request: 'Pedir uma proposta por medida', faqTitle: 'Perguntas sobre mobiliário',
    faq: [
      ['Quais são os prazos?', 'Estudo, produção, transporte e instalação são acordados após a definição do projeto. Não existe um prazo padrão para todas as peças e destinos.'],
      ['A equipa desloca-se ao estrangeiro?', 'Sim, para mobiliário premium por medida, com condições e custos acordados. As obras mantêm-se locais, até cerca de 60 km por estrada de Cefalù.'],
      ['Que materiais posso escolher?', 'Avaliamos cimento, microcimento e acabamentos conforme a utilização e o projeto. Amostras, proteções, limites e manutenção são acordados para a solução proposta.'],
      ['Como obtenho um orçamento?', 'Envie destino, dimensões, utilização, fotos do espaço e prioridades. O orçamento a pedido esclarece trabalhos e logística; não publicamos preços ou disponibilidades inventados.'],
    ],
  },
  pl: {
    premiumTitle: 'Meble premium na wymiar, na całym świecie', localTitle: 'Budowa i remonty w Cefalù',
    scope: 'Dwie odrębne oferty: prace budowlane do około 60 km drogą od Cefalù, po sprawdzeniu adresu; meble premium na wymiar na całym świecie, z wyjazdem zespołu.',
    premiumIntro: 'Ekskluzywne stoły z cementu i mikrocementu oraz designerskie meble na wymiar. Punktem wyjścia są wnętrze, zastosowanie i Twoje potrzeby, nie standardowy produkt katalogowy.',
    materials: 'Cement, mikrocement i wykończenia oceniamy dla każdego mebla. Kształt, wymiary, podłoże, ciężar, zabezpieczenie i pielęgnację określamy w projekcie i wycenie, bez ogólnych obietnic parametrów.',
    process: 'Prześlij przybliżone wymiary, zdjęcia wnętrza, przeznaczenie i inspiracje. Przed propozycją na zamówienie ustalamy wykonalność, materiały, detale, dostęp i warunki.',
    travel: 'Oferta mebli obejmuje cały świat i możliwość wyjazdu zespołu. Transport, dostęp, montaż, podróż i lokalne wymogi ustalamy dla miejsca docelowego. Nie rozszerza to robót budowlanych za granicę.',
    gallery: 'Zbiór udokumentowanych realizacji jest przygotowywany. Nie przedstawiamy ilustracji jako wykonanych prac. Możesz omówić projekt bez fikcyjnego katalogu.',
    request: 'Poproś o indywidualną propozycję', faqTitle: 'Pytania o meble',
    faq: [
      ['Jakie są terminy?', 'Projekt, produkcję, transport i montaż uzgadniamy po określeniu projektu. Nie ma jednego terminu dla wszystkich mebli i miejsc docelowych.'],
      ['Czy zespół wyjeżdża za granicę?', 'Tak, przy meblach premium na wymiar, na uzgodnionych warunkach i za uzgodnioną cenę. Roboty budowlane pozostają lokalne, do około 60 km drogą od Cefalù.'],
      ['Jakie materiały mogę wybrać?', 'Oceniamy cement, mikrocement i wykończenia pod kątem użycia i projektu. Próbki, ochronę, ograniczenia i pielęgnację uzgadniamy dla danej propozycji.'],
      ['Jak otrzymać wycenę?', 'Prześlij miejsce docelowe, wymiary, zastosowanie, zdjęcia wnętrza i priorytety. Wycena na życzenie określa prace i logistykę; nie publikujemy zmyślonych cen ani dostępności.'],
    ],
  },
  ru: {
    premiumTitle: 'Премиальная мебель на заказ по всему миру', localTitle: 'Строительство и ремонт в Чефалу',
    scope: 'Два отдельных направления: строительные работы в пределах примерно 60 км по дороге от Чефалу после проверки адреса; премиальная мебель на заказ по всему миру с выездом команды.',
    premiumIntro: 'Эксклюзивные столы из цемента и микроцемента и дизайнерские предметы на заказ. Мы исходим из пространства, назначения и ваших пожеланий, а не из стандартного каталожного изделия.',
    materials: 'Цемент, микроцемент и отделку оцениваем для каждого предмета. Форму, размеры, основание, вес, защиту и уход определяем в проекте и смете, без общих обещаний характеристик.',
    process: 'Пришлите примерные размеры, фотографии помещения, назначение и примеры желаемого результата. До подготовки предложения по запросу уточняем осуществимость, материалы, детали, доступ и условия.',
    travel: 'Мебель предлагаем по всему миру с возможным выездом команды. Перевозку, доступ, монтаж, поездку и местные требования согласуем для каждого места назначения. Строительные услуги за рубеж это не распространяет.',
    gallery: 'Подборка документально подтверждённых работ готовится. Мы не выдаём иллюстрации за выполненные проекты. Обсудить ваш проект можно без вымышленного каталога.',
    request: 'Запросить индивидуальное предложение', faqTitle: 'Вопросы о мебели',
    faq: [
      ['Каковы сроки?', 'Сроки проектирования, изготовления, перевозки и монтажа согласуются после определения проекта. Единого срока для всех изделий и направлений нет.'],
      ['Выезжает ли команда за границу?', 'Да, для премиальной мебели на заказ, с согласованием условий и затрат. Строительные работы остаются местными, примерно в 60 км по дороге от Чефалу.'],
      ['Какие материалы доступны?', 'Оцениваем цемент, микроцемент и отделку с учётом назначения и проекта. Образцы, защиту, ограничения и уход согласуем для конкретного решения.'],
      ['Как получить смету?', 'Пришлите место назначения, размеры, назначение, фотографии и приоритеты. Смета по запросу уточняет работы и логистику; вымышленные цены и наличие не публикуются.'],
    ],
  },
  sv: {
    premiumTitle: 'Skräddarsydda premiummöbler, världen över', localTitle: 'Byggnation och renovering i Cefalù',
    scope: 'Två skilda erbjudanden: byggarbeten inom cirka 60 km vägsträcka från Cefalù efter adresskontroll; skräddarsydda premiummöbler världen över med resande team.',
    premiumIntro: 'Exklusiva bord i cement och mikrocement samt formgivna möbler på beställning. Vi utgår från rummet, användningen och dina behov, inte en standardprodukt i en katalog.',
    materials: 'Cement, mikrocement och ytor bedöms för varje möbel. Form, mått, underlag, vikt, skydd och skötsel definieras i projekt och offert, utan generella prestandalöften.',
    process: 'Skicka ungefärliga mått, bilder av rummet, avsedd användning och referenser för önskat resultat. Genomförbarhet, material, detaljer, tillträde och villkor klargörs före ett förslag på begäran.',
    travel: 'Möbler erbjuds världen över och teamet kan resa. Transport, tillträde, montering, resa och lokala krav avtalas för varje destination. Det innebär inte byggtjänster utomlands.',
    gallery: 'Samlingen av dokumenterade arbeten förbereds. Illustrationer visas inte som utförda projekt. Du kan diskutera ditt projekt utan en påhittad produktkatalog.',
    request: 'Begär ett skräddarsytt förslag', faqTitle: 'Frågor om möbler',
    faq: [
      ['Vilka är leveranstiderna?', 'Design, tillverkning, transport och montering planeras efter att projektet definierats. Ingen standardtid gäller alla möbler och destinationer.'],
      ['Kan teamet resa utomlands?', 'Ja, för skräddarsydda premiummöbler med avtalade villkor och kostnader. Byggarbeten förblir lokala, inom cirka 60 km vägsträcka från Cefalù.'],
      ['Vilka material kan jag välja?', 'Vi bedömer cement, mikrocement och ytor efter användning och design. Prover, skydd, begränsningar och skötsel avtalas för lösningen.'],
      ['Hur får jag en offert?', 'Skicka destination, mått, användning, rumsbilder och prioriteringar. Offert på begäran klargör arbete och logistik; vi publicerar inte påhittade priser eller tillgänglighet.'],
    ],
  },
  no: {
    premiumTitle: 'Skreddersydde premiummøbler, over hele verden', localTitle: 'Bygging og renovering i Cefalù',
    scope: 'To ulike tilbud: byggearbeid innen omtrent 60 km langs vei fra Cefalù etter adressekontroll; skreddersydde premiummøbler over hele verden med reisende team.',
    premiumIntro: 'Eksklusive bord i sement og mikrosement og designmøbler på mål. Vi tar utgangspunkt i rommet, bruken og dine behov, ikke et standard katalogprodukt.',
    materials: 'Sement, mikrosement og overflater vurderes for hvert møbel. Form, mål, underlag, vekt, beskyttelse og vedlikehold fastsettes i prosjekt og tilbud, uten generelle ytelsesløfter.',
    process: 'Send omtrentlige mål, bilder av rommet, bruksområde og referanser for ønsket resultat. Gjennomførbarhet, materialer, detaljer, tilgang og vilkår avklares før et tilbud på forespørsel.',
    travel: 'Møbler tilbys over hele verden med mulighet for at teamet reiser. Transport, tilgang, montering, reise og lokale krav avtales for hvert reisemål. Dette utvider ikke byggetjenestene til utlandet.',
    gallery: 'Samlingen av dokumenterte arbeider forberedes. Illustrasjoner fremstilles ikke som utførte prosjekter. Du kan diskutere prosjektet uten en oppdiktet produktkatalog.',
    request: 'Be om et skreddersydd tilbud', faqTitle: 'Spørsmål om møbler',
    faq: [
      ['Hva er leveringstiden?', 'Design, produksjon, transport og montering avtales etter at prosjektet er definert. Ingen standardfrist gjelder alle møbler og reisemål.'],
      ['Kan teamet reise til utlandet?', 'Ja, for skreddersydde premiummøbler, med avtalte vilkår og kostnader. Byggearbeid forblir lokalt, innen omtrent 60 km langs vei fra Cefalù.'],
      ['Hvilke materialer kan jeg velge?', 'Vi vurderer sement, mikrosement og overflater etter bruk og design. Prøver, beskyttelse, begrensninger og vedlikehold avtales for løsningen.'],
      ['Hvordan får jeg et tilbud?', 'Send reisemål, mål, bruk, rombilder og prioriteringer. Tilbud på forespørsel avklarer arbeid og logistikk; vi publiserer ikke oppdiktede priser eller tilgjengelighet.'],
    ],
  },
  da: {
    premiumTitle: 'Skræddersyede premiummøbler, i hele verden', localTitle: 'Byggeri og renovering i Cefalù',
    scope: 'To adskilte tilbud: byggearbejde inden for cirka 60 km ad vej fra Cefalù efter adressekontrol; skræddersyede premiummøbler i hele verden med rejsende team.',
    premiumIntro: 'Eksklusive borde i cement og mikrocement samt designmøbler på mål. Vi tager udgangspunkt i rummet, anvendelsen og dine behov, ikke et standardprodukt fra et katalog.',
    materials: 'Cement, mikrocement og overflader vurderes for hvert møbel. Form, mål, underlag, vægt, beskyttelse og vedligeholdelse defineres i projekt og tilbud uden generelle løfter om egenskaber.',
    process: 'Send omtrentlige mål, billeder af rummet, anvendelse og referencer for det ønskede resultat. Muligheder, materialer, detaljer, adgang og vilkår afklares før et tilbud efter forespørgsel.',
    travel: 'Møbler tilbydes i hele verden med mulighed for, at teamet rejser. Transport, adgang, montering, rejse og lokale krav aftales for hver destination. Det udvider ikke byggeydelserne til udlandet.',
    gallery: 'Samlingen af dokumenterede arbejder forberedes. Illustrationer fremstilles ikke som udførte projekter. Du kan drøfte projektet uden et opdigtet produktkatalog.',
    request: 'Bed om et skræddersyet tilbud', faqTitle: 'Spørgsmål om møbler',
    faq: [
      ['Hvad er leveringstiden?', 'Design, fremstilling, transport og montering aftales, når projektet er defineret. Ingen standardfrist gælder alle møbler og destinationer.'],
      ['Kan teamet rejse til udlandet?', 'Ja, ved skræddersyede premiummøbler med aftalte vilkår og omkostninger. Byggearbejde forbliver lokalt, inden for cirka 60 km ad vej fra Cefalù.'],
      ['Hvilke materialer kan jeg vælge?', 'Vi vurderer cement, mikrocement og overflader efter anvendelse og design. Prøver, beskyttelse, begrænsninger og vedligeholdelse aftales for løsningen.'],
      ['Hvordan får jeg et tilbud?', 'Send destination, mål, anvendelse, rumbilleder og prioriteter. Tilbud efter forespørgsel præciserer arbejde og logistik; vi offentliggør ikke opdigtede priser eller tilgængelighed.'],
    ],
  },
};

for (const [locale, decision] of Object.entries(ownerDecisions)) {
  const copy = serviceCopy[locale];
  copy.scope = decision.scope;
  copy.travel = copy.travel.split(/(?<=\.)\s/).slice(0, -1).join(' ') + ' ' + decision.scope;
  copy.faq[1][1] = copy.faq[1][1].split(/(?<=\.)\s/)[0] + ' ' + decision.scope;
}
export function offerPath(lang: string, kind: 'premium' | 'local') {
  if (!SERVICE_LOCALES.includes(lang as typeof SERVICE_LOCALES[number])) throw new Error(`Unsupported service locale: ${lang}`);
  return lang === 'it' ? (kind === 'premium' ? '/arredi-su-misura' : '/area-servizi-edili') : `/${lang}/${kind === 'premium' ? 'bespoke-furniture' : 'local-building-area'}`;
}
export function requestPath(lang: string) {
  return (pages as Record<string, {request: {path: string}}>)[lang].request.path;
}
export const localAreaNotes: Record<string, string> = Object.fromEntries(Object.entries(ownerDecisions).map(([locale, decision]) => [locale, decision.scope]));
/** Historical desk-research notes, no longer the commercial coverage boundary. */
const supersededAreaNotes: Record<string, string> = {
  it: 'Verifica dell’area: le località elencate sono candidate, non una garanzia di copertura dell’intero comune. Le distanze riportate dalla fonte sono stime stradali fra centri abitati, non misure dal nostro indirizzo. Occorre verificare il luogo esatto, il percorso e gli accessi. Petralia Sottana, Petralia Soprana e Gangi sono casi vicini alla soglia da concordare; Alimena, Bompietro e Campofelice di Fitalia risultano oltre soglia e non sono inclusi.',
  en: 'Area checks: the places listed are candidates, not a guarantee of coverage throughout each municipality. Source distances are road estimates between towns, not measurements from our address. The exact site, route and access must be checked. Petralia Sottana, Petralia Soprana and Gangi are near-limit cases requiring agreement; Alimena, Bompietro and Campofelice di Fitalia exceed the limit and are not included.',
  de: 'Gebietsprüfung: Die aufgeführten Orte sind mögliche Einsatzorte, keine Zusage für das gesamte Gemeindegebiet. Die Quelle nennt geschätzte Straßenstrecken zwischen Ortszentren, keine Messungen ab unserer Adresse. Baustelle, Strecke und Zugang sind zu prüfen. Petralia Sottana, Petralia Soprana und Gangi liegen nahe der Grenze und müssen abgestimmt werden; Alimena, Bompietro und Campofelice di Fitalia liegen darüber und sind nicht eingeschlossen.',
  fr: 'Vérification de zone : les lieux indiqués sont des possibilités, pas une garantie pour toute la commune. Les distances de la source sont des estimations routières entre centres, pas des mesures depuis notre adresse. Le site, le trajet et les accès doivent être vérifiés. Petralia Sottana, Petralia Soprana et Gangi sont proches de la limite et à convenir ; Alimena, Bompietro et Campofelice di Fitalia la dépassent et sont exclus.',
  es: 'Comprobación de zona: las localidades son candidatas, no una garantía para todo el municipio. Las distancias de la fuente son estimaciones por carretera entre núcleos, no mediciones desde nuestra dirección. Hay que comprobar lugar exacto, trayecto y accesos. Petralia Sottana, Petralia Soprana y Gangi están cerca del límite y deben acordarse; Alimena, Bompietro y Campofelice di Fitalia lo superan y no se incluyen.',
  nl: 'Gebiedscontrole: de genoemde plaatsen zijn kandidaten, geen garantie voor de hele gemeente. De bron geeft geschatte wegafstanden tussen kernen, geen metingen vanaf ons adres. Locatie, route en toegang moeten worden gecontroleerd. Petralia Sottana, Petralia Soprana en Gangi liggen bij de grens en vereisen overleg; Alimena, Bompietro en Campofelice di Fitalia vallen erbuiten en zijn niet inbegrepen.',
  pt: 'Verificação da área: as localidades são candidatas, não uma garantia para todo o município. As distâncias da fonte são estimativas por estrada entre centros, não medições desde a nossa morada. Local exato, percurso e acessos devem ser verificados. Petralia Sottana, Petralia Soprana e Gangi estão perto do limite e exigem acordo; Alimena, Bompietro e Campofelice di Fitalia ultrapassam-no e ficam excluídos.',
  pl: 'Sprawdzenie obszaru: wymienione miejscowości to kandydaci, nie gwarancja obsługi całej gminy. Źródło podaje szacunkowe odległości drogowe między centrami, nie pomiary od naszego adresu. Trzeba sprawdzić dokładne miejsce, trasę i dojazd. Petralia Sottana, Petralia Soprana i Gangi są blisko granicy i wymagają uzgodnienia; Alimena, Bompietro i Campofelice di Fitalia ją przekraczają i są wyłączone.',
  ru: 'Проверка территории: перечислены возможные места работы, а не гарантия обслуживания всей коммуны. Источник даёт дорожные оценки между населёнными пунктами, не замеры от нашего адреса. Нужна проверка точного места, маршрута и подъезда. Petralia Sottana, Petralia Soprana и Gangi близки к пределу и требуют согласования; Alimena, Bompietro и Campofelice di Fitalia за пределами и не включены.',
  sv: 'Områdeskontroll: orterna är möjliga arbetsorter, inte en garanti för hela kommunen. Källans vägavstånd är uppskattningar mellan ortscentrum, inte mätningar från vår adress. Exakt plats, väg och tillträde måste kontrolleras. Petralia Sottana, Petralia Soprana och Gangi ligger nära gränsen och kräver överenskommelse; Alimena, Bompietro och Campofelice di Fitalia ligger utanför och ingår inte.',
  no: 'Områdekontroll: stedene er mulige arbeidssteder, ikke en garanti for hele kommunen. Kildens veilengder er anslag mellom tettsteder, ikke målinger fra vår adresse. Nøyaktig sted, vei og tilgang må sjekkes. Petralia Sottana, Petralia Soprana og Gangi er nær grensen og krever avtale; Alimena, Bompietro og Campofelice di Fitalia er utenfor og ikke inkludert.',
  da: 'Områdekontrol: stederne er mulige arbejdssteder, ikke en garanti for hele kommunen. Kildens vejafstande er skøn mellem bycentre, ikke målinger fra vores adresse. Nøjagtigt sted, rute og adgang skal kontrolleres. Petralia Sottana, Petralia Soprana og Gangi er tæt på grænsen og kræver aftale; Alimena, Bompietro og Campofelice di Fitalia er udenfor og ikke inkluderet.',
};
