/**
 * Arabic interface overrides for English/Italian shared strings that have no catalog id
 * (inline localizeChoice/translateText sources). AI-assisted translation, not native-certified.
 * Keys are the normalized English (or Italian) source exactly as passed to translateText.
 */
export const arabicInterface: Record<string, string> = {
  'Tel': 'الهاتف',
  'Email': 'البريد الإلكتروني',
  'Your enquiry is emailed to info@marenetto.com. The site does not save form data in its database. Email sending is disabled in preview: do not enter real personal details.': 'يُرسَل استفساركم بالبريد الإلكتروني إلى info@marenetto.com. ولا يحفظ الموقع بيانات النموذج في قاعدة بياناته. الإرسال بالبريد معطّل في المعاينة: لا تُدخلوا بيانات شخصية حقيقية.',
  'You can also email info@marenetto.com, call or send a WhatsApp message to the company number.': 'يمكنكم أيضًا مراسلة info@marenetto.com، أو الاتصال، أو إرسال رسالة واتساب إلى رقم الشركة.',
  'Email sent': 'أُرسل البريد الإلكتروني',
  'Your enquiry has been sent to info@marenetto.com. Thank you for contacting us.': 'أُرسل استفساركم إلى info@marenetto.com. شكرًا لتواصلكم معنا.',
  'This form does not support document uploads.': 'لا يدعم هذا النموذج رفع المستندات.',
  'The form sends your enquiry by email without keeping a copy on the site.': 'يرسل النموذج استفساركم بالبريد الإلكتروني من دون الاحتفاظ بنسخة على الموقع.',
};
/** Strings that are already Arabic, or are numbers, dates, contact data, slugs, flags or brand tokens. */
export function isArabicNeutral(text: string) {
  return /\p{Script=Arabic}/u.test(text)
    || /^[\d\s+().:\-–—/·]+$/.test(text)
    || /^[\w.+-]+@[\w.-]+$/.test(text)
    || /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(text)
    || /^\p{Extended_Pictographic}|^[\u{1F1E6}-\u{1F1FF}]+$/u.test(text)
    || /^(?:WhatsApp|Marenetto Build(?:\.com)?|BUILD\.COM|Atelier Marenetto)(?: [\d\s+]+)?$/.test(text);
}
