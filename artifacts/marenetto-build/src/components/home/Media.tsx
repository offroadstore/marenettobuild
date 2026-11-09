type Props = { name: string; widths: number[]; sizes: string; alt: string; width: number; height: number; eager?: boolean; className?: string; lang: string };

export function IllustrativeImage({ name, widths, sizes, alt, width, height, eager, className, lang }: Props) {
  const srcSet = widths.map((w) => `/media/home/${name}-${w}.webp ${w}w`).join(', ');
  const fallback = `/media/home/${name}-${widths[widths.length - 1]}.webp`;
  return <figure className={`mb-media ${className ?? ''}`}>
    <img src={fallback} srcSet={srcSet} sizes={sizes} alt={alt} width={width} height={height}
      loading={eager ? 'eager' : 'lazy'} decoding={eager ? 'sync' : 'async'} {...(eager ? { fetchPriority: 'high' as const } : {})} />
    <figcaption className="mb-media__tag" data-testid={`label-illustrative-${name}`}>
      {lang === 'it' ? 'Immagine illustrativa · non portfolio' : 'Illustrative image · not a verified project'}
    </figcaption>
  </figure>;
}
