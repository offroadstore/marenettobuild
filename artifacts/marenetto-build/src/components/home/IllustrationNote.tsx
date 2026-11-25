import { noticeCopy, legalPath } from '@/content/legal-notices';
import { Link } from 'wouter';
/** Localized fallback for unpublished historical review languages. */
export const illustrationNotes: Record<string, string> = {
  it: 'Immagini illustrative generate con IA; non rappresentano lavori eseguiti.',
  en: 'Illustrative images generated with AI; they do not depict completed work.',
  fr: 'Images illustratives générées par IA ; elles ne représentent pas des travaux réalisés.',
  de: 'KI-generierte illustrative Bilder; sie zeigen keine ausgeführten Arbeiten.',
  nl: 'Illustratieve beelden gegenereerd met AI; ze tonen geen uitgevoerde werkzaamheden.',
  es: 'Imágenes ilustrativas generadas con IA; no representan trabajos realizados.',
  pt: 'Imagens ilustrativas geradas com IA; não representam trabalhos realizados.',
  ru: 'Иллюстративные изображения созданы с помощью ИИ; они не показывают выполненные работы.',
  pl: 'Ilustracje wygenerowane przez AI; nie przedstawiają wykonanych prac.',
  ro: 'Imagini ilustrative generate cu IA; nu reprezintă lucrări executate.',
  uk: 'Ілюстративні зображення створено за допомогою ШІ; вони не показують виконаних робіт.',
  cs: 'Ilustrativní obrázky vytvořené pomocí AI; nezobrazují provedené práce.',
  sk: 'Ilustračné obrázky vytvorené pomocou AI; nezobrazujú vykonané práce.',
  sl: 'Ilustrativne slike, ustvarjene z umetno inteligenco; ne prikazujejo izvedenih del.',
  hr: 'Ilustrativne slike generirane umjetnom inteligencijom; ne prikazuju izvedene radove.',
  sr: 'Илустративне слике генерисане вештачком интелигенцијом; не приказују изведене радове.',
  bg: 'Илюстративни изображения, генерирани с ИИ; не представят извършени работи.',
  bs: 'Ilustrativne slike generirane umjetnom inteligencijom; ne prikazuju izvedene radove.',
  mk: 'Илустративни слики генерирани со ВИ; не прикажуваат изведени работи.',
  be: 'Ілюстрацыйныя выявы створаны з дапамогай ШІ; яны не паказваюць выкананых работ.',
  ar: 'صور توضيحية مولّدة بالذكاء الاصطناعي؛ لا تمثّل أعمالًا منفّذة.',
  he: 'תמונות המחשה שנוצרו באמצעות בינה מלאכותית; אינן מציגות עבודות שבוצעו.',
  sv: 'Illustrativa bilder skapade med AI; de visar inte utförda arbeten.',
  no: 'Illustrasjonsbilder generert med KI; de viser ikke utført arbeid.',
  da: 'Illustrative billeder genereret med AI; de viser ikke udført arbejde.',
  fi: 'Tekoälyllä luodut havainnekuvat eivät esitä toteutettuja töitä.',
  hu: 'MI-vel létrehozott illusztrációk; nem mutatnak be elvégzett munkákat.',
  el: 'Ενδεικτικές εικόνες δημιουργημένες με ΤΝ· δεν απεικονίζουν εκτελεσμένες εργασίες.',
  tr: 'Yapay zekâ ile oluşturulmuş temsili görseller; tamamlanmış işleri göstermez.',
};

/** General disclosure complements, never replaces, individual image labels. */
export function IllustrationNote({ lang }: { lang: string }) {
  const copy = noticeCopy[lang];
  if (copy) return <p className="footer-image-note" lang={lang} data-testid="illustration-note">{copy.footer} <Link href={legalPath(lang, 'ai')}>{copy.ai}</Link></p>;
  const text = illustrationNotes[lang];
  if (!text) throw new Error(`Missing illustration disclosure for locale ${lang}`);
  return <p className="footer-image-note" lang={lang} data-testid="illustration-note">{text}</p>;
}
