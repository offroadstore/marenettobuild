import { GetGoogleReviewsResponse } from "@workspace/api-zod";
import type { GooglePlaceReviews, GoogleReview } from "@workspace/api-zod";

// Only request fields actually displayed. No translated text, summaries or photos API.
export const PLACES_FIELDS = "rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks,attributions";
const MAX_JSON_BYTES = 256_000;
const MAX_PHOTO_BYTES = 100_000;
const EMPTY = { data: null } as const;
type Fetcher = typeof fetch;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid response");
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 20_000): string {
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid text");
  return value;
}
function googleLink(value: unknown): string {
  const url = new URL(text(value, 4096));
  if (url.protocol !== "https:" || url.port || url.username || url.password ||
    !["google.com", "www.google.com", "maps.google.com", "search.google.com", "maps.app.goo.gl"].includes(url.hostname)) {
    throw new Error("Invalid Google link");
  }
  return url.href;
}
function photoLink(value: unknown): string {
  const url = new URL(text(value, 4096));
  if (url.protocol !== "https:" || url.port || url.username || url.password ||
    !/^(?:lh[3-6]\.googleusercontent\.com|(?:lh[3-6]|streetviewpixels-pa)\.ggpht\.com)$/.test(url.hostname)) {
    throw new Error("Invalid avatar host");
  }
  return url.href;
}
async function limitedBytes(response: Response, max: number): Promise<Uint8Array> {
  if (!response.ok || !response.body || Number(response.headers.get("content-length") ?? 0) > max) {
    throw new Error("Unavailable upstream");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) throw new Error("Oversized upstream");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}
async function avatar(value: unknown, fetcher: Fetcher, signal: AbortSignal): Promise<string | null> {
  if (value === undefined) return null;
  // No forwarding of visitor cookies, IP, Referer, Origin, or the Places API key.
  // Redirects are rejected, not followed to an arbitrary host.
  const response = await fetcher(photoLink(value), {
    signal, redirect: "error", cache: "no-store", headers: { Accept: "image/png,image/jpeg,image/webp" },
  });
  const mime = response.headers.get("content-type")?.split(";")[0];
  if (!mime || !["image/png", "image/jpeg", "image/webp"].includes(mime)) throw new Error("Invalid avatar type");
  const bytes = await limitedBytes(response, MAX_PHOTO_BYTES);
  const valid = mime === "image/png" ? Buffer.from(bytes).subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : mime === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : Buffer.from(bytes).subarray(0, 4).toString() === "RIFF" && Buffer.from(bytes).subarray(8, 12).toString() === "WEBP";
  if (!valid) throw new Error("Invalid avatar bytes");
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function fetchGoogleReviews(key: string, placeId: string, fetcher: Fetcher = fetch, timeoutMs = 6000): Promise<GooglePlaceReviews> {
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetcher(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    signal, redirect: "error", cache: "no-store",
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": PLACES_FIELDS },
  });
  const raw = record(JSON.parse(new TextDecoder().decode(await limitedBytes(response, MAX_JSON_BYTES))));
  if (!Array.isArray(raw.reviews) || !raw.reviews.length || raw.reviews.length > 5) throw new Error("No reviews");
  const reviews: GoogleReview[] = await Promise.all(raw.reviews.map(async value => {
    const review = record(value);
    const author = record(review.authorAttribution);
    const original = review.originalText === undefined ? null : record(review.originalText);
    return {
      // Missing original text can be a rating-only review. NEVER substitute translated text.
      text: original ? text(original.text) : "",
      languageCode: original?.languageCode === undefined ? "" : text(original.languageCode, 35),
      rating: review.rating as number,
      authorName: text(author.displayName, 500),
      authorUri: author.uri === undefined ? null : googleLink(author.uri),
      photoDataUri: await avatar(author.photoUri, fetcher, signal),
      googleMapsUri: googleLink(review.googleMapsUri),
    };
  }));
  const links = raw.googleMapsLinks === undefined ? {} : record(raw.googleMapsLinks);
  if (raw.attributions !== undefined && !Array.isArray(raw.attributions)) throw new Error("Invalid attributions");
  const attributions = ((raw.attributions ?? []) as unknown[]).map(value => {
    const attribution = record(value);
    // Provider attributions can legitimately link outside Google, but never to scripts.
    const uri = attribution.providerUri === undefined ? null : new URL(text(attribution.providerUri, 4096));
    if (uri && (uri.protocol !== "https:" || uri.username || uri.password)) throw new Error("Invalid attribution");
    return { provider: text(attribution.provider, 500), uri: uri?.href ?? null };
  });
  const result = GetGoogleReviewsResponse.parse({ data: {
    rating: raw.rating, userRatingCount: raw.userRatingCount, reviews, attributions,
    googleMapsUri: googleLink(raw.googleMapsUri),
    writeReviewUri: links.writeAReviewUri === undefined
      ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
      : googleLink(links.writeAReviewUri),
  } });
  if (!result.data) throw new Error("Invalid reviews");
  return result.data;
}

/** No completed-response cache. Only simultaneous requests share an in-flight call.
 * Counters contain no Google content. Limits are per process, not billing caps. */
export function createGoogleReviewsService({
  credentials = () => ({ key: process.env.GOOGLE_PLACES_API_KEY, placeId: process.env.GOOGLE_PLACE_ID }),
  fetcher = fetch,
  now = Date.now,
  timeoutMs = 6000,
} = {}) {
  let pending: Promise<{ data: GooglePlaceReviews | null }> | null = null;
  let nextAllowed = 0;
  let day = -1;
  let calls = 0;
  return async () => {
    const { key, placeId } = credentials();
    if (!key || !placeId || !/^[A-Za-z0-9_-]{1,255}$/.test(placeId)) return EMPTY;
    if (pending) return pending;
    const time = now();
    if (Math.floor(time / 86_400_000) !== day) { day = Math.floor(time / 86_400_000); calls = 0; }
    if (time < nextAllowed || calls >= 100) return EMPTY;
    calls++;
    nextAllowed = time + 10_000;
    pending = fetchGoogleReviews(key, placeId, fetcher, timeoutMs)
      .then(data => ({ data }))
      // Do not log upstream errors, URLs, reviewer data or credentials.
      .catch(() => EMPTY)
      .finally(() => { pending = null; });
    return pending;
  };
}
