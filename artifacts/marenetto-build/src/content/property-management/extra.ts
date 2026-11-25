import type { PropertySection } from './types';

/** Additional section: what to describe in the initial enquiry (no new data collection). */
export const prepareSection: Record<string, PropertySection> = {
  it: { heading: 'Cosa raccontarci nella prima richiesta', paragraphs: [
    'Bastano poche informazioni: il comune o la zona, il tipo di immobile, quante camere ha e se è già stato affittato. Una breve descrizione dello stato di impianti e arredi aiuta a capire da dove partire.',
    'Eventuali fotografie o documenti si possono condividere in un secondo momento, attraverso i normali canali diretti, solo se servono. Se pensi che occorrano lavori prima di affittare, dillo subito: la parte edile e la gestione restano incarichi distinti.',
  ] },
  en: { heading: 'What to tell us in your first enquiry', paragraphs: [
    'A few details are enough: the town or area, the type of property, how many bedrooms it has and whether it has been let before. A short description of the condition of systems and furnishings helps us see where to start.',
    'Photographs or documents can be shared later through our usual direct channels, and only if they are needed. If you think work is required before letting, mention it early: building work and management remain separate engagements.',
  ] },
  fr: { heading: 'Ce qu’il faut nous dire dans la première demande', paragraphs: [
    'Quelques éléments suffisent : la commune ou le secteur, le type de bien, le nombre de chambres et s’il a déjà été loué. Une courte description de l’état des installations et du mobilier aide à savoir par où commencer.',
    'Photos ou documents pourront être échangés plus tard, par nos canaux directs habituels, et seulement s’ils sont utiles. Si des travaux vous semblent nécessaires avant la location, signalez-le tôt : travaux et gestion restent des mandats distincts.',
  ] },
  de: { heading: 'Was Sie uns in der ersten Anfrage mitteilen', paragraphs: [
    'Wenige Angaben genügen: Ort oder Gegend, Art der Immobilie, Zahl der Schlafzimmer und ob bereits vermietet wurde. Eine kurze Beschreibung des Zustands von Installationen und Einrichtung zeigt, wo wir ansetzen.',
    'Fotos oder Unterlagen können später über die üblichen direkten Kanäle ausgetauscht werden, nur wenn sie nötig sind. Wenn vor der Vermietung Arbeiten nötig scheinen, sagen Sie es früh: Bauarbeiten und Verwaltung bleiben getrennte Aufträge.',
  ] },
  nl: { heading: 'Wat u in uw eerste aanvraag vertelt', paragraphs: [
    'Een paar gegevens volstaan: de plaats of omgeving, het type woning, het aantal slaapkamers en of de woning al eerder is verhuurd. Een korte beschrijving van de staat van installaties en inrichting laat zien waar we beginnen.',
    'Foto’s of documenten kunnen later via de gebruikelijke directe kanalen worden gedeeld, alleen als dat nodig is. Denkt u dat er vóór verhuur werk nodig is, meld het dan vroeg: bouwwerk en beheer blijven aparte opdrachten.',
  ] },
  es: { heading: 'Qué contarnos en la primera solicitud', paragraphs: [
    'Bastan unos pocos datos: el municipio o la zona, el tipo de inmueble, cuántos dormitorios tiene y si ya se ha alquilado. Una breve descripción del estado de instalaciones y mobiliario ayuda a saber por dónde empezar.',
    'Las fotos o los documentos pueden compartirse más adelante por los canales directos habituales, solo si hacen falta. Si crees que se necesitan obras antes de alquilar, dilo pronto: obra y gestión siguen siendo encargos distintos.',
  ] },
  pt: { heading: 'O que nos dizer no primeiro pedido', paragraphs: [
    'Bastam alguns dados: a localidade ou zona, o tipo de imóvel, quantos quartos tem e se já foi arrendado. Uma breve descrição do estado das instalações e do mobiliário ajuda a perceber por onde começar.',
    'Fotografias ou documentos podem ser partilhados mais tarde pelos canais diretos habituais, apenas se forem necessários. Se acha que são precisas obras antes de arrendar, diga-o cedo: obras e gestão continuam a ser encomendas distintas.',
  ] },
  ru: { heading: 'Что рассказать в первом запросе', paragraphs: [
    'Достаточно нескольких сведений: город или район, тип объекта, количество спален и сдавался ли он раньше. Короткое описание состояния коммуникаций и мебели поможет понять, с чего начать.',
    'Фотографии или документы можно передать позже через обычные прямые каналы связи и только при необходимости. Если, по-вашему, перед сдачей нужны работы, скажите об этом сразу: строительные работы и управление остаются отдельными заказами.',
  ] },
  pl: { heading: 'Co napisać w pierwszym zapytaniu', paragraphs: [
    'Wystarczy kilka informacji: miejscowość lub okolica, rodzaj nieruchomości, liczba sypialni i to, czy była już wynajmowana. Krótki opis stanu instalacji i wyposażenia pomaga ustalić punkt wyjścia.',
    'Zdjęcia lub dokumenty można przekazać później zwykłymi kanałami bezpośrednimi, tylko jeśli będą potrzebne. Jeśli przed wynajmem potrzebne są prace, powiedz o tym wcześnie: prace budowlane i zarządzanie pozostają osobnymi zleceniami.',
  ] },
  sv: { heading: 'Vad du berättar i din första förfrågan', paragraphs: [
    'Några uppgifter räcker: ort eller område, typ av bostad, antal sovrum och om den har hyrts ut tidigare. En kort beskrivning av skicket på installationer och möbler visar var vi ska börja.',
    'Bilder eller handlingar kan delas senare via våra vanliga direkta kanaler, och bara om de behövs. Tror du att arbeten krävs före uthyrning, nämn det tidigt: byggarbete och förvaltning förblir separata uppdrag.',
  ] },
  no: { heading: 'Hva du forteller oss i den første henvendelsen', paragraphs: [
    'Noen få opplysninger holder: sted eller område, type bolig, antall soverom og om boligen har vært leid ut før. En kort beskrivelse av tilstanden til installasjoner og møbler viser hvor vi bør begynne.',
    'Bilder eller dokumenter kan deles senere via de vanlige direkte kanalene, og bare hvis de trengs. Tror du det trengs arbeid før utleie, si det tidlig: byggearbeid og forvaltning forblir separate oppdrag.',
  ] },
  da: { heading: 'Hvad du fortæller os i din første henvendelse', paragraphs: [
    'Nogle få oplysninger er nok: by eller område, boligtype, antal soveværelser og om boligen har været udlejet før. En kort beskrivelse af installationernes og møblernes stand viser, hvor vi skal begynde.',
    'Billeder eller dokumenter kan deles senere via de sædvanlige direkte kanaler, og kun hvis de er nødvendige. Mener du, at der skal udføres arbejde før udlejning, så nævn det tidligt: byggearbejde og administration forbliver særskilte opgaver.',
  ] },
};

