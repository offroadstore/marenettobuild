import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { networkCopy, networkPath, networkRelated, networkImages, NETWORK_PAGES, networkPublic, networkPreviewPath, type NetworkPageRecord } from '@/content/network';
import { NETWORK_IDS, type NetworkId } from '@/content/network/types';
import { networkSourcesFor } from '@/content/network/sources';
import { regulatoryNotice } from '@/content/network/regulatory-notice';
import { requestPath } from '@/content/service-offers';
import { furniturePath } from '@/content/phase3';
import { withCampaignParams } from '@/lib/campaign';
import { useNetworkMeta } from '@/lib/network-meta';
import { useActiveEditorial } from '@/lib/editorial-runtime';
import { networkGuideLinks } from '@/content/network/guide-links';
import { getEdition } from '@/localization/edition-inventory';
import '@/styles/network.css';
import { AtelierLink } from './atelier';
import { AreaBreadcrumb, AreaPillarLink } from './four-areas';

export type { NetworkPageRecord };
const previewPath = networkPreviewPath;

type Ui = { draft: string; sourceWarning: string; next: string; coverage: string; pillar: string; imagesPending: string; breadcrumb: string; scopeCol: string };
const UI: Record<string, Ui> = {
  it: { draft: 'Bozza editoriale · anteprima interna', sourceWarning: 'Le fonti indicano riferimenti generali e vanno verificate sulla versione vigente dal professionista incaricato; non costituiscono un controllo del tuo caso.', next: 'Prossimo passo', coverage: 'Area di lavoro', pillar: 'La rete', imagesPending: 'Immagini illustrative in preparazione.', breadcrumb: 'Percorso', scopeCol: 'Verificata il' },
  en: { draft: 'Editorial draft · internal preview', sourceWarning: 'Sources point to general references and must be checked against the version in force by the appointed professional; they are not a review of your case.', next: 'Next step', coverage: 'Working area', pillar: 'The network', imagesPending: 'Illustrative images in preparation.', breadcrumb: 'Breadcrumb', scopeCol: 'Checked' },
  de: { draft: 'Redaktioneller Entwurf · interne Vorschau', sourceWarning: 'Die Quellen sind allgemeine Bezüge und müssen von der beauftragten Fachperson in der geltenden Fassung geprüft werden; sie ersetzen keine Prüfung Ihres Falls.', next: 'Nächster Schritt', coverage: 'Arbeitsgebiet', pillar: 'Das Netzwerk', imagesPending: 'Illustrative Bilder in Vorbereitung.', breadcrumb: 'Navigationspfad', scopeCol: 'Geprüft am' },
  nl: { draft: 'Redactioneel concept · interne preview', sourceWarning: 'De bronnen zijn algemene verwijzingen en moeten door de aangestelde professional in de geldende versie worden gecontroleerd; ze zijn geen beoordeling van uw situatie.', next: 'Volgende stap', coverage: 'Werkgebied', pillar: 'Het netwerk', imagesPending: 'Illustratieve beelden in voorbereiding.', breadcrumb: 'Kruimelpad', scopeCol: 'Gecontroleerd op' },
  fr: { draft: 'Brouillon éditorial · aperçu interne', sourceWarning: 'Les sources sont des références générales à vérifier dans leur version en vigueur par le professionnel mandaté ; elles ne constituent pas un examen de votre dossier.', next: 'Prochaine étape', coverage: 'Zone d’intervention', pillar: 'Le réseau', imagesPending: 'Images d’illustration en préparation.', breadcrumb: 'Fil d’Ariane', scopeCol: 'Consultée le' },
  es: { draft: 'Borrador editorial · vista previa interna', sourceWarning: 'Las fuentes son referencias generales que el profesional encargado debe comprobar en su versión vigente; no constituyen una revisión de su caso.', next: 'Siguiente paso', coverage: 'Zona de trabajo', pillar: 'La red', imagesPending: 'Imágenes ilustrativas en preparación.', breadcrumb: 'Ruta de navegación', scopeCol: 'Consultada el' },
  pt: { draft: 'Rascunho editorial · pré-visualização interna', sourceWarning: 'As fontes são referências gerais que o profissional contratado deve verificar na versão em vigor; não constituem uma análise do seu caso.', next: 'Próximo passo', coverage: 'Área de trabalho', pillar: 'A rede', imagesPending: 'Imagens ilustrativas em preparação.', breadcrumb: 'Caminho de navegação', scopeCol: 'Consultada em' },
  pl: { draft: 'Wersja robocza · podgląd wewnętrzny', sourceWarning: 'Źródła są ogólnymi odniesieniami i muszą zostać sprawdzone w obowiązującej wersji przez zleconego specjalistę; nie stanowią oceny Twojej sprawy.', next: 'Następny krok', coverage: 'Obszar działania', pillar: 'Sieć', imagesPending: 'Ilustracje w przygotowaniu.', breadcrumb: 'Ścieżka nawigacji', scopeCol: 'Sprawdzono' },
  ru: { draft: 'Редакционный черновик · внутренний просмотр', sourceWarning: 'Источники — это общие ссылки; действующую редакцию должен проверить привлечённый специалист. Это не проверка вашего случая.', next: 'Следующий шаг', coverage: 'Район работ', pillar: 'Сеть', imagesPending: 'Иллюстрации готовятся.', breadcrumb: 'Навигационная цепочка', scopeCol: 'Проверено' },
  sv: { draft: 'Redaktionellt utkast · intern förhandsvisning', sourceWarning: 'Källorna är allmänna hänvisningar och ska kontrolleras i gällande lydelse av den anlitade fackpersonen; de är ingen bedömning av ditt fall.', next: 'Nästa steg', coverage: 'Arbetsområde', pillar: 'Nätverket', imagesPending: 'Illustrationer förbereds.', breadcrumb: 'Brödsmulor', scopeCol: 'Kontrollerad' },
  no: { draft: 'Redaksjonelt utkast · intern forhåndsvisning', sourceWarning: 'Kildene er generelle henvisninger og må kontrolleres i gjeldende versjon av den engasjerte fagpersonen; de er ingen vurdering av din sak.', next: 'Neste steg', coverage: 'Arbeidsområde', pillar: 'Nettverket', imagesPending: 'Illustrasjoner under arbeid.', breadcrumb: 'Brødsmulesti', scopeCol: 'Kontrollert' },
  da: { draft: 'Redaktionelt udkast · intern forhåndsvisning', sourceWarning: 'Kilderne er generelle henvisninger og skal kontrolleres i den gældende udgave af den engagerede fagperson; de er ikke en vurdering af din sag.', next: 'Næste skridt', coverage: 'Arbejdsområde', pillar: 'Netværket', imagesPending: 'Illustrationer under udarbejdelse.', breadcrumb: 'Brødkrummesti', scopeCol: 'Kontrolleret' },
  ar: { draft: 'مسودة تحريرية · معاينة داخلية', sourceWarning: 'المصادر مراجع عامة ويجب أن يتحقق منها المهني المكلف في نسختها السارية؛ وهي ليست فحصًا لحالتكم.', next: 'الخطوة التالية', coverage: 'نطاق العمل', pillar: 'الشبكة', imagesPending: 'الصور التوضيحية قيد الإعداد.', breadcrumb: 'مسار التنقل', scopeCol: 'تم التحقق' },
};
const ui = (locale: string) => UI[locale] ?? UI.en!;
const homePath = (locale: string) => getEdition(locale, 'home')?.path ?? (locale === 'it' ? '/' : `/${locale}/`);

