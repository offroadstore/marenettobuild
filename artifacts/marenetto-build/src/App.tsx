import { type AnchorHTMLAttributes, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronDown, House, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import { useCreateProjectRequest, type ProjectRequestInput } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Logo } from '@/components/brand/Logo';
import { HeroPhoto, IllustrativeImage } from '@/components/home/Media';
import { IllustrationNote } from '@/components/home/IllustrationNote';
import { WhatsAppAccess, WhatsAppNavLink } from '@/components/WhatsAppAccess';
import { COMPANY_CONTACT, COMPANY_PHONE, emailHref, telHref, whatsappHref } from '@/config/contact';
import { MobileContactBar } from '@/components/home/MobileContactBar';
import { homeCopy, SERVICE_GROUP_IDS, type HomeCopy } from '@/content/home-copy';
import { articlePath, libraryPath } from '@/localization/paths';
import { LibraryLocale } from '@/localization/library-context';
import { historicalArticleMenu } from '@/content/historical-article-menu';
import { localeLoadErrors } from '@/localization/load-errors';
import '@/styles/home.css';
import { Route, Switch, useLocation, Router as WouterRouter, Link, Redirect } from 'wouter';
import { articleBySlug, articles as articleList } from '@/content/articles';
import { withCampaignParams } from '@/lib/campaign';
import { ArticleDetailPage, ArticlesPage, GuidesPage, SearchPage, ActiveArticleListing } from '@/pages/library';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { InternalEntry, OwnerDemo, PublishedCmsPage } from '@/pages/internal-surfaces';
import publicPageData from '@/localization/public-pages.json';
import { chooseLanguage, isAutomaticVisitor, readSavedLanguage, saveLanguageChoice } from '@/localization/detect';
import { getLocale, getLocaleDirection, LANGUAGE_CHOICES, LOCALES, PAGE_KEYS, PUBLISHED_LOCALES } from '@/localization/locales';
import { getLocalizedCopy, isLocaleCatalogLoaded, loadLocaleCatalog, localizeChoice, localizeNode, translateText } from '@/localization/runtime';
import { isTranslationReviewMode, setTranslationReviewMode } from '@/localization/runtime';
import { editions, editionByPath, reviewPathForEdition, canonicalEdition, equivalentEditions, getEdition, redirects } from '@/localization/edition-inventory';
import { languageFlag } from '@/localization/language-flags';
import { updateStructuredData } from '@/lib/structured-data';
import { historicalPage, historicalPending, historicalArticleForPreview, historicalLoaded, loadHistorical, historicalNavigation, type HistoricalPage as HistoricalPageRecord } from '@/content/historical';
import { HistoricalContents } from '@/pages/historical';
import { EditorialRuntime, useActiveEditorial, useEditorialStatus, editorialPathKey } from '@/lib/editorial-runtime';
import type { EditorialActive } from '@workspace/api-client-react';
import { usePageMeta } from '@/lib/meta';
import { AnalyticsPreferences } from '@/components/AnalyticsPreferences';
import { trackSavedRequest } from '@/lib/analytics/browser';

const queryClient = new QueryClient();
// Restored historical pages have state "reviewed", not a new publication
// approval. Their known public paths are measurable; draft/review pages are not.
const analyticsPublicEditions = editions.filter(e => e.state === 'published' || e.state === 'reviewed');

const clerkPubKey = typeof window === 'undefined' ? undefined : publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
type Lang = string;
type Page = 'home' | 'services' | 'process' | 'abroad' | 'request' | 'contact' | 'articles' | 'guides' | 'projects' | 'search';

type PageMetadata = { path: string; title: string; description: string };
type CorePage = 'home' | 'services' | 'process' | 'abroad' | 'request' | 'contact';
const PUBLIC_SITE_ORIGIN = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://preview.invalid';
const seoCopy = publicPageData as Record<Lang, Record<CorePage, PageMetadata>>;
const routes = Object.fromEntries(LOCALES.map(locale => {
  const pages = seoCopy[locale.code];
  if (!pages) throw new Error(`Missing published page metadata for locale ${locale.code}.`);
  return [locale.code, {
    ...Object.fromEntries(PAGE_KEYS.map(page => [page, pages[page].path])),
    articles: libraryPath(locale.code, 'articles'),
    guides: libraryPath(locale.code, 'guides'),
    projects: libraryPath(locale.code, 'projects'),
    search: libraryPath(locale.code, 'search'),
  }];
})) as Record<Lang, Record<Page, string>>;

