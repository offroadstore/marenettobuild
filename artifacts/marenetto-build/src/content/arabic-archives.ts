import { ARABIC_EDITORIAL_ARTICLES, arabicEditorialPath } from './arabic-editorial';

type Archive = { sourcePath: string; slug: string; h1: string; title: string; description: string; articleSlugs: string[]; kind?: 'reviews' | 'turnkey' };
const all = ARABIC_EDITORIAL_ARTICLES.map(a => a.slug);
const building = ['buying-renovating-five-checks', 'building-company-cefalu', 'ten-year-building-insurance', 'insulation-thermal-plaster', 'microcement-renovation', 'decorative-resin-flooring', 'structural-deformation'];
const outdoor = ['outdoor-concrete-flooring', 'mediterranean-garden-design', 'stonework-and-facades', 'pools-and-ornamental-ponds', 'bespoke-masonry-kitchens'];
const leak = ['water-leaks-damp-investigation'];
const surf = ['decorative-resin-flooring', 'microcement-renovation', 'outdoor-concrete-flooring'];
const brand = ' | Marenetto Build';
const searchTitles: Record<string, string> = {
  'general-contractor': 'المقاول العام وتنسيق أعمال العقار بتشفالو',
  'building-work': 'تنظيم الموقع وأعمال البناء والتجديد بصقلية',
  'outdoor-garden-design': 'المساحات الخارجية والحدائق: مقالات صقلية',
  'assistance-repairs': 'فحص الرطوبة والأعطال وإصلاح العقار بتشفالو',
  'topics/building-cefalu': 'مقالات البناء والعقار في تشفالو وصقلية',
  'topics/thermography': 'التصوير الحراري وفحص رطوبة العقار بتشفالو',
  'topics/microcement': 'الميكروسيمنت وتجديد الأسطح والأثاث المخصص',
  'topics/isoplam': 'أنظمة Isoplam والأرضيات والتشطيبات بصقلية',
  reviews: 'آراء العملاء ورابط مراجعات Google للشركة',
};
const entry = (sourcePath: string, slug: string, h1: string, title: string, description: string, articleSlugs: string[], kind?: Archive['kind']): Archive =>
  ({ sourcePath, slug, h1, title: (searchTitles[slug] ?? title) + brand, description, articleSlugs, kind });

