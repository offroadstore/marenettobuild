# Homepage media provenance

## Cefalù panorama correction — preview awaiting visual confirmation

The active `cefalu-hero-*` images are a local revision of the approved original
described below, **not** a newly approved illustration or permission to publish.
The cathedral is set back into the town at the foot of La Rocca, with smaller
visible towers and several roofs separating its base from the waterfront.
There is one cathedral. This remains an AI illustration, not a survey or a real
photograph, and not evidence of work performed.

Geographic reference only: https://ita.travel/img/t1270h0/blogimg/leto/sicilia/cefalu.webp
(consulted 2026-11-11). That photograph has a different viewpoint; its screen
coordinates were not copied. It is not served, incorporated, or claimed licensed.

The original attached PNG and all `approved-hero-*` files remain untouched.
Only an alpha-masked local patch was incorporated into the original PNG:
`assets/hero/cefalu-retouch.png`, positioned at x=650, y=440.
Its nontransparent pixels are confined to the small cathedral/roof area; the
terrace, house, scaffold, vegetation, coast, lighting and composition are preserved.
Two rejected wider AI edits were discarded because they changed the framing.
The accepted edit used a square detail crop, downsampled to native size, then a
feathered mask to retain only the local correction, not the regenerated background.

Reproduce with `node scripts/encode-cefalu-hero.mjs` from this artifact directory
(requires ImageMagick). It reconstructs the lossless 1672 × 941 master under
`generated-artifacts/cefalu-hero/` from the original and the retained patch, then
encodes every served derivative. No enlargement or extra sharpening is applied.
Desktop widths, mobile rectangle and output sizes/qualities are unchanged:
768/1280/1672; mobile x=440, y=0, 900 × 941 → 450 × 471 / 900 × 941.
AVIF/WebP quality 82, JPEG 86. Both social image tags use the corrected JPEG.
The new filenames avoid stale cached versions. Text, controls, CSS framing and the
existing footer disclosure are unchanged. The illustration still needs the
owner's visual confirmation; this revision does not authorize public release.

## Original approved opening illustration

`approved-hero-*` derives exclusively from the owner's attached
`0_hero_marenetto_build_1794264904110.png` (1672 × 941).
Desktop widths: 768, 1280, 1672. Mobile: source rectangle 900 × 941
at x=440, y=0; outputs 450 × 471 and 900 × 941.
AVIF and WebP use quality 82; desktop JPEG fallback uses quality 86.
For these original derivatives: no generation, enlargement, sharpening or extraction from the design board.
The hero is an AI illustration, not completed work; its separate disclosure is
visible immediately below it. At 1920 CSS pixels or high DPR it does not provide
native-density detail: request a 2560–3200 px (or larger) approved original.

The three separate service-photo originals shown in the approved board were
not supplied. The preview deliberately retains the existing construction,
property-care and pre-purchase images with a group illustration note; these
are **not** an exact photographic match to the board. The third source is
`/media/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali.jpg`.
Do not extract replacements from the board or imply these are company projects.

## Historical assets retained

These files are optimized WebP derivatives of historical assets already held by
Marenetto Build. No new stock photography or externally hosted image is used at
runtime. Original files remain untouched.

| Derivative | Local source | Historical source |
| --- | --- | --- |
| `hero-*.webp` | `/brand/original-hero.png` | Previously imported homepage hero; original remote URL and authorship are not established by the migration manifest |
| `construction-*.webp` | `/media/articles/impresa-edile-a-cefalu.jpg` | `lavori-edilizia-cefalu.png`, recorded in `/media/articles/manifest.json` |
| `property-*.webp` | `/media/articles/gestione-manutenzione-immobile.jpg` | `manutenzione.jpg`, recorded in `/media/articles/manifest.json` |
| `garden-*.webp` | `/media/articles/garden-design-esclusivo.jpg` | `garden.jpg`, recorded in `/media/articles/manifest.json` |

## Editorial use

All four sources are treated as **illustrative historical imagery**, not evidence
of completed work, company employees, vehicles, equipment, or a particular place.
The hero includes a synthetic-image-style sparkle. The garden and property
images depict people and equipment whose identity/ownership is not verified.
No identity, employment, customer relationship or equipment ownership is inferred.
They have no testimonial or project-caption attribution.

Provenance on the old site establishes prior use, not independent proof of a
copyright licence or model release. Continue only the requested reuse within
this same site's preview, with visible illustrative captions. Confirm ownership,
usage rights and any releases (or replace the files) before public release.

## Encoding

The visual revision also supplies `hero-portrait-384.webp` and
`hero-portrait-628.webp`: ordinary crops of the same 1920×1047 historical
hero (source rectangle 628×1047 at x=801, y=0), not generated replacements.
The larger crop retains native pixels and the smaller is downsampled.
Mobile `<picture>` uses these instead of downloading an entire landscape
image to show a narrow strip. The original is insufficient for full-density
large/high-DPR displays; no larger version has been invented.

ImageMagick WebP quality 82 for the hero (768, 1280, 1920 pixels wide), quality 80
for the other images (480 and 960 pixels wide). Aspect ratios are retained;
cropping is presentation-only. No extra person/vehicle crop is presented as a
verified company detail.
