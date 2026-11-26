import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { type ArabicEditorialArticle } from '@/content/arabic-editorial';
import { ARABIC_LIBRARY_PATH, arabicLibraryCopy } from '@/content/arabic-editorial-library';
import { withCampaignParams } from '@/lib/campaign';
import { AreaBreadcrumb, AreaPillarLink } from '@/pages/four-areas';
import { historicalPending } from '@/content/historical';

/** All text comes from the reviewed Arabic composition; no source-language fallback. */
export function ArabicEditorialPage({ article }: { article: ArabicEditorialArticle }) {
  const pendingSource = historicalPending(article.sourcePath);
  const sourceHeld = pendingSource && !pendingSource.editorialCorrection;
  return <main lang="ar" dir="rtl" data-testid="page-arabic-article">
    <section className="page-hero article-hero">
      <div className="container">
        <AreaBreadcrumb locale="ar" article={article.id} title={article.h1} />
        <Link href={withCampaignParams(ARABIC_LIBRARY_PATH)} className="text-link back-link">
          <ArrowRight size={14} aria-hidden="true" />جميع المقالات
        </Link>
        <div className="article-head">
          <p className="eyebrow">المعرفة قبل التنفيذ</p>
          <h1 className="display-title" data-testid="text-arabic-article-title">{article.h1}</h1>
          <p className="article-lede">{article.intro}</p>
        </div>
      </div>
    </section>
    <section className="section tight">
      <div className="container article-layout">
        <article className="article-body" lang="ar" dir="rtl">
          {article.sections.map((section, i) => <section id={`section-${i + 1}`} key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, j) => <p key={j}>{paragraph}</p>)}
          </section>)}
          {article.faq && <section aria-labelledby="arabic-faq-title">
            <h2 id="arabic-faq-title">أسئلة شائعة</h2>
            {article.faq.map(([question, answer]) => <div key={question}><h3>{question}</h3><p>{answer}</p></div>)}
          </section>}
          <AreaPillarLink locale="ar" article={article.id} />
          <section className="review-note" aria-labelledby="arabic-source-title">
            <h2 id="arabic-source-title">المصدر وحدود النص</h2>
            <p>{arabicLibraryCopy.note}</p>
            <p>هذا نص عربي جديد، وليس نسخة عربية تاريخية مستردّة. صيغت الوعود المطلقة أو غير المثبتة في المصدر بصفتها مسائل تستلزم التحقق، لا ضمانات من الشركة.</p>
            {sourceHeld
              ? <p>{arabicLibraryCopy.source}: <bdi dir="ltr">{article.sourcePath}</bdi><br />مسار أرشيفي؛ لا ندرجه هنا رابطاً عاماً قبل اكتمال مراجعته.</p>
              : <a href={withCampaignParams(article.sourcePath)}>{arabicLibraryCopy.source}</a>}
          </section>
        </article>
        <aside className="article-aside" aria-label="تواصل">
          <h2>هل تدرس مشروعاً؟</h2>
          <p>ابدأ بموقع العقار ونوع العمل وبيانات التواصل. لا ترسل مستندات حساسة في الطلب الأول؛ تُناقش الفحوص والنطاق والشروط لاحقاً.</p>
          <Link href={withCampaignParams('/ar/request')} className="button">أرسل استفساراً <ArrowRight size={14} aria-hidden="true" /></Link>
          <Link href={withCampaignParams(ARABIC_LIBRARY_PATH)} className="text-link">العودة إلى المقالات</Link>
        </aside>
      </div>
    </section>
  </main>;
}
