import '@/styles/brand.css';

/** Diagonal M monogram adapted from the supplied banner; font independent. Not used for the site header. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4 43 43M5 37V13l17 16M28 16 43 3v29" />
    </g>
  </svg>;
}

const SRC = `${import.meta.env.BASE_URL}brand/current-logo.png`;

/**
 * Hybrid logo chosen by the owner: the thin historical M and the spaced MARENETTO are the
 * unmodified historical raster (public/brand/current-logo.png, 1536x560), shown through two
 * CSS crop windows; BUILD.COM sits below the name in a bar, as in public/brand/design-reference.png.
 * Neither original file is altered and nothing is redrawn. Source coordinates (px in the PNG):
 *   M monogram  x 260-451, y 181-374  (191x193)
 *   MARENETTO   x 510-1307, y 246-322 (797x76)
 * All sizes derive from --logo-h (rendered height of the M).
 */
export function Logo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return <span className={`mb-logo mb-logo--${variant}`} dir="ltr">
    <span className="mb-logo__crop mb-logo__crop--m"><img src={SRC} alt="" width={1536} height={560} decoding="async" /></span>
    <span className="mb-logo__stack">
      <span className="mb-logo__crop mb-logo__crop--name"><img src={SRC} alt="" width={1536} height={560} decoding="async" /></span>
      <span className="mb-logo__bar" aria-hidden="true">BUILD.COM</span>
    </span>
  </span>;
}
