import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { arabicEditorialPath } from '@/content/arabic-editorial';
import { arabicLibraryCopy as c, arabicLibraryGroups } from '@/content/arabic-editorial-library';
import { withCampaignParams } from '@/lib/campaign';
import { useState } from 'react';
import { ARABIC_ARCHIVES, arabicArchivePath } from '@/content/arabic-archives';
import {useActiveEditorial} from '@/lib/editorial-runtime';
import {commercialEntries} from '@/content/commercial-release.mjs';

/** Arabic article index: lists the parent's Arabic adaptations, grouped by family. */
export function ArabicLibraryPage({ mode = 'articles' }: { mode?: 'articles' | 'guides' | 'search' }) {
  const [query, setQuery] = useState('');
  const active=useActiveEditorial();
  const release=commercialEntries(active).filter(e=>e.locale==='ar');
  const replaced=new Set(active.filter(e=>e.locale==='ar').map(e=>e.path.replace(/\/+$/,'')));
  const normalize = (text: string) => text.normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g, '').toLocaleLowerCase('ar');
  const guideSlugs = new Set(['buying-renovating-five-checks', 'ten-year-building-insurance', 'water-leaks-damp-investigation', 'microcement-renovation', 'outdoor-concrete-flooring', 'insulation-thermal-plaster']);
  const groups = arabicLibraryGroups.map(group => ({ ...group, articles: group.articles.filter(article =>
    !replaced.has(arabicEditorialPath(article.slug).replace(/\/+$/,'')) &&
    (mode !== 'guides' || guideSlugs.has(article.slug)) && (!query.trim() || normalize(JSON.stringify(article)).includes(normalize(query.trim())))),
  }));
  const released=release.filter(e=>!query.trim()||normalize(`${e.visibleTitle} ${e.description}`).includes(normalize(query.trim())));
  const total = groups.reduce((n, g) => n + g.articles.length, released.length);
  return (
    <main className="container section" lang="ar" dir="rtl" data-testid="page-arabic-library">
      <p className="mbh-kicker">{c.kicker}</p>
      <h1 data-testid="text-arabic-library-title">{mode === 'search' ? 'البحث في المقالات والأدلة' : mode === 'guides' ? 'أدلة عملية لمالك العقار' : c.h1}</h1>
      <p>{c.intro}</p>
      <p className="translation-review-status" role="note">{c.note}</p>
      <label htmlFor="arabic-library-search">ابحث في النصوص العربية</label>
      <input id="arabic-library-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="مثال: رطوبة أو مطبخ أو عزل" data-testid="input-arabic-search" style={{ display: 'block', width: 'min(100%, 38rem)', padding: '.8rem', marginBlock: '.5rem 1.5rem' }} />
      <p role="status" aria-live="polite">{total} من المقالات مطابقة</p>
      {total === 0 && <p>لا توجد نتيجة مطابقة. جرّب كلمة أخرى أو امسح البحث لعرض المقالات.</p>}
      {released.length>0&&<section aria-labelledby="ar-release-guides" style={{marginBlock:'2.5rem'}}>
        <h2 id="ar-release-guides">أدلة البناء والترميم وشراء العقار</h2>
        <ul style={{listStyle:'none',padding:0,display:'grid',gap:'1rem'}}>
          {released.map(entry=><li key={entry.id} style={{borderTop:'1px solid var(--line)',paddingTop:'1rem'}}>
            <h3><Link href={withCampaignParams(entry.path)}>{entry.visibleTitle}</Link></h3>
            <p>{entry.description}</p>
            <Link href={withCampaignParams(entry.path)} className="text-link">{c.read}<ArrowLeft size={13} aria-hidden="true"/></Link>
          </li>)}
        </ul>
      </section>}
      {groups.filter(g => g.articles.length).map(group => (
        <section key={group.id} aria-labelledby={`ar-group-${group.id}`} style={{ marginBlock: '2.5rem' }}>
          <h2 id={`ar-group-${group.id}`}>{group.heading}</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
            {group.articles.map(article => (
              <li key={article.slug} style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }} data-testid={`card-arabic-article-${article.slug}`}>
                <h3 style={{ margin: '0 0 .4rem' }}><Link href={withCampaignParams(arabicEditorialPath(article.slug))}>{article.h1}</Link></h3>
                <p style={{ margin: '0 0 .5rem' }}>{article.description}</p>
                <Link href={withCampaignParams(arabicEditorialPath(article.slug))} className="text-link">{c.read} <ArrowLeft size={13} aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <nav aria-label="التصنيفات والموضوعات" style={{ marginBlock: '2.5rem' }}>
        <h2>التصنيفات والموضوعات</h2>
        <ul className="footer-links">{ARABIC_ARCHIVES.map(archive => <li key={archive.slug}>
          <Link href={withCampaignParams(arabicArchivePath(archive))}>{archive.h1}</Link>
        </li>)}</ul>
      </nav>
    </main>
  );
}
