import { useContext, useId, type ReactNode } from 'react';
import { ImageDisclosure } from '../ImageDisclosure';
import { LibraryLocale } from '@/localization/library-context';
import { heroDescription, imageDescription } from '@/content/image-descriptions';

/** alt may be '' only when the image is decorative and the surrounding text already says everything. */
type Props = {
  name: string; widths: number[]; sizes: string; alt: string; width: number; height: number;
  eager?: boolean; className?: string;
  /** Single original file (no derivatives exist); used instead of /media/home/{name}-{w}.webp. */
  src?: string;
};

export function IllustrativeImage({ name, widths, sizes, alt, width, height, eager, className, src }: Props) {
  const locale = useContext(LibraryLocale);
  const base = import.meta.env.BASE_URL;
  const srcSet = src ? undefined : widths.map((w) => `${base}media/home/${name}-${w}.webp ${w}w`).join(', ');
  const fallback = src ? `${base}${src.replace(/^\//, '')}` : `${base}media/home/${name}-${widths[widths.length - 1]}.webp`;
  return <figure className={`mb-media ${className ?? ''}`}>
    <img src={fallback} srcSet={srcSet} sizes={src ? undefined : sizes} alt={imageDescription(fallback, locale, alt)} width={width} height={height}
      loading={eager ? 'eager' : 'lazy'} decoding={eager ? 'sync' : 'async'} {...(eager ? { fetchPriority: 'high' as const } : {})} />
    <figcaption><ImageDisclosure src={fallback} /></figcaption>
  </figure>;
}

/**
 * Local Cefalù correction of the owner-supplied AI illustration, 1672×941.
 * Cathedral-left placement approved by the owner. Derivatives are never upscaled. The mobile crop
 * retains the stone building and Cefalù; high-DPR / wide screens need a larger original.
 */
export function HeroPhoto({ children, altLocale }: { children: ReactNode; altLocale: string }) {
  const base = `${import.meta.env.BASE_URL}media/home/cefalu-hero-left`;
  const labelId = useId();
  return <><section className="mbh-hero" data-testid="section-hero" aria-describedby={labelId}>
    <div className="mbh-hero__stage">
      <picture>
        <source media="(max-width: 699px)" type="image/avif" srcSet={`${base}-mobile-450.avif 450w, ${base}-mobile-900.avif 900w`} sizes="100vw" width={900} height={941} />
        <source media="(max-width: 699px)" type="image/webp" srcSet={`${base}-mobile-450.webp 450w, ${base}-mobile-900.webp 900w`} sizes="100vw" width={900} height={941} />
        <source type="image/avif" srcSet={`${base}-768.avif 768w, ${base}-1280.avif 1280w, ${base}-1672.avif 1672w`} sizes="100vw" />
        <source type="image/webp" srcSet={`${base}-768.webp 768w, ${base}-1280.webp 1280w, ${base}-1672.webp 1672w`} sizes="100vw" />
        <img src={`${base}-1672.jpg`} sizes="100vw" alt={heroDescription(altLocale) ?? ''} aria-hidden={heroDescription(altLocale) ? undefined : true} width={1672} height={941} loading="eager" decoding="sync" fetchPriority="high" />
      </picture>
      <span className="mbh-hero__shade" aria-hidden="true" />
    </div>
    <div className="mbh-wrap mbh-hero__inner">{children}</div>
  </section><div id={labelId} className="mbh-image-note"><ImageDisclosure src={`${base}-1672.jpg`} className="image-disclosure--hero" /></div></>;
}
