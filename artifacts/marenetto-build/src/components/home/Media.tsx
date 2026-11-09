import type { ReactNode } from 'react';

/** alt may be '' only when the image is decorative and the surrounding text already says everything. */
type Props = {
  name: string; widths: number[]; sizes: string; alt: string; width: number; height: number;
  eager?: boolean; className?: string;
  /** Single original file (no derivatives exist); used instead of /media/home/{name}-{w}.webp. */
  src?: string;
};

export function IllustrativeImage({ name, widths, sizes, alt, width, height, eager, className, src }: Props) {
  const srcSet = src ? undefined : widths.map((w) => `/media/home/${name}-${w}.webp ${w}w`).join(', ');
  const fallback = src ?? `/media/home/${name}-${widths[widths.length - 1]}.webp`;
  return <figure className={`mb-media ${className ?? ''}`}>
    <img src={fallback} srcSet={srcSet} sizes={src ? undefined : sizes} alt={alt} width={width} height={height}
      loading={eager ? 'eager' : 'lazy'} decoding={eager ? 'sync' : 'async'} {...(eager ? { fetchPriority: 'high' as const } : {})} />
  </figure>;
}

/**
 * Replaceable full-bleed photographic hero.
 * PREVIEW ONLY: currently fed with the historical illustrative hero (1920x1047, synthetic-style
 * sparkle, authorship unverified). Replace `name`/widths with a real, authorised photograph
 * (ideally >= 3200 px wide) before public release.
 * Above 1920 CSS px the raster is never upscaled: it stays at its native width, centred,
 * and blends into a matching dark backdrop.
 */
export function HeroPhoto({ children }: { children: ReactNode }) {
  return <section className="mbh-hero" data-testid="section-hero">
    <div className="mbh-hero__stage">
      <picture>
        <source media="(max-width: 699px)" srcSet="/media/home/hero-portrait-384.webp 384w, /media/home/hero-portrait-628.webp 628w" sizes="100vw" />
        <img src="/media/home/hero-1920.webp" srcSet="/media/home/hero-768.webp 768w, /media/home/hero-1280.webp 1280w, /media/home/hero-1920.webp 1920w"
          sizes="(min-width: 1920px) 1920px, (max-width: 1099px) 1210px, 100vw" alt="" width={1920} height={1047} loading="eager" decoding="sync" fetchPriority="high" />
      </picture>
      <span className="mbh-hero__shade" aria-hidden="true" />
    </div>
    <div className="mbh-wrap mbh-hero__inner">{children}</div>
  </section>;
}
