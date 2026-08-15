/**
 * 響應式圖檔清單。
 *
 * 由 tools/optimize-images.mjs 產生 assets/images/opt/{name}-{w}.{avif,webp,jpg}，
 * 這份清單記錄每張圖的原始尺寸（給 width/height 佔位，避免 CLS）與可用寬度。
 * 新增圖片時：把原圖放進 public/assets/images/，跑 `npm run images`，再更新這裡。
 */
export type ImageEntry = {
  /** 原始像素尺寸 — 用來算 aspect ratio 與 width/height 屬性 */
  w: number;
  h: number;
  /** 已產生的寬度變體 */
  widths: number[];
  /** jpg 後備檔的寬度 */
  fb: number;
};

export const IMAGES: Record<string, ImageEntry> = {
  'TheGentleTrigger':        { w: 2560, h: 1080, widths: [400, 800, 1200, 1600], fb: 1600 },
  'Order':                   { w: 1918, h: 1078, widths: [400, 800, 1200, 1600], fb: 1600 },
  'maxresdefault':           { w: 1280, h:  720, widths: [400, 800, 1200],       fb: 1200 },
  'noddy':                   { w: 1280, h:  720, widths: [400, 800, 1200],       fb: 1200 },
  'myPic':                   { w: 1060, h: 1545, widths: [400, 800],             fb:  800 },
  'autodesk-3dsmax-cert':    { w: 1262, h:  892, widths: [400, 800, 1200],       fb: 1200 },
  'autodesk-maya-cert':      { w:  986, h:  758, widths: [400, 800],             fb:  800 },
  'ling-tung-teaching-cert': { w: 1076, h: 1520, widths: [400, 800],             fb:  800 },
};

const BASE = 'assets/images/opt';

export function srcsetFor(name: string, format: 'avif' | 'webp'): string {
  const entry = IMAGES[name];
  if (!entry) return '';
  return entry.widths.map((w) => `${BASE}/${name}-${w}.${format} ${w}w`).join(', ');
}

export function fallbackFor(name: string): string {
  const entry = IMAGES[name];
  return entry ? `${BASE}/${name}-${entry.fb}.jpg` : '';
}
