# Homepage media provenance

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