const copySource = {
  it: {
    nav: { services: 'Servizi', process: 'Come lavoriamo', abroad: 'Per chi vive all’estero', articles: 'Articoli', projects: 'Progetti', contact: 'Contatti', request: 'Parliamone' },
    home: { eyebrow: 'MARENETTO BUILD · CEFALÙ E DINTORNI', title: <>Costruzioni, ristrutturazioni<br /><em>e cura della tua proprietà a Cefalù.</em></>, intro: 'Dalla prima valutazione alla consegna, realizziamo e coordiniamo gli interventi per case, ville e seconde abitazioni. Un referente locale anche quando vivi lontano.', primary: 'Raccontaci il tuo progetto', secondary: 'Guarda come lavoriamo', note: 'Un referente locale, anche quando vivi lontano.', figure: 'Una presenza concreta, sul posto.', proof1: 'Cefalù e territorio', proof2: 'Italiano · Inglese · Olandese · Spagnolo' },
    page: { services: ['Servizi', 'Dalla prima idea alla cura quotidiana.', 'Un riferimento locale per lavori, manutenzione e necessità legate alla tua casa. Ogni richiesta parte da un confronto chiaro, per capire cosa serve davvero.'], process: ['Come lavoriamo', 'Prima ci capiamo. Poi si parte.', 'Un percorso semplice per definire il bisogno, mettere a fuoco le opzioni e tenerti aggiornato, passo dopo passo.'], abroad: ['Proprietari all’estero', 'La distanza non deve complicare le cose.', 'Un contatto locale per seguire richieste, manutenzione e lavori sulla tua proprietà in Sicilia, con aggiornamenti comprensibili anche a distanza.'], contact: ['Contatti', 'Il primo passo è una conversazione.', 'Scrivici in italiano o in inglese. Condividi il contesto e ti aiuteremo a capire quale può essere il passo successivo.'], request: ['Richiesta', 'Da dove possiamo cominciare?', 'Raccontaci della proprietà e di ciò che ti serve. Più contesto ci dai, più concreto potrà essere il primo confronto.'] },
    services: { over: 'Un supporto concreto, senza promesse vaghe.', heading: 'Servizi per la tua proprietà', intro: 'Ogni immobile e ogni necessità sono diversi. Definiamo insieme il perimetro, le verifiche necessarie e chi svolge le attività prima di parlare di interventi.', groups: [
      { title: 'Costruzioni e ristrutturazioni', desc: 'Nuove opere, interventi completi o parziali e coordinamento delle lavorazioni secondo il progetto concordato.', items: ['Costruzioni e ristrutturazioni', 'Coordinamento chiavi in mano, con ruoli definiti', 'Demolizioni e movimento terra, previa verifica di accessi e logistica'] },
      { title: 'Finiture e superfici', desc: 'Scelta e posa da valutare in base a supporto, uso, condizioni del luogo e manutenzione richiesta.', items: ['Finiture, pietra e pavimentazioni', 'Resine, microcemento e superfici decorative', 'Impermeabilizzazioni e ripristini, dopo le verifiche pertinenti'] },
      { title: 'Infiltrazioni e assistenza', desc: 'Raccogliamo i sintomi e valutiamo quali controlli siano utili. Una fotografia può aiutare a capire la richiesta, ma non dà da sola una diagnosi.', items: ['Ricerca e gestione delle infiltrazioni', 'Interventi e ripristini da definire dopo sopralluogo', 'Attività tecniche riservate affidate a professionisti abilitati incaricati'] },
      { title: 'Esterni, giardini e piscine', desc: 'Interventi esterni valutati considerando terreno, drenaggi, accessi e condizioni specifiche dell’immobile.', items: ['Giardini e aree esterne', 'Pietra, pavimentazioni e cucine esterne', 'Piscine e manutenzione collegata, secondo perimetro concordato'] },
      { title: 'Cura e gestione della proprietà', desc: 'Attività e frequenze si concordano per singolo immobile; manutenzione, pulizie e gestione degli affitti restano ambiti distinti.', items: ['Manutenzione immobiliare e piccoli interventi', 'Pulizie e servizi collegati agli appartamenti', 'Cura della proprietà e servizi per gli affitti, con perimetro da concordare'] },
      { title: 'Prima dell’acquisto', desc: 'Un confronto preliminare sulle informazioni disponibili e sugli aspetti da sottoporre a verifica tecnica o documentale.', items: ['Assistenza tecnica prima dell’acquisto', 'Raccolta delle esigenze e delle trasformazioni desiderate', 'Le verifiche professionali e documentali restano in capo agli incaricati competenti'] },
    ] },
    process: { heading: 'Un processo chiaro, senza salti.', intro: 'Non esistono due case uguali. Ecco come trasformiamo una richiesta in un percorso condiviso, con aspettative realistiche.', steps: [
      ['01', 'Ci racconti il contesto', 'Ci spieghi di che proprietà si tratta, dove si trova e quale esigenza vuoi affrontare. Puoi scriverci nella lingua che preferisci.'],
      ['02', 'Mettiamo a fuoco', 'Raccogliamo le informazioni utili e individuiamo insieme gli aspetti da verificare o chiarire prima di definire il lavoro.'],
      ['03', 'Concordiamo i prossimi passi', 'Definiamo portata, priorità e modalità di aggiornamento. Prima di procedere, sai cosa è stato concordato e cosa resta da valutare.'],
      ['04', 'Ti teniamo aggiornato', 'Durante il percorso manteniamo il dialogo aperto e condividiamo gli aggiornamenti concordati, anche se sei lontano.'],
    ] },
    abroad: { heading: 'Essere lontani è già abbastanza complicato.', intro: 'Per chi vive fuori dalla Sicilia, trovare un riferimento locale è spesso il primo passo. Puoi inviare una richiesta nella lingua che preferisci; Herman parla italiano, inglese, olandese e spagnolo. Per altre lingue possono intervenire collaboratori e strumenti di supporto: la lingua del sito non garantisce un referente che la parli.', blocks: [
      ['Un contatto che conosce il territorio', 'Cefalù e i suoi dintorni sono il nostro contesto di lavoro. Ci racconti la situazione e valutiamo insieme come affrontarla, senza dare per scontato ciò che non sappiamo ancora.'],
      ['Informazioni comprensibili, anche a distanza', 'Concordiamo prima come tenerti aggiornato e quali informazioni ti sono più utili. Un messaggio, una chiamata o una mail: scegliamo il canale più adatto a te.'],
      ['Aspettative chiare fin dall’inizio', 'Ogni richiesta viene valutata caso per caso. Prima di procedere mettiamo in chiaro ciò che è compreso, cosa va verificato e gli eventuali limiti del nostro intervento.'],
      ['La casa resta tua, anche quando non ci sei', 'Puoi condividere una necessità di manutenzione, un intervento da valutare o una domanda legata a un acquisto. Il primo passo è capire bene il contesto.'],
    ] },
  },
  en: {
    nav: { services: 'Services', process: 'How we work', abroad: 'Owners abroad', articles: 'Articles (IT)', projects: 'Projects', contact: 'Contact', request: 'Start a conversation' },
    home: { eyebrow: 'MARENETTO BUILD · CEFALÙ AND SURROUNDING AREA', title: <>Construction, renovation<br /><em>and property care in Cefalù.</em></>, intro: 'From the first review to handover, we carry out and coordinate work for homes, villas and second properties. A local point of contact when you live abroad.', primary: 'Tell us about your project', secondary: 'See how we work', note: 'A local point of contact, even when you live abroad.', figure: 'A real presence, on the ground.', proof1: 'Cefalù and the surrounding area', proof2: 'Italian · English · Dutch · Spanish' },
    page: { services: ['Services', 'From the first idea to everyday care.', 'A local point of contact for building work, maintenance and the needs of your home. Every request starts with a clear conversation about what is actually needed.'], process: ['How we work', 'First we understand. Then we begin.', 'A straightforward way to define the need, consider the options and keep you informed at every step.'], abroad: ['Owners abroad', 'Distance should not make things harder.', 'A local contact for property requests, maintenance and building work in Sicily, with clear updates even when you are far away.'], contact: ['Contact', 'It starts with a conversation.', 'Write to us in Italian or English. Share the context and we will help you understand a sensible next step.'], request: ['Request', 'Where should we begin?', 'Tell us about the property and what you need. The more context you share, the more useful our first conversation can be.'] },
    services: { over: 'Practical support, without vague promises.', heading: 'Services for your property', intro: 'Every property and every need is different. We define the scope, checks required and people responsible before discussing the work.', groups: [
      { title: 'Construction and renovation', desc: 'New building work, full or partial renovations, and coordination of the agreed work packages.', items: ['Construction and renovation', 'Turnkey coordination, with roles set out', 'Demolition and earthworks, subject to access and logistics checks'] },
      { title: 'Finishes and surfaces', desc: 'Materials and installation depend on the substrate, intended use, site conditions and maintenance needs.', items: ['Finishes, stonework and paving', 'Resin, microcement and decorative surfaces', 'Waterproofing and reinstatement, after relevant checks'] },
      { title: 'Leaks and technical support', desc: 'We gather the symptoms and consider which checks may help. A photograph can provide context, but cannot by itself establish a diagnosis.', items: ['Leak investigation and repair management', 'Repairs and reinstatement defined after a site review', 'Reserved technical activities carried out by the appointed qualified professionals'] },
      { title: 'Outdoor spaces, gardens and pools', desc: 'Outdoor work is considered in light of the terrain, drainage, access and specific property conditions.', items: ['Gardens and outdoor areas', 'Stonework, paving and outdoor kitchens', 'Pools and related upkeep, within an agreed scope'] },
      { title: 'Property care and management', desc: 'Activities and frequency are agreed for each property; maintenance, cleaning and rental management remain distinct services.', items: ['Property maintenance and smaller repairs', 'Cleaning and apartment-related services', 'Property care and rental-related services, with scope agreed separately'] },
      { title: 'Before you buy', desc: 'An initial discussion about available information and questions for technical or document checks.', items: ['Support before a purchase', 'Clarifying needs and desired changes', 'Professional and document checks remain with the appropriately appointed specialists'] },
    ] },
    process: { heading: 'A clear process, with no leaps.', intro: 'No two homes are the same. Here is how we turn an enquiry into a shared plan, with realistic expectations.', steps: [
      ['01', 'Tell us the context', 'Let us know about the property, where it is and what you want to address. You can write in whichever language feels right.'],
      ['02', 'Get specific', 'We gather the useful details and identify together what needs checking or clarifying before the work can be defined.'],
      ['03', 'Agree the next steps', 'We define scope, priorities and how we will keep in touch. Before proceeding, you know what we have agreed and what still needs review.'],
      ['04', 'Stay in the loop', 'We keep the conversation open and share the updates we have agreed, even when you are far away.'],
    ] },
    abroad: { heading: 'Being far away is complicated enough.', intro: 'For people who live outside Sicily, finding a local contact is often the first step. You can send an enquiry in your preferred language; Herman speaks Italian, English, Dutch and Spanish. Colleagues and support tools may help with other languages, but a translated website does not guarantee a contact who speaks that language.', blocks: [
      ['A local contact who knows the area', 'Cefalù and nearby towns are our working context. Tell us what is happening and we can consider how to approach it, without assuming what we do not yet know.'],
      ['Clear information, wherever you are', 'We agree in advance how to keep you updated and what information is useful. Message, call or email: we choose the right channel for you.'],
      ['Clear expectations from the start', 'Every enquiry is considered individually. Before proceeding, we clarify what is included, what needs checking and any limits to our involvement.'],
      ['Your home is still yours when you are away', 'You can share a maintenance need, work to consider or a question about a purchase. The first step is to understand the context.'],
    ] },
  },
};
const copyBase = {
  it: {
    nav: { services: 'Servizi', process: 'Come lavoriamo', abroad: 'Per chi vive all’estero', articles: 'Articoli', projects: 'Progetti', contact: 'Contatti', request: 'Parliamo del tuo progetto' },
    home: { eyebrow: 'MARENETTO BUILD · CEFALÙ E DINTORNI', title: <>Costruiamo e ristrutturiamo <em>a Cefalù.</em></>, intro: 'Lavori edili e manutenzione per case, seconde abitazioni e strutture ricettive a Cefalù e dintorni. Un referente locale per organizzare gli interventi e restare aggiornato, anche se vivi all’estero.', primary: 'Raccontaci il tuo progetto', secondary: 'Guarda come lavoriamo', note: 'Un referente locale, anche quando vivi lontano.', figure: 'Una presenza concreta, sul posto.', proof1: 'Cefalù e dintorni', proof2: 'Italiano · Inglese · Olandese · Spagnolo' },
    page: { services: ['Servizi', 'Costruire, rinnovare, mantenere.', 'Lavori edili, finiture, esterni e manutenzione per la tua casa a Cefalù e dintorni. Dopo il primo contatto ti diciamo cosa facciamo noi, cosa affidiamo a un professionista e come procediamo.'], process: ['Come lavoriamo', 'Dalla tua richiesta ai prossimi passi.', 'Ci racconti la situazione, individuiamo le verifiche utili e concordiamo attività, responsabilità e aggiornamenti.'], abroad: ['Proprietari all’estero', 'La tua casa in Sicilia, seguita da vicino.', 'Un referente a Cefalù per lavori e manutenzione, con un canale di comunicazione concordato anche quando non puoi esserci.'], contact: ['Contatti', 'Scrivici o chiamaci.', 'Puoi contattarci in italiano o in inglese. Bastano poche righe sulla casa e su cosa ti serve per iniziare un confronto.'], request: ['Richiesta', 'Da dove possiamo cominciare?', 'Raccontaci della proprietà e di ciò che ti serve: località, tipo di intervento e priorità ci aiutano a capire da dove iniziare.'] },
    services: { over: 'Cosa facciamo, in concreto.', heading: 'Servizi per la tua proprietà', intro: 'Descrivi l’immobile e l’intervento. Definiamo le lavorazioni e chi se ne occupa; per gli aspetti riservati intervengono i professionisti abilitati incaricati.', groups: [
      { title: 'Costruzioni e ristrutturazioni', desc: 'Nuove opere e ristrutturazioni complete o parziali. Organizziamo le lavorazioni secondo il progetto concordato, con ruoli e responsabilità definiti.', items: ['Costruzioni e ristrutturazioni', 'Coordinamento chiavi in mano, con ruoli definiti', 'Demolizioni e movimento terra, dopo aver verificato accessi e logistica'] },
      { title: 'Finiture e superfici', desc: 'Pavimenti, pietra, resine e microcemento scelti in base al supporto, all’uso e al clima di costa. Ti indichiamo anche la manutenzione che richiederanno.', items: ['Finiture, pietra e pavimentazioni', 'Resine, microcemento e superfici decorative', 'Impermeabilizzazioni e ripristini, dopo le verifiche necessarie'] },
      { title: 'Infiltrazioni e assistenza', desc: 'Partiamo dai segni che vedi e dalle foto, poi verifichiamo sul posto la causa prima di proporre la riparazione.', items: ['Ricerca e gestione delle infiltrazioni', 'Riparazioni e ripristini definiti dopo il sopralluogo', 'Le attività tecniche riservate sono affidate a professionisti abilitati'] },
      { title: 'Esterni, giardini e piscine', desc: 'Interventi su terrazze, percorsi, giardini e piscine: valutiamo terreno, drenaggi e accessi prima di definire le lavorazioni.', items: ['Giardini e aree esterne', 'Pietra, pavimentazioni e cucine esterne', 'Piscine e relativa manutenzione, con attività concordate'] },
      { title: 'Cura e gestione della proprietà', desc: 'Controlli periodici, piccole riparazioni e servizi per la casa, con attività e frequenza fissate per il tuo immobile.', items: ['Manutenzione immobiliare e piccoli interventi', 'Pulizie e servizi collegati agli appartamenti', 'Cura della proprietà e servizi per gli affitti, su accordo specifico'] },
      { title: 'Prima dell’acquisto', desc: 'Partiamo dall’immobile e dai cambiamenti che hai in mente. Le verifiche tecniche e documentali competono ai professionisti incaricati.', items: ['Assistenza tecnica prima dell’acquisto', 'Raccolta delle esigenze e delle trasformazioni desiderate', 'Verifiche professionali e documentali a cura dei tecnici incaricati'] },
    ] },
    process: { heading: 'Quattro passaggi per capirci.', intro: 'Dal piccolo intervento alla ristrutturazione, definiamo il percorso in base alla casa e a ciò che vuoi realizzare.', steps: [
      ['01', 'Ci racconti la situazione', 'Dove si trova la casa, cosa vuoi fare, eventuali foto. Puoi scriverci via WhatsApp, email o con il modulo di richiesta.'],
      ['02', 'Valutiamo cosa serve', 'Partiamo dalle informazioni disponibili e individuiamo se servono un sopralluogo o verifiche professionali.'],
      ['03', 'Definiamo il lavoro', 'Prima di procedere concordiamo attività, responsabilità e condizioni del lavoro.'],
      ['04', 'Restiamo in contatto', 'Concordiamo un canale per condividere avanzamento, decisioni e prossimi passi, anche se vivi lontano.'],
    ] },
    abroad: { heading: 'Lontano da casa, non lontano dai lavori.', intro: 'Se vivi fuori dalla Sicilia, puoi iniziare il confronto a distanza. Herman parla italiano, inglese, olandese e spagnolo. Per altre lingue possiamo usare strumenti di supporto: la lingua del sito non garantisce un referente che la parli.', blocks: [
      ['Un referente sul posto', 'Un contatto locale a Cefalù per condividere la situazione dell’immobile e organizzare i prossimi passi.'],
      ['Aggiornamenti che puoi seguire', 'Concordiamo come condividere lo stato del lavoro: messaggi, chiamate ed email scelti in base alla situazione.'],
      ['Sapere cosa è incluso', 'Chiariamo lavorazioni, responsabilità e condizioni prima di procedere, così puoi decidere anche da lontano.'],
      ['Manutenzione, lavori, acquisto', 'Una riparazione, una ristrutturazione o una visita prima di comprare: si comincia sempre da una conversazione.'],
    ] },
  },
  en: {
    nav: { services: 'Services', process: 'How we work', abroad: 'Owners abroad', articles: 'Articles', projects: 'Projects', contact: 'Contact', request: 'Let’s talk about your project' },
    home: { eyebrow: 'MARENETTO BUILD · CEFALÙ AND SURROUNDING AREA', title: <>Building and renovation <em>in Cefalù.</em></>, intro: 'Building work and maintenance for homes, second homes and hospitality properties in Cefalù and nearby. A local contact to organise the work and keep you informed, even when you live abroad.', primary: 'Tell us about your project', secondary: 'See how we work', note: 'A local point of contact, even when you live abroad.', figure: 'A real presence, on the ground.', proof1: 'Cefalù and the surrounding area', proof2: 'Italian · English · Dutch · Spanish' },
    page: { services: ['Services', 'Build, renovate, maintain.', 'Building work, finishes, outdoor spaces and maintenance for your home in Cefalù and nearby. After the first contact we tell you what we do ourselves, what goes to a qualified professional and how we proceed.'], process: ['How we work', 'From your enquiry to the next steps.', 'You describe the situation; we identify useful checks and agree on tasks, responsibilities and updates.'], abroad: ['Owners abroad', 'Your home in Sicily, looked after up close.', 'A contact in Cefalù for building work and maintenance, with an agreed way to keep in touch when you cannot be there.'], contact: ['Contact', 'Write or call us.', 'You can contact us in Italian or English. A few lines about the property and what you need are enough to start a conversation.'], request: ['Request', 'Where should we begin?', 'Tell us about the property and what you need: its location, the work and your priorities help us understand where to start.'] },
    services: { over: 'What we do, in practice.', heading: 'Services for your property', intro: 'Describe the property and the work you have in mind. We define the tasks and who will handle them; reserved technical matters involve the appointed qualified professionals.', groups: [
      { title: 'Construction and renovation', desc: 'New building work and full or partial renovations. We organise the agreed work with defined roles and responsibilities.', items: ['Construction and renovation', 'Turnkey coordination, with roles set out', 'Demolition and earthworks, once access and logistics are checked'] },
      { title: 'Finishes and surfaces', desc: 'Floors, stone, resin and microcement chosen for the substrate, the use and the coastal climate. We also tell you what upkeep they will need.', items: ['Finishes, stonework and paving', 'Resin, microcement and decorative surfaces', 'Waterproofing and reinstatement, after the necessary checks'] },
      { title: 'Leaks and technical support', desc: 'We start from the signs you see and your photos, then check the cause on site before proposing a repair.', items: ['Leak investigation and repair management', 'Repairs and reinstatement defined after the site visit', 'Reserved technical activities are entrusted to qualified professionals'] },
      { title: 'Outdoor spaces, gardens and pools', desc: 'Work on terraces, paths, gardens and pools: we consider terrain, drainage and access before defining the tasks.', items: ['Gardens and outdoor areas', 'Stonework, paving and outdoor kitchens', 'Pools and their upkeep, with agreed tasks'] },
      { title: 'Property care and management', desc: 'Regular checks, small repairs and home services, with tasks and frequency set for your property.', items: ['Property maintenance and smaller repairs', 'Cleaning and apartment-related services', 'Property care and rental-related services, under a specific agreement'] },
      { title: 'Before you buy', desc: 'We start with the property and the changes you have in mind. Technical and document checks belong to the appointed professionals.', items: ['Support before a purchase', 'Clarifying needs and desired changes', 'Professional and document checks by the appointed specialists'] },
    ] },
    process: { heading: 'Four steps to understand your project.', intro: 'From a small repair to a renovation, we shape the next steps around the property and what you want to achieve.', steps: [
      ['01', 'Describe the situation', 'Where the property is, what you want to do, any photos. Reach us by WhatsApp, email or the enquiry form.'],
      ['02', 'Identify what is needed', 'We start with the available information and identify whether a site visit or professional checks are needed.'],
      ['03', 'Define the work', 'Before proceeding, we agree the tasks, responsibilities and terms of the work.'],
      ['04', 'Keep in touch', 'We agree a channel for sharing progress, decisions and next steps, even when you live abroad.'],
    ] },
    abroad: { heading: 'Far from home, not far from the work.', intro: 'If you live outside Sicily, you can start the conversation remotely. Herman speaks Italian, English, Dutch and Spanish. Support tools may help with other languages; the website language does not guarantee a contact who speaks it.', blocks: [
      ['A contact on the ground', 'A local contact in Cefalù to discuss the property and organise the next steps.'],
      ['Updates you can follow', 'We agree how to share progress: messages, calls and email chosen to suit the situation.'],
      ['Knowing what is included', 'We clarify tasks, responsibilities and terms before proceeding, so you can decide from a distance.'],
      ['Maintenance, building work, buying', 'A repair, a renovation or a visit before you buy: it always starts with a conversation.'],
    ] },
  },
};
const copy = new Proxy(copyBase, {
  get(target, key, receiver) {
    if (!isTranslationReviewMode() && typeof key === 'string' && key !== 'it') {
      return getLocalizedCopy(key, copySource as Record<string, typeof copySource.en>);
    }
    if (typeof key !== 'string' || key in target) return Reflect.get(target, key, receiver);
    return getLocalizedCopy(key, copyBase as Record<string, typeof copySource.en>);
  },
}) as typeof copySource & Record<Lang, typeof copySource.en>;

