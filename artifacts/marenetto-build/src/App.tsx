import { type AnchorHTMLAttributes, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDownRight, ArrowRight, ChevronDown, Compass, Globe2, Hammer, House, Mail, MapPin, Menu, MessageCircle, Wrench, X } from 'lucide-react';
import { useCreateProjectRequest, type ProjectRequestInput } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter, Link, Redirect } from 'wouter';
import { Search } from 'lucide-react';
import { articleBySlug, legacyRedirects } from '@/content/articles';
import { usePageMeta } from '@/lib/meta';
import { ArticleDetailPage, ArticlesPage, GuidesPage, ProjectsPage, SearchPage } from '@/pages/library';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { InternalEntry, OwnerDemo, PublishedCmsPage } from '@/pages/internal-surfaces';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
type Lang = 'it' | 'en';
type Page = 'home' | 'services' | 'process' | 'abroad' | 'request' | 'contact' | 'articles' | 'guides' | 'projects' | 'search';

type CorePage = 'home' | 'services' | 'process' | 'abroad' | 'request' | 'contact';
const routes: Record<Lang, Record<Page, string>> = {
  it: { home: '/', services: '/servizi', process: '/come-lavoriamo', abroad: '/proprietari-all-estero', request: '/richiesta', contact: '/contatti', articles: '/articoli', guides: '/guide', projects: '/progetti', search: '/ricerca' },
  en: { home: '/en/', services: '/en/services', process: '/en/how-we-work', abroad: '/en/owners-abroad', request: '/en/request', contact: '/en/contact', articles: '/articoli', guides: '/guide', projects: '/progetti', search: '/ricerca' },
};

