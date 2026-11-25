import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export const ORIGINAL_SVG_SHA256 = '24e80f51c6dabe094720b1ff978d86cfcf4b5b6fe266c1fa06d35bd0df63a4bf';
export const background = '#23211f';
export const pngIcons = [
  ['favicon-48x48.png', 48, 1],
  ['favicon-96x96.png', 96, 1],
  ['apple-touch-icon.png', 180, 0.84],
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  // The entire original square fits inside the 80%-diameter safe circle:
  // sqrt(2) * 0.56 < 0.80. No edits to paths, strokes or original proportions.
  ['icon-maskable-512.png', 512, 0.56],
];
export async function raster(svg, size, scale = 1) {
  const inner = Math.round(size * scale);
  // Rasterize at >=2x the target; never upscale a low-resolution SVG raster.
  const image = await sharp(svg, { density: Math.max(384, size * 3) }).resize(inner, inner).png().toBuffer();
  if (scale === 1) return image;
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: image, left: Math.floor((size - inner) / 2), top: Math.floor((size - inner) / 2) }])
    .png().toBuffer();
}
export async function generateIcons(directory = new URL('../public/', import.meta.url)) {
  const svg = await readFile(new URL('favicon.svg', directory));
  if (createHash('sha256').update(svg).digest('hex') !== ORIGINAL_SVG_SHA256) {
    throw new Error('Original favicon.svg changed; do not silently regenerate a different mark.');
  }
  for (const [file, size, scale] of pngIcons) await writeFile(new URL(file, directory), await raster(svg, size, scale));
  // ICO directory with three independent, lossless PNG frames (Vista+ ICO).
  const sizes = [16, 32, 48];
  const frames = await Promise.all(sizes.map(size => raster(svg, size)));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + i * 16;
    header[entry] = header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(frames[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += frames[i].length;
  });
  await writeFile(new URL('favicon.ico', directory), Buffer.concat([header, ...frames]));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await generateIcons();
