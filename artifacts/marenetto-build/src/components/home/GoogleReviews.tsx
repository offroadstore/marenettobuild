import { useEffect, useState } from 'react';
import { getGoogleReviews, type GooglePlaceReviews } from '@workspace/api-client-react';
import { GOOGLE_REVIEWS_URL, googleReviewsCopy } from '@/config/google-reviews';
import { googleReviewsDetails } from '@/config/google-reviews-details';

/** Always SSRs the existing link. Fresh reviews are client-requested, never built into HTML. */
export function GoogleReviews({ locale, heading: Heading = 'h2' }: { locale: string; heading?: 'h1' | 'h2' }) {
  const [data, setData] = useState<GooglePlaceReviews | null>(null);
  useEffect(() => {
    let active = true;
    setData(null);
    if (googleReviewsDetails[locale]) {
      // No query cache, localStorage, service worker or polling of Google content.
      void getGoogleReviews({ cache: 'no-store', signal: AbortSignal.timeout(9000) })
        .then(result => { if (active) setData(result.data); })
        .catch(() => { if (active) setData(null); });
    }
    return () => { active = false; };
  }, [locale]);
  return <GoogleReviewsView locale={locale} heading={Heading} data={data} />;
}

export function GoogleReviewsView({ locale, heading: Heading = 'h2', data }: {
  locale: string; heading?: 'h1' | 'h2'; data: GooglePlaceReviews | null;
}) {
  const copy = googleReviewsCopy[locale];
  if (!copy) throw new Error(`Missing Google reviews copy for ${locale}`);
  const details = googleReviewsDetails[locale];
  const shown = details && data?.reviews.length ? data : null;
  return <div className="mbx-reviews" data-testid="google-reviews">
    <Heading id="mbx-reviews-h" className="mbx-reviews__h">{copy.heading}</Heading>
    {shown && <div className="mbx-reviews__content" data-testid="google-reviews-content">
      <img className="mbx-reviews__google" src={`${import.meta.env.BASE_URL}images/google-maps-attribution.svg`}
        alt="Google Maps" width="99" height="18" translate="no" />
      <p className="mbx-reviews__summary"><strong>{details.rating}: {shown.rating} / 5</strong>
        <span>{details.count.replace('{count}', String(shown.userRatingCount))}</span></p>
      <p className="mbx-reviews__note">{details.order}</p>
      <ol className="mbx-reviews__list">
        {shown.reviews.map((review, i) => <li key={i} className="mbx-reviews__review">
          <div className="mbx-reviews__author" translate="no">
            {review.photoDataUri && <img src={review.photoDataUri} width="40" height="40" alt="" referrerPolicy="no-referrer" />}
            {review.authorUri
              ? <a href={review.authorUri} target="_blank" rel="noopener noreferrer">{review.authorName}</a>
              : <span>{review.authorName}</span>}
            <span aria-label={`${details.rating}: ${review.rating} / 5`}>{review.rating} / 5</span>
          </div>
          {review.text && <blockquote lang={review.languageCode || undefined} dir="auto" translate="no">{review.text}</blockquote>}
          <a className="mbx-reviews__source" href={review.googleMapsUri} target="_blank" rel="noopener noreferrer">{details.source}</a>
        </li>)}
      </ol>
      {shown.attributions.map((attribution, i) => <p key={i} className="mbx-reviews__note" translate="no">
        {attribution.uri ? <a href={attribution.uri} target="_blank" rel="noopener noreferrer">{attribution.provider}</a> : attribution.provider}
      </p>)}
    </div>}
    <div className="mbx-reviews__actions">
      <a className="mbx-reviews__link" href={shown?.googleMapsUri ?? GOOGLE_REVIEWS_URL}
        target="_blank" rel="noopener noreferrer" data-testid="google-reviews-link">{shown ? details.all : copy.button}</a>
      {shown && <a className="mbx-reviews__link" href={shown.writeReviewUri} target="_blank" rel="noopener noreferrer">{details.write}</a>}
    </div>
    {shown && <div className="mbx-reviews__note">
      <p>{details.privacy}</p>
      <a href="https://www.google.com/intl/en_US/help/terms_maps.html" target="_blank" rel="noopener noreferrer">{details.terms}</a>
      {' · '}<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">{details.policy}</a>
    </div>}
  </div>;
}