/** Additional FAQ: eligibility and boundaries of daily issue management. */
export const extraFaq: Record<string, [string, string][]> = {
  it: [
    ['Il partner gestisce anche immobili che possiedo già e che non avete ristrutturato voi?', 'Sì, la gestione non dipende da lavori fatti da Marenetto Build. Appartamenti e ville già di proprietà vengono valutati caso per caso, in base a posizione, stato e caratteristiche. La zona è principalmente Cefalù e i comuni vicini.'],
    ['Fin dove arriva la gestione dei problemi quotidiani?', 'Riguarda gli imprevisti ordinari legati al soggiorno degli ospiti, nei limiti concordati. Responsabilità, modalità di contatto e cosa fare per i guasti si definiscono per iscritto all’inizio. Non sono previste copertura automatica 24 ore su 24, disponibilità immediata né rendimenti promessi.'],
  ],
  en: [
    ['Can the partner manage a property I already own that you did not renovate?', 'Yes. Management does not depend on work by Marenetto Build. Apartments and villas you already own are assessed case by case, based on location, condition and features. The area is mainly Cefalù and neighbouring towns.'],
    ['How far does everyday issue management go?', 'It covers ordinary issues arising from guest stays, within agreed limits. Responsibilities, contact arrangements and what happens with breakdowns are set out in writing at the start. There is no automatic round-the-clock cover, no promise of immediate availability and no promised return.'],
  ],
  fr: [
    ['Le partenaire peut-il gérer un bien que je possède déjà et que vous n’avez pas rénové ?', 'Oui, la gestion ne dépend pas de travaux réalisés par Marenetto Build. Appartements et villas déjà en votre possession sont évalués au cas par cas, selon l’emplacement, l’état et les caractéristiques. Le secteur est principalement Cefalù et les communes voisines.'],
    ['Jusqu’où va la gestion des imprévus du quotidien ?', 'Elle concerne les imprévus courants liés au séjour des voyageurs, dans les limites convenues. Responsabilités, modalités de contact et conduite à tenir en cas de panne sont fixées par écrit dès le départ. Il n’y a ni couverture automatique 24 h sur 24, ni disponibilité immédiate, ni rendement promis.'],
  ],
  de: [
    ['Verwaltet der Partner auch eine Immobilie, die ich schon besitze und die Sie nicht renoviert haben?', 'Ja, die Verwaltung setzt keine Arbeiten von Marenetto Build voraus. Bereits vorhandene Wohnungen und Villen werden im Einzelfall nach Lage, Zustand und Ausstattung geprüft. Das Gebiet ist vor allem Cefalù mit den Nachbarorten.'],
    ['Wie weit reicht die Betreuung bei Alltagsproblemen?', 'Sie umfasst übliche Probleme rund um den Aufenthalt der Gäste, im vereinbarten Rahmen. Zuständigkeiten, Kontaktwege und das Vorgehen bei Defekten werden zu Beginn schriftlich festgelegt. Eine automatische Rund-um-die-Uhr-Abdeckung, sofortige Verfügbarkeit oder zugesagte Erträge gibt es nicht.'],
  ],
  nl: [
    ['Beheert de partner ook een woning die ik al bezit en die u niet hebt gerenoveerd?', 'Ja, beheer hangt niet af van werk door Marenetto Build. Appartementen en villa’s die u al bezit, worden per geval beoordeeld op ligging, staat en kenmerken. Het gebied is vooral Cefalù en de omliggende plaatsen.'],
    ['Hoe ver gaat het oplossen van dagelijkse problemen?', 'Het gaat om gewone problemen rond het verblijf van gasten, binnen de afgesproken grenzen. Verantwoordelijkheden, contactafspraken en de aanpak bij storingen worden vooraf schriftelijk vastgelegd. Er is geen automatische dekking rond de klok, geen directe beschikbaarheid en geen beloofd rendement.'],
  ],
  es: [
    ['¿El socio puede gestionar un inmueble que ya tengo y que no habéis reformado vosotros?', 'Sí, la gestión no depende de obras de Marenetto Build. Los apartamentos y villas que ya posees se valoran caso por caso, según ubicación, estado y características. La zona es principalmente Cefalù y los municipios cercanos.'],
    ['¿Hasta dónde llega la gestión de incidencias diarias?', 'Cubre las incidencias habituales relacionadas con la estancia de los huéspedes, dentro de los límites acordados. Responsabilidades, forma de contacto y qué hacer ante averías se fijan por escrito al principio. No hay cobertura automática las 24 horas, ni disponibilidad inmediata, ni rentabilidad prometida.'],
  ],
  pt: [
    ['O parceiro pode gerir um imóvel que já tenho e que não foi renovado por vós?', 'Sim, a gestão não depende de obras da Marenetto Build. Apartamentos e moradias que já possui são avaliados caso a caso, conforme localização, estado e características. A zona é sobretudo Cefalù e as localidades vizinhas.'],
    ['Até onde vai a gestão dos imprevistos diários?', 'Abrange os imprevistos correntes ligados à estadia dos hóspedes, dentro dos limites acordados. Responsabilidades, formas de contacto e o que fazer em caso de avaria são definidos por escrito no início. Não há cobertura automática 24 horas, disponibilidade imediata nem rendimento prometido.'],
  ],
  ru: [
    ['Может ли партнёр управлять объектом, который уже мой и который вы не ремонтировали?', 'Да, управление не зависит от работ Marenetto Build. Уже принадлежащие вам квартиры и виллы оцениваются индивидуально — по расположению, состоянию и характеристикам. Район — главным образом Чефалу и соседние города.'],
    ['Насколько далеко простирается решение ежедневных вопросов?', 'Речь идёт об обычных ситуациях, связанных с проживанием гостей, в согласованных пределах. Обязанности, способы связи и порядок действий при поломках фиксируются письменно в начале. Автоматической круглосуточной поддержки, немедленной доступности и обещанного дохода нет.'],
  ],
  pl: [
    ['Czy partner zarządza też nieruchomością, którą już mam, a której nie remontowaliście?', 'Tak, zarządzanie nie zależy od prac Marenetto Build. Posiadane już apartamenty i wille ocenia się indywidualnie, według lokalizacji, stanu i cech. Obszar to głównie Cefalù i sąsiednie miejscowości.'],
    ['Jak daleko sięga obsługa codziennych spraw?', 'Obejmuje zwykłe sprawy związane z pobytem gości, w uzgodnionych granicach. Zakres odpowiedzialności, sposób kontaktu i postępowanie przy awariach ustala się na piśmie na początku. Nie ma automatycznej całodobowej obsługi, natychmiastowej dostępności ani obiecanych zysków.'],
  ],
  sv: [
    ['Kan partnern förvalta en bostad jag redan äger och som ni inte har renoverat?', 'Ja, förvaltningen förutsätter inga arbeten av Marenetto Build. Lägenheter och villor du redan äger bedöms från fall till fall utifrån läge, skick och egenskaper. Området är främst Cefalù och grannorterna.'],
    ['Hur långt sträcker sig hanteringen av vardagliga problem?', 'Den gäller vanliga problem kring gästernas vistelse, inom avtalade ramar. Ansvar, kontaktvägar och hur fel hanteras skrivs ner från början. Det finns ingen automatisk dygnet runt-täckning, ingen omedelbar tillgänglighet och ingen utlovad avkastning.'],
  ],
  no: [
    ['Kan partneren forvalte en bolig jeg allerede eier, og som dere ikke har renovert?', 'Ja, forvaltningen forutsetter ikke arbeid fra Marenetto Build. Leiligheter og villaer du allerede eier, vurderes i hvert enkelt tilfelle ut fra beliggenhet, tilstand og egenskaper. Området er hovedsakelig Cefalù og nabokommunene.'],
    ['Hvor langt går håndteringen av daglige problemer?', 'Den gjelder vanlige problemer knyttet til gjestenes opphold, innenfor avtalte rammer. Ansvar, kontaktordninger og hva som skjer ved feil avtales skriftlig fra starten. Det gis ingen automatisk døgnkontinuerlig dekning, ingen umiddelbar tilgjengelighet og ingen lovet avkastning.'],
  ],
  da: [
    ['Kan partneren administrere en bolig, jeg allerede ejer, og som I ikke har renoveret?', 'Ja, administrationen forudsætter ikke arbejde fra Marenetto Build. Lejligheder og villaer, du allerede ejer, vurderes i hvert enkelt tilfælde ud fra beliggenhed, stand og egenskaber. Området er primært Cefalù og nabobyerne.'],
    ['Hvor langt rækker håndteringen af daglige problemer?', 'Den omfatter almindelige problemer i forbindelse med gæsternes ophold, inden for aftalte rammer. Ansvar, kontaktaftaler og hvad der sker ved fejl aftales skriftligt fra start. Der er ingen automatisk døgndækning, ingen øjeblikkelig tilgængelighed og intet lovet afkast.'],
  ],
};
