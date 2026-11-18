import type { ReactNode } from 'react';

/**
 * Native homepage presentation copy.
 * - it: owner-supplied text; hero subtitle and services heading/intro copied verbatim from the
 *   approved layout brief (task 45). eyebrow/svcKicker/desc/link are no longer rendered on the home.
 * - en: native English adaptation.
 * - de: PRESENTATION OVERLAY, REVIEW PENDING — not owner-approved; used only to verify
 *   German layout. Other locales do NOT use this file: they reuse already localized
 *   catalog values from copy[lang] (see buildHomeCopy in App.tsx), so no new keys are
 *   introduced into the 27 other catalogs.
 */
export type HomeCopy = {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  primary: string;
  secondary: string;
  svcKicker: string; svcHeading: string; svcIntro: string; svcAll: string;
  services: { title: string; desc: string; link: string }[];
  outdoorKicker: string; outdoorTitle: string; outdoorText: string; outdoorLink: string;
  methodKicker: string; methodHeading: string; methodLink: string;
  steps: [string, string][];
  abroadKicker: string; abroadHeading: string; abroadText: string; abroadLink: string;
  abroadPoints: [string, string][];
};

export const homeCopy: Record<'it' | 'en' | 'de', HomeCopy> = {
  it: {
    eyebrow: 'Impresa edile · Cefalù e dintorni',
    title: 'Costruzioni e ristrutturazioni a Cefalù.',
    intro: 'Diamo forma ai tuoi progetti, con cura e presenza sul posto.',
    primary: 'Parliamo del tuo progetto',
    secondary: 'Come lavoriamo',
    svcKicker: 'Servizi', svcHeading: 'La cura si vede nei dettagli.', svcIntro: 'Costruzioni, ristrutturazioni e manutenzione per case e strutture ricettive.', svcAll: 'Tutti i servizi',
    services: [
      { title: 'Costruzioni e ristrutturazioni', desc: 'Nuove opere e ristrutturazioni complete o parziali, con ruoli e responsabilità definiti.', link: 'Vedi costruzioni e ristrutturazioni' },
      { title: 'Manutenzione e ripristini', desc: 'Controlli, piccole riparazioni e ripristini, con attività e frequenza concordate per il tuo immobile.', link: 'Scopri gli interventi di manutenzione' },
      { title: 'Assistenza prima dell’acquisto', desc: 'Partiamo dall’immobile e dai cambiamenti che hai in mente; le verifiche tecniche restano ai professionisti incaricati.', link: 'Cosa valutare prima di comprare' },
    ],
    outdoorKicker: 'Esterni', outdoorTitle: 'Esterni, giardini e piscine.', outdoorText: 'Terrazze, percorsi, pietra, giardini e piscine: valutiamo terreno, drenaggi e accessi prima di definire le lavorazioni.', outdoorLink: 'Scopri gli interventi sugli esterni',
    methodKicker: 'Metodo', methodHeading: 'Come funzionerà.', methodLink: 'Il metodo per intero',
    steps: [
      ['Ci racconti la situazione', 'Dove si trova la casa, cosa vuoi fare, eventuali foto.'],
      ['Valutiamo cosa serve', 'Capiamo se servono un sopralluogo o verifiche professionali.'],
      ['Definiamo il lavoro', 'Concordiamo attività, responsabilità e condizioni prima di iniziare.'],
      ['Restiamo in contatto', 'Un canale concordato per avanzamento e decisioni.'],
    ],
    abroadKicker: 'Proprietari all’estero', abroadHeading: 'Seguire i lavori da lontano.', abroadText: 'Se il servizio concordato lo prevede, ricevi dal referente a Cefalù ciò che serve per decidere senza essere qui.', abroadLink: 'Come seguiamo i lavori a distanza',
    abroadPoints: [
      ['Un referente sul posto', 'Una persona a Cefalù a cui rivolgerti per la tua proprietà.'],
      ['Fotografie e aggiornamenti', 'Con la frequenza e il canale concordati: messaggi, chiamate o email.'],
      ['Decisioni da approvare', 'Le scelte che spettano a te ti vengono sottoposte prima di procedere.'],
    ],
  },
  en: {
    eyebrow: 'Builders · Cefalù and nearby',
    title: 'Building and renovation in Cefalù.',
    intro: 'Building work and maintenance for homes, villas and hospitality properties. A contact on the ground, even when you live far away.',
    primary: 'Let’s talk about your project',
    secondary: 'How we work',
    svcKicker: 'Services', svcHeading: 'What can we take on for you?', svcIntro: 'Three common starting points. The scope of each job is agreed together after the first conversation.', svcAll: 'All services',
    services: [
      { title: 'Construction and renovation', desc: 'New building work and full or partial renovations, with roles and responsibilities set out.', link: 'See construction and renovation' },
      { title: 'Maintenance and repairs', desc: 'Checks, small repairs and reinstatement, with tasks and frequency agreed for your property.', link: 'Explore maintenance work' },
      { title: 'Support before you buy', desc: 'We start from the property and the changes you have in mind; technical checks stay with the appointed professionals.', link: 'What to consider before buying' },
    ],
    outdoorKicker: 'Outdoors', outdoorTitle: 'Outdoor spaces, gardens and pools.', outdoorText: 'Terraces, paths, stonework, gardens and pools: we consider terrain, drainage and access before defining the work.', outdoorLink: 'Explore outdoor work',
    methodKicker: 'Method', methodHeading: 'How it will work.', methodLink: 'The full method',
    steps: [
      ['Describe the situation', 'Where the property is, what you want to do, any photos.'],
      ['We identify what is needed', 'Whether a site visit or professional checks are required.'],
      ['We define the work', 'Tasks, responsibilities and terms agreed before starting.'],
      ['We keep in touch', 'An agreed channel for progress and decisions.'],
    ],
    abroadKicker: 'Owners abroad', abroadHeading: 'Following the work from afar.', abroadText: 'Where the agreed service includes it, your contact in Cefalù sends what you need to decide without being here.', abroadLink: 'How we follow work remotely',
    abroadPoints: [
      ['A contact on the ground', 'One person in Cefalù to turn to about your property.'],
      ['Photos and updates', 'At the agreed frequency and channel: messages, calls or email.'],
      ['Decisions to approve', 'Choices that are yours are put to you before we proceed.'],
    ],
  },
  de: {
    eyebrow: 'Bauunternehmen · Cefalù und Umgebung',
    title: 'Bauen und Renovieren in Cefalù.',
    intro: 'Bauarbeiten und Instandhaltung für Häuser, Villen und Beherbergungsbetriebe. Ein Ansprechpartner vor Ort, auch wenn Sie weit weg wohnen.',
    primary: 'Sprechen wir über Ihr Projekt',
    secondary: 'So arbeiten wir',
    svcKicker: 'Leistungen', svcHeading: 'Was können wir für Sie übernehmen?', svcIntro: 'Drei häufige Ausgangspunkte. Der Umfang jeder Arbeit wird nach dem ersten Gespräch gemeinsam festgelegt.', svcAll: 'Alle Leistungen',
    services: [
      { title: 'Neubau und Renovierung', desc: 'Neubauten sowie vollständige oder teilweise Renovierungen, mit festgelegten Rollen und Verantwortlichkeiten.', link: 'Neubau und Renovierung ansehen' },
      { title: 'Instandhaltung und Reparaturen', desc: 'Kontrollen, kleine Reparaturen und Instandsetzungen, mit für Ihre Immobilie vereinbarten Aufgaben und Intervallen.', link: 'Instandhaltungsarbeiten ansehen' },
      { title: 'Beratung vor dem Kauf', desc: 'Wir gehen von der Immobilie und Ihren Plänen aus; technische Prüfungen bleiben bei den beauftragten Fachleuten.', link: 'Was vor dem Kauf zu prüfen ist' },
    ],
    outdoorKicker: 'Außenbereiche', outdoorTitle: 'Außenbereiche, Gärten und Pools.', outdoorText: 'Terrassen, Wege, Naturstein, Gärten und Pools: Wir prüfen Gelände, Entwässerung und Zugang, bevor die Arbeiten festgelegt werden.', outdoorLink: 'Arbeiten im Außenbereich ansehen',
    methodKicker: 'Vorgehen', methodHeading: 'So läuft es ab.', methodLink: 'Das ganze Vorgehen',
    steps: [
      ['Sie beschreiben die Situation', 'Wo die Immobilie liegt, was Sie vorhaben, eventuelle Fotos.'],
      ['Wir klären den Bedarf', 'Ob eine Besichtigung oder fachliche Prüfungen nötig sind.'],
      ['Wir legen die Arbeit fest', 'Aufgaben, Verantwortung und Bedingungen vor Beginn vereinbart.'],
      ['Wir bleiben in Kontakt', 'Ein vereinbarter Kanal für Fortschritt und Entscheidungen.'],
    ],
    abroadKicker: 'Eigentümer im Ausland', abroadHeading: 'Die Arbeiten aus der Ferne begleiten.', abroadText: 'Sofern im vereinbarten Leistungsumfang enthalten, erhalten Sie von Ihrem Ansprechpartner in Cefalù, was Sie für Entscheidungen brauchen.', abroadLink: 'So begleiten wir Arbeiten aus der Ferne',
    abroadPoints: [
      ['Ein Ansprechpartner vor Ort', 'Eine Person in Cefalù für alle Fragen zu Ihrer Immobilie.'],
      ['Fotos und Updates', 'In vereinbarter Häufigkeit und über den vereinbarten Kanal.'],
      ['Entscheidungen zur Freigabe', 'Was Sie entscheiden, wird Ihnen vorgelegt, bevor wir fortfahren.'],
    ],
  },
};

/** Stable anchors on the localized ServicesPage, in group order. */
export const SERVICE_GROUP_IDS = ['costruzioni', 'finiture', 'infiltrazioni', 'esterni', 'cura-proprieta', 'prima-acquisto', 'tetti'] as const;