const copy = {
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

function getLang(path: string): Lang { return path === '/en' || path.startsWith('/en/') ? 'en' : 'it'; }
function getPage(path: string): Page {
  if (path === '/servizi' || path === '/en/services') return 'services';
  if (path === '/come-lavoriamo' || path === '/en/how-we-work') return 'process';
  if (path === '/proprietari-all-estero' || path === '/en/owners-abroad') return 'abroad';
  if (path === '/richiesta' || path === '/en/request') return 'request';
  if (path === '/contatti' || path === '/en/contact') return 'contact';
  if (path === '/articoli') return 'articles';
  if (path === '/guide') return 'guides';
  if (path === '/progetti') return 'projects';
  if (path === '/ricerca') return 'search';
  return 'home';
}
function switchLanguagePath(path: string, target: Lang) {
  const page = getPage(path);
  return routes[target][page];
}
function PageLink({ page, lang, children, className, ...props }: { page: Page; lang: Lang; children: ReactNode; className?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'>) {
  return <Link href={routes[lang][page]} className={className} {...props}>{children}</Link>;
}

function Header({ lang, page }: { lang: Lang; page: Page }) {
  const [path] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const c = copy[lang].nav;
  const items: [Page, string][] = [['services', c.services], ['process', c.process], ['abroad', c.abroad], ['articles', c.articles], ['projects', c.projects], ['contact', c.contact]];
  return <header className="topbar">
    <div className="container nav-wrap">
      <Link href={routes[lang].home} className="wordmark" aria-label="Marenetto Build home" data-testid="link-logo">
        <strong>MARENETTO</strong><span>BUILD · CEFALÙ</span>
      </Link>
      <nav className="nav-links" aria-label={lang === 'it' ? 'Navigazione principale' : 'Main navigation'}>
        {items.map(([key, label]) => <PageLink key={key} page={key} lang={lang} aria-current={page === key ? 'page' : undefined} data-testid={`nav-${key}`}>{label}</PageLink>)}
      </nav>
      <div className="nav-actions">
        <Link href="/ricerca" className="nav-search" aria-label={lang === 'it' ? 'Cerca negli articoli' : 'Search articles'} aria-current={page === 'search' ? 'page' : undefined} data-testid="nav-search"><Search size={16} /></Link>
        <Link href={switchLanguagePath(path, lang === 'it' ? 'en' : 'it')} className="lang-switch" aria-label={lang === 'it' ? 'Switch to English' : 'Passa all’italiano'} data-testid="link-language">{lang === 'it' ? 'EN' : 'IT'} <ChevronDown size={12} /></Link>
        <PageLink page="request" lang={lang} className="button" data-testid="nav-request">{c.request}<ArrowRight size={14} /></PageLink>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} data-testid="button-menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
    </div>
    {menuOpen && <nav className="mobile-nav" aria-label={lang === 'it' ? 'Menu' : 'Menu'}>
      {items.map(([key, label]) => <PageLink key={key} page={key} lang={lang} onClick={() => setMenuOpen(false)} data-testid={`mobile-nav-${key}`}>{label}</PageLink>)}
      <PageLink page="guides" lang={lang} onClick={() => setMenuOpen(false)} data-testid="mobile-nav-guides">{lang === 'it' ? 'Guide pratiche' : 'Practical guides (IT)'}</PageLink>
      <PageLink page="search" lang={lang} onClick={() => setMenuOpen(false)} data-testid="mobile-nav-search">{lang === 'it' ? 'Ricerca' : 'Search (IT)'}</PageLink>
      <PageLink page="request" lang={lang} className="button" onClick={() => setMenuOpen(false)}>{c.request}<ArrowRight size={14} /></PageLink>
    </nav>}
  </header>;
}

function Footer({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  const message = encodeURIComponent(it ? 'Buongiorno, vorrei parlare della mia proprietà a Cefalù.' : 'Hello, I would like to discuss my property in Cefalù.');
  return <footer className="footer">
    <div className="container">
      <div className="footer-top">
        <div className="footer-brand">
          <Link href={routes[lang].home} className="wordmark"><strong>MARENETTO</strong><span>BUILD · CEFALÙ</span></Link>
          <p><strong>{it ? 'Costruiamo valore.' : 'We build lasting value.'}</strong><br />{it ? 'Un riferimento locale per la tua casa a Cefalù e dintorni. Lavori, manutenzione e cura della proprietà, con un dialogo chiaro.' : 'A local point of contact for your home in Cefalù and nearby. Building, maintenance and property care, with clear communication.'}</p>
        </div>
        <div><h3>{it ? 'Esplora' : 'Explore'}</h3><div className="footer-links">
          <PageLink lang={lang} page="services">{it ? 'Servizi' : 'Services'}</PageLink>
          <PageLink lang={lang} page="process">{it ? 'Come lavoriamo' : 'How we work'}</PageLink>
          <PageLink lang={lang} page="abroad">{it ? 'Proprietari all’estero' : 'Owners abroad'}</PageLink>
          <PageLink lang={lang} page="request">{it ? 'Invia una richiesta' : 'Send an enquiry'}</PageLink>
        </div></div>
        <div><h3>{it ? 'Approfondire' : 'Read (in Italian)'}</h3><div className="footer-links">
          <PageLink lang={lang} page="articles" data-testid="link-footer-articles">{it ? 'Articoli' : 'Articles'}</PageLink>
          <PageLink lang={lang} page="guides" data-testid="link-footer-guides">{it ? 'Guide pratiche' : 'Practical guides'}</PageLink>
          <PageLink lang={lang} page="projects" data-testid="link-footer-projects">{it ? 'Progetti' : 'Projects'}</PageLink>
          <PageLink lang={lang} page="search" data-testid="link-footer-search">{it ? 'Ricerca' : 'Search'}</PageLink>
        </div></div>
        <div><h3>{it ? 'Un primo contatto' : 'Get in touch'}</h3><div className="footer-links">
          <PageLink lang={lang} page="contact">{it ? 'Contatti' : 'Contact'}</PageLink>
          <a href={`mailto:info@marenettobuild.com?subject=${encodeURIComponent(it ? 'Richiesta informazioni — Marenetto Build' : 'Enquiry — Marenetto Build')}`} data-testid="link-footer-email">info@marenettobuild.com</a>
          <a href={`https://wa.me/393339363007?text=${message}`} target="_blank" rel="noopener noreferrer" data-testid="link-footer-whatsapp">WhatsApp · +39 333 936 3007</a>
          <a href="tel:+393339363007" data-testid="link-footer-phone">+39 333 936 3007</a>
          <span>SS 113 Settentrionale Sicula, 73b<br />90015 Cefalù, Palermo, Italia</span>
        </div></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Marenetto s.r.l. unipersonale · P. IVA IT06471740826</span><span>{it ? 'Cefalù · Sicilia' : 'Cefalù · Sicily'}</span><Link href={routes[it ? 'en' : 'it'].home}>{it ? 'English' : 'Italiano'} <ArrowRight size={12} /></Link></div>
    </div>
  </footer>;
}

function SectionLabel({ children }: { children: ReactNode }) { return <span className="eyebrow">{children}</span>; }
function CtaPanel({ lang, title, text }: { lang: Lang; title: string; text: string }) {
  return <div className="cta-panel">
    <div><h2 className="display-title">{title}</h2><p>{text}</p></div>
    <PageLink lang={lang} page="request" className="button" data-testid="cta-request">{lang === 'it' ? 'Raccontaci il tuo progetto' : 'Tell us about your project'}<ArrowRight size={15} /></PageLink>
  </div>;
}
function PageHero({ lang, page }: { lang: Lang; page: Exclude<CorePage, 'home'> }) {
  const d = copy[lang].page[page];
  return <section className="page-hero">
    <div className="container">
      <div className="page-hero-grid">
        <div className="animate-enter"><SectionLabel>{d[0]}</SectionLabel><h1 className="display-title">{d[1]}</h1></div>
        <p className="animate-enter delay-1">{d[2]}</p>
      </div>
      <div className="page-meta"><span>{lang === 'it' ? 'Un riferimento locale a Cefalù' : 'A local point of contact in Cefalù'}</span><span>{lang === 'it' ? 'Sicilia · Italia' : 'Sicily · Italy'}</span></div>
    </div>
  </section>;
}

function HomePage({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  const h = copy[lang].home;
  return <>
    <section className="hero">
      <div className="hero-main">
        <div className="hero-copy">
          <div className="animate-enter"><SectionLabel>{h.eyebrow}</SectionLabel></div>
          <h1 className="display-title animate-enter delay-1">{h.title}</h1>
          <p className="animate-enter delay-2">{h.intro}</p>
          <div className="hero-actions animate-enter delay-3">
            <PageLink lang={lang} page="request" className="button" data-testid="hero-request">{h.primary}<ArrowRight size={15} /></PageLink>
            <PageLink lang={lang} page="process" className="button outline" data-testid="hero-services">{h.secondary}</PageLink>
          </div>
          <div className="hero-note"><MapPin size={15} />{h.note}</div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <img src="/brand/original-hero.png" alt="" fetchPriority="high" />
        </div>
      </div>
      <div className="hero-bottom"><div className="container hero-bottom-inner"><span><Compass size={15} />{h.proof1}</span><span><Globe2 size={15} />{h.proof2}</span><span>{it ? 'Un primo confronto, senza impegno' : 'An initial conversation, no obligation'}<ArrowDownRight size={14} /></span></div></div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-head"><div><SectionLabel>{it ? 'Cosa facciamo' : 'What we do'}</SectionLabel><h2 className="section-heading display-title">{it ? <>La cura della casa,<br /><em>vista da vicino.</em></> : <>Looking after your home,<br /><em>from close by.</em></>}</h2><p className="section-intro">{it ? 'Dalla manutenzione di ogni giorno a un intervento più ampio: un punto di partenza chiaro, senza complicare ciò che può essere semplice.' : 'From everyday maintenance to a larger piece of work: a clear place to start, without making the simple complicated.'}</p></div><PageLink lang={lang} page="services" className="text-link">{it ? 'Tutti i servizi' : 'All services'}<ArrowRight size={15} /></PageLink></div>
        <div className="service-grid">
          {[
            { n: '01', icon: <Hammer size={19} />, title: it ? 'Realizzare o rinnovare' : 'Build or renovate', desc: it ? 'Costruzioni, ristrutturazioni e coordinamento degli interventi, con perimetro e ruoli da concordare.' : 'Construction, renovation and coordinated work, with scope and roles agreed in advance.' },
            { n: '02', icon: <Wrench size={19} />, title: it ? 'Risolvere e mantenere' : 'Resolve and maintain', desc: it ? 'Manutenzione e piccoli interventi, valutati in base alla proprietà e alle verifiche necessarie.' : 'Maintenance and smaller repairs, considered in light of the property and checks required.' },
            { n: '03', icon: <House size={19} />, title: it ? 'Valutare prima di acquistare' : 'Review before you buy', desc: it ? 'Un confronto preliminare sulle esigenze e sugli aspetti da sottoporre a verifica professionale.' : 'An initial discussion about your needs and the matters to review with qualified professionals.' },
          ].map((service) => <article className="service-card" key={service.n}><span className="number">{service.n} / <span aria-hidden="true">{service.icon}</span></span><h3>{service.title}</h3><p>{service.desc}</p><PageLink lang={lang} page="services" className="text-link">{it ? 'Scopri di più' : 'Explore'}<ArrowRight size={14} /></PageLink></article>)}
        </div>
      </div>
    </section>

    <section className="section split-band">
      <div className="container split-layout">
        <div><SectionLabel>{it ? 'Un riferimento, sul posto' : 'A local point of contact'}</SectionLabel><h2 className="display-title">{it ? <>Non devi seguire<br />tutto <em>da solo.</em></> : <>You do not have<br />to manage it <em>alone.</em></>}</h2><p>{it ? 'Avere una casa lontano da casa richiede fiducia e informazioni chiare. Partiamo dal tuo bisogno, non da una soluzione preconfezionata.' : 'Having a home away from home takes trust and clear information. We start with your need, not a pre-packaged answer.'}</p><PageLink lang={lang} page="abroad" className="text-link" style={{ color: '#d79c7d', marginTop: '14px' }}>{it ? 'Per chi vive all’estero' : 'For owners abroad'}<ArrowRight size={15} /></PageLink></div>
        <div className="principles">
          {[it ? ['Parole chiare', 'Un dialogo diretto, in italiano o inglese.'] : ['Clear communication', 'A direct conversation in Italian or English.'], it ? ['Passi concordati', 'Prima capiamo ciò che serve, poi definiamo come procedere.'] : ['Agreed steps', 'First we understand what is needed, then we decide how to proceed.'], it ? ['Un referente locale', 'Vicino alla proprietà e raggiungibile con facilità.'] : ['A local contact', 'Close to the property and easy to reach.']].map((p, i) => <div className="principle" key={i}><span>0{i + 1}</span><div><h3>{p[0]}</h3><p>{p[1]}</p></div></div>)}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-head"><div><SectionLabel>{it ? 'Il percorso' : 'The process'}</SectionLabel><h2 className="section-heading display-title">{it ? 'Pochi passaggi, fatti bene.' : 'A few steps, done well.'}</h2><p className="section-intro">{it ? 'Una richiesta non deve diventare un labirinto. Ecco come iniziamo a lavorare insieme.' : 'An enquiry should not become a maze. Here is how we begin working together.'}</p></div><PageLink lang={lang} page="process" className="text-link">{it ? 'Il nostro metodo' : 'Our approach'}<ArrowRight size={15} /></PageLink></div>
        <div className="process-strip">
          {(it ? [['01', 'Ci racconti', 'Conosciamo la proprietà e la tua necessità.'], ['02', 'Mettiamo a fuoco', 'Chiariamo priorità e informazioni utili.'], ['03', 'Concordiamo', 'Definiamo insieme i prossimi passi.'], ['04', 'Restiamo in contatto', 'Condividiamo gli aggiornamenti concordati.']] : [['01', 'You tell us', 'We learn about the property and your needs.'], ['02', 'We get specific', 'We clarify priorities and useful details.'], ['03', 'We agree', 'We define the next steps together.'], ['04', 'We stay in touch', 'We share the updates we agreed.']]).map(([n, title, desc]) => <div className="process-step" key={n}><span className="step-number">{n}</span><h3>{title}</h3><p>{desc}</p></div>)}
        </div>
      </div>
    </section>

    <section className="section tight">
      <div className="container">
        <div className="portfolio-note"><div><h3>{it ? 'Lavori e risultati, raccontati con materiali verificati.' : 'Work and outcomes, shown with verified material.'}</h3><p>{it ? 'Stiamo preparando una selezione di progetti documentati. Preferiamo aspettare i materiali corretti, invece di mostrare esempi non verificati.' : 'We are preparing a selection of documented projects. We would rather wait for the right material than show unverified examples.'}</p></div><span className="portfolio-mark" aria-hidden="true">—</span></div>
      </div>
    </section>
    <section className="section tight"><div className="container"><CtaPanel lang={lang} title={it ? 'Ogni casa ha una storia. La tua qual è?' : 'Every home has a story. What is yours?'} text={it ? 'Descrivici quello che vuoi fare, con calma. Il primo confronto serve proprio a capire da dove partire.' : 'Tell us what you have in mind. The first conversation is simply a way to understand where to begin.'} /></div></section>
  </>;
}

function ServicesPage({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  const data = copy[lang].services;
  return <>
    <PageHero lang={lang} page="services" />
    <section className="section">
      <div className="container">
        <div className="section-head"><div><SectionLabel>{data.over}</SectionLabel><h2 className="section-heading display-title">{data.heading}</h2><p className="section-intro">{data.intro}</p></div></div>
        <div className="service-groups">{data.groups.map((group, i) => <article className="service-group" key={group.title}><span className="number">0{i + 1} / {it ? 'AMBITO' : 'AREA'}</span><h2>{group.title}</h2><p>{group.desc}</p><ul className="service-list">{group.items.map(item => <li key={item}><span>{item}</span><span aria-hidden="true">+</span></li>)}</ul></article>)}</div>
      </div>
    </section>
    <section className="section tight"><div className="container"><div className="portfolio-note"><div><h3>{it ? 'Un portfolio verificato, in preparazione.' : 'A verified portfolio is in preparation.'}</h3><p>{it ? 'Le immagini dei lavori saranno pubblicate quando saranno disponibili materiali approvati e riferibili a interventi reali.' : 'Work images will be published when approved material tied to real projects is available.'}</p></div><span className="portfolio-mark">—</span></div></div></section>
    <section className="section tight"><div className="container"><CtaPanel lang={lang} title={it ? 'Hai in mente un intervento?' : 'Have a project in mind?'} text={it ? 'Raccontaci la tua idea: capiremo insieme se e come possiamo aiutarti.' : 'Tell us what you have in mind and we can see together whether and how we can help.'} /></div></section>
  </>;
}

function ProcessPage({ lang }: { lang: Lang }) {
  const data = copy[lang].process;
  const it = lang === 'it';
  return <>
    <PageHero lang={lang} page="process" />
    <section className="section">
      <div className="container editorial-grid">
        <aside className="editorial-aside"><SectionLabel>{it ? 'Un metodo pratico' : 'A practical approach'}</SectionLabel><h2 className="section-heading display-title">{data.heading}</h2><p className="section-intro">{data.intro}</p></aside>
        <div className="detail-list">{data.steps.map(([n, title, desc]) => <article className="detail-row" key={n}><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div></article>)}</div>
      </div>
    </section>
    <section className="section split-band"><div className="container split-layout"><div><SectionLabel>{it ? 'La chiarezza prima di tutto' : 'Clarity comes first'}</SectionLabel><h2 className="display-title">{it ? <>Ogni passaggio<br /><em>condiviso.</em></> : <>Every step,<br /><em>shared.</em></>}</h2><p>{it ? 'Non diamo per scontato il contesto. Ti diciamo cosa sappiamo, cosa va ancora verificato e quali aspetti è utile concordare prima di procedere.' : 'We do not assume the context. We tell you what we know, what still needs checking and what is useful to agree before moving ahead.'}</p></div><div className="principles">{(it ? [['Ambito', 'Cosa è incluso e cosa richiede un approfondimento.'], ['Comunicazione', 'Chi è il referente e come condividiamo gli aggiornamenti.'], ['Decisioni', 'I passaggi vengono concordati prima di procedere.']] : [['Scope', 'What is included and what needs further review.'], ['Communication', 'Who your contact is and how updates are shared.'], ['Decisions', 'Steps are agreed before we proceed.']]).map(([h, p], i) => <div className="principle" key={h}><span>0{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></div>)}</div></div></section>
    <section className="section tight"><div className="container"><CtaPanel lang={lang} title={it ? 'Hai una domanda o un progetto?' : 'A question or a project?'} text={it ? 'Condividi i dettagli che hai: non serve avere già tutto deciso.' : 'Share the details you have. You do not need to have everything figured out.'} /></div></section>
  </>;
}

function AbroadPage({ lang }: { lang: Lang }) {
  const data = copy[lang].abroad;
  const it = lang === 'it';
  return <>
    <PageHero lang={lang} page="abroad" />
    <section className="section">
      <div className="container editorial-grid">
        <aside className="editorial-aside"><SectionLabel>{it ? 'La tua casa, anche da lontano' : 'Your home, from a distance'}</SectionLabel><h2 className="section-heading display-title">{data.heading}</h2><p className="section-intro">{data.intro}</p></aside>
        <div className="detail-list">{data.blocks.map(([title, desc], i) => <article className="detail-row" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{desc}</p></div></article>)}</div>
      </div>
    </section>
    <section className="section split-band"><div className="container split-layout"><div><SectionLabel>{it ? 'Una lingua in comune' : 'A shared language'}</SectionLabel><h2 className="display-title">{it ? <>Un dialogo<br /><em>senza distanza.</em></> : <>A conversation<br /><em>without distance.</em></>}</h2><p>{it ? 'Puoi scriverci in italiano o inglese. Ti chiediamo di scegliere come preferisci essere ricontattato e di condividere solo le informazioni che ci aiutano a capire la situazione.' : 'You can write to us in Italian or English. Choose how you would like us to get back to you and share only the information that helps us understand the situation.'}</p></div><div className="principles">{(it ? [['WhatsApp', 'Un messaggio per iniziare, anche da un altro fuso orario.'], ['Email', 'Comodo per condividere con calma il contesto.'], ['Richiesta', 'Un modulo strutturato quando hai già i dettagli.']] : [['WhatsApp', 'A message to begin, even from another time zone.'], ['Email', 'Useful for sharing the context in your own time.'], ['Enquiry', 'A structured form when you have the details.']]).map(([h, p], i) => <div className="principle" key={h}><span>0{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></div>)}</div></div></section>
    <section className="section tight"><div className="container"><CtaPanel lang={lang} title={it ? 'Comincia da ciò che sai.' : 'Start with what you know.'} text={it ? 'Puoi inviare una richiesta anche se alcuni dettagli sono ancora da definire.' : 'You can send an enquiry even if some details are still to be worked out.'} /></div></section>
  </>;
}

function ContactPage({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  return <>
    <PageHero lang={lang} page="contact" />
    <section className="section">
      <div className="container contact-layout">
        <aside className="contact-info"><SectionLabel>{it ? 'Scegli il tuo modo' : 'Choose your way'}</SectionLabel><h2 className="display-title">{it ? 'Ci trovi qui.' : 'We are here.'}</h2><p>{it ? 'Contattaci nel modo che ti è più comodo. Puoi iniziare con una domanda semplice.' : 'Get in touch in whichever way is easiest. You can start with a simple question.'}</p>
          <div className="contact-method"><MessageCircle size={17} /><div><small>WhatsApp</small><a href={`https://wa.me/393339363007?text=${encodeURIComponent(it ? 'Buongiorno, vorrei parlare della mia proprietà a Cefalù.' : 'Hello, I would like to discuss my property in Cefalù.')}`} target="_blank" rel="noopener noreferrer" data-testid="link-whatsapp">+39 333 936 3007 · {it ? 'Apri una conversazione' : 'Start a conversation'}<ArrowRight size={13} /></a></div></div>
          <div className="contact-method"><Mail size={17} /><div><small>Email</small><a href={`mailto:info@marenettobuild.com?subject=${encodeURIComponent(it ? 'Richiesta informazioni — Marenetto Build' : 'Enquiry — Marenetto Build')}`} data-testid="link-email">info@marenettobuild.com<ArrowRight size={13} /></a></div></div>
          <div className="contact-method"><MessageCircle size={17} /><div><small>{it ? 'Telefono' : 'Phone'}</small><a href="tel:+393339363007" data-testid="link-phone">+39 333 936 3007</a></div></div>
          <div className="contact-method"><MapPin size={17} /><div><small>{it ? 'Indirizzo' : 'Address'}</small><span>SS 113 Settentrionale Sicula, 73b<br />90015 Cefalù, Palermo, Italia</span></div></div>
          <div className="contact-note">{it ? 'Anteprima sintetica: non inserire dati personali reali. Il modulo scarta i dettagli inseriti e crea solo un lead dimostrativo. Per un contatto effettivo, usa email, telefono o WhatsApp.' : 'Synthetic preview: do not enter real personal information. The form discards the details entered and creates only a demo lead. For a real enquiry, use email, phone or WhatsApp.'}</div>
        </aside>
        <div className="contact-content"><SectionLabel>{it ? 'Ci racconti' : 'Tell us'}</SectionLabel><h2 className="display-title">{it ? 'Che cosa ti serve?' : 'What do you need?'}</h2><p>{it ? 'Una richiesta specifica, un dubbio sulla manutenzione o una domanda prima di acquistare? Scegli il punto di partenza più adatto.' : 'A specific request, a maintenance question or something to ask before buying? Choose the starting point that suits you.'}</p>
          <div className="contact-cta-list">
            <PageLink lang={lang} page="request" className="contact-cta"><div><strong>{it ? 'Invia una richiesta strutturata' : 'Send a structured enquiry'}</strong><span>{it ? 'Per progetti, manutenzione o acquisto.' : 'For a project, maintenance or purchase.'}</span></div><ArrowRight size={18} color="#a66546" /></PageLink>
            <PageLink lang={lang} page="services" className="contact-cta"><div><strong>{it ? 'Esplora i servizi' : 'Explore services'}</strong><span>{it ? 'Scopri i principali ambiti di supporto.' : 'See the main areas of support.'}</span></div><ArrowRight size={18} color="#a66546" /></PageLink>
            <PageLink lang={lang} page="abroad" className="contact-cta"><div><strong>{it ? 'Vivi all’estero?' : 'Live abroad?'}</strong><span>{it ? 'Come funziona il contatto a distanza.' : 'How working at a distance can work.'}</span></div><ArrowRight size={18} color="#a66546" /></PageLink>
          </div>
        </div>
      </div>
    </section>
  </>;
}

type RequestFormState = {
  requestType: ProjectRequestInput['requestType']; propertyType: string; service: string; location: string; projectStage: string; message: string; preferredLanguage: string; name: string; email: string; phone: string; preferredChannel: ProjectRequestInput['preferredChannel']; budget: string; desiredPeriod: string; needsAccommodation: boolean; needsMobility: boolean; privacyAccepted: boolean;
};
const initialForm = (lang: Lang): RequestFormState => ({ requestType: 'project', propertyType: '', service: '', location: '', projectStage: '', message: '', preferredLanguage: lang, name: '', email: '', phone: '', preferredChannel: 'email', budget: '', desiredPeriod: '', needsAccommodation: false, needsMobility: false, privacyAccepted: false });

function RequestPage({ lang }: { lang: Lang }) {
  const it = lang === 'it';
  const [form, setForm] = useState<RequestFormState>(() => initialForm(lang));
  const [review, setReview] = useState(false);
  const [receipt, setReceipt] = useState<{ code: string; status: string; notificationStatus: string } | null>(null);
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
    create.mutate({ data: payload }, { onSuccess: result => { setReceipt({ code: result.code, status: result.status, notificationStatus: result.notificationStatus }); setReview(false); } });
  };
  const label = (it ? { group1: 'La richiesta', type: 'Di cosa hai bisogno?', property: 'Tipo di proprietà', service: 'Servizio', location: 'Dove si trova la proprietà?', stage: 'A che punto sei?', message: 'Raccontaci meglio', group2: 'Come ricontattarti', name: 'Nome e cognome', email: 'Email', phone: 'Telefono / WhatsApp', channel: 'Canale preferito', lang: 'Lingua preferita', group3: 'Altri dettagli', budget: 'Budget indicativo (opzionale)', period: 'Periodo desiderato (opzionale)', accom: 'Potresti aver bisogno di un alloggio durante i lavori', mobility: 'Hai esigenze di accessibilità o mobilità da segnalarci', privacy: 'Ho letto e accetto l’informativa privacy per essere ricontattato in merito a questa richiesta.', submit: 'Rivedi la richiesta', sending: 'Invio in corso…', requestType: ['Progetto / lavori', 'Manutenzione', 'Acquisto'], required: 'I campi contrassegnati con * sono necessari. La richiesta non conferma disponibilità o avvio dei lavori.' } : { group1: 'Your enquiry', type: 'What do you need?', property: 'Property type', service: 'Service', location: 'Where is the property?', stage: 'What stage are you at?', message: 'Tell us a little more', group2: 'How to reach you', name: 'Name', email: 'Email', phone: 'Phone / WhatsApp', channel: 'Preferred contact channel', lang: 'Preferred language', group3: 'A few more details', budget: 'Indicative budget (optional)', period: 'Desired timing (optional)', accom: 'You may need accommodation during the work', mobility: 'You have accessibility or mobility needs to let us know about', privacy: 'I have read and accept the privacy notice so I can be contacted about this enquiry.', submit: 'Review your enquiry', sending: 'Sending…', requestType: ['Project / building work', 'Maintenance', 'Purchase'], required: 'Fields marked * are required. Sending an enquiry does not confirm availability or a start date.' });
  const requestTypes: ProjectRequestInput['requestType'][] = ['project', 'maintenance', 'purchase'];
  const selectField = (key: keyof RequestFormState, name: string, options: [string, string][], required = true) => <div className="field"><label htmlFor={`field-${key}`}>{name}{required && <span aria-hidden="true"> *</span>}</label><select id={`field-${key}`} data-testid={`select-${key}`} value={form[key] as string} onChange={e => update(key, e.target.value)} required={required}><option value="">{it ? 'Seleziona…' : 'Choose…'}</option>{options.map(([v, t]) => <option value={v} key={v}>{t}</option>)}</select></div>;
  const human = (value: string) => value.replaceAll('_', ' ').replace(/^./, x => x.toUpperCase());
  return <>
    <PageHero lang={lang} page="request" />
    <section className="section">
      <div className="container request-layout">
        <aside className="request-aside"><SectionLabel>{it ? 'Un buon punto di partenza' : 'A useful place to start'}</SectionLabel><h2 className="display-title">{it ? 'Con calma, con i dettagli che hai.' : 'No rush. Share what you know.'}</h2><p>{it ? 'Questa anteprima scarta i dati inseriti e conserva solo un lead sintetico. Non inserire dati personali reali. Le notifiche interne sono persistenti; gli invii email attendono l’approvazione del fornitore.' : 'This preview discards the details entered and stores only a synthetic lead. Do not enter real personal information. In-app notifications persist; email delivery awaits provider approval.'}</p><p>{it ? 'Per un contatto effettivo, scrivi a info@marenettobuild.com, chiama o invia un messaggio WhatsApp al numero aziendale.' : 'For a real enquiry, email info@marenettobuild.com, call or send a WhatsApp message to the company number.'}</p><div className="language-note">{it ? 'Puoi indicare una lingua preferita fra quelle richieste; la risposta automatica non è ancora attiva.' : 'You can select any requested language; automated replies are not active yet.'}</div></aside>
        <div>
          <form className="form-card" ref={formRef} onSubmit={submitRequest} noValidate={false}>
            <h2 className="form-section-title">{label.group1}</h2>
            <div className="field full"><span className="field-label">{label.type} *</span><div className="radio-row">{requestTypes.map((value, i) => <label className="radio-choice" key={value}><input type="radio" name="requestType" value={value} checked={form.requestType === value} onChange={() => update('requestType', value)} data-testid={`radio-request-${value}`} /><span>{label.requestType[i]}</span></label>)}</div></div>
            <div className="form-grid" style={{ marginTop: 18 }}>
              {selectField('propertyType', label.property, [['apartment', it ? 'Appartamento' : 'Apartment'], ['house', it ? 'Casa indipendente' : 'House'], ['commercial', it ? 'Immobile commerciale' : 'Commercial property'], ['other', it ? 'Altro' : 'Other']])}
              {selectField('service', label.service, [['renovation', it ? 'Ristrutturazione / lavori' : 'Renovation / building work'], ['maintenance', it ? 'Manutenzione' : 'Maintenance'], ['property_care', it ? 'Cura della proprietà' : 'Property care'], ['purchase', it ? 'Acquisto / orientamento' : 'Purchase / guidance'], ['other', it ? 'Altro' : 'Other']])}
              {field('location', label.location, { required: true, placeholder: it ? 'Comune o zona' : 'Town or area', maxLength: 160 })}
              {selectField('projectStage', label.stage, [['planning', it ? 'Sto raccogliendo informazioni' : 'I am gathering information'], ['defined', it ? 'Ho un’idea abbastanza definita' : 'I have a fairly clear idea'], ['ready', it ? 'Vorrei valutare i prossimi passi' : 'I am ready to discuss next steps'], ['ongoing', it ? 'C’è un’esigenza in corso' : 'There is an ongoing need']])}
              <div className="field full"><label htmlFor="field-message">{label.message} *</label><textarea id="field-message" data-testid="input-message" value={form.message} onChange={e => update('message', e.target.value)} minLength={20} maxLength={4000} placeholder={it ? 'Qual è la situazione? Che cosa vorresti fare? Ci sono dettagli utili sulla casa o sul contesto?' : 'What is the situation? What would you like to do? Any useful details about the home or context?'} required /></div>
            </div>
            <div className="form-divider" />
            <h2 className="form-section-title">{label.group2}</h2>
            <div className="form-grid">
              {field('name', label.name, { required: true, maxLength: 120 })}
              {field('email', label.email, { required: form.preferredChannel === 'email', type: 'email', maxLength: 254 })}
              {field('phone', label.phone, { required: form.preferredChannel !== 'email', type: 'tel', maxLength: 50 })}
              {selectField('preferredChannel', label.channel, [['email', 'Email'], ['phone', it ? 'Telefono' : 'Phone'], ['whatsapp', 'WhatsApp']])}
              {selectField('preferredLanguage', label.lang, [
                ['it', 'Italiano'], ['en', 'English'], ['fr', 'Français'], ['de', 'Deutsch'], ['nl', 'Nederlands'], ['es', 'Español'], ['pt', 'Português'],
                ['ru', 'Русский'], ['pl', 'Polski'], ['ro', 'Română'], ['uk', 'Українська'], ['cs', 'Čeština'], ['sk', 'Slovenčina'], ['sl', 'Slovenščina'],
                ['hr', 'Hrvatski'], ['sr', 'Српски'], ['bg', 'Български'], ['bs', 'Bosanski'], ['mk', 'Македонски'], ['be', 'Беларуская'],
                ['ar', 'العربية'], ['he', 'עברית'], ['sv', 'Svenska'], ['no', 'Norsk'], ['da', 'Dansk'], ['fi', 'Suomi'], ['hu', 'Magyar'], ['el', 'Ελληνικά'], ['tr', 'Türkçe'],
              ])}
            </div>
            <div className="form-divider" />
            <h2 className="form-section-title">{label.group3}</h2>
            <div className="form-grid">
              {field('budget', label.budget, { maxLength: 80, placeholder: it ? 'Facoltativo' : 'Optional' })}
              {field('desiredPeriod', label.period, { maxLength: 120, placeholder: it ? 'Facoltativo' : 'Optional' })}
              <div className="field full">
                <label className="check-row"><input type="checkbox" checked={form.needsAccommodation} onChange={e => update('needsAccommodation', e.target.checked)} data-testid="check-accommodation" /><span>{label.accom}</span></label>
                <label className="check-row" style={{ marginTop: 12 }}><input type="checkbox" checked={form.needsMobility} onChange={e => update('needsMobility', e.target.checked)} data-testid="check-mobility" /><span>{label.mobility}</span></label>
              </div>
              <div className="field full"><label className="check-row"><input type="checkbox" required checked={form.privacyAccepted} onChange={e => update('privacyAccepted', e.target.checked)} data-testid="check-privacy" /><span>{label.privacy} *</span></label></div>
            </div>
            {create.isError && <div className="error-box" role="alert" data-testid="status-error">{it ? 'Non siamo riusciti a inviare la richiesta. I tuoi dati sono ancora qui: controlla la connessione e riprova.' : 'We could not send your enquiry. Your details are still here: check your connection and try again.'}</div>}
            {!receipt && !review && <div className="form-footer"><span className="form-hint">{label.required}</span><button className="button" type="submit" data-testid="button-review">{label.submit}<ArrowRight size={15} /></button></div>}
            {review && !receipt && <div className="review-card" data-testid="review-card">
              <h3>{it ? 'Controlla prima di inviare' : 'Review before sending'}</h3>
              <div className="review-grid">
                {[[it ? 'Richiesta' : 'Request', label.requestType[requestTypes.indexOf(form.requestType)]], [label.property, human(form.propertyType)], [label.service, human(form.service)], [label.location, form.location], [label.stage, human(form.projectStage)], [label.name, form.name], [label.email, form.email], [label.phone, form.phone || '—'], [label.channel, human(form.preferredChannel)], [label.lang, form.preferredLanguage], [label.budget, form.budget || '—'], [label.period, form.desiredPeriod || '—'], [label.accom, form.needsAccommodation ? (it ? 'Sì' : 'Yes') : (it ? 'No' : 'No')], [label.mobility, form.needsMobility ? (it ? 'Sì' : 'Yes') : (it ? 'No' : 'No')], [label.message, form.message]].map(([k, v]) => <div className="review-item" key={k}><small>{k}</small><strong>{v}</strong></div>)}
              </div>
              {create.isError && <div className="error-box" role="alert">{it ? 'Invio non riuscito. Puoi modificare i dettagli o riprovare; nessun dato è stato cancellato.' : 'Sending failed. Edit your details or try again; nothing has been cleared.'}</div>}
              <div className="form-footer"><button type="button" className="button outline" onClick={() => setReview(false)} data-testid="button-edit">{it ? 'Modifica' : 'Edit'}</button><button type="button" className="button" disabled={create.isPending} onClick={() => { if (formRef.current?.reportValidity()) formRef.current.requestSubmit(); }} data-testid="button-submit">{create.isPending ? label.sending : (it ? 'Invia richiesta' : 'Send enquiry')}<ArrowRight size={15} /></button></div>
            </div>}
            {receipt && <div className="success-box" role="status" data-testid="status-success"><SectionLabel>{receipt.status === 'received' ? (it ? 'Richiesta ricevuta' : 'Enquiry received') : (it ? 'Richiesta registrata' : 'Enquiry recorded')}</SectionLabel><span className="success-code">{receipt.code}</span><p>{it ? 'Conserva questo codice di riferimento. È stato creato un lead sintetico; i dettagli inseriti non sono stati conservati. ' : 'Keep this reference code. A synthetic lead was created; the details you entered were not retained. '}{receipt.notificationStatus === 'pending_provider' ? (it ? 'La notifica email al fornitore è in attesa di configurazione. ' : 'Email notification to the provider is awaiting configuration. ') : ''}{it ? 'Non inviare nuovamente il modulo.' : 'There is no need to submit the form again.'}</p><p>{it ? 'Gli allegati privati restano disabilitati finché privacy, fornitore e collaudo non sono approvati.' : 'Private attachments remain disabled until privacy, provider, and testing approvals are complete.'}</p></div>}
          </form>
          {!receipt && <div className="language-note">{it ? 'I dettagli vengono inviati solo dopo aver accettato l’informativa privacy. Per allegati o documenti, contattaci direttamente: il modulo non gestisce caricamenti.' : 'Your details are sent only after accepting the privacy notice. For documents or attachments, contact us directly: this form does not support uploads.'}</div>}
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

function SitePage({ page, lang }: { page: CorePage; lang: Lang }) {
  const names = copy[lang].page;
  const pageCopy = page === 'home' ? null : names[page];
  const title = page === 'home' ? (lang === 'it' ? 'Marenetto Build | Costruzioni e ristrutturazioni a Cefalù' : 'Marenetto Build | Construction and renovation in Cefalù') : `${pageCopy![0]} | Marenetto Build`;
  usePageMeta({ title, description: page === 'home' ? copy[lang].home.intro : pageCopy![2], path: routes[lang][page], lang });
  return <div className="site-shell"><Header lang={lang} page={page} /><main><ContactContents lang={lang} page={page} /></main><Footer lang={lang} /></div>;
}

function LibraryShell({ page, children }: { page: Page; children: ReactNode }) {
  return <div className="site-shell"><Header lang="it" page={page} /><main>{children}</main><Footer lang="it" /></div>;
}
function Router() {
  const [path] = useLocation();
  const lang = getLang(path);
  const page = getPage(path);
  const trimmed = path.length > 1 && path.endsWith('/') && path !== '/en/' ? path.replace(/\/+$/, '') : path;
  const queryAndFragment = `${window.location.search}${window.location.hash}`;
  if (legacyRedirects[trimmed]) {
    return <Redirect to={`${legacyRedirects[trimmed]}${queryAndFragment}`} replace />;
  }
  if (trimmed !== path && (articleBySlug.has(trimmed.slice(1)) || ['/articoli', '/contatti', '/guide', '/progetti', '/ricerca'].includes(trimmed))) return <Redirect to={`${trimmed}${queryAndFragment}`} replace />;
  const article = articleBySlug.get(trimmed.slice(1));
  if (article) return <RoutedErrorBoundary><LibraryShell page="articles"><ArticleDetailPage a={article} /></LibraryShell></RoutedErrorBoundary>;
  return <RoutedErrorBoundary><Switch>
    <Route path="/internal"><InternalEntry /></Route>
    <Route path="/owner-demo"><OwnerDemo /></Route>
    <Route path="/content/:locale/:slug">{params => <PublishedCmsPage params={params} />}</Route>
    <Route path="/articoli"><LibraryShell page="articles"><ArticlesPage /></LibraryShell></Route>
    <Route path="/guide"><LibraryShell page="guides"><GuidesPage /></LibraryShell></Route>
    <Route path="/progetti"><LibraryShell page="projects"><ProjectsPage /></LibraryShell></Route>
    <Route path="/ricerca"><LibraryShell page="search"><SearchPage /></LibraryShell></Route>
    <Route path="/"><SitePage page="home" lang="it" /></Route>
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

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}>{clerkPubKey ? <ClerkProviderWithRoutes /> : <Router />}<Toaster /></WouterRouter></TooltipProvider></QueryClientProvider>;
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
    logoImageUrl: `${window.location.origin}${basePath}/favicon.svg`,
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