function getLang(path: string): Lang {
  const reviewLocale = path.match(/^\/__localization-review\/([a-z]{2})\//)?.[1];
  if (reviewLocale && getLocale(reviewLocale)) return reviewLocale;
  const pathLocale = path.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
  return pathLocale && getLocale(pathLocale) ? pathLocale : 'it';
}
function getPage(path: string): Page {
  const reviewPage = path.match(/^\/__localization-review\/[a-z]{2}\/(home|services|process|abroad|request|contact)\/?$/)?.[1];
  if (reviewPage) return reviewPage as Page;
  if (path === '/servizi' || path === '/en/services') return 'services';
  if (path === '/come-lavoriamo' || path === '/en/how-we-work') return 'process';
  if (path === '/proprietari-all-estero' || path === '/en/owners-abroad') return 'abroad';
  if (path === '/richiesta' || path === '/en/request') return 'request';
  if (path === '/contatti' || path === '/en/contact') return 'contact';
  if (path === '/articoli') return 'articles';
  if (path === '/guide') return 'guides';
  if (path === '/progetti') return 'projects';
  if (path === '/ricerca') return 'search';
  const normalizedPath = path.replace(/\/+$/, '') || '/';
  for (const locale of LOCALES) {
    const matchedPage = (Object.keys(routes[locale.code]) as Page[]).find(page => (routes[locale.code][page].replace(/\/+$/, '') || '/') === normalizedPath);
    if (matchedPage) return matchedPage;
  }
  return 'home';
}
function PageLink({ page, lang, children, className, ...props }: { page: Page; lang: Lang; children: ReactNode; className?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'>) {
  return <Link href={withCampaignParams(historicalNavigation(lang, page) ?? routes[lang][page])} className={className} {...props}>{children}</Link>;
}

function routeRedirect(target: string) {
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const url = new URL(withCampaignParams(target, search), 'https://preview.invalid');
  if (/\/(?:ricerca|search)$/.test(url.pathname)) {
    const query = new URLSearchParams(search).get('q');
    if (query !== null) url.searchParams.set('q', query);
  }
  if (typeof window !== 'undefined') url.hash = window.location.hash;
  return `${url.pathname}${url.search}${url.hash}`;
}

function ArticleNav({ lang, variant, onNavigate }: { lang: Lang; variant: 'desktop' | 'mobile'; onNavigate?: () => void }) {
  const activeArticles = useActiveEditorial().filter(e => e.locale === lang && e.kind === 'article' && e.revisionId !== 'withdrawn');
  const originalMenu = historicalArticleMenu(lang);
  const sourceMenu = originalMenu ? { ...originalMenu, categories: [...originalMenu.categories, ...activeArticles.map(e => ({ label: e.content.title, path: e.path }))] } : activeArticles.length ? { label: copy[lang].nav.articles, path: libraryPath(lang,'articles'), categories: activeArticles.map(e => ({label:e.content.title,path:e.path})) } : undefined;
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const groupRef = useRef<HTMLDivElement>(null);
  const pointerWithin = useRef(false);
  const menuId = `article-categories-${variant}-${lang}`;

  useEffect(() => { setOpen(false); }, [location]);
  if (!sourceMenu) {
    return variant === 'mobile'
      ? <PageLink page="articles" lang={lang} onClick={onNavigate} data-testid="mobile-nav-articles">{copy[lang].nav.articles}</PageLink>
      : null;
  }

  const articleTestId = variant === 'mobile' ? 'mobile-nav-articles' : 'nav-articles';
  return <div
    ref={groupRef}
    className={`article-nav article-nav--${variant}`}
    onMouseEnter={() => { pointerWithin.current = true; setOpen(true); }}
    onMouseLeave={() => {
      pointerWithin.current = false;
      if (!groupRef.current?.contains(document.activeElement)) setOpen(false);
    }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}
    onKeyDown={event => {
      if (event.key !== 'Escape' || !open) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      event.currentTarget.querySelector<HTMLButtonElement>('.article-nav-toggle')?.focus();
    }}
  >
    <div className="article-nav-topline">
      <PageLink page="articles" lang={lang} onClick={onNavigate} aria-current={undefined} data-testid={articleTestId}>{sourceMenu.label}</PageLink>
      <button
        type="button"
        className="article-nav-toggle"
        aria-label={sourceMenu.label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(current => pointerWithin.current ? current : !current)}
        data-testid={`button-${variant}-article-categories`}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    </div>
    <ul id={menuId} className="article-nav-list" hidden={!open}>
      {sourceMenu.categories.map(category => {
        const slug = category.path.split('/').filter(Boolean).at(-1);
        return <li key={category.path}>
          <Link
            href={withCampaignParams(category.path)}
            onClick={onNavigate}
            data-testid={`${variant}-article-category-${slug}`}
          >{category.label}</Link>
        </li>;
      })}
    </ul>
  </div>;
}

function Header({ lang, page, articleSlug, editionId }: { lang: Lang; page: Page; articleSlug?: string; editionId?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [location] = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const c = copy[lang].nav;
  const requestLabel = lang === 'it' || lang === 'en' ? homeCopy[lang].primary : c.request;
  // Close both menus whenever the route changes (link click, back/forward).
  useEffect(() => { setMenuOpen(false); setLanguageMenuOpen(false); }, [location]);
  // Escape closes the open menu and returns focus to its trigger.
  useEffect(() => {
    if (!menuOpen && !languageMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menuOpen) { setMenuOpen(false); menuButtonRef.current?.focus(); }
      if (languageMenuOpen) { setLanguageMenuOpen(false); langButtonRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, languageMenuOpen]);
  // Move focus into the mobile menu when it opens.
  useEffect(() => { if (menuOpen) mobileNavRef.current?.querySelector<HTMLElement>('a')?.focus(); }, [menuOpen]);
  useEffect(() => {
    if (languageMenuOpen) {
      const menu = languageMenuRef.current;
      (menu?.querySelector<HTMLElement>('[aria-current="true"]') ?? menu?.querySelector<HTMLElement>('[role="menuitem"]'))?.focus();
    }
  }, [languageMenuOpen]);
  const items: [Page, string][] = [['services', c.services], ['process', c.process], ['abroad', c.abroad], ['articles', c.articles], ['contact', c.contact]];
  // Keep the approved primary links and add the recovered historical article menu
  // only for locales whose original menu and category paths were verified.
  const desktopItems: [Page, string][] = [['services', c.services], ['process', c.process], ['contact', c.contact]];
  // 'projects' stays routable (/progetti) but is hidden from navigation until approved real work exists.
  return localizeNode(lang, <header className="topbar">
    <div className="container nav-wrap">
      <Link href={withCampaignParams(routes[lang].home)} className="wordmark" aria-label={'Marenetto Build'} data-testid="link-logo">
        <Logo />
      </Link>
      <nav className="nav-links" aria-label={lang === 'it' ? 'Navigazione principale' : 'Main navigation'}>
        <WhatsAppNavLink lang={lang} />
        {desktopItems.slice(0, 2).map(([key, label]) => <PageLink key={key} page={key} lang={lang} aria-current={page === key ? 'page' : undefined} data-testid={`nav-${key}`}>{label}</PageLink>)}
        {historicalArticleMenu(lang) && <ArticleNav lang={lang} variant="desktop" />}
        <PageLink page="contact" lang={lang} aria-current={page === 'contact' ? 'page' : undefined} data-testid="nav-contact">{c.contact}</PageLink>
      </nav>
      <div className="nav-actions">
        <div className="language-picker">
          <button ref={langButtonRef} type="button" className="lang-switch" aria-label={getLocale(lang)?.nativeName ?? lang} aria-expanded={languageMenuOpen} aria-haspopup="menu" onClick={() => { setMenuOpen(false); setLanguageMenuOpen(open => !open); }} data-testid="link-language"><span className="language-flag" aria-hidden="true">{languageFlag(lang)}</span>{lang.toUpperCase()} <ChevronDown size={12} /></button>
          {languageMenuOpen && <div ref={languageMenuRef} className="language-menu" role="menu" onKeyDown={event => {
            const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
            if (!keys.includes(event.key)) return;
            const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
            if (!items.length) return;
            event.preventDefault();
            const current = items.indexOf(document.activeElement as HTMLElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
          }}>{LOCALES.map(locale => {
            const edition = getEdition(locale.code, editionId ?? articleSlug ?? page);
            if (!edition) return null;
            return <Link key={locale.code} href={withCampaignParams(edition.path)} role="menuitem" lang={locale.code} aria-label={locale.nativeName} aria-current={locale.code === lang ? 'true' : undefined} onClick={() => { saveLanguageChoice(locale.code); setLanguageMenuOpen(false); }}><span className="language-flag" aria-hidden="true">{languageFlag(locale.code)}</span><span className="language-name" dir={locale.direction}>{locale.nativeName}</span>{locale.code === lang && <Check size={15} aria-hidden="true" className="language-selected" />}</Link>;
          })}</div>}
        </div>
        <PageLink page="request" lang={lang} className={`button${page === 'request' ? ' is-quiet' : ''}`} data-testid="nav-request">{requestLabel}<ArrowRight size={14} /></PageLink>
        <button ref={menuButtonRef} type="button" className="menu-toggle" aria-controls="mobile-nav" onClick={() => { setLanguageMenuOpen(false); setMenuOpen(!menuOpen); }} aria-label={translateText(lang, 'Menu')} aria-expanded={menuOpen} data-testid="button-menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
    </div>
    {menuOpen && <nav ref={mobileNavRef} id="mobile-nav" className="mobile-nav" aria-label={lang === 'it' ? 'Menu' : 'Menu'}>
      {items.map(([key, label]) => key === 'articles'
        ? <ArticleNav key={key} lang={lang} variant="mobile" onNavigate={() => setMenuOpen(false)} />
        : <PageLink key={key} page={key} lang={lang} onClick={() => setMenuOpen(false)} data-testid={`mobile-nav-${key}`}>{label}</PageLink>)}
      <PageLink page="guides" lang={lang} onClick={() => setMenuOpen(false)} data-testid="mobile-nav-guides">{lang === 'it' ? 'Guide pratiche' : 'Practical guides'}</PageLink>
      <PageLink page="search" lang={lang} onClick={() => setMenuOpen(false)} data-testid="mobile-nav-search">{lang === 'it' ? 'Ricerca' : 'Search'}</PageLink>
      <a href={telHref} data-testid="mobile-nav-phone">{COMPANY_PHONE.display}</a>
      <PageLink page="request" lang={lang} className="button" onClick={() => setMenuOpen(false)}>{requestLabel}<ArrowRight size={14} /></PageLink>
    </nav>}
    <MobileContactBar hidden={menuOpen || languageMenuOpen} callLabel={localizeChoice(lang, 'Chiama', 'Phone')} writeLabel={localizeChoice(lang, 'Scrivici', 'Email')}
      emailHref={emailHref(localizeChoice(lang, 'Richiesta informazioni — Marenetto Build', 'Enquiry — Marenetto Build'))} />
  </header>);
}

function Footer({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  const message = localizeChoice(lang, 'Buongiorno, vorrei parlare della mia proprietà a Cefalù.', 'Hello, I would like to discuss my property in Cefalù.');
  return localizeNode(lang, <>
  <div className="footer-logo-band"><div className="container">
    <Link href={withCampaignParams(routes[lang].home)} className="wordmark" aria-label={'Marenetto Build'} data-testid="link-footer-logo"><Logo variant="dark" /></Link>
  </div></div>
  <footer className="footer">
    <div className="container">
      <div className="footer-top">
        <div><h3>{it ? 'Esplora' : 'Explore'}</h3><div className="footer-links">
          <PageLink lang={lang} page="services">{it ? 'Servizi' : 'Services'}</PageLink>
          <PageLink lang={lang} page="process">{it ? 'Come lavoriamo' : 'How we work'}</PageLink>
          <PageLink lang={lang} page="abroad">{it ? 'Proprietari all’estero' : 'Owners abroad'}</PageLink>
          <PageLink lang={lang} page="request">{it ? 'Invia una richiesta' : 'Send an enquiry'}</PageLink>
        </div><h3 className="footer-subheading">{it ? 'Approfondire' : 'Explore'}</h3><div className="footer-links">
          <PageLink lang={lang} page="articles" data-testid="link-footer-articles">{it ? 'Articoli' : 'Articles'}</PageLink>
          <PageLink lang={lang} page="guides" data-testid="link-footer-guides">{it ? 'Guide pratiche' : 'Practical guides'}</PageLink>
          <PageLink lang={lang} page="search" data-testid="link-footer-search">{it ? 'Ricerca' : 'Search'}</PageLink>
        </div></div>
        <div><h3>{it ? 'Un primo contatto' : 'Get in touch'}</h3><div className="footer-links">
          <PageLink lang={lang} page="contact">{it ? 'Contatti' : 'Contact'}</PageLink>
          <a href={emailHref(localizeChoice(lang, 'Richiesta informazioni — Marenetto Build', 'Enquiry — Marenetto Build'))} data-testid="link-footer-email" dir="ltr">{COMPANY_CONTACT.email}</a>
          <span className="footer-phone-row"><a href={telHref} data-testid="link-footer-phone">Tel {COMPANY_PHONE.display}</a><span aria-hidden="true">·</span><a href={whatsappHref(message)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${COMPANY_PHONE.display}`} data-testid="link-footer-whatsapp">WhatsApp</a></span>
          <span lang="it">Cefalù · Sicilia<br /><small>Sede esatta in attesa di conferma aziendale.</small></span>
        </div></div>
      </div>
      <IllustrationNote lang={lang} />
      <div className="footer-bottom"><span lang="it">© {new Date().getFullYear()} Marenetto Build · Dati societari in attesa di conferma.</span><span>{it ? 'Cefalù · Sicilia' : 'Cefalù · Sicily'}</span><Link href={withCampaignParams(routes[it ? 'en' : 'it'].home)} onClick={() => saveLanguageChoice(it ? 'en' : 'it')}>{it ? 'English' : 'Italiano'} <ArrowRight size={12} /></Link></div>
    </div>
  </footer></>);
}

function SectionLabel({ children }: { children: ReactNode }) { return <span className="eyebrow">{children}</span>; }
function CtaPanel({ lang, title, text }: { lang: Lang; title: string; text: string }) {
  return localizeNode(lang, <div className="cta-panel">
    <div><h2 className="display-title">{title}</h2><p>{text}</p></div>
    <PageLink lang={lang} page="request" className="button" data-testid="cta-request">{lang === 'it' ? 'Raccontaci il tuo progetto' : 'Tell us about your project'}<ArrowRight size={15} /></PageLink>
  </div>);
}
function PageHero({ lang, page }: { lang: Lang; page: Exclude<CorePage, 'home'> }) {
  const d = copy[lang].page[page];
  return localizeNode(lang, <section className="page-hero">
    <div className="container">
      <div className="page-hero-grid">
        <div className="animate-enter"><SectionLabel>{d[0]}</SectionLabel><h1 className="display-title">{d[1]}</h1></div>
        <p className="animate-enter delay-1">{d[2]}</p>
      </div>
      <div className="page-meta"><span>{lang === 'it' ? 'Un riferimento locale a Cefalù' : 'A local point of contact in Cefalù'}</span><span>{lang === 'it' ? 'Sicilia · Italia' : 'Sicily · Italy'}</span></div>
    </div>
  </section>);
}

function buildHomeCopy(lang: Lang): HomeCopy {
  if (!isTranslationReviewMode() && !['it', 'en'].includes(lang)) {
    const c = copy[lang];
    // Reuse the previously approved phrases; do not silently load the newer draft.
    return {
      ...homeCopy.en, title: c.home.title, intro: c.home.intro, primary: c.home.primary, secondary: c.home.secondary,
      svcHeading: c.services.heading, svcIntro: c.services.intro,
      services: [c.services.groups[0], c.services.groups[4], c.services.groups[5]].map(group => ({ title: group.title, desc: group.desc, link: c.home.primary })),
      outdoorKicker: c.services.groups[3].title, outdoorTitle: c.services.groups[3].title, outdoorText: c.services.groups[3].desc, outdoorLink: c.nav.services,
      methodKicker: c.nav.process, methodHeading: c.process.heading, methodLink: c.nav.process,
      steps: c.process.steps.map(step => [step[1], step[2]]),
      abroadKicker: c.nav.abroad, abroadHeading: c.abroad.heading, abroadText: c.abroad.intro, abroadLink: c.nav.abroad,
      abroadPoints: c.abroad.blocks.slice(0, 3).map(block => [block[0], block[1]]),
    };
  }
  return getLocalizedCopy(lang, { it: homeCopy.it, en: homeCopy.en });
}

function HomePage({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  const h = buildHomeCopy(lang);
  const native = lang === 'it' || lang === 'en';
  // Native copy is rendered as-is; other locales already receive localized values from copy[lang].
  const wrap = (node: ReactNode) => native ? node : localizeNode(lang, node);
  const svcHref = (id: string) => withCampaignParams(routes[lang].services) + '#' + id;
  const serviceMedia = [
    { name: 'construction', widths: [480, 960], width: 960, height: 524 },
    { name: 'property', widths: [480, 960], width: 960, height: 960 },
    { name: 'pre-purchase', widths: [1920], width: 1920, height: 1047, src: '/media/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali.jpg' },
  ];
  const svcIds = [SERVICE_GROUP_IDS[0], SERVICE_GROUP_IDS[4], SERVICE_GROUP_IDS[5]];
  return <div className="mb-home mbh">
    <section className="mbh-opening">
    <HeroPhoto>
      <div className="mbh-hero__copy">
        <h1 className="mbh-h1 animate-enter delay-1">{h.title}</h1>
        <p className="mbh-hero__lead animate-enter delay-2">{h.intro}</p>
        <div className="mbh-actions animate-enter delay-3">
          <PageLink lang={lang} page="request" className="mbh-btn mbh-btn--board" data-testid="hero-request">{h.primary}</PageLink>
          <PageLink lang={lang} page="process" className="mbh-hero__link" data-testid="hero-process">{h.secondary}</PageLink>
        </div>
      </div>
    </HeroPhoto>
    </section>

    {wrap(<section className="mbh-section" data-testid="section-services" aria-labelledby="mbh-svc-title">
      <div className="mbh-wrap">
        <div className="mbh-head mbh-head--split">
          <h2 id="mbh-svc-title" className="mbh-h2">{h.svcHeading}</h2>
          <p className="mbh-intro">{h.svcIntro}</p>
        </div>
        <div className="mbh-cards">
          {h.services.map((s, i) => <Link href={svcHref(svcIds[i])} className="mbh-card" key={svcIds[i]} data-testid={`card-service-0${i + 1}`}>
            <IllustrativeImage className="mbh-card__media" name={serviceMedia[i].name} widths={serviceMedia[i].widths} src={serviceMedia[i].src}
              sizes="(min-width: 1356px) 403px, (min-width: 1100px) calc((100vw - 148px) / 3), (min-width: 700px) calc((100vw - 112px) / 3), calc(100vw - 40px)" width={serviceMedia[i].width} height={serviceMedia[i].height} alt="" />
            <span className="mbh-card__body" data-testid={`link-service-${svcIds[i]}`}>
              <h3 className="mbh-h3">{s.title}</h3>
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>)}
        </div>
      </div>
    </section>)}

    {localizeNode(lang, <section className="mbh-strip" data-testid="section-contact-strip" aria-labelledby="mbh-strip-title">
      <div className="mbh-wrap mbh-strip__inner">
        {/* IT: approved copy. Other locales reuse the existing contact-page title and nav label (no new translations). */}
        <h2 id="mbh-strip-title" className="mbh-strip__title">{it ? 'Il tuo progetto comincia da un confronto.' : copy[lang].page.contact[1]}</h2>
        <PageLink lang={lang} page="contact" className="mbh-btn mbh-btn--primary" data-testid="strip-contact">{it ? 'Contattaci' : copy[lang].nav.contact}</PageLink>
      </div>
    </section>)}

    {/* Featured real project: intentionally omitted until a verified, authorised project exists. */}

    {wrap(<section data-testid="section-outdoor" aria-labelledby="mbh-out-title">
      <div className="mbh-outdoor">
      <IllustrativeImage className="mbh-outdoor__media" name="garden" widths={[480, 960]} sizes="(min-width: 900px) 58vw, 100vw" width={960} height={960} alt="" />
      <div className="mbh-outdoor__copy">
        <p className="mbh-kicker mbh-kicker--light">{h.outdoorKicker}</p>
        <h2 id="mbh-out-title" className="mbh-h2">{h.outdoorTitle}</h2>
        <p>{h.outdoorText}</p>
        <Link href={svcHref(SERVICE_GROUP_IDS[3])} className="mbh-link mbh-link--light" data-testid="link-service-esterni">{h.outdoorLink}<ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      </div>
    </section>)}

    {wrap(<section className="mbh-section" id="metodo" data-testid="section-method" aria-labelledby="mbh-method-title">
      <div className="mbh-wrap">
        <div className="mbh-head">
          <div><p className="mbh-kicker">{h.methodKicker}</p><h2 id="mbh-method-title" className="mbh-h2">{h.methodHeading}</h2></div>
          <PageLink lang={lang} page="process" className="mbh-link" data-testid="link-home-process">{h.methodLink}<ArrowRight size={15} aria-hidden="true" /></PageLink>
        </div>
        <ol className="mbh-steps">
          {h.steps.map(([t, d], i) => <li className="mbh-step" key={i}><span className="mbh-num">0{i + 1}</span><h3>{t}</h3><p>{d}</p></li>)}
        </ol>
      </div>
    </section>)}

    {wrap(<section className="mbh-section mbh-abroad" data-testid="section-abroad" aria-labelledby="mbh-abroad-title">
      <div className="mbh-wrap mbh-abroad__grid">
        <IllustrativeImage className="mbh-abroad__media" name="stonework" widths={[1024]} src="/media/articles/opere-in-pietra-e-prospetti.jpg"
          sizes="(min-width: 900px) 50vw, 100vw" width={1024} height={1024} alt="" />
        <div className="mbh-abroad__copy">
          <p className="mbh-kicker">{h.abroadKicker}</p>
          <h2 id="mbh-abroad-title" className="mbh-h2">{h.abroadHeading}</h2>
          <p className="mbh-intro">{h.abroadText}</p>
          <ul className="mbh-points">{h.abroadPoints.map(([t, d], i) => <li key={i}><span className="mbh-num">0{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></li>)}</ul>
          <PageLink lang={lang} page="abroad" className="mbh-link" data-testid="link-home-abroad">{h.abroadLink}<ArrowRight size={15} aria-hidden="true" /></PageLink>
        </div>
      </div>
    </section>)}

    {localizeNode(lang, <section className="mbh-section mbh-news" id="approfondimenti" data-testid="section-home-articles">
      <div className="mbh-wrap">
        <div className="mb-news-head"><h2 className="mbh-h2">{copy[lang].nav.articles}</h2><span className="mb-news-rule" aria-hidden="true" /><PageLink lang={lang} page="articles" className="mbh-link" data-testid="link-home-articles">{copy[lang].nav.articles}<ArrowRight size={14} /></PageLink></div>
        <div className="mb-news-grid">
          {[...articleList].sort((a, b) => (a.reviewStatus === 'documentary-review' ? 0 : 1) - (b.reviewStatus === 'documentary-review' ? 0 : 1)).slice(0, 3).map(a => <Link key={a.slug} href={withCampaignParams(articlePath(lang, a.slug))} className="mb-news-card" data-testid={`card-home-article-${a.slug}`}>
            <div className="mb-news-media"><img src={a.image} alt={translateText(lang, a.imageAlt)} width={1920} height={a.image.endsWith('.png') ? 1920 : 1047} loading="lazy" /></div>
            <div className="mb-news-meta" lang="it"><span>{a.category}</span><time dateTime={a.publishedOn ?? undefined}>{a.publishedOn ?? '—'}</time></div>
            <h3 className="mb-serif" lang="it">{a.title}</h3>
            <p lang="it">{a.summary}</p>
            {lang !== 'it' && <small lang="it">Testo originale italiano</small>}
          </Link>)}
        </div>
      </div>
    </section>)}

  </div>;
}

function ServicesPage({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  useEffect(() => {
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => { target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }); target.focus({ preventScroll: true }); });
  }, []);
  const data = copy[lang].services;
  return localizeNode(lang, <>
    <PageHero lang={lang} page="services" />
    <section className="section">
      <div className="container">
        <div className="section-head"><div><SectionLabel>{data.over}</SectionLabel><h2 className="section-heading display-title">{data.heading}</h2><p className="section-intro">{data.intro}</p></div></div>
        <div className="service-groups">{data.groups.map((group, i) => <article className="service-group" id={SERVICE_GROUP_IDS[i]} tabIndex={-1} data-testid={`service-group-${SERVICE_GROUP_IDS[i]}`} key={group.title}><span className="number">0{i + 1} / {it ? 'AMBITO' : 'AREA'}</span><h2>{group.title}</h2><p>{group.desc}</p><ul className="service-list">{group.items.map(item => <li key={item}><span>{item}</span><span aria-hidden="true">+</span></li>)}</ul></article>)}</div>
      </div>
    </section>
    <section className="section tight" id="contatti" data-testid="anchor-contatti"><div className="container"><CtaPanel lang={lang} title={it ? 'Hai in mente un intervento?' : 'Have a project in mind?'} text={it ? 'Raccontaci la tua idea: capiremo insieme se e come possiamo aiutarti.' : 'Tell us what you have in mind and we can see together whether and how we can help.'} /></div></section>
  </>);
}

function ProcessPage({ lang }: { lang: Lang }) {
  const data = copy[lang].process;
  const it = lang === 'it';
  return localizeNode(lang, <>
    <PageHero lang={lang} page="process" />
    <section className="section">
      <div className="container editorial-grid">
        <aside className="editorial-aside"><SectionLabel>{it ? 'Un metodo pratico' : 'A practical approach'}</SectionLabel><h2 className="section-heading display-title">{data.heading}</h2><p className="section-intro">{data.intro}</p></aside>
        <div className="detail-list">{data.steps.map(([n, title, desc]) => <article className="detail-row" key={n}><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div></article>)}</div>
      </div>
    </section>
    <section className="section split-band"><div className="container split-layout"><div><SectionLabel>{it ? 'La chiarezza prima di tutto' : 'Clarity comes first'}</SectionLabel><h2 className="display-title">{it ? <>Ogni passaggio<br /><em>condiviso.</em></> : <>Every step,<br /><em>shared.</em></>}</h2><p>{it ? 'Non diamo per scontato il contesto. Ti diciamo cosa sappiamo, cosa va ancora verificato e quali aspetti è utile concordare prima di procedere.' : 'We do not assume the context. We tell you what we know, what still needs checking and what is useful to agree before moving ahead.'}</p></div><div className="principles">{(it ? [['Ambito', 'Cosa è incluso e cosa richiede un approfondimento.'], ['Comunicazione', 'Chi è il referente e come condividiamo gli aggiornamenti.'], ['Decisioni', 'I passaggi vengono concordati prima di procedere.']] : [['Scope', 'What is included and what needs further review.'], ['Communication', 'Who your contact is and how updates are shared.'], ['Decisions', 'Steps are agreed before we proceed.']]).map(([h, p], i) => <div className="principle" key={h}><span>0{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></div>)}</div></div></section>
    <section className="section tight"><div className="container"><CtaPanel lang={lang} title={it ? 'Hai una domanda o un progetto?' : 'A question or a project?'} text={it ? 'Condividi i dettagli che hai: non serve avere già tutto deciso.' : 'Share the details you have. You do not need to have everything figured out.'} /></div></section>
  </>);
}

function AbroadPage({ lang }: { lang: Lang }) {
  const data = copy[lang].abroad;
  const it = lang === 'it';
  return localizeNode(lang, <>
    <PageHero lang={lang} page="abroad" />
    <section className="section">
      <div className="container editorial-grid">
        <aside className="editorial-aside"><SectionLabel>{it ? 'La tua casa, anche da lontano' : 'Your home, from a distance'}</SectionLabel><h2 className="section-heading display-title">{data.heading}</h2><p className="section-intro">{data.intro}</p></aside>
        <div className="detail-list">{data.blocks.map(([title, desc], i) => <article className="detail-row" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{desc}</p></div></article>)}</div>
      </div>
    </section>
    <section className="section split-band"><div className="container split-layout"><div><SectionLabel>{it ? 'Una lingua in comune' : 'A shared language'}</SectionLabel><h2 className="display-title">{it ? <>Un dialogo<br /><em>senza distanza.</em></> : <>A conversation<br /><em>without distance.</em></>}</h2><p>{it ? 'Puoi scriverci in italiano o inglese. Ti chiediamo di scegliere come preferisci essere ricontattato e di condividere solo le informazioni che ci aiutano a capire la situazione.' : 'You can write to us in Italian or English. Choose how you would like us to get back to you and share only the information that helps us understand the situation.'}</p></div><div className="principles">{(it ? [['WhatsApp', 'Un messaggio per iniziare, anche da un altro fuso orario.'], ['Email', 'Comodo per condividere con calma il contesto.'], ['Richiesta', 'Un modulo strutturato quando hai già i dettagli.']] : [['WhatsApp', 'A message to begin, even from another time zone.'], ['Email', 'Useful for sharing the context in your own time.'], ['Enquiry', 'A structured form when you have the details.']]).map(([h, p], i) => <div className="principle" key={h}><span>0{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></div>)}</div></div></section>
    <section className="section tight"><div className="container"><CtaPanel lang={lang} title={it ? 'Comincia da ciò che sai.' : 'Start with what you know.'} text={it ? 'Puoi inviare una richiesta anche se alcuni dettagli sono ancora da definire.' : 'You can send an enquiry even if some details are still to be worked out.'} /></div></section>
  </>);
}

function ContactPage({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  return localizeNode(lang, <>
    <PageHero lang={lang} page="contact" />
    <section className="section" id="contatti" data-testid="anchor-contatti">
      <div className="container contact-layout">
        <aside className="contact-info"><SectionLabel>{it ? 'Contatti' : 'Contact'}</SectionLabel><h2 className="display-title">{it ? 'Ci trovi qui.' : 'We are here.'}</h2>
          <div className="contact-method"><MessageCircle size={17} /><div><small>WhatsApp</small><a href={whatsappHref(localizeChoice(lang, 'Buongiorno, vorrei parlare della mia proprietà a Cefalù.', 'Hello, I would like to discuss my property in Cefalù.'))} target="_blank" rel="noopener noreferrer" data-testid="link-whatsapp">{it ? 'Scrivici' : 'Get in touch'}<ArrowRight size={13} /></a></div></div>
          <div className="contact-method"><Phone size={17} /><div><small>{it ? 'Telefono' : 'Phone'}</small><a href={telHref} data-testid="link-phone">{COMPANY_PHONE.display}</a></div></div>
          <div className="contact-method"><Mail size={17} /><div><small>Email</small><a href={emailHref(localizeChoice(lang, 'Richiesta informazioni — Marenetto Build', 'Enquiry — Marenetto Build'))} data-testid="link-email" dir="ltr">{COMPANY_CONTACT.email}</a></div></div>
          <div className="contact-method"><MapPin size={17} /><div><small>{it ? 'Indirizzo' : 'Address'}</small><span lang="it">Cefalù · Sicilia<br />Sede esatta in attesa di conferma aziendale.</span></div></div>
          <div className="contact-note">{localizeChoice(lang, 'Anteprima sintetica: non inserire dati personali reali. Per un contatto effettivo usa email, telefono o WhatsApp.', 'Synthetic preview: do not enter real personal information. The form discards the details entered and creates only a demo lead. For a real enquiry, use email, phone or WhatsApp.')}</div>
        </aside>
        <div className="contact-content"><SectionLabel>{it ? 'Richiesta' : 'Enquiry'}</SectionLabel><h2 className="display-title">{it ? 'Che cosa ti serve?' : 'What do you need?'}</h2>
          <div className="contact-cta-list">
            <PageLink lang={lang} page="request" className="contact-cta" data-testid="link-contact-request"><div><strong>{it ? 'Invia una richiesta' : 'Send an enquiry'}</strong></div><ArrowRight size={18} color="#a66546" /></PageLink>
          </div>
        </div>
      </div>
    </section>
  </>);
}

type RequestFormState = {
  requestType: ProjectRequestInput['requestType']; propertyType: string; service: string; location: string; projectStage: string; message: string; preferredLanguage: string; name: string; email: string; phone: string; preferredChannel: ProjectRequestInput['preferredChannel']; budget: string; desiredPeriod: string; needsAccommodation: boolean; needsMobility: boolean; privacyAccepted: boolean;
};
const initialForm = (lang: Lang): RequestFormState => ({ requestType: 'project', propertyType: '', service: '', location: '', projectStage: '', message: '', preferredLanguage: lang, name: '', email: '', phone: '', preferredChannel: 'email', budget: '', desiredPeriod: '', needsAccommodation: false, needsMobility: false, privacyAccepted: false });

function RequestPage({ lang, editorial = false }: { lang: Lang; editorial?: boolean }) {
  const text = (italian: string, english: string) => localizeChoice(lang, italian, english);
  const [form, setForm] = useState<RequestFormState>(() => initialForm(lang));
  const [review, setReview] = useState(false);
  const [receipt, setReceipt] = useState<{ code: string; status: string; notificationStatus: string; isSynthetic: boolean } | null>(null);
  const create = useCreateProjectRequest();
  const keyRef = useRef<string>(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `marenetto-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const formRef = useRef<HTMLFormElement>(null);
  const update = (key: keyof RequestFormState, value: string | boolean) => setForm(old => ({ ...old, [key]: value } as RequestFormState));
  const field = (key: keyof RequestFormState, label: string, opts: { required?: boolean; placeholder?: string; type?: string; full?: boolean; minLength?: number; maxLength?: number } = {}) => <div className={`field${opts.full ? ' full' : ''}`}>
    <label htmlFor={`field-${key}`}>{label}{opts.required && <span aria-hidden="true"> *</span>}</label>
    <input id={`field-${key}`} data-testid={`input-${key}`} value={form[key] as string} onChange={e => update(key, e.target.value)} placeholder={opts.placeholder} type={opts.type || 'text'} required={opts.required} minLength={opts.minLength} maxLength={opts.maxLength} />
  </div>;
  const submitRequest = (event: FormEvent) => {
    event.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    if (!review) {
      setReview(true);
      return;
    }
    const payload: ProjectRequestInput = {
      requestType: form.requestType, propertyType: form.propertyType, service: form.service, location: form.location, projectStage: form.projectStage,
      message: form.message, preferredLanguage: form.preferredLanguage, name: form.name, email: form.email, ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      preferredChannel: form.preferredChannel, ...(form.budget.trim() ? { budget: form.budget.trim() } : {}), ...(form.desiredPeriod.trim() ? { desiredPeriod: form.desiredPeriod.trim() } : {}),
      needsAccommodation: form.needsAccommodation, needsMobility: form.needsMobility, privacyAccepted: form.privacyAccepted, idempotencyKey: keyRef.current,
    };
    create.mutate({ data: payload }, { onSuccess: result => { trackSavedRequest(result); setReceipt({ code: result.code, status: result.status, notificationStatus: result.notificationStatus, isSynthetic: result.isSynthetic }); setReview(false); } });
  };
  const label = localizeChoice(lang, { group1: 'La richiesta', type: 'Di cosa hai bisogno?', property: 'Tipo di proprietà', service: 'Servizio', location: 'Dove si trova la proprietà?', stage: 'A che punto sei?', message: 'Raccontaci meglio', group2: 'Come ricontattarti', name: 'Nome e cognome', email: 'Email', phone: 'Telefono / WhatsApp', channel: 'Canale preferito', lang: 'Lingua preferita', group3: 'Altri dettagli', budget: 'Budget indicativo (opzionale)', period: 'Periodo desiderato (opzionale)', accom: 'Potresti aver bisogno di un alloggio durante i lavori', mobility: 'Hai esigenze di accessibilità o mobilità da segnalarci', privacy: 'Ho letto e accetto l’informativa privacy per essere ricontattato in merito a questa richiesta.', submit: 'Rivedi la richiesta', sending: 'Invio in corso…', requestType: ['Progetto / lavori', 'Manutenzione', 'Acquisto'], required: 'I campi contrassegnati con * sono necessari. La richiesta non conferma disponibilità o avvio dei lavori.' }, { group1: 'Your enquiry', type: 'What do you need?', property: 'Property type', service: 'Service', location: 'Where is the property?', stage: 'What stage are you at?', message: 'Tell us a little more', group2: 'How to reach you', name: 'Name', email: 'Email', phone: 'Phone / WhatsApp', channel: 'Preferred contact channel', lang: 'Preferred language', group3: 'A few more details', budget: 'Indicative budget (optional)', period: 'Desired timing (optional)', accom: 'You may need accommodation during the work', mobility: 'You have accessibility or mobility needs to let us know about', privacy: 'I have read and accept the privacy notice so I can be contacted about this enquiry.', submit: 'Review your enquiry', sending: 'Sending…', requestType: ['Project / building work', 'Maintenance', 'Purchase'], required: 'Fields marked * are required. Sending an enquiry does not confirm availability or a start date.' });
  const requestTypes: ProjectRequestInput['requestType'][] = ['project', 'maintenance', 'purchase'];
  const selectField = (key: keyof RequestFormState, name: string, options: [string, string][], required = true) => <div className="field"><label htmlFor={`field-${key}`}>{name}{required && <span aria-hidden="true"> *</span>}</label><select id={`field-${key}`} data-testid={`select-${key}`} value={form[key] as string} onChange={e => update(key, e.target.value)} required={required}><option value="">{text('Seleziona…', 'Choose…')}</option>{options.map(([v, t]) => <option value={v} key={v}>{t}</option>)}</select></div>;
  const human = (key: keyof RequestFormState) => {
    const element = formRef.current?.querySelector<HTMLSelectElement>(`select[id="field-${key}"]`);
    return element?.selectedOptions[0]?.textContent ?? String(form[key]);
  };
  return <>
    {!editorial && <PageHero lang={lang} page="request" />}
    <section className="section">
      <div className="container request-layout">
        <aside className="request-aside"><SectionLabel>{text('Un buon punto di partenza', 'A useful place to start')}</SectionLabel><h2 className="display-title">{text('Con calma, con i dettagli che hai.', 'No rush. Share what you know.')}</h2><p>{text('Questa anteprima scarta i dati inseriti e conserva solo un lead sintetico. Non inserire dati personali reali. Le notifiche interne sono persistenti; gli invii email attendono l’approvazione del fornitore.', 'This preview discards the details entered and stores only a synthetic lead. Do not enter real personal information. In-app notifications persist; email delivery awaits provider approval.')}</p><p>{text('Per un contatto effettivo, scrivi a info@marenetto.com, chiama o invia un messaggio WhatsApp al numero aziendale.', 'For a real enquiry, email info@marenetto.com, call or send a WhatsApp message to the company number.')}</p><div className="language-note">{text('Puoi indicare una lingua preferita fra quelle richieste; la risposta automatica non è ancora attiva.', 'You can select any requested language; automated replies are not active yet.')}</div></aside>
        <div>
          <form className="form-card" ref={formRef} onSubmit={submitRequest} noValidate={false}
            onInputCapture={event => {
              const field = event.target;
              if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) field.setCustomValidity('');
            }}
            onInvalidCapture={event => {
              const field = event.target;
              if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
              field.setCustomValidity(field.validity.valueMissing
                ? text('Compila questo campo.', 'Please fill in this field.')
                : field.validity.typeMismatch ? text('Inserisci un indirizzo email valido.', 'Please enter a valid email address.')
                : text('Controlla questo campo.', 'Please check this field.'));
            }}>
            <h2 className="form-section-title">{label.group1}</h2>
            <div className="field full"><span className="field-label">{label.type} *</span><div className="radio-row">{requestTypes.map((value, i) => <label className="radio-choice" key={value}><input type="radio" name="requestType" value={value} checked={form.requestType === value} onChange={() => update('requestType', value)} data-testid={`radio-request-${value}`} /><span>{label.requestType[i]}</span></label>)}</div></div>
            <div className="form-grid" style={{ marginTop: 18 }}>
              {selectField('propertyType', label.property, [['apartment', text('Appartamento', 'Apartment')], ['house', text('Casa indipendente', 'House')], ['commercial', text('Immobile commerciale', 'Commercial property')], ['other', text('Altro', 'Other')]])}
              {selectField('service', label.service, [['renovation', text('Ristrutturazione / lavori', 'Renovation / building work')], ['maintenance', text('Manutenzione', 'Maintenance')], ['property_care', text('Cura della proprietà', 'Property care')], ['purchase', text('Acquisto / orientamento', 'Purchase / guidance')], ['other', text('Altro', 'Other')]])}
              {field('location', label.location, { required: true, placeholder: text('Comune o zona', 'Town or area'), maxLength: 160 })}
              {selectField('projectStage', label.stage, [['planning', text('Sto raccogliendo informazioni', 'I am gathering information')], ['defined', text('Ho un’idea abbastanza definita', 'I have a fairly clear idea')], ['ready', text('Vorrei valutare i prossimi passi', 'I am ready to discuss next steps')], ['ongoing', text('C’è un’esigenza in corso', 'There is an ongoing need')]])}
              <div className="field full"><label htmlFor="field-message">{label.message} *</label><textarea id="field-message" data-testid="input-message" value={form.message} onChange={e => update('message', e.target.value)} minLength={20} maxLength={4000} placeholder={text('Qual è la situazione? Che cosa vorresti fare? Ci sono dettagli utili sulla casa o sul contesto?', 'What is the situation? What would you like to do? Any useful details about the home or context?')} required /></div>
            </div>
            <div className="form-divider" />
            <h2 className="form-section-title">{label.group2}</h2>
            <div className="form-grid">
              {field('name', label.name, { required: true, maxLength: 120 })}
              {field('email', label.email, { required: form.preferredChannel === 'email', type: 'email', maxLength: 254 })}
              {field('phone', label.phone, { required: form.preferredChannel !== 'email', type: 'tel', maxLength: 50 })}
              {selectField('preferredChannel', label.channel, [['email', 'Email'], ['phone', text('Telefono', 'Phone')], ['whatsapp', 'WhatsApp']])}
              {selectField('preferredLanguage', label.lang, [
                ...LANGUAGE_CHOICES,
              ])}
            </div>
            <div className="form-divider" />
            <h2 className="form-section-title">{label.group3}</h2>
            <div className="form-grid">
              {field('budget', label.budget, { maxLength: 80, placeholder: text('Facoltativo', 'Optional') })}
              {field('desiredPeriod', label.period, { maxLength: 120, placeholder: text('Facoltativo', 'Optional') })}
              <div className="field full">
                <label className="check-row"><input type="checkbox" checked={form.needsAccommodation} onChange={e => update('needsAccommodation', e.target.checked)} data-testid="check-accommodation" /><span>{label.accom}</span></label>
                <label className="check-row" style={{ marginTop: 12 }}><input type="checkbox" checked={form.needsMobility} onChange={e => update('needsMobility', e.target.checked)} data-testid="check-mobility" /><span>{label.mobility}</span></label>
              </div>
              <div className="field full"><label className="check-row"><input type="checkbox" required checked={form.privacyAccepted} onChange={e => update('privacyAccepted', e.target.checked)} data-testid="check-privacy" /><span>{label.privacy} *</span></label></div>
            </div>
            {create.isError && <div className="error-box" role="alert" data-testid="status-error">{text('Non siamo riusciti a inviare la richiesta. I tuoi dati sono ancora qui: controlla la connessione e riprova.', 'We could not send your enquiry. Your details are still here: check your connection and try again.')}</div>}
            {!receipt && !review && <div className="form-footer"><span className="form-hint">{label.required}</span><button className="button" type="submit" data-testid="button-review">{label.submit}<ArrowRight size={15} /></button></div>}
            {review && !receipt && <div className="review-card" data-testid="review-card">
              <h3>{text('Controlla prima di inviare', 'Review before sending')}</h3>
              <div className="review-grid">
                {[[text('Richiesta', 'Request'), label.requestType[requestTypes.indexOf(form.requestType)]], [label.property, human('propertyType')], [label.service, human('service')], [label.location, form.location], [label.stage, human('projectStage')], [label.name, form.name], [label.email, form.email], [label.phone, form.phone || '—'], [label.channel, human('preferredChannel')], [label.lang, getLocale(form.preferredLanguage)?.nativeName ?? form.preferredLanguage], [label.budget, form.budget || '—'], [label.period, form.desiredPeriod || '—'], [label.accom, form.needsAccommodation ? text('Sì', 'Yes') : text('No', 'No')], [label.mobility, form.needsMobility ? text('Sì', 'Yes') : text('No', 'No')], [label.message, form.message]].map(([k, v]) => <div className="review-item" key={k}><small>{k}</small><strong>{v}</strong></div>)}
              </div>
              {create.isError && <div className="error-box" role="alert">{text('Invio non riuscito. Puoi modificare i dettagli o riprovare; nessun dato è stato cancellato.', 'Sending failed. Edit your details or try again; nothing has been cleared.')}</div>}
              <div className="form-footer"><button type="button" className="button outline" onClick={() => setReview(false)} data-testid="button-edit">{text('Modifica', 'Edit')}</button><button type="button" className="button" disabled={create.isPending} onClick={() => { if (formRef.current?.reportValidity()) formRef.current.requestSubmit(); }} data-testid="button-submit">{create.isPending ? label.sending : text('Invia richiesta', 'Send enquiry')}<ArrowRight size={15} /></button></div>
            </div>}
            {receipt && <div className="success-box" role="status" data-testid="status-success"><SectionLabel>{receipt.status === 'received' ? text('Richiesta ricevuta', 'Enquiry received') : text('Richiesta registrata', 'Enquiry recorded')}</SectionLabel><span className="success-code">{receipt.code}</span>{receipt.isSynthetic && <p>{text('Conserva questo codice di riferimento. È stato creato un lead sintetico; i dettagli inseriti non sono stati conservati. ', 'Keep this reference code. A synthetic lead was created; the details you entered were not retained.')}</p>}{receipt.notificationStatus === 'pending_provider' && <p>{text('La notifica email al fornitore è in attesa di configurazione. ', 'Email notification to the provider is awaiting configuration.')}</p>}<p>{text('Gli allegati privati restano disabilitati finché privacy, fornitore e collaudo non sono approvati.', 'Private attachments remain disabled until privacy, provider, and testing approvals are complete.')}</p></div>}
          </form>
          {!receipt && <div className="language-note">{text('I dettagli vengono inviati solo dopo aver accettato l’informativa privacy. Per allegati o documenti, contattaci direttamente: il modulo non gestisce caricamenti.', 'Your details are sent only after accepting the privacy notice. For documents or attachments, contact us directly: this form does not support uploads.')}</div>}
        </div>
      </div>
    </section>
  </>;
}

function ContactContents({ lang, page }: { lang: Lang; page: CorePage }) {
  if (page === 'home') return <HomePage lang={lang} />;
  if (page === 'services') return <ServicesPage lang={lang} />;
  if (page === 'process') return <ProcessPage lang={lang} />;
  if (page === 'abroad') return <AbroadPage lang={lang} />;
  if (page === 'request') return <RequestPage lang={lang} />;
  return <ContactPage lang={lang} />;
}

function LocalizationReviewIndex() {
  const pageLabels: Record<CorePage, string> = {
    home: 'Home',
    services: 'Servizi',
    process: 'Come lavoriamo',
    abroad: 'Proprietari all’estero',
    request: 'Richiesta',
    contact: 'Contatti',
  };
  const pendingLocales = LOCALES.filter(locale => locale.code !== 'it');
  return <div className="site-shell" lang="it-IT" dir="ltr">
    <header className="topbar"><div className="container nav-wrap"><Link href="/" className="wordmark"><strong>MARENETTO</strong><span>BUILD · CEFALÙ</span></Link><span className="translation-review-status">Anteprima editoriale non indicizzabile</span></div></header>
    <main className="section translation-review-index">
      <div className="container">
        <SectionLabel>Revisione editoriale</SectionLabel>
        <h1 className="display-title">29 lingue nel percorso editoriale</h1>
        <p className="section-intro">L’originale italiano e le 28 edizioni straniere restano nel perimetro. Le bozze qui collegate sono revisionabili, non approvate: non entrano negli equivalenti pubblicabili. Questa anteprima non richiede accesso; non inserirvi dati riservati.</p>
        <div className="translation-review-list">
          {pendingLocales.map(locale => <article className="translation-review-row" key={locale.code}>
            <div><h2>{locale.nativeName}</h2><p>{locale.code.toUpperCase()} · {locale.direction.toUpperCase()} · In attesa della tua approvazione</p></div>
            <nav aria-label={`Pagine in ${locale.nativeName}`}>{editions.filter(e => e.locale === locale.code && e.kind !== 'article').map(edition => <Link key={edition.id} href={reviewPathForEdition(edition)}>{pageLabels[edition.id as CorePage] ?? ({ articles: 'Articoli', guides: 'Guide', search: 'Ricerca' } as Record<string, string>)[edition.id]}</Link>)}</nav>
          </article>)}
        </div>
      </div>
    </main>
  </div>;
}
function SitePage({ page, lang }: { page: CorePage; lang: Lang }) {
  useEffect(() => {
    const metadata = getEdition(lang, page) ?? seoCopy[lang][page];
    const pagePath = routes[lang][page];
    const canonicalUrl = new URL(isTranslationReviewMode() ? `/__localization-review/${lang}/${page}` : pagePath, PUBLIC_SITE_ORIGIN).toString();
    const direction = getLocaleDirection(lang);
    const htmlLang = lang === 'it' ? 'it-IT' : lang;
    document.title = metadata.title;
    document.documentElement.lang = htmlLang;
    // Keep the outer viewport LTR; the site shell carries the page's RTL direction.
    document.documentElement.dir = 'ltr';

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    setMeta('meta[name="description"]', 'name', 'description', metadata.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', lang === 'it' ? 'it_IT' : lang === 'en' ? 'en_GB' : lang);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    const structuredEdition = getEdition(lang, page);
    if (structuredEdition) updateStructuredData(structuredEdition, PUBLIC_SITE_ORIGIN);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    if (canonical) canonical.href = canonicalUrl;

    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
    const currentEdition = getEdition(lang, page);
    const alternates: [string, string][] = (currentEdition?.state === 'published' && !isTranslationReviewMode() ? equivalentEditions(page) : []).map(edition => [
      edition.locale === 'it' ? 'it-IT' : edition.locale,
      edition.path,
    ]);
    if (currentEdition?.state === 'published' && !isTranslationReviewMode()) alternates.push(['x-default', seoCopy.it[page].path]);
    for (const [hrefLang, pathname] of alternates) {
      const alternate = document.createElement('link');
      alternate.rel = 'alternate';
      alternate.hreflang = hrefLang;
      alternate.href = new URL(pathname, PUBLIC_SITE_ORIGIN).toString();
      alternate.dataset.localeAlternate = 'true';
      document.head.appendChild(alternate);
    }
    setMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
  }, [lang, page]);
  const header = localizeNode(lang, <Header lang={lang} page={page} />);
  const contents = <ContactContents lang={lang} page={page} />;
  const main = page === 'request' ? contents : localizeNode(lang, contents);
  const footer = localizeNode(lang, <Footer lang={lang} />);
  return <div className="site-shell" lang={lang === 'it' ? 'it-IT' : lang} dir={getLocaleDirection(lang)}>
    {header}<main>{lang !== 'it' && <p className="container translation-review-status" lang="it" role="note">Traduzione da approvare: non ancora approvata come equivalente pubblico. <a href={`/__localization-review/${lang}/${page}`}>Apri la bozza da revisionare</a></p>}<WhatsAppAccess lang={lang} />{main}</main>{footer}
  </div>;
}

function LibraryShell({ page, children, lang = 'it', articleSlug }: { page: Page; children: ReactNode; lang?: Lang; articleSlug?: string }) {
  const contentLocale = isTranslationReviewMode() ? lang : 'it';
  const hasLocalArticles = useActiveEditorial().some(e => e.kind === 'article' && e.locale === lang);
  return <LibraryLocale.Provider value={hasLocalArticles ? lang : contentLocale}><div className="site-shell" lang={lang === 'it' ? 'it-IT' : lang} dir={getLocaleDirection(lang)}>
    <Header lang={lang} page={page} articleSlug={articleSlug} />
    <main><WhatsAppAccess lang={lang} />{lang !== 'it' && <p className="container translation-review-status" role="note" data-testid="translation-review-notice" lang="it" dir="ltr">{isTranslationReviewMode() ? 'Bozza tradotta · in attesa della revisione del titolare.' : hasLocalArticles ? 'Archivio misto: le edizioni attive hanno la lingua indicata; le altre mantengono il testo originale italiano.' : 'Testo originale italiano · nessuna traduzione approvata.'} <a href={articleSlug ? `/${articleSlug}` : libraryPath('it', page as 'articles' | 'guides' | 'search')}>Leggi l’edizione italiana</a></p>}<div lang={contentLocale} dir={getLocaleDirection(contentLocale)}>{children}</div></main>
    <Footer lang={lang} />
  </div></LibraryLocale.Provider>;
}
function LocalizedLibraryPage({ lang, page, articleSlug }: { lang: Lang; page: 'articles' | 'guides' | 'search'; articleSlug?: string }) {
  return <LocaleGate lang={lang}><LibraryShell lang={lang} page={page} articleSlug={articleSlug}>
    {articleSlug ? <ArticleDetailPage a={articleBySlug.get(articleSlug)!} /> : page === 'articles' ? <ArticlesPage /> : page === 'guides' ? <GuidesPage /> : <SearchPage />}
  </LibraryShell></LocaleGate>;
}
function LocalizedSitePage({ page, lang }: { page: CorePage; lang: Lang }) {
  return <LocaleGate lang={lang}><SitePage page={page} lang={lang} /></LocaleGate>;
}
function RecoveredPage({ page, lang }: { page: HistoricalPageRecord; lang: Lang }) {
  const h = buildHomeCopy(lang);
  const navigationPage = page.kind === 'article' || page.kind === 'archive' ? 'articles' : page.family === '/' ? 'home' : 'services';
  return <div className="site-shell" lang={lang === 'it' ? 'it-IT' : lang} dir={getLocaleDirection(lang)}>
    <Header lang={lang} page={navigationPage} editionId={editionByPath.get(page.path)?.id} articleSlug={page.kind === 'article' ? page.family.slice(1) : undefined} />
    <main><WhatsAppAccess lang={lang} /><HistoricalContents page={page} actions={<div className="mbh-actions">
      <PageLink lang={lang} page="request" className="mbh-btn mbh-btn--board" data-testid="hero-request">{h.primary}</PageLink>
      <PageLink lang={lang} page="process" className="mbh-hero__link" data-testid="hero-process">{h.secondary}</PageLink>
    </div>} /></main>
    <Footer lang={lang} />
  </div>;
}

function LocaleGate({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [readyLocale, setReadyLocale] = useState<string | null>(() => isLocaleCatalogLoaded(lang) && historicalLoaded(lang) ? lang : null);
  const [failedLocale, setFailedLocale] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([loadLocaleCatalog(lang), loadHistorical(lang)])
      .then(() => { if (active) setReadyLocale(lang); })
      .catch(() => { if (active) setFailedLocale(lang); });
    return () => { active = false; };
  }, [lang]);

  if ((!isLocaleCatalogLoaded(lang) || !historicalLoaded(lang)) && readyLocale !== lang) {
    if (failedLocale === lang) return <div className="locale-load-error" lang={lang} dir={getLocaleDirection(lang)} role="alert">{localeLoadErrors[lang]}</div>;
    return <div className="locale-loading" lang={lang} dir={getLocaleDirection(lang)} aria-busy="true">{getLocale(lang)?.nativeName}…</div>;
  }
  return children;
}
function Router() {
  const [path] = useLocation();
  const active = useActiveEditorial();
  const editorialStatus = useEditorialStatus();
  setTranslationReviewMode(path.startsWith('/__localization-review/'));
  useHashFragmentNavigation(path);
  const lang = getLang(path);
  const page = getPage(path);
  const privateShell = /^\/(?:internal|sign-in|sign-up)(?:\/|$)/.test(path) || /^\/owner-demo\/?$/.test(path);
  if (!privateShell && editorialStatus !== 'verified') return <div className="site-shell" lang="it" dir="ltr"><main className="container" style={{ paddingBlock: '5rem' }} data-testid="editorial-state" role={editorialStatus === 'loading' ? 'status' : 'alert'} aria-busy={editorialStatus === 'loading'}>
    <h1>{editorialStatus === 'loading' ? 'Verifica dei contenuti in corso' : 'Contenuti temporaneamente non disponibili'}</h1>
    <p>Prima di mostrare un testo dobbiamo verificare quali revisioni sono attive. Nessuna copia precedente viene ripubblicata.</p>
    {editorialStatus === 'unavailable' && <button className="int-primary" onClick={() => window.location.reload()}>Riprova</button>}
  </main></div>;
  const live = active.find(edition => [edition.path,...(edition.aliases ?? [])].some(candidate => editorialPathKey(candidate) === editorialPathKey(path)));
  if (live) return live.revisionId === 'withdrawn' ? <NotFound lang={live.locale} /> : <LocaleGate lang={live.locale}><ActiveEditorialPage edition={live} /></LocaleGate>;
  const libraryEdition = editions.find(edition => editorialPathKey(edition.path) === editorialPathKey(path) && ['articles','guides','search'].includes(edition.id));
  if (libraryEdition && active.some(e => e.kind === 'article' && e.locale === libraryEdition.locale)) return <LocaleGate lang={libraryEdition.locale}><LocalizedLibraryPage lang={libraryEdition.locale} page={libraryEdition.id as 'articles' | 'guides' | 'search'} /></LocaleGate>;
  const recovered = historicalPage(path) ?? historicalArticleForPreview(path) ?? historicalPending(path);
  if (recovered && !path.startsWith('/__localization-review/')) {
    const temporaryHold = recovered.state === 'awaiting-confirmation' && recovered.kind !== 'article' && !recovered.editorialCorrection;
    if (path !== recovered.path && !temporaryHold) return <Redirect to={routeRedirect(recovered.path)} replace />;
    return <LocaleGate lang={lang}><RecoveredPage page={recovered} lang={lang} /></LocaleGate>;
  }
  const reviewLibrary = path.match(/^\/__localization-review\/([a-z]{2})\/(articles|guides|search)(?:\/([^/]+))?$/);
  if (reviewLibrary && getLocale(reviewLibrary[1])) {
    const [, reviewLang, kind, slug] = reviewLibrary;
    if (slug && (kind !== 'articles' || !articleBySlug.has(slug))) return <NotFound lang={reviewLang} />;
    return <LocalizedLibraryPage lang={reviewLang} page={kind as 'articles' | 'guides' | 'search'} articleSlug={slug} />;
  }
  const trimmed = path.length > 1 && path.endsWith('/') && path !== '/en/' ? path.replace(/\/+$/, '') : path;
  if (trimmed === '/translation-ok') return <NotFound status={410} lang="it" />;
  // Native historical destinations take priority over the app's generic
  // /:locale/articles/:slug matcher, including editions still under review.
  if (redirects[trimmed]) return <Redirect to={routeRedirect(redirects[trimmed])} replace />;
  const localizedLibrary = trimmed.match(/^\/([a-z]{2})\/(articles|guides|search|projects)(?:\/([^/]+))?$/);
  if (localizedLibrary && getLocale(localizedLibrary[1])) {
    const [, libraryLang, kind, slug] = localizedLibrary;
    if (slug && kind === 'articles') {
      const native = articlePath(libraryLang, slug);
      if ((historicalPage(native) || historicalArticleForPreview(native)) && native.replace(/\/+$/, '') !== trimmed) return <Redirect to={routeRedirect(native)} replace />;
    }
    if (kind === 'projects') return <Redirect to={withCampaignParams(routes[libraryLang].services)} />;
    if (slug && (kind !== 'articles' || !articleBySlug.has(slug))) return <NotFound lang={libraryLang} />;
    return <RoutedErrorBoundary><LocalizedLibraryPage lang={libraryLang} page={kind as 'articles' | 'guides' | 'search'} articleSlug={slug} /></RoutedErrorBoundary>;
  }
  if (trimmed !== path && (articleBySlug.has(trimmed.slice(1)) || ['/articoli', '/contatti', '/guide', '/progetti', '/ricerca'].includes(trimmed))) return <Redirect to={routeRedirect(trimmed)} replace />;
  const article = articleBySlug.get(trimmed.slice(1));
  if (article) return <RoutedErrorBoundary><LibraryShell page="articles"><ArticleDetailPage a={article} /></LibraryShell></RoutedErrorBoundary>;
  if (path === '/__localization-review') return <LocalizationReviewIndex />;
  const reviewMatch = path.match(/^\/__localization-review\/([a-z]{2})\/(home|services|process|abroad|request|contact)\/?$/);
  if (reviewMatch) {
    const locale = getLocale(reviewMatch[1]);
    if (!locale) return <NotFound />;
    return <RoutedErrorBoundary><LocalizedSitePage page={reviewMatch[2] as CorePage} lang={locale.code} /></RoutedErrorBoundary>;
  }

  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const locale = LOCALES.find(record => normalizedPath === `/${record.code}` || normalizedPath.startsWith(`/${record.code}/`))?.code
    ?? (normalizedPath === '/' ? 'it' : undefined);
  if (locale && getLocale(locale)?.publication === 'published') {
    const localizedPage = PAGE_KEYS.find(key => {
      const route = routes[locale][key];
      return (route.length > 1 ? route.replace(/\/+$/, '') : route) === normalizedPath;
    });
    if (localizedPage === 'home' && locale === 'it' && normalizedPath === '/') return <RoutedErrorBoundary><HomeEntry /></RoutedErrorBoundary>;
    if (localizedPage) return <RoutedErrorBoundary><LocalizedSitePage page={localizedPage} lang={locale} /></RoutedErrorBoundary>;
  }

  return <RoutedErrorBoundary><Switch>
    <Route path="/internal"><InternalEntry /></Route>
    <Route path="/owner-demo"><OwnerDemo /></Route>
    <Route path="/content/:locale/:slug">{params => <PublishedCmsPage params={params} />}</Route>
    <Route path="/articoli"><LibraryShell page="articles"><ArticlesPage /></LibraryShell></Route>
    <Route path="/guide"><LibraryShell page="guides"><GuidesPage /></LibraryShell></Route>
    {/* Keep the editorial ProjectsPage component, but do not expose an empty
        portfolio through direct or historical links until real work is ready. */}
    <Route path="/progetti"><Redirect to={withCampaignParams(`/servizi${typeof window === 'undefined' ? '' : window.location.hash}`)} replace /></Route>
    <Route path="/ricerca"><LibraryShell page="search"><SearchPage /></LibraryShell></Route>
    <Route path="/"><HomeEntry /></Route>
    <Route path="/servizi"><SitePage page="services" lang="it" /></Route>
    <Route path="/come-lavoriamo"><SitePage page="process" lang="it" /></Route>
    <Route path="/proprietari-all-estero"><SitePage page="abroad" lang="it" /></Route>
    <Route path="/richiesta"><SitePage page="request" lang="it" /></Route>
    <Route path="/contatti"><SitePage page="contact" lang="it" /></Route>
    <Route path="/en/"><SitePage page="home" lang="en" /></Route>
    <Route path="/en/services"><SitePage page="services" lang="en" /></Route>
    <Route path="/en/how-we-work"><SitePage page="process" lang="en" /></Route>
    <Route path="/en/owners-abroad"><SitePage page="abroad" lang="en" /></Route>
    <Route path="/en/request"><SitePage page="request" lang="en" /></Route>
    <Route path="/en/contact"><SitePage page="contact" lang="en" /></Route>
    <Route><NotFound /></Route>
  </Switch><span style={{ display: 'none' }} aria-hidden="true">{lang}{page}</span></RoutedErrorBoundary>;
}

// Suggest, never force, a language on the root home, including recovered editions.
function BrowserLanguageSuggestion() {
  const [path] = useLocation();
  const editorialStatus = useEditorialStatus();
  const [suggested, setSuggested] = useState<string | null>(null);
  useEffect(() => {
    setSuggested(null);
    if (path !== '/' || editorialStatus !== 'verified' || isAutomaticVisitor(navigator.userAgent)) return;
    const available = LOCALES.filter(locale => getEdition(locale.code, 'home')).map(locale => locale.code);
    const code = chooseLanguage(navigator.languages?.length ? navigator.languages : [navigator.language], readSavedLanguage(), available);
    if (code !== 'it') setSuggested(code);
  }, [path, editorialStatus]);
  if (path !== '/' || editorialStatus !== 'verified') return null;
  return suggested && <aside className="language-suggestion" aria-label="Lingua" data-testid="language-suggestion">
    <a href={withCampaignParams(`${routes[suggested].home}${window.location.hash}`)} lang={suggested} onClick={() => saveLanguageChoice(suggested)}>{getLocale(suggested)?.nativeName}</a>
    <button type="button" onClick={() => { saveLanguageChoice('it'); setSuggested(null); }}>Continua in italiano</button>
  </aside>;
}

function HomeEntry() {
  return <LocalizedSitePage page="home" lang="it" />;
}

function useHashFragmentNavigation(path: string) {
  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;

    const scheduleFragmentScroll = () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);

      const fragment = window.location.hash.slice(1);
      if (!fragment) return;

      let targetId: string;
      try {
        targetId = decodeURIComponent(fragment);
      } catch {
        return;
      }

      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
        });
      });
    };

    const navigationEvents = ['pushState', 'replaceState', 'popstate', 'hashchange'] as const;
    navigationEvents.forEach(event => window.addEventListener(event, scheduleFragmentScroll));
    scheduleFragmentScroll();

    return () => {
      navigationEvents.forEach(event => window.removeEventListener(event, scheduleFragmentScroll));
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [path]);
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ActiveEditorialPage({ edition }: { edition: EditorialActive }) {
  const { content, locale } = edition;
  usePageMeta({ title: content.seoTitle || content.title, description: content.seoDescription || content.summary, path: edition.path, type: edition.kind === 'article' ? 'article' : 'website' });
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    document.querySelectorAll('link[rel="alternate"][hreflang], script[type="application/ld+json"]').forEach(node => node.remove());
    const title = content.seoTitle || content.title;
    const description = content.seoDescription || content.summary;
    const canonical = new URL(edition.path, PUBLIC_SITE_ORIGIN).href;
    document.title = title;
    const values: [string, string][] = [['name:description',description],['name:twitter:title',title],['name:twitter:description',description],['property:og:title',title],['property:og:description',description],['property:og:url',canonical],['property:og:locale',locale]];
    for (const [selector,value] of values) {
      const [attribute] = selector.split(':',2);
      // Preserve og:/twitter: prefixes (split only the attribute separator).
      const metaKey = selector.slice(attribute.length + 1);
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${metaKey}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute,metaKey); document.head.appendChild(element); }
      element.content = value;
    }
    document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical);
  }, [edition]);
  const core = edition.identity as CorePage;
  return <div className="site-shell" lang={locale} dir={getLocaleDirection(locale)}>
    <Header lang={locale} page={pageForEditorial(edition)} />
    <main><section className="section"><div className="container">
      <h1 className="display-title">{content.title}</h1>
      {content.summary && <p className="section-intro">{content.summary}</p>}
      {content.image && <img className="historical-cover" src={content.image} alt={content.imageAlt} />}
      <article className="historical-content article-body" data-active-revision={edition.revisionId} lang={content.contentLanguage} dangerouslySetInnerHTML={{ __html: content.body.replace(/(<\/?)h1(\b[^>]*>)/gi, '$1h2$2') }} />
      {edition.identity === 'articles' && <LibraryLocale.Provider value={locale}><ActiveArticleListing /></LibraryLocale.Provider>}
      {content.sources.length > 0 && <aside><h2>Fonti</h2><ul>{content.sources.map(source => <li key={source.url}><a href={source.url} rel="noreferrer">{source.title}</a></li>)}</ul></aside>}
    </div></section>{core === 'request' && <RequestPage lang={locale} editorial />}</main>
    <Footer lang={locale} />
  </div>;
}
function pageForEditorial(edition: EditorialActive): Page { return edition.kind === 'article' ? 'articles' : PAGE_KEYS.includes(edition.identity as CorePage) ? edition.identity as CorePage : 'home'; }

