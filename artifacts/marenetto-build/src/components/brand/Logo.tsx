import '@/styles/brand.css';

/*
 * Marenetto Build logo, approved by the owner on 18 November 2026.
 * Monogram (viewBox -2 -6 106 106, stroke 12, miter joins, butt caps):
 *   copper stroke  M50 50 L86 14 V64  — the roof pitch, drawn first
 *   carbon stroke  M14 94 V14 L90 90  — post and diagonal brace, drawn on top
 * Wordmark: MARENETTO in Archivo Expanded 700, with the copper BUILD band below.
 * Colours: carbon #1E1D1B, copper #B5623A, lime white #F4F0E8.
 * All sizes derive from --logo-h (the rendered height of the monogram).
 */

const ROOF = 'M50 50 L86 14 V64';
const FRAME = 'M14 94 V14 L90 90';

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="-2 -6 106 106" aria-hidden="true" focusable="false">
    <path d={ROOF} fill="none" stroke="#B5623A" strokeWidth="12" strokeLinejoin="miter" strokeLinecap="butt" />
    <path d={FRAME} fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="miter" strokeLinecap="butt" />
  </svg>;
}

export function Logo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return <span className={`mb-logo mb-logo--${variant}`} dir="ltr">
    <svg className="mb-logo__mark" viewBox="-2 -6 106 106" aria-hidden="true" focusable="false">
      <path className="mb-logo__roof" d={ROOF} />
      <path className="mb-logo__frame" d={FRAME} />
    </svg>
    <span className="mb-logo__words" aria-hidden="true">
      <span className="mb-logo__name">MARENETTO</span>
      <span className="mb-logo__bar"><span className="mb-logo__build">BUILD</span></span>
    </span>
  </span>;
}
