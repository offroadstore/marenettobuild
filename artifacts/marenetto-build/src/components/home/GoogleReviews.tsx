import { GOOGLE_REVIEWS_URL, googleReviewsCopy } from '@/config/google-reviews';

/** A plain outbound link: no widget, remote assets, ratings or reviewer data. */
export function GoogleReviews({ locale, heading: Heading = 'h2' }: { locale: string; heading?: 'h1' | 'h2' }) {
  const copy = googleReviewsCopy[locale];
  if (!copy) throw new Error(`Missing Google reviews copy for ${locale}`);
  return <div className="mbx-reviews" data-testid="google-reviews">
    <Heading id="mbx-reviews-h" className="mbx-reviews__h">{copy.heading}</Heading>
    <a className="mbx-reviews__link" href={GOOGLE_REVIEWS_URL}
      target="_blank" rel="noopener noreferrer" data-testid="google-reviews-link">{copy.button}</a>
  </div>;
}
