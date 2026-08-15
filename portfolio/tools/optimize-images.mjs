/**
 * 產生響應式圖檔。
 *
 *   node tools/optimize-images.mjs        （或 npm run images）
 *
 * 來源：public/assets/images/*.{jpg,png}
 * 輸出：public/assets/images/opt/{name}-{w}.{avif,webp} + 一張最大尺寸的 .jpg 後備
 *
 * 跑完後把印出來的清單貼進 src/app/data/images.ts，<app-img> 才知道有哪些尺寸可用。
 *
 * 為什麼需要這個：原始素材是 2560px、4MB 的 PNG，但站上最寬只顯示到約 880px。
 * 直接送原圖等於浪費 99% 的位元組，手機網路上尤其致命。
 */
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public/assets/images');
const OUT = path.join(SRC, 'opt');

/** 站上最大顯示寬度約 880px（技能檢視器）；做到 1600 是為了 2x 高解析螢幕 */
const WIDTHS = [400, 800, 1200, 1600];

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
const manifest = {};
let srcTotal = 0;
let outTotal = 0;

for (const file of files) {
  const name = path.basename(file, path.extname(file));
  const abs = path.join(SRC, file);
  const srcSize = (await stat(abs)).size;
  srcTotal += srcSize;

  const meta = await sharp(abs).metadata();
  const widths = WIDTHS.filter((w) => w <= meta.width);
  // 來源比最小級距還窄，或最大級距仍小於原圖 → 補上原生寬度，
  // 否則像 640px 的來源只會產出 400px，白白丟掉解析度。
  if (widths.length === 0 || widths[widths.length - 1] < meta.width) {
    widths.push(meta.width);
  }

  for (const w of widths) {
    for (const [fmt, opts] of [
      ['avif', { quality: 52, effort: 6 }],
      ['webp', { quality: 78, effort: 5 }],
    ]) {
      const info = await sharp(abs)
        .resize({ width: w, withoutEnlargement: true })
        [fmt](opts)
        .toFile(path.join(OUT, `${name}-${w}.${fmt}`));
      outTotal += info.size;
    }
  }

  // 後備 jpg — 給極舊瀏覽器，以及證照 modal 的放大檢視
  const fb = widths[widths.length - 1];
  const fbInfo = await sharp(abs)
    .resize({ width: fb, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, `${name}-${fb}.jpg`));
  outTotal += fbInfo.size;

  manifest[name] = { w: meta.width, h: meta.height, widths, fb };
  console.log(
    `${file.padEnd(30)} ${String(meta.width).padStart(4)}x${String(meta.height).padEnd(4)}  ` +
    `${(srcSize / 1024).toFixed(0).padStart(5)}KB → ${(fbInfo.size / 1024).toFixed(0)}KB jpg`,
  );
}

console.log(`\n來源合計 ${(srcTotal / 1048576).toFixed(2)} MB`);
console.log(`輸出合計 ${(outTotal / 1048576).toFixed(2)} MB（所有尺寸與格式；瀏覽器每張只會抓一個）\n`);
console.log('貼進 src/app/data/images.ts 的 IMAGES：');
for (const [name, e] of Object.entries(manifest)) {
  console.log(`  '${name}': { w: ${e.w}, h: ${e.h}, widths: [${e.widths.join(', ')}], fb: ${e.fb} },`);
}
