/** Single source of truth for the company contact number. */
export const COMPANY_PHONE = {
  e164: '+393339363007',
  waDigits: '393339363007',
  display: '+39 333 936 3007',
} as const;

export const telHref = `tel:${COMPANY_PHONE.e164}`;

export function whatsappHref(message: string): string {
  return `https://wa.me/${COMPANY_PHONE.waDigits}?text=${encodeURIComponent(message)}`;
}