type SourceLike = { title: string; url?: string; checkedAt?: string; scope?: string; status?: string };

function hrefFor(page: NetworkPageRecord, id: NetworkId) {
  const ready = NETWORK_PAGES.find((p: NetworkPageRecord) => p.locale === page.locale && p.id === id);
  return ready && networkPublic(ready) && networkPublic(page) ? networkPath(page.locale, id) : previewPath(page.locale, id);
}

function Figure({ id, index, alt, caption, eager }: { id: NetworkId; index: number; alt: string; caption: string; eager?: boolean }) {
  const img = networkImages(id)[index];
  if (!img) return null;
  return (
    <figure className="mbn-figure" data-testid={`img-network-${id}-${index}`}>
      <img src={img.src} srcSet={img.srcSet} sizes={eager ? '100vw' : '(min-width: 1100px) 760px, 100vw'} width={img.width} height={img.height} alt={alt}
        loading={eager ? 'eager' : 'lazy'} decoding="async" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function NetworkPage({ page }: { page: NetworkPageRecord }) {
  const c = networkCopy(page.locale);
  const t = ui(page.locale);
  const a = c.articles[page.id];
  const isPillar = page.id === 'network';
  const isDraft = !networkPublic(page);
  const sources = (networkSourcesFor(page.id) ?? []) as SourceLike[];
  const related = networkRelated(page.id);
  const hasImages = networkImages(page.id).length > 0;
  const active = useActiveEditorial();
  const guides = networkGuideLinks(page.locale, page.id, active);
  useNetworkMeta(page);

  return (
    <main className="mbn" lang={page.locale} data-testid={`page-network-${page.id}`}>
      {isDraft && <p className="mbn-draft" role="note" data-testid="status-network-draft"><span>{t.draft}</span> {c.reviewNotice}</p>}

      <header className="mbn-head">
        <div className="mbh-wrap">
          <AreaBreadcrumb locale={page.locale} article={`network-${page.id}`} title={a.title} />
          <p className="mbh-kicker">{isPillar ? 'Marenetto Build' : c.nav}</p>
          <h1 className="mbh-h1 mbn-title" data-testid="text-network-title">{a.title}</h1>
          <p className="mbn-lead">{a.lead}</p>
        </div>
      </header>

      <div className="mbh-wrap mbn-cover"><Figure id={page.id} index={0} alt={a.imageAlts[0]} caption={c.illustration} eager /></div>
      {!hasImages && <p className="mbh-wrap mbn-pending">{t.imagesPending}</p>}

      <div className="mbh-wrap mbn-layout">
        <aside className="mbn-toc">
          <nav aria-labelledby="mbn-toc-h" data-testid="nav-network-contents">
            <p id="mbn-toc-h" className="mbn-toc__h">{c.contents}</p>
            <ol>
              {a.sections.map((s, i) => <li key={i}><a href={`#s-${i + 1}`}><span className="mbh-num">{String(i + 1).padStart(2, '0')}</span>{s.heading}</a></li>)}
              <li><a href="#roles">{c.directHeading}</a></li>
              <li><a href="#checklist">{c.checklist}</a></li>
              <li><a href="#faq">{c.faq}</a></li>
              <li><a href="#sources">{c.sources}</a></li>
            </ol>
          </nav>
        </aside>

        <article className="mbn-body">
          {a.sections.map((s, i) => (
            <section key={i} id={`s-${i + 1}`} tabIndex={-1} className="mbn-sec">
              <h2 className="mbh-h2"><span className="mbh-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{s.heading}</h2>
              {s.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
              {!isPillar && i < 2 && <Figure id={page.id} index={i + 1} alt={a.imageAlts[i + 1]} caption={c.illustration} />}
            </section>
          ))}

          <section id="roles" tabIndex={-1} className="mbn-roles" aria-label={`${c.directHeading} / ${c.coordinatedHeading}`}>
            <div className="mbn-role mbn-role--direct"><h2 className="mbh-h3">{c.directHeading}</h2><p>{c.direct}</p></div>
            <div className="mbn-role"><h2 className="mbh-h3">{c.coordinatedHeading}</h2><p>{c.coordinated}</p></div>
            <div className="mbn-role mbn-role--scope"><h2 className="mbh-h3">{t.coverage}</h2><p>{c.scope}</p></div>
          </section>

          <section id="checklist" tabIndex={-1} className="mbn-check">
            <h2 className="mbh-h2">{c.checklist}</h2>
            <ul>{a.checklist.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </section>

          <section id="faq" tabIndex={-1} className="mbn-faq">
            <h2 className="mbh-h2">{c.faq}</h2>
            <dl>{a.faq.map(([q, ans], i) => <div key={i} data-testid={`faq-network-${i}`}><dt>{q}</dt><dd>{ans}</dd></div>)}</dl>
          </section>

          <section id="sources" tabIndex={-1} className="mbn-sources">
            <h2 className="mbh-h2">{c.sources}</h2>
            <aside className="mbn-notice" data-testid="network-regulatory-notice" aria-label={regulatoryNotice(page.locale).heading}>
              <h3>{regulatoryNotice(page.locale).heading}</h3>
              <p>{regulatoryNotice(page.locale).body}</p>
            </aside>
            <p className="mbn-warn">{t.sourceWarning}</p>
            {sources.length > 0 && (
              <ul>
                {sources.map((s, i) => {
                  return (
                    <li key={i} data-testid={`text-network-source-${i}`}>
                      {s.url ? <a href={s.url} rel="noopener noreferrer" target="_blank" lang="it">{s.title}</a> : <span lang="it">{s.title}</span>}
                      {page.locale === 'it' && s.scope && <span className="mbn-sources__scope">{s.scope}</span>}
                      {s.checkedAt && <span className="mbn-sources__scope">{t.scopeCol}: <time dateTime={s.checkedAt}>{s.checkedAt}</time></span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mbn-notice">{regulatoryNotice(page.locale).reviewSummary}</p>
          </section>

          <section className="mbn-next">
            <p className="mbh-kicker">{t.next}</p>
            <p className="mbn-next__text">{a.nextStep}</p>
            <div className="mbh-actions">
              <Link href={withCampaignParams(requestPath(page.locale))} className="mbh-btn mbh-btn--primary" data-testid="link-network-request">{c.contact} <ArrowRight size={18} aria-hidden="true" /></Link>
              {(page.id === 'bespoke' || isPillar) && <Link href={furniturePath(page.locale)} className="mbh-link" data-testid="link-network-furniture">{c.furniture} <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
            {(isPillar || page.id === 'bespoke') && <AtelierLink locale={page.locale} />}
          </section>
        </article>
      </div>

      <section className="mbn-related mbh-section">
        <div className="mbh-wrap">
          <h2 className="mbh-h2">{c.related}</h2>
          <ul className="mbn-links">
            {(isPillar ? NETWORK_IDS.filter(id => id !== 'network') : ['network' as NetworkId, ...related.filter((id: NetworkId) => id !== 'network')]).map((id: NetworkId, i: number) => (
              <li key={id}><Link href={hrefFor(page, id)} className="mbn-link" data-testid={`link-network-related-${id}`}>
                <span className="mbh-num">{String(i + 1).padStart(2, '0')}</span><span>{c.articles[id].title}</span><ArrowRight size={18} aria-hidden="true" />
              </Link></li>
            ))}
            {guides.map(guide => <li key={guide.path}><Link href={guide.path} className="mbn-link" data-testid="link-network-published-guide">
              <span aria-hidden="true">↗</span><span>{guide.title.replace(/ \| Marenetto Build$/, '')}</span><ArrowRight size={18} aria-hidden="true" />
            </Link></li>)}
          </ul>
        </div>
      </section>
      <AreaPillarLink locale={page.locale} article={`network-${page.id}`} />
    </main>
  );
}

export function NetworkServicesBlock({ locale, preview = false }: { locale: string; preview?: boolean }) {
  const pillar = NETWORK_PAGES.find((p: NetworkPageRecord) => p.locale === locale && p.id === 'network');
  if (!pillar) return null;
  if (!preview && !networkPublic(pillar)) return null;
  const linkFor = (id: NetworkId) => (preview ? previewPath(locale, id) : networkPath(locale, id));
  const c = networkCopy(locale);
  return (
    <section className="mbn-block mbh-section" data-testid="section-network-services">
      <div className="mbh-wrap">
        <div className="mbn-block__grid">
          <div>
            <p className="mbh-kicker">{c.services}</p>
            <h2 className="mbh-h2">{c.nav}</h2>
            <div className="mbn-role mbn-role--direct"><h3 className="mbh-h3">{c.directHeading}</h3><p>{c.direct}</p></div>
            <div className="mbn-role"><h3 className="mbh-h3">{c.coordinatedHeading}</h3><p>{c.coordinated}</p></div>
            <p className="mbn-block__scope">{c.scope}</p>
            <Link href={linkFor('network')} className="mbh-link" data-testid="link-network-pillar">{c.articles.network.title} <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <ul className="mbn-links">
            {NETWORK_IDS.filter(id => id !== 'network').map((id, i) => {
              const p = NETWORK_PAGES.find((x: NetworkPageRecord) => x.locale === locale && x.id === id);
              const live = preview || (!!p && networkPublic(p));
              return (
                <li key={id}>{live
                  ? <Link href={linkFor(id)} className="mbn-link" data-testid={`link-network-service-${id}`}><span className="mbh-num">{String(i + 1).padStart(2, '0')}</span><span>{c.articles[id].title}</span><ArrowRight size={18} aria-hidden="true" /></Link>
                  : <span className="mbn-link mbn-link--off"><span className="mbh-num">{String(i + 1).padStart(2, '0')}</span><span>{c.articles[id].title}</span></span>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default NetworkPage;
