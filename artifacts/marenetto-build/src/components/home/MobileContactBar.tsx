import { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';

/** Mobile-only bottom bar (CSS hides it from 700px). Verified contacts already used in header/footer. */
export function MobileContactBar({ hidden, callLabel, writeLabel, emailHref }: { hidden: boolean; callLabel: string; writeLabel: string; emailHref: string }) {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && t.matches('input, textarea, select, [contenteditable="true"]');
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setTyping(true); };
    const onOut = (e: FocusEvent) => { if (isField(e.target)) setTyping(isField(e.relatedTarget)); };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => { document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut); };
  }, []);
  const off = hidden || typing;
  return <div className="mb-cbar" data-hidden={off ? 'true' : undefined} aria-hidden={off || undefined} data-testid="mobile-contact-bar">
    <a href="tel:+393339363007" tabIndex={off ? -1 : undefined} data-testid="cbar-call"><Phone size={17} aria-hidden="true" /><span>{callLabel}</span></a>
    <a href={emailHref} tabIndex={off ? -1 : undefined} data-testid="cbar-write"><Mail size={17} aria-hidden="true" /><span>{writeLabel}</span></a>
  </div>;
}
