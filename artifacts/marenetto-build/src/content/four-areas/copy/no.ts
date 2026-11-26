import type { AreaLocaleCopy } from '../types';

export const no: AreaLocaleCopy = {
  ui: {
    areasLabel: 'Fire områder', about: 'Om oss', request: 'Be om en vurdering', home: 'Hjem', menu: 'Meny',
    offerHeading: 'Hva vi utfører', processHeading: 'Slik går vi frem', faqHeading: 'Vanlige spørsmål',
    priceHeading: 'Priser', priceText: 'Hvert prosjekt får et eget tilbud, først etter vurdering av eiendommen og oppdraget. Vi publiserer ingen prislister eller veiledende priser.',
    readMore: 'Les mer', ctaHeading: 'Fortell oss om eiendommen', ctaText: 'Oppgi sted, nåværende tilstand og mål: vi forklarer hvordan vi går videre og hva som må vurderes.',
    breadcrumbLabel: 'Brødsmuler', articleArea: 'Område', pillarLink: 'Til området', articlesArchive: 'Artikler',
    fourAreasHeading: 'Fire måter å jobbe med oss på', fourAreasIntro: 'Velg området som ligger nærmest planene dine: hver side forklarer hva vi gjør, hvordan og med hvem.',
    needsHeading: 'Hvor starter du?',
    needs: [
      ['Jeg bor i utlandet og kjøper på Sicilia', 'Befaring før kjøp, oppussing fulgt på avstand etappe for etappe, én kontaktperson.'],
      ['Jeg er arkitekt eller interiørdesigner', 'Møbler i betong, lavastein og majolika etter dine tegninger, via Atelier Marenetto, vilkår for kontorer på forespørsel.'],
      ['Jeg har et hus i Cefalù og vil få mer ut av det', 'Målrettet oppussing og, om du vil leie ut, forvaltning med partneren Cefalù Apartments, uten lovet avkastning.'],
    ],
    needsCta: ['Kjøpe og pusse opp', 'Atelier for fagfolk', 'Forvaltning av korttidsutleie'],
    projects: { title: 'Marenetto Build prosjekter – siden er under arbeid', description: 'Siden er under arbeid: vi publiserer bare prosjekter med ekte bilder og kundenes samtykke. I mellomtiden kan du fortelle oss om eiendommen din.', h1: 'Prosjekter under arbeid', text: 'Her samles virkelige arbeider, dokumentert med ekte fotografier og publisert bare med kundens samtykke. Inntil da er siden bevisst tom.' },
  },
  areas: {
    villas: {
      slug: 'villaer-og-gardshus-sicilia', nav: 'Villaer og gårdshus', tagline: 'Gårdshus, masserier, villaer med havutsikt og historiske hus',
      title: 'Villaer og gårdshus på Sicilia: restaurering nøkkelferdig',
      description: 'Restaurering av gårdshus og masserier, nøkkelferdige villaer med havutsikt og historiske hus rundt Cefalù og Madonie. Tilbud etter vurdering.',
      h1: 'Villaer og gårdshus', lede: 'Vi restaurerer gårdshus og masserier, bygger og fornyer villaer ved havet og gir palasser og hus i historiske sentrum nytt liv. Ett byggefirma koordinerer håndverkere og utpekte fagfolk.',
      scope: 'Vi arbeider hovedsakelig innenfor om lag 60 km fra Cefalù, langs kysten og i Madonie; prosjekter lenger unna vurderes på forespørsel. Prosjektering og byggeledelse ligger hos de utpekte godkjente fagfolkene.',
      offer: [
        ['Nøkkelferdige villaer med havutsikt', 'Nybygg eller totalrenovering, fra konstruksjon til overflater, med tydelige roller i hver fase.'],
        ['Palasser og byhus i gamlebyen', 'Kalkpuss, isolasjon tilpasset gammelt murverk og logistikk for smale smug.'],
        ['Restaurering av gårdshus og masserier', 'Forsterkning, tak, stein og overflater på landlige bygg etter nødvendige tekniske kontroller.'],
      ],
      process: [
        ['Befaring og samtale', 'Vi besøker eiendommen eller tar utgangspunkt i bilder og dokumenter.'],
        ['Prosjektering og mengdeberegning', 'Med utpekt prosjekterende fastsetter vi arbeid, faser og et eget tilbud.'],
        ['Bygging og overlevering', 'Én kontaktperson, avtalte oppdateringer og overlevering med valgte overflater.'],
      ],
      faq: [
        ['Jobber dere utenfor Cefalù?', 'Ja, prosjekter utenfor vårt vanlige område på om lag 60 km vurderes i hvert enkelt tilfelle, inkludert reise og logistikk.'],
        ['Tar dere også prosjekteringen?', 'Vi koordinerer utpekte godkjente fagfolk: arkitekt, ingeniør, landmåler og ved behov geolog.'],
        ['Hva koster det å pusse opp en villa?', 'Det avhenger av tilstand, areal og overflater: eget tilbud gis først etter vurdering.'],
      ],
    },
    outdoors: {
      slug: 'eksklusive-uteomrader', nav: 'Eksklusive uteområder', tagline: 'Basseng, utekjøkken, hager, stein og terrasser',
      title: 'Eksklusive uteområder i Cefalù: basseng, hage og stein',
      description: 'Basseng og bassenghus, utekjøkken fra Atelier, hagedesign, steinarbeid, fasader og terrasser for villaer i og rundt Cefalù på Sicilia.',
      h1: 'Eksklusive uteområder', lede: 'På Sicilia leves livet ute. Vi bygger basseng, hager, terrasser og steinarbeid laget for sol, vind og havluft.',
      scope: 'Bygningsarbeid ute utføres hovedsakelig innenfor om lag 60 km fra Cefalù. Utekjøkken fra Atelier Marenetto bygges også i utlandet, med logistikk og reise fastsatt per prosjekt.',
      offer: [
        ['Basseng og bassenghus', 'Bassenger, kanter, soldekk og teknisk rom etter kontroll av grunn, adkomst og drenering.'],
        ['Utekjøkken', 'Murte kjøkken, vedovner og benkeplater i lavastein eller majolika, med Atelier Marenetto.'],
        ['Hagedesign', 'Middelhavshager, stier og belysning, med gartnere fra vårt nettverk.'],
        ['Stein og fasader', 'Tørrmurer, kledning, fasader og restaurering av eksisterende stein.'],
        ['Terrasser', 'Utendørs belegg, membraner, bioklimatiske pergolaer og markiser.'],
      ],
      process: [
        ['Oppmåling av området', 'Mål, solforhold, fall og adkomst for maskiner og materialer.'],
        ['Forslag og materialer', 'Stein og overflater tilpasset kystklimaet, med eget tilbud.'],
        ['Utførelse', 'Utførelse i etapper og råd om langsiktig vedlikehold.'],
      ],
      faq: [
        ['Krever et basseng tillatelse?', 'Som regel ja: søknadene håndteres av utpekte godkjente fagfolk, som vi koordinerer.'],
        ['Bygger dere utekjøkken utenfor Italia?', 'Ja, via Atelier: materialer forberedes på Sicilia, sendes og monteres av teamet vårt etter vurdering av stedet.'],
        ['Har dere veiledende priser?', 'Nei. Hvert uteprosjekt får eget tilbud etter vurdering.'],
      ],
    },
    surfaces: {
      slug: 'overflater-og-mobler-pa-mal', nav: 'Overflater og møbler', tagline: 'Mikrosement, betongmøbler, epoksygulv og preget betong',
      title: 'Mikrosement, epoksygulv og betongmøbler på mål',
      description: 'Mikrosement uten riving, møbler i betong og mikrosement på mål, designgulv i epoksy og preget betong. Møbler sendes til hele verden på forespørsel.',
      h1: 'Overflater og møbler på mål', lede: 'Sømløse overflater og håndlagde stykker: mikrosement på gulv og vegger, bord, benkeplater og servanter i betong, epoksy og preget betong inne og ute.',
      scope: 'Overflater legges hovedsakelig innenfor om lag 60 km fra Cefalù. Møbler i betong og mikrosement lages på bestilling og sendes eller monteres over hele verden, med avtalt logistikk.',
      offer: [
        ['Mikrosement', 'Sømløse belegg på gulv, vegger og bad, ofte uten riving, etter kontroll av underlaget.'],
        ['Møbler i betong og mikrosement', 'Bord, benkeplater, disker og servanter etter tegning, laget på Sicilia og sendt i kasser.'],
        ['Epoksygulv og preget betong', 'Dekorativ epoksy inne og preget betong ute, med råd om vedlikehold.'],
      ],
      process: [
        ['Prøver og underlag', 'Vi vurderer eksisterende underlag og lager på forespørsel farge- og overflateprøver.'],
        ['Tegning og tilbud', 'Mål, detaljer og skriftlig tidsplan for prosjektet, med eget tilbud.'],
        ['Legging eller frakt', 'Legging på stedet, eller produksjon, pakking, frakt og valgfri montering.'],
      ],
      faq: [
        ['Kan mikrosement legges over eksisterende fliser?', 'Ofte ja, hvis underlaget er stabilt: vi kontrollerer før vi bekrefter.'],
        ['Sender dere møbler til Norge?', 'Ja, i kasser med valgfri montering; logistikk og destinasjon vurderes per prosjekt.'],
        ['Hva koster det per kvadratmeter?', 'Vi publiserer ikke kvadratmeterpriser: tilbudet avhenger av underlag, areal og finish.'],
      ],
    },
    investment: {
      slug: 'kjope-pusse-opp-leie-ut-cefalu', nav: 'Kjøpe og leie ut', tagline: 'Befaring før kjøp, bygging på avstand, utleie',
      title: 'Kjøpe, pusse opp og leie ut hus i Cefalù',
      description: 'Teknisk befaring før kjøp, oppussing fulgt på avstand i etapper, nøkkelferdig totalentreprise og forvaltning av feriebolig med Cefalù Apartments.',
      h1: 'Kjøpe, pusse opp, leie ut', lede: 'Fra befaringen før kontrakt til nøklene til feriehuset: et byggefirma som leder byggingen mens du bor i utlandet, og deretter en egen partner for utleie.',
      scope: 'Byggingen skjer hovedsakelig innenfor om lag 60 km fra Cefalù. Vi er ikke eiendomsmeglere og lover ingen avkastning: utleie håndteres av partneren Cefalù Apartments etter egen avtale.',
      offer: [
        ['Teknisk befaring før kjøp', 'Vi besøker eiendommen med deg eller for deg og peker på hva utpekte fagfolk og notarius bør kontrollere.'],
        ['Bygging på avstand i etapper (SAL)', 'Mengdeberegning i etapper; hver nådde etappe dokumenteres med bilder og byggelederens rapport. Mellom etappene oppdateringer på WhatsApp; endringer avtales med deg og byggelederen.'],
        ['Forvaltning av feriebolig', 'Med Cefalù Apartments, en partner atskilt fra byggefirmaet: CIN, bookingplattformer, rengjøring og innsjekk etter egen avtale.'],
        ['Nøkkelferdig totalentreprenør', 'Én kontaktperson som koordinerer firmaer, håndverkere og fagfolk fra nettverket.'],
      ],
      process: [
        ['Før kjøpet', 'Befaring og første råd om mulige arbeider, uten å erstatte fagfolkenes kontroller.'],
        ['Bygging i etapper', 'Etapper fra mengdeberegningen, bilder og rapport ved hver etappe, én kontaktperson.'],
        ['Etter overlevering', 'Om ønskelig, kontakt med partneren Cefalù Apartments for forvaltning.'],
      ],
      faq: [
        ['Kan jeg følge arbeidet uten å reise til Sicilia?', 'Ja: hver etappe dokumenteres med bilder og byggelederens rapport, med WhatsApp-oppdateringer imellom.'],
        ['Garanterer dere leieinntekter?', 'Nei. Cefalù Apartments forvalter eiendommen etter egen avtale, uten garantert avkastning.'],
        ['Hvilke språk kan jeg bruke?', 'Teamet og partneren snakker italiensk, engelsk, fransk, nederlandsk og spansk; norsktalende kontakt garanteres ikke.'],
      ],
    },
  },
};
