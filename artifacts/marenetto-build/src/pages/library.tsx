import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Search, ShieldAlert, X } from 'lucide-react';
import { articles, claimLabels, guides, reviewLabels, type Article } from '@/content/articles';
import { withCampaignParams } from '@/lib/campaign';
import { usePageMeta } from '@/lib/meta';
import { useLibraryLocale } from '@/localization/library-context';
import { showsTranslatedCopy } from '@/localization/runtime';
import { historicalPage, historicalArticleForPreview } from '@/content/historical';
import { useActiveEditorial } from '@/lib/editorial-runtime';
import { useEditorialArticles } from '@/content/editorial-articles';

function LibHero({ eyebrow, title, intro, meta }: { eyebrow: string; title: string; intro: string; meta: string }) {
  const { render } = useLibraryLocale();
  return render(<section className="page-hero">
    <div className="container">
      <div className="page-hero-grid">
        <div className="animate-enter"><span className="eyebrow">{eyebrow}</span><h1 className="display-title">{title}</h1></div>
        <p className="animate-enter delay-1">{intro}</p>
      </div>
      <div className="page-meta"><span>{meta}</span><span>Cefalù · Sicilia</span></div>
    </div>
  </section>);
}

function StatusPill({ a }: { a: Article }) {
  const { render } = useLibraryLocale();
  return render(<span className={`status-pill status-${a.reviewStatus}`} data-testid={`status-review-${a.slug}`}>{reviewLabels[a.reviewStatus].short}</span>);
}

export function ArticleCard({ a, kind = 'archive', index }: { a: Article; kind?: 'archive' | 'guide' | 'search'; index: number }) {
  const { lang, render, articleHref, date: formatDate } = useLibraryLocale();
  const live = useActiveEditorial().find(e => e.locale === lang && e.identity === a.slug && e.revisionId !== 'withdrawn');
  const original = !live && !showsTranslatedCopy(lang) ? historicalPage(articleHref(a.slug)) ?? historicalArticleForPreview(articleHref(a.slug)) : undefined;
  const card = <Link href={withCampaignParams(live?.path ?? articleHref(a.slug))} lang={live?.content.contentLanguage ?? (showsTranslatedCopy(lang) ? lang : 'it')} className="lib-card" data-testid={`card-${kind}-${a.slug}`}>
    <div className="lib-card-media">{a.image && <img src={a.image} alt={a.imageAlt} loading="lazy" />}<span className="lib-card-index">{String(index + 1).padStart(2, '0')}</span></div>
    <div className="lib-card-body">
      <div className="lib-card-meta"><span>{a.category}</span><span>{formatDate(a.publishedOn)}</span></div>
      <h2>{original?.h1 ?? a.title}</h2>
      <p>{original?.description ?? a.summary}</p>
      <div className="lib-card-foot"><div>{!original && !live && <><StatusPill a={a} /><span className="review-date">Revisione: {a.review.reviewedAt ? formatDate(a.review.reviewedAt) : 'non registrata'}</span></>}{live && <span className="status-pill">Edizione attiva</span>}</div><span className="text-link">{live || original || a.reviewStatus === 'documentary-review' ? 'Leggi l’articolo' : 'Leggi la sintesi'}<ArrowRight size={13} /></span></div>
    </div>
  </Link>;
  return live ? card : render(card);
}

function ReviewLegend() {
  const { render } = useLibraryLocale();
  return render(<div className="review-legend" data-testid="review-legend">
    {(Object.keys(reviewLabels) as (keyof typeof reviewLabels)[]).map(k => <div key={k}><span className={`status-pill status-${k}`}>{reviewLabels[k].short}</span><p>{reviewLabels[k].long}</p></div>)}
  </div>);
}

function FullText({ text }: { text: string }) {
  const { t } = useLibraryLocale();
  const blocks = t(text).trim().split(/\n\s*\n/).filter(Boolean);
  return <>{blocks.map((block, i) => {
    if (block.startsWith('## ')) return <h2 key={i}>{block.slice(3)}</h2>;
    if (block.startsWith('- ')) return <ul className="question-list" key={i}>{block.split('\n').map(item => <li key={item}>{item.slice(2)}</li>)}</ul>;
    return <p key={i}>{block}</p>;
  })}</>;
}

export function ActiveArticleListing() {
  const { lang } = useLibraryLocale();
  const articles = useEditorialArticles(lang);
  return <div className="lib-grid" data-testid="active-article-listing">{articles.map((article, index) => <ArticleCard key={article.slug} a={article} index={index} />)}</div>;
}

