import '@/styles/brand.css';

/** Diagonal M monogram adapted from the supplied banner; font independent. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4 43 43M5 37V13l17 16M28 16 43 3v29" />
    </g>
  </svg>;
}

/** Historical banner logo (thin diagonal M + spaced MARENETTO), served locally. */
export function Logo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return <span className={`mb-logo mb-logo--${variant}`}>
    <img className="mb-logo__img" src={`${import.meta.env.BASE_URL}brand/current-logo.png`} alt="" width={1536} height={560} decoding="async" />
  </span>;
}
