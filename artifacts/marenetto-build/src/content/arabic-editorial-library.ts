// Arabic article library metadata (frontend-owned). Groups the parent's new Arabic adaptations
// by their source family; these groups replace, for Arabic readers, the historical category
// archives. No historical source record is created or altered.
import { buildingArticles } from './arabic-editorial/building';
import { finishesArticles } from './arabic-editorial/finishes';
import { outdoorArticles } from './arabic-editorial/outdoor';

export const ARABIC_LIBRARY_PATH = '/ar/articles';
export const arabicLibraryCopy = {
  title: 'مقالات عن البناء والترميم في صقلية | Marenetto Build',
  description: 'مقالات عربية عن البناء والترميم والتشطيبات والمساحات الخارجية في تشيفالو وصقلية، أُعدّت بمساعدة الذكاء الاصطناعي ومُقارنة بالمصدر الإيطالي الأصلي.',
  kicker: 'المقالات',
  h1: 'مقالات عن البناء والترميم والمساحات الخارجية',
  intro: 'نصوص عربية جديدة مبنية على مقالات Marenetto Build الإيطالية. ليست ترجمة حرفية للأصل التاريخي: حيث كان الأصل يطلق ادعاءات غير موثقة، صغنا المعلومة بحذر أو حددنا شروطها.',
  note: 'أُعدّت هذه النصوص بمساعدة الذكاء الاصطناعي ورُوجعت آليًا مقابل المصدر؛ لا توجد مصادقة من متحدث أصلي أو من مهني مختص. لا تغني عن معاينة الموقع أو رأي مهني مؤهل.',
  read: 'اقرأ المقال',
  source: 'المصدر الإيطالي',
  empty: 'لا توجد مقالات عربية منشورة حاليًا.',
};
export const arabicLibraryGroups = [
  { id: 'building', heading: 'البناء والترميم والفحوص', articles: buildingArticles },
  { id: 'finishes', heading: 'التشطيبات والأسطح', articles: finishesArticles },
  { id: 'outdoor', heading: 'المساحات الخارجية والحدائق', articles: outdoorArticles },
];
