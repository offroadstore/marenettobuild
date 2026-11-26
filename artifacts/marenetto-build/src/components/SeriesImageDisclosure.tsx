import { networkCopy } from '@/content/network';
import { imageClassification } from '@/config/image-provenance';
import { ImageDisclosure } from './ImageDisclosure';

/** The reused fictional scenes must be called illustrations, not merely AI edits. */
export function SeriesImageDisclosure({ src, locale }: { src: string; locale: string }) {
  if (!src.startsWith('/api/network-media/') || imageClassification(src) !== 'ai-generated') {
    return <ImageDisclosure src={src} lang={locale} />;
  }
  return <span className="image-disclosure" lang={locale} data-image-disclosure="ai-generated">
    {networkCopy(locale).illustration}
  </span>;
}