/** Arabic counterparts of existing archives: translated cards, never copied Italian bodies. */
export const ARABIC_ARCHIVES: Archive[] = [
  entry('/general-contractor/', 'general-contractor', 'المقاول العام وتنسيق الأعمال', 'المقاول العام وتنسيق أعمال العقار في تشفالو', 'مقالات عن تنسيق البناء والتجديد والصيانة في تشفالو، مع فصل دور المقاول عن مهام المهنيين المرخّصين. استكشف الموضوعات وحدود المعلومات قبل مناقشة مشروعك.', all),
  entry('/edilizia-e-ristrutturazioni/', 'building-renovation', 'البناء والتجديد', 'مقالات البناء وتجديد العقارات في تشفالو', 'مقالات عربية عن فحص المباني والتجديد والعزل والتشطيبات في تشفالو. أسئلة للمختصين ومقارنات أولية، لا تشخيص لعقارك أو موافقة على أعمال أو حوافز أو تأمين.', building),
  entry('/bonus-edilizi-e-permessi/', 'permits-incentives', 'التصاريح والحوافز: ما ينبغي التحقق منه', 'التصاريح والحوافز لتجديد عقار في صقلية', 'معلومات أولية عن وثائق العقار والتصاريح والحوافز عند التجديد في صقلية. تُراجع القواعد النافذة والأهلية مع المهني المكلّف؛ لا توجد موافقة أو إعفاء مضمون.', ['buying-renovating-five-checks', 'building-company-cefalu', 'insulation-thermal-plaster']),
  entry('/cantieri-e-lavori/', 'building-work', 'الموقع والأعمال: معلومات قبل التنفيذ', 'تنظيم الموقع وأعمال البناء والتجديد في صقلية', 'مقالات عن تنظيم الموقع وفحص الهيكل والمواد والتجديد. هذا قسم معلوماتي، لا معرض لمشاريع منفذة أو عملاء؛ تُحدَّد الأعمال والمسؤوليات والعرض لكل مشروع.', ['building-company-cefalu', 'structural-deformation', 'stonework-and-facades']),
  entry('/outdoor-e-garden-design/', 'outdoor-garden-design', 'المساحات الخارجية وتنسيق الحدائق', 'المساحات الخارجية والحدائق: مقالات في صقلية', 'مقالات عن الحدائق والمسابح والحجر والمطابخ والأرضيات الخارجية. افهم علاقة المواد والصرف والوصول والصيانة بالتصميم، مع التحقق من ملاءمة كل حل للموقع.', outdoor),
  entry('/assistenza-e-pronto-intervento/', 'assistance-repairs', 'المساعدة الفنية والإصلاحات', 'فحص الأعطال والرطوبة وإصلاح العقار في تشفالو', 'مقالات عن فحص التسربات والرطوبة وتنسيق الإصلاح والصيانة في تشفالو. تعرّف إلى حدود الأدوات والتقارير، دون وعد بتشخيص فوري أو استجابة على مدار الساعة.', [...leak, 'property-maintenance']),
  entry('/tag/edilizia-cefalu/', 'topics/building-cefalu', 'أعمال البناء في تشفالو', 'مقالات أعمال البناء والعقار في تشفالو وصقلية', 'استكشف موضوعات البناء في تشفالو: حالة العقار والمواد والتصاريح والهيكل. تساعد المقالات على تنظيم الأسئلة ولا تستبدل فحصاً ميدانياً أو رأي مهني مكلّف.', building),
  entry('/tag/impresa-edile-cefalu/', 'topics/building-company-cefalu', 'اختيار شركة بناء في تشفالو', 'اختيار شركة بناء وتنسيق التجديد في تشفالو', 'كيف تناقش الأعمال مع شركة بناء في تشفالو؟ اقرأ عن نطاق المشروع والوصول والميزانية والمسؤوليات والمستندات، دون افتراض مدة أو ضمان أو اعتماد غير موثّق.', ['building-company-cefalu', 'buying-renovating-five-checks']),
  entry('/tag/endoscopio/', 'topics/endoscope', 'المنظار والفحص المرئي', 'المنظار وفحص التسربات والرطوبة في المباني', 'اقرأ عن استخدام المنظار للوصول إلى أجزاء من أنبوب أو تجويف، وحدود الرؤية وتفسير النتيجة. اختيار الأداة والفحوص والتقرير المطلوب يُحدَّد حسب حالة المبنى.', leak),
  entry('/tag/geofono/', 'topics/acoustic-leak-testing', 'الجيوفون والبحث الصوتي عن التسرب', 'الجيوفون والبحث عن تسربات المياه بالمبنى', 'الفحص الصوتي قد يساعد في بحث تسرب أنابيب مضغوطة وفق المواد والضغط والضوضاء والوصول. تعرّف إلى حدوده دون وعد بإيجاد كل تسرب أو تجنب فتح الجدران.', leak),
  entry('/tag/igrometro/', 'topics/moisture-meter', 'قياس الرطوبة في مواد المبنى', 'قياس الرطوبة وفهم علامات تدهور المباني', 'ما الذي توضحه قراءة جهاز الرطوبة وما الذي لا تثبته؟ مقالة عن دمج القياس مع المعاينة وظروف المبنى للتمييز بين الفرضيات قبل اقتراح إصلاح مناسب للحالة.', leak),
  entry('/tag/termografia/', 'topics/thermography', 'التصوير الحراري للمباني', 'التصوير الحراري وفحص رطوبة العقار في تشفالو', 'التصوير الحراري يبيّن فروق حرارة سطحية تحتاج إلى تفسير مع فحوص أخرى. اقرأ عن حدوده في بحث الرطوبة والتسرب، دون اعتباره شهادة سلامة أو تشخيصاً منفرداً.', leak),
  entry('/tag/termo-camera/', 'topics/thermal-camera', 'الكاميرا الحرارية ضمن الفحص', 'الكاميرا الحرارية وفحص مباني تشفالو وصقلية', 'كيف تدخل الكاميرا الحرارية في دراسة الرطوبة؟ تعرّف إلى مؤشرات الحرارة وظروف القياس وما يستلزم تحققاً إضافياً، دون ضمان تحديد مصدر العطل من الصورة وحدها.', leak),
  entry('/tag/garden/', 'topics/gardens', 'الحدائق المتوسطية والمساحات المفتوحة', 'الحدائق المتوسطية وتنظيم المساحات في صقلية', 'موضوعات عن تصميم الحديقة والظل والمسارات والمواد والمياه والزراعة. ابدأ باحتياجات الموقع والصيانة والتصاريح، لا بافتراض أن كل فكرة تناسب أي عقار.', ['mediterranean-garden-design', 'pools-and-ornamental-ponds']),
  entry('/tag/pavimento-in-resina/', 'topics/resin-flooring', 'الأرضيات الراتنجية الزخرفية', 'الأرضيات الراتنجية والملمس واللون للمبنى', 'مقالات عن اختيار الأرضيات الراتنجية والزخرفية والركيزة والحماية والتشطيب. تُحدَّد ملاءمة النظام ومقاومته واستعماله الداخلي أو الخارجي من وثائقه الفعلية.', surf),
  entry('/tag/resina/', 'topics/resins', 'الراتنجات والطلاءات الواقية', 'الراتنجات وحماية الأسطح والتشطيبات بالمبنى', 'افهم دور الراتنج والطلاء الواقي في التشطيب والصيانة، والفرق بين التسميات العامة والأنظمة المحددة. لا يُنسب أداء أو مقاومة إلى مادة دون وثائق مناسبة.', surf),
  entry('/tag/microcemento/', 'topics/microcement', 'الميكروسيمنت والتجديد الرقيق', 'الميكروسيمنت وتجديد الأسطح والأثاث حسب الطلب', 'مقالات عن الميكروسيمنت والركيزة والتشطيب والحماية والصيانة، وما يلزم بحثه قبل التغطية فوق سطح قائم أو اختيار أثاث. لا تعني السماكة القليلة صلاحية كل حالة.', ['microcement-renovation', 'bespoke-masonry-kitchens']),
  entry('/tag/microverlay/', 'topics/microverlay', 'نظام Microverlay وحدود الاستخدام', 'نظام Microverlay وتجديد الأسطح في صقلية', 'مقالة عن نظام Microverlay والتحضير والطبقات والحماية والفروق مع البلاط والخشب. تُراجع ورقة النظام والركيزة والاستخدام دون الادعاء باعتماد مهني للشركة.', ['microcement-renovation']),
  entry('/tag/isoplam/', 'topics/isoplam', 'أنظمة Isoplam المذكورة في المقالات', 'أنظمة Isoplam والأرضيات والتشطيبات في صقلية', 'استكشف الإشارات إلى أنظمة Isoplam للأرضيات والميكروسيمنت. أسماء المنتجات ليست اعتماداً للشركة أو مواصفة مكتملة؛ تُراجع الوثائق والتوافق والاستخدام.', ['microcement-renovation', 'outdoor-concrete-flooring', 'decorative-resin-flooring']),
  entry('/tag/costruzione/', 'topics/construction', 'البناء والهيكل والتجديد', 'البناء والهيكل وتجديد العقارات في صقلية', 'مقالات عن البناء والهيكل والمواد وتنظيم التجديد. تعرّف إلى الأسئلة والفحوص والأدوار المهنية قبل العمل، دون تحويل المعلومات العامة إلى تصميم أو ضمان.', ['structural-deformation', 'building-company-cefalu']),
  entry('/recensioni/', 'reviews', 'آراء العملاء على Google', 'آراء العملاء ورابط Google حول Marenetto Build', 'يمكنك الانتقال إلى آراء العملاء على Google. إن توفرت مراجعات مباشرة تظهر بلغتها الأصلية مع مصدرها؛ لا نختلق تعليقات أو تقييمات أو أسماء عملاء أو أعداداً.', [], 'reviews'),
  entry('/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto/', 'turnkey-renovation', 'التجديد المتكامل في تشفالو وصقلية', 'التجديد المتكامل وتنظيم مشروعك في تشفالو', 'من تحديد الأعمال إلى التشطيبات والتسليم المتفق عليه: تعرّف إلى التجديد المتكامل في تشفالو، مع مهام واضحة للمختصين ونطاق مكتوب دون وعود شاملة غير محددة.', ['building-company-cefalu', 'buying-renovating-five-checks', 'property-maintenance'], 'turnkey'),
];
export const arabicArchivePath = (archive: Archive) => `/ar/${archive.slug}`;
export const arabicArchiveByPath = (path: string) => ARABIC_ARCHIVES.find(a => arabicArchivePath(a) === path.replace(/\/+$/, ''));
export const arabicArchiveArticles = (archive: Archive) => archive.articleSlugs.map(slug => {
  const article = ARABIC_EDITORIAL_ARTICLES.find(a => a.slug === slug);
  if (!article) throw new Error(`Missing Arabic archive article: ${slug}`);
  return { ...article, path: arabicEditorialPath(article.slug) };
});
export type { Archive as ArabicArchive };