export function ArticlesPage() {
  const { lang, render, t, libraryHref } = useLibraryLocale();
  const articles = useEditorialArticles(lang);
  const intro = articles.length === 14 ? 'Archivio dei 14 articoli storici di Marenetto Build, con sintesi neutrali e stato di revisione delle affermazioni originali.' : `Archivio di ${articles.length} articoli di Marenetto Build, con fonti e revisioni editoriali.`;
  usePageMeta({ title: 'Articoli | Marenetto Build', description: intro, path: '/articoli' });
  const [cat, setCat] = useState<string>('Tutti');
  const cats = useMemo(() => ['Tutti', ...Array.from(new Set(articles.map(a => a.category)))], [articles]);
  const list = cat === 'Tutti' ? articles : articles.filter(a => a.category === cat);
  return render(<>
    <LibHero eyebrow="Articoli" title={articles.length === 14 ? 'Quattordici articoli, riletti con calma.' : 'Articoli e approfondimenti.'} intro={intro} meta={`${articles.length} ${t('articoli')}`} />
    <section className="section">
      <div className="container">
        <ReviewLegend />
        <div className="filter-row" role="tablist" aria-label="Filtra per categoria">
          {cats.map(c => <button key={c} role="tab" aria-selected={cat === c} className={`filter-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)} data-testid={`filter-${c.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{c}</button>)}
          <Link href={withCampaignParams(libraryHref('search'))} className="filter-search" data-testid="link-to-search"><Search size={14} />Cerca</Link>
        </div>
        <p className="result-count" data-testid="text-archive-count">{list.length} {list.length === 1 ? 'articolo' : 'articoli'}</p>
        <div className="lib-grid">{list.map((a, i) => <ArticleCard key={a.slug} a={a} index={i} />)}</div>
      </div>
    </section>
  </>);
}

export function GuidesPage() {
  const { lang, render, t, articleHref, libraryHref } = useLibraryLocale();
  const articles = useEditorialArticles(lang);
  const guides = articles.filter(article => article.isGuide);
  usePageMeta({ title: 'Guide pratiche | Marenetto Build', description: 'Guide pratiche per proprietari a Cefalù: sintesi riviste su acquisto, manutenzione, infiltrazioni, isolamento e superfici.', path: '/guide' });
  return render(<>
    <LibHero eyebrow="Guide pratiche" title="Domande utili, prima delle risposte." intro="Guide pratiche per proprietari a Cefalù: sintesi riviste su acquisto, manutenzione, infiltrazioni, isolamento e superfici." meta={`${guides.length} ${t('guide')} · ${t('su')} ${articles.length} ${t('articoli')}`} />
    <section className="section">
      <div className="container">
        <div className="guide-list">{guides.map((a, i) => <Link key={a.slug} href={withCampaignParams(articleHref(a.slug))} className="guide-row" data-testid={`card-guide-${a.slug}`}>
          <span className="guide-n">{String(i + 1).padStart(2, '0')}</span>
          <img src={a.image} alt={a.imageAlt} loading="lazy" />
          <div><span className="guide-cat">{a.category}</span><h2>{a.title}</h2><p>{a.summary}</p></div>
          <div className="guide-side"><StatusPill a={a} /><ArrowRight size={18} /></div>
        </Link>)}</div>
        <div className="portfolio-note" style={{ marginTop: 56 }}><div><h2>Cerchi un argomento diverso?</h2><p>L’archivio completo raccoglie tutti i 14 articoli storici, ciascuno con il proprio stato di revisione.</p></div><Link href={withCampaignParams(libraryHref('articles'))} className="text-link" data-testid="link-guides-archive">Tutti gli articoli<ArrowRight size={14} /></Link></div>
      </div>
    </section>
  </>);
}

export function SearchPage() {
  const { lang, render, t, publicHref } = useLibraryLocale();
  const articles = useEditorialArticles(lang);
  usePageMeta({ title: 'Ricerca | Marenetto Build', description: 'Cerca tra gli articoli e le guide di Marenetto Build per titolo, sintesi e categoria.', path: '/ricerca' });
  const [q, setQ] = useState('');
  useEffect(() => { setQ(new URLSearchParams(window.location.search).get('q') ?? ''); }, []);
  const results = useMemo(() => {
    const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase(lang);
    const words = normalize(q).trim().split(/\s+/).filter(Boolean);
    return articles.filter(a => words.every(word => normalize([a.title, a.summary, a.category, ...a.overview].map(t).join(' ')).includes(word)));
  }, [q, lang, articles]);
  const suggestions = ['infiltrazioni', 'manutenzione', 'pietra', 'acquisto', 'giardini'];
  return render(<>
    <section className="page-hero search-hero">
      <div className="container">
        <span className="eyebrow">Ricerca</span>
        <h1 className="display-title">Che cosa stai cercando?</h1>
        <label className="search-box" htmlFor="search-input">
          <Search size={20} />
          <input id="search-input" autoFocus type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Es. umidità, facciata, pavimento esterno" data-testid="input-search" aria-describedby="search-count" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Cancella ricerca" data-testid="button-clear-search"><X size={16} /></button>}
        </label>
        <div className="search-suggest">{suggestions.map(s => <button key={s} type="button" onClick={() => setQ(t(s))} data-testid={`button-suggest-${s}`}>{s}</button>)}</div>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <p className="result-count" id="search-count" aria-live="polite" data-testid="text-result-count">{results.length} {q.trim() ? <>{t(results.length === 1 ? 'risultato' : 'risultati')} {t('per')} “{q.trim()}”</> : t('articoli disponibili')}</p>
        {results.length ? <div className="lib-grid">{results.map((a, i) => <ArticleCard key={a.slug} a={a} index={i} kind="search" />)}</div>
          : <div className="empty-state" data-testid="state-empty-search"><span className="portfolio-mark">—</span><h2>{t('Nessun articolo trovato.')} “{q.trim()}”</h2><p>Prova con un termine più generale, oppure scrivici: possiamo rispondere a una domanda specifica anche se non è trattata qui.</p><div className="hero-actions"><button className="button outline" onClick={() => setQ('')} data-testid="button-reset-search">Mostra tutti</button><Link href={withCampaignParams(publicHref('request'))} className="button" data-testid="link-empty-request">Fai una domanda<ArrowRight size={14} /></Link></div></div>}
      </div>
    </section>
  </>);
}

export function ProjectsPage() {
  const { render } = useLibraryLocale();
  usePageMeta({ title: 'Progetti | Marenetto Build', description: 'I casi studio verificati di Marenetto Build sono in preparazione. Nessun progetto viene pubblicato senza materiale documentato.', path: '/progetti' });
  return render(<>
    <LibHero eyebrow="Progetti" title="Casi studio verificati, in preparazione." intro="Questa sezione accoglierà interventi reali, documentati e approvati dai proprietari. Finché il materiale non è pronto, preferiamo lasciarla vuota piuttosto che mostrare esempi non verificati." meta="0 progetti pubblicati · in preparazione" />
    <section className="section">
      <div className="container editorial-grid">
        <aside className="editorial-aside"><span className="eyebrow">Il nostro criterio</span><h2 className="section-heading display-title">Ogni progetto dovrà essere verificabile.</h2></aside>
        <div className="detail-list" data-testid="list-project-criteria">
          {[['Immagini riferibili', 'Fotografie dell’intervento reale, non immagini generiche o di repertorio.'], ['Consenso del proprietario', 'Pubblichiamo solo con autorizzazione e nel rispetto della privacy.'], ['Descrizione misurata', 'Che cosa è stato fatto, da chi e con quali limiti, senza promesse di risultato.'], ['Nessuna testimonianza inventata', 'Eventuali commenti di clienti saranno riportati solo se reali e autorizzati.']].map(([h, p], i) => <article className="detail-row" key={h}><span>0{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></article>)}
        </div>
      </div>
    </section>
    <section className="section tight"><div className="container"><div className="cta-panel"><div><h2 className="display-title">Nel frattempo, parliamo della tua casa.</h2><p>Puoi leggere le guide pratiche o inviarci una richiesta: il primo confronto serve a capire da dove partire.</p></div><div className="hero-actions"><Link href={withCampaignParams('/guide')} className="button outline" data-testid="link-projects-guides">Guide pratiche</Link><Link href={withCampaignParams('/richiesta')} className="button" data-testid="link-projects-request">Invia una richiesta<ArrowRight size={14} /></Link></div></div></div></section>
  </>);
}

export function ArticleDetailPage({ a }: { a: Article }) {
  const { lang, render, t, articleHref, libraryHref, publicHref, date: formatDate } = useLibraryLocale();
  usePageMeta({ title: `${a.title} | Marenetto Build`, description: a.summary, path: `/${a.slug}`, type: 'article' });
  const idx = articles.findIndex(x => x.slug === a.slug);
  const related = articles.filter(x => x.category === a.category && x.slug !== a.slug).slice(0, 2);
  const next = articles[(idx + 1) % articles.length];
  return render(<>
    <section className="article-hero">
      <div className="container">
        <Link href={withCampaignParams(libraryHref('articles'))} className="text-link back-link" data-testid="link-back-archive"><ArrowLeft size={14} />Tutti gli articoli</Link>
        <div className="article-head">
          <div className="lib-card-meta"><span data-testid="text-category">{a.category}</span><span data-testid="text-date">Pubblicato in origine: {formatDate(a.publishedOn)}</span></div>
          <h1 className="display-title animate-enter" data-testid="text-article-title">{a.title}</h1>
          <p className="article-lede animate-enter delay-1">{a.summary}</p>
        </div>
      </div>
      <div className="container"><figure className="article-figure"><img src={a.image} alt={a.imageAlt} data-testid="img-article-hero" /><figcaption>Immagine illustrativa dell’articolo originale, conservata localmente. Non documenta un lavoro verificato.</figcaption></figure></div>
    </section>
    <section className="section tight">
      <div className="container article-layout">
        <article className="article-body" lang={showsTranslatedCopy(lang) ? lang : 'it'} dir={showsTranslatedCopy(lang) && ['ar', 'he'].includes(lang) ? 'rtl' : 'ltr'}>
          {a.reviewStatus === 'documentary-review' && a.approvedFullText ? <>
            <div className="review-note" role="note" data-testid="note-review-approved">
              <ShieldAlert size={20} />
              <div><strong>Testo integrale · revisione documentale automatizzata</strong><p>Verifica redazionale con fonti pubbliche consultate il {formatDate(a.review.reviewedAt)}.</p><p>{reviewLabels[a.reviewStatus].long}</p></div>
            </div>
            <h2>Articolo completo</h2>
            <FullText text={a.approvedFullText} />
            <h2>Domande utili da porsi</h2>
            <ul className="question-list">{a.questions.map(question => <li key={question}>{question}</li>)}</ul>
            {a.slug.startsWith('comprare-') && <a href={`${import.meta.env.BASE_URL}documents/promemoria-acquisto.txt`} lang="it" download>Scarica il promemoria documentale in italiano</a>}
          </> : <>
            <div className="review-note" role="note" data-testid="note-review">
              <ShieldAlert size={20} />
              <div><strong>Il testo originale non è ancora approvato per la pubblicazione.</strong><p>L’articolo storico è conservato nell’archivio e non viene riproposto integralmente senza revisione documentata. {reviewLabels[a.reviewStatus].long}</p></div>
            </div>
            <h2>In sintesi</h2>
            {a.overview.map((p, i) => <p key={i}>{p}</p>)}
            <h2>Domande utili da porsi</h2>
            <ol className="question-list">{a.questions.map(q => <li key={q}>{q}</li>)}</ol>
          </>}
          <p className="article-disclaimer">Questa pagina offre un orientamento generale. Non costituisce una diagnosi, un preventivo o un impegno contrattuale.</p>
        </article>
        <aside className="article-aside">
          <div className="aside-block"><small>Stato</small><StatusPill a={a} /></div>
          <div className="aside-block" data-testid="article-review-record">
            <small>Metodo e data revisione</small>
            <span>{a.review.responsible ?? 'Responsabile non assegnato'}</span>
            <p className="review-date">Testo completo: {a.review.reviewedAt ? formatDate(a.review.reviewedAt) : 'data non registrata'}</p>
          </div>
          <div className="aside-block">
            <small>Fonti verificate</small>
             {a.review.sources.length ? <ul className="claim-list">{a.review.sources.map(source => <li key={`${source.url}-${source.verifiedAt}`}><a href={source.url} lang="it" target="_blank" rel="noreferrer">{source.title}</a><br />{source.scope} · consultata il {formatDate(source.verifiedAt)}</li>)}</ul> : <span>Nessuna fonte di approvazione registrata.</span>}
          </div>
          <div className="aside-block">
            <small>Controllo delle affermazioni</small>
            {a.claimsToReview.length
              ? <ul className="claim-list" data-testid="list-claims">{a.claimsToReview.map(c => <li key={c}>{claimLabels[c]}</li>)}</ul>
              : <span data-testid="list-claims">Nessun punto segnalato nel testo pubblicato; le affermazioni non documentate dell’originale sono state rimosse o qualificate.</span>}
          </div>
           <div className="aside-block"><small>Titolo originale</small><span className="orig-title" lang="en">{a.originalTitle}</span></div>
          <div className="aside-block"><small>Percorso storico</small><code>/{a.slug}/</code></div>
          {lang !== 'it' && <div className="aside-block"><a href={withCampaignParams(`/${a.slug}`)} lang="it">{t('Testo originale italiano')}</a></div>}
          <Link href={withCampaignParams(publicHref('request'))} className="button" data-testid="link-article-request">Parliamone<ArrowRight size={14} /></Link>
        </aside>
      </div>
    </section>
    <section className="section tight">
      <div className="container">
        <div className="section-head"><div><span className="eyebrow">Continua a leggere</span></div><Link href={withCampaignParams(articleHref(next.slug))} className="text-link" data-testid="link-next-article">Articolo successivo<ArrowRight size={14} /></Link></div>
        <div className="lib-grid">{(related.length ? related : [next]).map((r) => <ArticleCard key={r.slug} a={r} index={articles.indexOf(r)} />)}</div>
      </div>
    </section>
  </>);
}
