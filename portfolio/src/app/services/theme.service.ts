import { Injectable, signal } from '@angular/core';

type Hsl = { h: number; s: number; l: number };

const THEME_VARS = ['--ink-rgb', '--paper-rgb', '--acid-rgb', '--punch-rgb', '--volt-rgb'] as const;

/**
 * 從一張圖片取色，替整站的三個強調色（acid/punch/volt）換上同色系。
 * 背景（paper/ink）刻意不動 — 版面穩定，強調色的變化才顯眼。
 * 由 AI 生圖（雲端或本地 LLM 觸發）共用。
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themed = signal(false);

  /** 恢復預設配色 */
  reset(): void {
    const root = document.documentElement.style;
    for (const v of THEME_VARS) root.removeProperty(v);
    this.themed.set(false);
  }

  // 縮圖取樣 → 依色相分桶（權重 = 飽和度 × 中間調程度）→ 取最強三個色相當強調色。
  async applyFromImage(blob: Blob): Promise<void> {
    const bmp = await createImageBitmap(blob);
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(bmp, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    bmp.close();

    type Bucket = { weight: number; h: number; s: number; l: number; n: number };
    const buckets: Bucket[] = Array.from({ length: 12 }, () => ({ weight: 0, h: 0, s: 0, l: 0, n: 0 }));

    for (let i = 0; i < data.length; i += 4) {
      const { h, s, l } = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);
      if (s < 0.22 || l < 0.12 || l > 0.92) continue; // 略過灰黑白
      const b = buckets[Math.floor(h / 30) % 12];
      const w = s * (1 - Math.abs(l - 0.5));
      b.weight += w;
      b.h += h; b.s += s; b.l += l; b.n += 1;
    }

    const ranked = buckets
      .filter((b) => b.n >= 8)
      .sort((a, b) => b.weight - a.weight)
      .map((b) => ({ h: b.h / b.n, s: b.s / b.n, l: b.l / b.n }));

    if (ranked.length === 0) return; // 幾乎無彩度：不動主題

    const picks: Hsl[] = ranked.slice(0, 3);
    while (picks.length < 3) {
      const base = picks[0];
      picks.push({ h: (base.h + 120 * picks.length) % 360, s: base.s, l: base.l });
    }

    // 只換三個強調色，背景不動
    const byLightness = [...picks].sort((a, b) => b.l - a.l);
    const acid = this.clampHsl(byLightness[0], [0.7, 1], [0.55, 0.68]);
    const punch = this.clampHsl(byLightness[1], [0.65, 1], [0.48, 0.6]);
    const volt = this.clampHsl(byLightness[2], [0.6, 0.95], [0.42, 0.58]);

    const root = document.documentElement.style;
    root.setProperty('--acid-rgb', this.hslToTriplet(acid));
    root.setProperty('--punch-rgb', this.hslToTriplet(punch));
    root.setProperty('--volt-rgb', this.hslToTriplet(volt));
    this.themed.set(true);
  }

  private clampHsl(c: Hsl, sRange: [number, number], lRange: [number, number]): Hsl {
    return {
      h: c.h,
      s: Math.min(Math.max(c.s, sRange[0]), sRange[1]),
      l: Math.min(Math.max(c.l, lRange[0]), lRange[1]),
    };
  }

  private rgbToHsl(r: number, g: number, b: number): Hsl {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else                h = ((r - g) / d + 4) * 60;
    return { h, s, l };
  }

  private hslToTriplet({ h, s, l }: Hsl): string {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60)       { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else              { r = c; b = x; }
    return `${Math.round((r + m) * 255)} ${Math.round((g + m) * 255)} ${Math.round((b + m) * 255)}`;
  }
}
