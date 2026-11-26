// Explicit owner-authorized URL/SEO-only refinements. Manuscripts and historical
// approval digests remain immutable. Episode 4 is read-only, including its SEO
// revision: the separately approved commercial presentation supplies its title.
export const migratedEpisodes = [1,2,3,5,6,8,9,10];
const copy = {
  it: ['costruire-cefalu-madonie',
    ['edilizia-libera-o-permesso','cila-scia-permesso-costruire','geometra-architetto-impresa-ruoli','vincolo-paesaggistico-centro-storico','costruire-ristrutturare-parco-madonie','ristrutturare-a-distanza-fasi-controlli','cantiere-sicilia-tempi-stagioni','tavoli-arredi-su-misura-cemento'],
    ['Edilizia libera o permesso? Guida per Cefalù','CILA, SCIA e permesso di costruire: le differenze','Geometra, architetto e impresa: ruoli in cantiere','Vincoli paesaggistici e centro storico di Cefalù','Costruire e ristrutturare nel Parco delle Madonie','Piscine a Cefalù: vincoli e permessi da verificare','Ristrutturare a distanza: fasi e controlli a Cefalù','Cantieri in Sicilia: tempi, stagioni e verifiche','Tavoli e arredi su misura in cemento: come scegliere']],
  en: ['building-cefalu-madonie',
    ['building-work-planning-permission','cila-scia-building-permits','surveyor-architect-contractor-roles','landscape-restrictions-historic-centre','building-renovating-madonie-park','renovating-from-abroad-stages-checks','sicily-building-work-timing-seasons','bespoke-concrete-tables-furniture'],
    ['Building work in Cefalù: when is permission needed?','CILA, SCIA and building permits in Sicily explained','Surveyor, architect and contractor: who does what?','Landscape restrictions in Cefalù’s historic centre','Building and renovating in the Madonie Park','Swimming pools in Cefalù: restrictions and permits','Renovating Cefalù from abroad: progress checks and SAL','Building work in Sicily: timing and seasonal factors','Bespoke concrete tables and furniture: choosing well']],
  de: ['bauen-cefalu-madonie',
    ['bauarbeiten-genehmigung','cila-scia-baugenehmigung','geometer-architekt-bauunternehmen-aufgaben','landschaftsschutz-altstadt','bauen-sanieren-madonien-park','sanieren-aus-dem-ausland-ablauf-kontrolle','baustelle-sizilien-zeiten-jahreszeiten','betontische-moebel-nach-mass'],
    ['Bauen in Cefalù: genehmigungsfrei oder mit Erlaubnis?','CILA, SCIA und Baugenehmigung auf Sizilien erklärt','Geometer, Architekt und Baufirma: Aufgaben im Bau','Landschaftsschutz und Altstadt von Cefalù','Bauen und Sanieren im Naturpark Madonien','Pools in Cefalù: Auflagen und Genehmigungen prüfen','Aus dem Ausland in Cefalù sanieren: Ablauf und Kontrolle','Bauarbeiten auf Sizilien: Zeiten und Jahreszeiten','Tische und Möbel aus Beton nach Maß: die Auswahl']],
  fr: ['construire-cefalu-madonie',
    ['travaux-libres-ou-autorisation','cila-scia-permis-construire','geometre-architecte-entreprise-roles','protection-paysagere-centre-historique','construire-renover-parc-madonie','renover-distance-etapes-controles','chantier-sicile-delais-saisons','tables-mobilier-beton-sur-mesure'],
    ['Travaux à Cefalù : libres ou soumis à autorisation ?','CILA, SCIA et permis de construire en Sicile','Géomètre, architecte et entreprise : rôles au chantier','Paysage protégé et centre historique de Cefalù','Construire et rénover dans le parc des Madonie','Piscines à Cefalù : contraintes et autorisations','Rénover à distance à Cefalù : étapes et contrôles','Chantiers en Sicile : délais, saisons et contraintes','Tables et mobilier en béton sur mesure : les choix']],
  nl: ['bouwen-cefalu-madonie',
    ['bouwwerk-vergunningsvrij-of-vergunning','cila-scia-bouwvergunning','landmeter-architect-aannemer-taken','landschapsbescherming-historisch-centrum','bouwen-renoveren-madonie-park','renoveren-op-afstand-fasen-controles','bouwplaats-sicilie-planning-seizoenen','betonnen-tafels-meubels-op-maat'],
    ['Bouwen in Cefalù: vergunningsvrij of met vergunning?','CILA, SCIA en bouwvergunningen op Sicilië uitgelegd','Landmeter, architect en aannemer: taken bij de bouw','Landschapsbescherming en het oude centrum van Cefalù','Bouwen en renoveren in het Madoniepark','Zwembaden in Cefalù: beperkingen en vergunningen','Verbouwen op afstand in Cefalù: voortgang en SAL','Bouwwerk op Sicilië: planning en seizoensinvloeden','Betonnen tafels en meubels op maat: bewust kiezen']],
  es: ['construir-cefalu-madonie',
    ['obras-libres-o-permiso','cila-scia-permiso-construccion','aparejador-arquitecto-constructora-funciones','proteccion-paisaje-centro-historico','construir-reformar-parque-madonie','reformar-distancia-fases-controles','obras-sicilia-plazos-estaciones','mesas-muebles-cemento-medida'],
    ['Obras en Cefalù: ¿libres o sujetas a permiso?','CILA, SCIA y permiso de construcción en Sicilia','Aparejador, arquitecto y constructora: sus funciones','Protección del paisaje y casco histórico de Cefalù','Construir y reformar en el parque de las Madonie','Piscinas en Cefalù: restricciones y permisos','Reformar en Cefalù desde el extranjero: seguimiento y SAL','Obras en Sicilia: plazos y factores estacionales','Mesas y muebles de cemento a medida: cómo elegir']],
  pt: ['construir-cefalu-madonie',
    ['obras-livres-ou-licenca','cila-scia-licenca-construcao','topografo-arquiteto-empreiteiro-funcoes','protecao-paisagem-centro-historico','construir-renovar-parque-madonie','renovar-distancia-fases-controlo','obras-sicilia-prazos-estacoes','mesas-moveis-cimento-medida'],
    ['Obras em Cefalù: livres ou sujeitas a licença?','CILA, SCIA e licença de construção na Sicília','Topógrafo, arquiteto e empreiteiro: funções na obra','Paisagem protegida e centro histórico de Cefalù','Construir e renovar no parque das Madonie','Piscinas em Cefalù: restrições e licenças','Renovar em Cefalù a partir do estrangeiro: obra e SAL','Obras na Sicília: prazos e fatores sazonais','Mesas e móveis de cimento por medida: como escolher']],
  ru: ['stroitelstvo-chefalu-madonie',
    ['raboty-bez-razresheniya-ili-s-razresheniem','cila-scia-razreshenie-na-stroitelstvo','geometr-arhitektor-podryadchik-roli','ohrana-landshafta-istoricheskiy-centr','stroitelstvo-remont-park-madonie','remont-iz-za-rubezha-etapy-kontrol','stroyka-siciliya-sroki-sezony','stoly-mebel-beton-na-zakaz'],
    ['Работы в Чефалу: когда нужно разрешение?','CILA, SCIA и разрешение на строительство в Сицилии','Геометр, архитектор и подрядчик: роли на стройке','Охрана ландшафта и исторический центр Чефалу','Строительство и ремонт в парке Мадоние','Бассейны в Чефалу: ограничения и разрешения','Ремонт в Чефалу из-за рубежа: этапы и контроль','Стройка на Сицилии: сроки и сезонные факторы','Столы и мебель из бетона на заказ: как выбирать']],
  pl: ['budowa-cefalu-madonie',
    ['roboty-bez-pozwolenia-czy-z-pozwoleniem','cila-scia-pozwolenie-na-budowe','geometra-architekt-wykonawca-role','ochrona-krajobrazu-stare-miasto','budowa-remont-park-madonie','remont-z-zagranicy-etapy-kontrola','budowa-sycylia-terminy-pory-roku','stoly-meble-betonowe-na-wymiar'],
    ['Roboty w Cefalù: kiedy potrzebne jest pozwolenie?','CILA, SCIA i pozwolenie na budowę na Sycylii','Geometra, architekt i wykonawca: podział zadań','Ochrona krajobrazu i stare miasto w Cefalù','Budowa i remont w parku Madonie','Baseny w Cefalù: ograniczenia i pozwolenia','Remont w Cefalù z zagranicy: etapy i kontrola','Budowa na Sycylii: terminy i pory roku','Stoły i meble betonowe na wymiar: świadomy wybór']],
  sv: ['bygga-cefalu-madonie',
    ['byggarbete-utan-lov-eller-med-tillstand','cila-scia-bygglov','geometer-arkitekt-byggforetag-roller','landskapsskydd-historiska-stadskarnan','bygga-renovera-madonieparken','renovera-fran-utlandet-etapper-kontroll','byggarbete-sicilien-tider-arstider','bord-mobler-betong-specialmatt'],
    ['Byggarbete i Cefalù: när krävs tillstånd?','CILA, SCIA och bygglov på Sicilien förklarade','Geometer, arkitekt och byggföretag: vem gör vad?','Landskapsskydd och Cefalùs historiska stadskärna','Bygga och renovera i Madonieparken','Pooler i Cefalù: begränsningar och tillstånd','Renovera i Cefalù från utlandet: uppföljning och SAL','Byggarbete på Sicilien: tider och årstider','Måttbeställda bord och möbler i betong: att välja']],
  no: ['bygge-cefalu-madonie',
    ['byggearbeid-med-eller-uten-tillatelse','cila-scia-byggetillatelse','geometer-arkitekt-entreprenor-roller','landskapsvern-historisk-sentrum','bygge-pusse-opp-madonieparken','pusse-opp-fra-utlandet-faser-kontroll','byggearbeid-sicilia-tid-arstider','bord-mobler-betong-spesialmal'],
    ['Byggearbeid i Cefalù: når trengs tillatelse?','CILA, SCIA og byggetillatelse på Sicilia forklart','Geometer, arkitekt og entreprenør: hvem gjør hva?','Landskapsvern og det historiske sentrum i Cefalù','Bygge og pusse opp i Madonieparken','Basseng i Cefalù: begrensninger og tillatelser','Pusse opp i Cefalù fra utlandet: fremdrift og SAL','Byggearbeid på Sicilia: tid og årstider','Bord og møbler i betong på spesialmål: gode valg']],
  da: ['bygge-cefalu-madonie',
    ['byggearbejde-med-eller-uden-tilladelse','cila-scia-byggetilladelse','geometer-arkitekt-entreprenor-roller','landskabsbeskyttelse-historisk-centrum','bygge-renovere-madonieparken','renovere-fra-udlandet-faser-kontrol','byggearbejde-sicilien-tid-arstider','borde-mobler-beton-specialmal'],
    ['Byggearbejde i Cefalù: hvornår kræves tilladelse?','CILA, SCIA og byggetilladelse på Sicilien forklaret','Geometer, arkitekt og entreprenør: hvem gør hvad?','Landskabsbeskyttelse og Cefalùs historiske centrum','Bygge og renovere i Madonieparken','Pools i Cefalù: begrænsninger og tilladelser','Renovere i Cefalù fra udlandet: fremdrift og SAL','Byggearbejde på Sicilien: tid og årstider','Borde og møbler i beton på specialmål: gode valg']],
};
const titledEpisodes = [1,2,3,5,6,7,8,9,10];
export function refineSeries(seeds) {
  return seeds.map(seed => {
    const episode = seed.content.guide.episode;
    const [segment,slugs,titles] = copy[seed.locale];
    const i = migratedEpisodes.indexOf(episode), t = titledEpisodes.indexOf(episode);
    const seoTitle = t < 0 ? seed.content.seoTitle : titles[t];
    if (t >= 0 && [...seoTitle].length >= 65) throw new Error(`Title troppo lungo: ${seed.locale}/${episode}`);
    return {...seed,
      path:i < 0 ? seed.path : `${seed.locale==='it'?'':`/${seed.locale}`}/${segment}/${slugs[i]}/`,
      // SEO-only presentation, not a replacement CMS manuscript/review.
      ...(t < 0 ? {} : {seoTitle}),
    };
  });
}
