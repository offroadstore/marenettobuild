import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const workspace = path.resolve(root, '../..');
const original = path.join(workspace, 'attached_assets/0_hero_marenetto_build_1794264904110.png');
const patch = path.join(root, 'assets/hero/cefalu-panorama-left-retouch.png');
const master = path.join(workspace, 'generated-artifacts/cefalu-panorama/corrected-master.png');
const magick = (...args) => execFileSync('magick', args, { maxBuffer: 16 * 1024 * 1024 });
const before = magick(original, '-depth', '8', 'rgb:-');
const after = magick(master, '-depth', '8', 'rgb:-');
const alpha = magick(patch, '-alpha', 'extract', '-depth', '8', 'gray:-');
if (before.length !== 1672 * 941 * 3 || after.length !== before.length || alpha.length !== 600 * 600) {
  throw new Error('Unexpected master or patch dimensions');
}
let changed = 0;
for (let y = 0; y < 941; y++) for (let x = 0; x < 1672; x++) {
  const i = (y * 1672 + x) * 3;
  const differs = before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2];
  if (!differs) continue;
  changed++;
  const px = x - 340, py = y - 340;
  if (px < 0 || py < 0 || px >= 600 || py >= 600 || alpha[py * 600 + px] === 0) {
    throw new Error(`Changed pixel outside panorama mask at ${x},${y}`);
  }
}
if (changed < 20000) throw new Error('Expected a panorama revision, not a tower-only patch');
for (const width of [768, 1280, 1672, 450, 900]) {
  const mobile = width === 450 || width === 900;
  for (const format of [...['avif', 'webp'], ...(width === 1672 ? ['jpg'] : [])]) {
    const file = path.join(root, `public/media/home/cefalu-hero-left-${mobile ? 'mobile-' : ''}${width}.${format}`);
    const args = [master, ...(mobile ? ['-crop', '900x941+440+0', '+repage'] : []),
      '-resize', `${width}x>`, '-quality', format === 'jpg' ? '86' : '82', `${format}:-`];
    const expected = magick(...args);
    const hash = data => createHash('sha256').update(data).digest('hex');
    if (hash(expected) !== hash(readFileSync(file))) throw new Error(`Derivative differs from master: ${file}`);
  }
}
console.log(`${changed} changed pixels, all within the panorama mask. All 11 derivatives match the same master.`);
