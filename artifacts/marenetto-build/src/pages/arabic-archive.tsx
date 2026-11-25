import { Link } from 'wouter';
import { ArabicArchive, arabicArchiveArticles } from '@/content/arabic-archives';
import { GoogleReviews } from '@/components/home/GoogleReviews';
import { withCampaignParams } from '@/lib/campaign';

export function ArabicArchivePage({ archive }: { archive: ArabicArchive }) {
  return <main className="container section" lang="ar" dir="rtl" data-testid="page-arabic-archive">
    <nav aria-label="مسار التنقل"><Link href="/ar/">الرئيسية</Link> · <Link href="/ar/articles">المقالات</Link></nav>
    {archive.kind === 'reviews' ? <><GoogleReviews locale="ar" heading="h1" /><p>{archive.description}</p></> : <>
      <h1 className="display-title">{archive.h1}</h1>
      <p className="article-lede">{archive.description}</p>
      {archive.kind === 'turnkey' && <article className="article-body">
        <h2>نقطة تواصل ونطاق متفق عليه</h2>
        <p>يبدأ التجديد بتحديد احتياجات العقار والأعمال والمواد والمسؤوليات. يجمع النطاق المكتوب ما ننسّقه أو ننفذه وما يتطلب تكليف مهني أو شركة مؤهلة. لا تعني عبارة «متكامل» أن كل عمل أو توريد أو ترخيص مشمول تلقائياً.</p>
        <h2>الوثائق والتصميم والأعمال</h2>
        <p>يحدّد المهني المكلّف ما يلزم من CILA أو SCIA أو غيرهما من إجراءات، ومن يعدّها ويقدّمها. تشمل الأعمال المتفق عليها الإزالة والبناء والتشطيبات وتنسيق الأنظمة مع جهاتها المؤهلة، وفق وضع العقار والتصاريح اللازمة.</p>
        <h2>التشطيبات والتسليم والمتابعة</h2>
        <p>تُثبَّت المواد والعينات والأعمال النهائية والتنظيف ووثائق التسليم في الاتفاق. ويمكن مناقشة صيانة لاحقة بنطاق منفصل، دون وعد بمساندة غير محدودة أو حالة خالية من الأعطال.</p>
        <h2>المساعدة أثناء المشروع</h2>
        <p>اتفق مسبقاً على جهات الاتصال وساعات وطرق التعامل مع الطوارئ والقرارات والمصروفات. لا نعرض استجابة فورية أو خدمة على مدار الساعة أو معاينة مجانية أو موعد إنجاز غير محدد للمشروع.</p>
      </article>}
      <h2>مقالات هذا الموضوع</h2>
      <ul className="footer-links" style={{ listStyle: 'none', padding: 0 }}>
        {arabicArchiveArticles(archive).map(article => <li key={article.slug} style={{ marginBlock: '1.2rem' }}>
          <h3><Link href={withCampaignParams(article.path)}>{article.h1}</Link></h3><p>{article.description}</p>
        </li>)}
      </ul>
      <p role="note">معلومات عامة أُعدّت ورُوجعت بمساعدة الذكاء الاصطناعي، لا رأياً مهنياً بشأن عقار بعينه. لا يعرض هذا التصنيف مشاريع منفذة أو اعتمادات غير موثّقة.</p>
    </>}
    <p><Link href={withCampaignParams('/ar/request')}>ناقش مشروعك</Link> · <Link href="/ar/articles">جميع المقالات</Link></p>
  </main>;
}
