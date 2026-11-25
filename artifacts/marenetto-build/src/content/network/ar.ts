import type { NetworkCopy } from './types';
import { arArticlesA } from './ar-a';
import { arArticlesB } from './ar-b';
import { arabicNetworkSeo } from '@/localization/arabic-seo.mjs';

// Arabic network edition (MSA). AI-assisted translation; no native-speaker or professional certification.
const ar: NetworkCopy = {
  nav: 'شبكة المهنيين لدينا', home: 'الرئيسية', contents: 'في هذا الدليل',
  faq: 'أسئلة شائعة', checklist: 'ما الذي ينبغي تجهيزه', sources: 'المصادر والفحوص',
  related: 'تابعوا عبر الشبكة', contact: 'لنتحدث عن مشروعكم', services: 'خدمات البناء',
  furniture: 'أثاث خرساني حسب الطلب حول العالم',
  illustration: 'صورة توضيحية · مولّدة بالذكاء الاصطناعي',
  reviewNotice: 'مسودة تحريرية قيد المراجعة. فحص المستندات ليس استشارة فنية أو قانونية بشأن عقاركم؛ ولم تُسجَّل أي مراجعة مهنية مستقلة.',
  scope: 'البناء والترميم والأنظمة الإشعاعية والتشطيبات أساسًا ضمن نحو 60 كم من تشيفالو ومنطقة مادونيه والساحل. أما المشاريع الأبعد فنقيّمها عند الطلب بعرض سعر خاص. ويُقدَّم الأثاث الخرساني حسب الطلب في أنحاء العالم، مع شحن أو تركيب وخدمات لوجستية يُتفق عليها لكل حالة.',
  directHeading: 'أعمال ننفذها بأنفسنا',
  direct: 'الأرضيات الإشعاعية والجدران والقواطع الإشعاعية والتشطيبات والتفاصيل الخاصة حسب الطلب خدمات مباشرة لـ Marenetto Build. ولا يعني ذلك تصميمًا داخليًا أو تراخيص لكل تركيب أو صلاحية إصدار أي شهادة: تُحدَّد التكليفات والفحوص والمستندات لكل عمل.',
  coordinatedHeading: 'خبرات وفئات منسقة',
  coordinated: 'يشارك المساحون (geometri) والمعماريون والمهندسون والجيولوجيون والسباكون والكهربائيون والنجارون ومنسقو الحدائق وغيرهم من الشركات المتخصصة بحسب الحاجة والتكليف. وللفئات الأخرى التي تقدمها الشركة أو الشبكة، نوضح من ينفذ كل خدمة قبل أي اتفاق، من دون نسبتها كلها إلى موظفين داخليين.',
  articles: { ...arArticlesA, ...arArticlesB },
};
for (const [id, metadata] of Object.entries(arabicNetworkSeo)) {
  const article = ar.articles[id as keyof typeof ar.articles];
  if (!article) throw new Error(`Missing Arabic network article: ${id}`);
  article.seoTitle = metadata.title;
  article.description = metadata.description;
}
export default ar;
