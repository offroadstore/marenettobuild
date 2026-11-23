import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createGoogleReviewsService, fetchGoogleReviews, PLACES_FIELDS } from '../src/lib/google-reviews.ts';
import { createGoogleReviewsRouter } from '../src/routes/google-reviews.ts';

// Entirely synthetic provider data. No real credentials or Google network calls.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
export function fixture() {
  return {
    rating: 3.8, userRatingCount: 47, googleMapsUri: 'https://maps.google.com/?cid=fixture',
    googleMapsLinks: { writeAReviewUri: 'https://www.google.com/maps/fixture/write' },
    attributions: [{ provider: 'Synthetic provider', providerUri: 'https://example.invalid/provider' }],
    reviews: [2, 5, 1, 4, 3].map((rating, i) => ({
      rating,
      originalText: { text: `RECENSIONE SIMULATA ${i + 1}\n  Testo originale <non HTML> & spazi.`, languageCode: 'it' },
      text: { text: 'MUST NEVER USE THE TRANSLATION', languageCode: 'en' },
      authorAttribution: { displayName: `Autore simulato ${i + 1}`, uri: `https://www.google.com/maps/contrib/fixture${i}`, photoUri: `https://lh3.googleusercontent.com/fixture${i}` },
      googleMapsUri: `https://www.google.com/maps/reviews/fixture${i}`,
    })),
  };
}
const credentials = () => ({ key: 'synthetic-not-a-key', placeId: 'fixture-place' });
function mock(raw = fixture(), photoResponse) {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).startsWith('https://places.googleapis.com/')) return Response.json(raw);
    return photoResponse ? photoResponse() : new Response(png, { headers: { 'content-type': 'image/png' } });
  };
  return { requests, fetcher };
}

test('missing or invalid configuration does not call Google', async () => {
  for (const config of [{}, { key: 'synthetic' }, { placeId: 'fixture' }, { key: 'synthetic', placeId: '../bad' }]) {
    const load = createGoogleReviewsService({ credentials: () => config, fetcher: () => assert.fail('No network') });
    assert.deepEqual(await load(), { data: null });
  }
});

test('valid response preserves all original text and ordering, authors, photos and provider attribution', async () => {
  const raw = fixture();
  const { fetcher, requests } = mock(raw);
  const data = await fetchGoogleReviews('synthetic-not-a-key', 'fixture-place', fetcher);
  assert.equal(data.rating, raw.rating);
  assert.equal(data.userRatingCount, raw.userRatingCount);
  assert.deepEqual(data.reviews.map(r => r.text), raw.reviews.map(r => r.originalText.text));
  assert.deepEqual(data.reviews.map(r => r.rating), [2, 5, 1, 4, 3]);
  assert.equal(data.googleMapsUri, raw.googleMapsUri);
  assert.equal(data.writeReviewUri, raw.googleMapsLinks.writeAReviewUri);
  assert.deepEqual(data.attributions, [{ provider: 'Synthetic provider', uri: 'https://example.invalid/provider' }]);
  assert.equal(requests.length, 6);
  assert.equal(requests[0].options.headers['X-Goog-FieldMask'], PLACES_FIELDS);
  assert.equal(requests[0].options.headers['X-Goog-Api-Key'], 'synthetic-not-a-key');
  assert.ok(!requests[0].url.includes('synthetic-not-a-key'));
  data.reviews.forEach((r, i) => {
    assert.equal(r.authorName, raw.reviews[i].authorAttribution.displayName);
    assert.equal(r.authorUri, raw.reviews[i].authorAttribution.uri);
    assert.equal(r.photoDataUri, `data:image/png;base64,${png.toString('base64')}`);
  });
  for (const r of requests.slice(1)) {
    assert.equal(r.options.redirect, 'error');
    assert.equal(r.options.cache, 'no-store');
    assert.deepEqual(Object.keys(r.options.headers), ['Accept']);
  }
});

