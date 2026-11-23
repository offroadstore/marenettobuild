import mottos from '@/content/brand-mottos.json';
import { getLocale, getLocaleDirection } from '@/localization/locales';

/** Dedicated copy: never pass these owner-approved expressions through catalog fallback. */
export function BrandMotto({ locale, placement }: { locale: string; placement: 'home' | 'footer' }) {
  if (getLocale(locale)?.publication !== 'published' || !(locale in mottos)) return null;
  const text = mottos[locale as keyof typeof mottos].corporate;
  return <p className={`brand-motto brand-motto--${placement}`} lang={locale} dir={getLocaleDirection(locale)}
    data-brand-motto="corporate" data-motto-placement={placement}>{text}</p>;
}
