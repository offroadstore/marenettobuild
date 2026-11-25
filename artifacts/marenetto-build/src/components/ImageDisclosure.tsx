import { useContext } from 'react';
import { useLocation } from 'wouter';
import { noticeCopy } from '@/content/legal-notices';
import { LibraryLocale } from '@/localization/library-context';
import { imageClassification } from '@/config/image-provenance';
export function ImageDisclosure({src, lang, className = ''}: {src: string; lang?: string; className?: string}) {
  const contextLocale = useContext(LibraryLocale);
  const [path] = useLocation();
  const locale = lang ?? path.match(/^\/(?:__localization-review\/)?([a-z]{2})(?:\/|$)/)?.[1] ?? contextLocale;
  const copy = noticeCopy[locale];
  if (!copy || imageClassification(src) === 'brand') return null;
  return <span className={`image-disclosure ${className}`} lang={locale} data-image-disclosure={imageClassification(src)}>
    {imageClassification(src).startsWith('ai-') ? copy.aiLabel : copy.unknownLabel}
  </span>;
}