function App({ ssrPath, editorialActive }: { ssrPath?: string; editorialActive?: EditorialActive[] }) {
  const [, setHydrated] = useState(false);
  useEffect(() => { document.documentElement.dataset.hydrated = 'true'; setHydrated(true); }, []);
  const pathname = ssrPath ?? window.location.pathname;
  const needsAuth = /^\/(internal|sign-in|sign-up)(\/|$)/.test(pathname.slice(basePath.length));
  return <QueryClientProvider client={queryClient}><TooltipProvider><EditorialRuntime initial={editorialActive}><WouterRouter base={basePath} ssrPath={ssrPath}><BrowserLanguageSuggestion />{needsAuth && clerkPubKey ? <ClerkProviderWithRoutes /> : <Router />}<AnalyticsPreferences publicEditions={analyticsPublicEditions} /><Toaster /></WouterRouter></EditorialRuntime></TooltipProvider></QueryClientProvider>;
}

function SignInPage() {
  useEffect(() => {
    document.title = 'Team sign in | Marenetto Build';
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow, noarchive');
  }, []);
  return <div className="access-screen"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}
export default App;

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  if (!clerkPubKey) return <Router />;
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <ClerkQueryClientCacheInvalidator />
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route><Router /></Route>
    </Switch>
  </ClerkProvider>;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function SignUpPage() {
  useEffect(() => {
    document.title = 'Create team account | Marenetto Build';
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow, noarchive');
  }, []);
  return <div className="access-screen"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${basePath}/favicon.svg`,
  },
  variables: {
    colorPrimary: '#9a634c',
    colorForeground: '#25302a',
    colorMutedForeground: '#69716a',
    colorDanger: '#b53c35',
    colorBackground: '#f8f6f0',
    colorInput: '#fffdfa',
    colorInputForeground: '#25302a',
    colorNeutral: '#d9d5ca',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '0.35rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#f8f6f0] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#25302a] font-semibold',
    headerSubtitle: 'text-[#69716a]',
    socialButtonsBlockButtonText: 'text-[#25302a]',
    formFieldLabel: 'text-[#25302a]',
    footerActionLink: 'text-[#9a634c]',
    footerActionText: 'text-[#69716a]',
    dividerText: 'text-[#69716a]',
    logoBox: 'mx-auto',
    socialButtonsBlockButton: 'border-[#d9d5ca] bg-[#fffdfa]',
    formButtonPrimary: 'bg-[#25302a] text-white hover:bg-[#9a634c]',
    formFieldInput: 'bg-[#fffdfa] text-[#25302a] border-[#d9d5ca]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#d9d5ca]',
    alert: 'border-[#b53c35]',
    otpCodeFieldInput: 'bg-[#fffdfa] text-[#25302a]',
    formFieldRow: 'text-[#25302a]',
    main: 'text-[#25302a]',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);
  return null;
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
