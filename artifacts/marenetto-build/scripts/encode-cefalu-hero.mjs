import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const workspace = path.resolve(root, '../..');
const original = path.join(workspace, 'attached_assets/0_hero_marenetto_build_1794264904110.png');
const patch = path.join(root, 'assets/hero/cefalu-panorama-retouch.png');
const scratch = path.join(workspace, 'generated-artifacts/cefalu-panorama');
const output = path.join(root, 'public/media/home/cefalu-hero-geography');
mkdirSync(scratch, { recursive: true });
const master = path.join(scratch, 'corrected-master.png');
const magick = (...args) => execFileSync('magick', args, { stdio: 'inherit' });

// The panorama-only transparent patch is the only generated content. All other original
// pixels survive unchanged in this lossless, native-resolution master.
magick(original, patch, '-geometry', '+340+340', '-compose', 'Over', '-composite', master);
for (const width of [768, 1280, 1672]) {
  for (const format of ['avif', 'webp']) {
    magick(master, '-resize', `${width}x>`, '-quality', '82', `${output}-${width}.${format}`);
  }
}
magick(master, '-quality', '86', `${output}-1672.jpg`);
for (const width of [450, 900]) {
  for (const format of ['avif', 'webp']) {
    magick(master, '-crop', '900x941+440+0', '+repage', '-resize', `${width}x>`,
      '-quality', '82', `${output}-mobile-${width}.${format}`);
  }
}
console.log(`Encoded all Cefalù hero variants from ${master}`);
