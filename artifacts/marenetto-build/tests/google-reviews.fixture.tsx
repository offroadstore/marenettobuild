import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GooglePlaceReviews } from '@workspace/api-client-react';
import { GoogleReviews, GoogleReviewsView } from '../src/components/home/GoogleReviews';
import { googleReviewsDetails } from '../src/config/google-reviews-details';
import { GOOGLE_REVIEWS_URL, googleReviewsCopy } from '../src/config/google-reviews';

export const syntheticReviews: GooglePlaceReviews = {
  rating: 3.8, userRatingCount: 47,
  googleMapsUri: 'https://maps.google.com/?cid=fixture',
  writeReviewUri: 'https://www.google.com/maps/fixture/write',
  attributions: [{ provider: 'Fornitore simulato', uri: 'https://example.invalid/provider' }],
  reviews: [2, 5, 1, 4, 3].map((rating, i) => ({
    rating, text: `RECENSIONE SIMULATA ${i + 1}\nTesto originale <non HTML> & spazi.`, languageCode: 'it',
    authorName: `Autore simulato ${i + 1}`, authorUri: `https://www.google.com/maps/contrib/fixture${i}`,
    photoDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
    googleMapsUri: `https://www.google.com/maps/reviews/fixture${i}`,
  })),
};
const locales = ['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da'];
for (const locale of locales) {
  test(`${locale}: localized actions, original review order, all attributions, no scripts/schema/remote images`, () => {
    const html = renderToStaticMarkup(<GoogleReviewsView locale={locale} data={syntheticReviews} />);
    assert.ok(html.includes(googleReviewsDetails[locale].all));
    assert.ok(html.includes(googleReviewsDetails[locale].write));
    assert.ok(html.includes('47'));
    let prior = -1;
    for (let i = 1; i <= 5; i++) {
      const pos = html.indexOf(`RECENSIONE SIMULATA ${i}`);
      assert.ok(pos > prior); prior = pos;
      assert.ok(html.includes(`Autore simulato ${i}`));
      assert.ok(html.includes(`https://www.google.com/maps/contrib/fixture${i - 1}`));
      assert.ok(html.includes(`https://www.google.com/maps/reviews/fixture${i - 1}`));
    }
    assert.ok(html.includes('&lt;non HTML&gt; &amp; spazi.'));
    assert.ok(html.includes('lang="it" dir="auto" translate="no"'));
    assert.ok(html.includes('alt="Google Maps"'));
    assert.ok(html.includes('https://example.invalid/provider'));
    assert.ok(!/<(?:script|iframe)|AggregateRating|application\/ld\+json|src="https?:/.test(html));
    assert.equal((html.match(/data:image\/png/g) ?? []).length, 5);
  });
  test(`${locale}: initial SSR and empty result keep only existing outbound link`, () => {
    for (const html of [
      renderToStaticMarkup(<GoogleReviews locale={locale} />),
      renderToStaticMarkup(<GoogleReviewsView locale={locale} data={null} heading="h1" />),
      renderToStaticMarkup(<GoogleReviewsView locale={locale} data={{ ...syntheticReviews, reviews: [] }} />),
    ]) {
      assert.ok(html.includes(GOOGLE_REVIEWS_URL.replaceAll('&', '&amp;')));
      assert.ok(html.includes(googleReviewsCopy[locale].button));
      assert.ok(!/RECENSIONE|mbx-reviews__content|<img|<script/.test(html));
      assert.equal((html.match(/<a /g) ?? []).length, 1);
    }
  });
}
test('private locale preview stays link-only without changing publication permissions', () => {
  const html = renderToStaticMarkup(<GoogleReviewsView locale="ar" data={syntheticReviews} />);
  assert.ok(!html.includes('RECENSIONE SIMULATA'));
  assert.ok(html.includes(GOOGLE_REVIEWS_URL.replaceAll('&', '&amp;')));
});