test('empty, malformed, unsafe and incomplete responses fail closed without selecting reviews', async () => {
  const changes = [
    r => { r.reviews = []; }, r => { r.reviews.push(r.reviews[0]); },
    r => { r.rating = 7; }, r => { r.userRatingCount = 1.5; },
    r => { r.googleMapsUri = 'javascript:alert(1)'; },
    r => { r.reviews[1].authorAttribution.photoUri = 'https://localhost/secret'; },
    r => { r.reviews[0].authorAttribution.uri = 'https://www.google.com.evil.invalid/'; },
    r => { r.reviews[0].googleMapsUri = 'https://evil.invalid/'; },
    r => { r.reviews[0].originalText.text = 'x'.repeat(20_001); },
    r => { r.attributions[0].providerUri = 'javascript:alert(1)'; },
  ];
  for (const mutate of changes) {
    const raw = fixture(); mutate(raw);
    const { fetcher } = mock(raw);
    assert.deepEqual(await createGoogleReviewsService({ credentials, fetcher })(), { data: null });
  }
});

test('upstream errors, malformed JSON and timeout return only the fallback envelope', async () => {
  const timeoutFetcher = (_url, { signal }) => new Promise((_resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('test hung')), 500);
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); });
  });
  for (const fetcher of [
    async () => { throw new Error('sensitive upstream body synthetic-not-a-key'); },
    async () => new Response('sensitive body', { status: 403 }),
    async () => new Response('{'),
    timeoutFetcher,
  ]) {
    const load = createGoogleReviewsService({ credentials, fetcher, timeoutMs: 15 });
    assert.deepEqual(await load(), { data: null });
  }
});

test('unsafe avatar content, oversized photos and rejected redirects cannot become browser requests', async () => {
  for (const make of [
    () => new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }),
    () => new Response('bad png', { headers: { 'content-type': 'image/png' } }),
    () => new Response(new Uint8Array(100_001), { headers: { 'content-type': 'image/png' } }),
    () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/' } }),
  ]) {
    assert.deepEqual(await createGoogleReviewsService({ credentials, fetcher: mock(fixture(), make).fetcher })(), { data: null });
  }
});

test('rating-only reviews never use translated text; absent optional avatars stay absent', async () => {
  const raw = fixture();
  delete raw.reviews[0].originalText;
  delete raw.reviews[0].authorAttribution.photoUri;
  delete raw.googleMapsLinks;
  const data = await fetchGoogleReviews('synthetic', 'fixture-place', mock(raw).fetcher);
  assert.equal(data.reviews[0].text, '');
  assert.equal(data.reviews[0].photoDataUri, null);
  assert.equal(data.reviews.length, 5);
  assert.equal(data.writeReviewUri, 'https://search.google.com/local/writereview?placeid=fixture-place');
});

test('deduplicates only in-flight work; rate limit uses fallback, not cached content; new request is fresh', async () => {
  let time = 1_000_000;
  const { fetcher, requests } = mock();
  const load = createGoogleReviewsService({ credentials, fetcher, now: () => time });
  const results = await Promise.all([load(), load(), load()]);
  assert.ok(results.every(r => r.data?.reviews.length === 5));
  assert.equal(requests.length, 6);
  assert.deepEqual(await load(), { data: null });
  time += 10_000;
  assert.ok((await load()).data);
  assert.equal(requests.length, 12);
});

test('daily attempt limit resets on next UTC day; no content cache survives', async () => {
  let time = 1_000_000;
  let attempts = 0;
  const load = createGoogleReviewsService({ credentials, now: () => time, fetcher: async () => { attempts++; throw new Error('synthetic failure'); } });
  for (let i = 0; i < 110; i++) { await load(); time += 10_000; }
  assert.equal(attempts, 100);
  time += 86_400_000;
  await load();
  assert.equal(attempts, 101);
});

test('public route is always no-store and exposes no upstream error or configuration', async () => {
  const app = express();
  app.use('/api', createGoogleReviewsRouter(createGoogleReviewsService({ credentials: () => ({}) })));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/google-reviews`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { data: null });
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
