import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { LINKS } from '../../data/config';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Hsl = { h: number; s: number; l: number };

const THEME_VARS = ['--ink-rgb', '--paper-rgb', '--acid-rgb', '--punch-rgb', '--volt-rgb'] as const;

@Component({
  selector: 'app-ai-lab',
  standalone: true,
  imports: [FormsModule, ScrollRevealDirective],
  templateUrl: './ai-lab.html',
  styleUrl: './ai-lab.scss',
})
export class AiLab implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private bgObjectUrl?: string;

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  // ── Chat ──
  readonly messages = signal<ChatMessage[]>([]);
  chatInput = '';
  readonly chatLoading = signal(false);
  readonly chatError = signal('');

  // ── Image generation ──
  imageInput = '';
  readonly imageLoading = signal(false);
  readonly imageError = signal('');
  readonly imageUrl = signal('');

  /** 目前是否套用了由生成圖片取出的主題色 */
  readonly themed = signal(false);

  /** section 在視窗內時背景才顯示；捲到過去經歷/證書認證時淡出 */
  readonly bgVisible = signal(false);

  // ── 開始使用門檻：按下前 AI 面板不可操作 ──
  readonly started = signal(false);
  readonly gateGone = signal(false);

  start(): void {
    if (this.started()) return;
    this.started.set(true);
    setTimeout(() => this.gateGone.set(true), 650);
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => this.bgVisible.set(entry.isIntersecting),
      { threshold: 0.15 },
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.bgObjectUrl) URL.revokeObjectURL(this.bgObjectUrl);
  }

  async sendChat(): Promise<void> {
    if (!this.started()) return;
    const prompt = this.chatInput.trim();
    if (!prompt || this.chatLoading()) return;

    this.chatInput = '';
    this.chatError.set('');
    this.messages.update((m) => [...m, { role: 'user', content: prompt }]);
    this.chatLoading.set(true);
    this.scrollChatToBottom();

    try {
      const res = await fetch(`${LINKS.ai.worker}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Worker 上限 20 則訊息，保留最近 12 則對話脈絡
        body: JSON.stringify({ messages: this.messages().slice(-12) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      this.messages.update((m) => [...m, { role: 'assistant', content: data.response ?? '(無回應)' }]);
    } catch (err) {
      this.chatError.set(
        (err as Error).message === '429' ? '訊息傳太快囉，休息一下再試' : '連線失敗，請稍後再試',
      );
      this.messages.update((m) => m.slice(0, -1));
      this.chatInput = prompt;
    } finally {
      this.chatLoading.set(false);
      this.scrollChatToBottom();
    }
  }

  async generateImage(): Promise<void> {
    if (!this.started()) return;
    const prompt = this.imageInput.trim();
    if (!prompt || this.imageLoading()) return;

    this.imageError.set('');
    this.imageLoading.set(true);

    try {
      const res = await fetch(`${LINKS.ai.worker}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width: 768, height: 768 }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();

      if (this.bgObjectUrl) URL.revokeObjectURL(this.bgObjectUrl);
      this.bgObjectUrl = URL.createObjectURL(blob);
      this.imageUrl.set(this.bgObjectUrl);

      // 從生成圖片取色，替整個網站換上同色系主題
      this.applyThemeFromImage(blob).catch(() => { /* 取色失敗就維持原主題 */ });
    } catch (err) {
      this.imageError.set(
        (err as Error).message === '429' ? '生圖太頻繁囉（每分鐘最多 3 張），休息一下再試' : '生成失敗，請稍後再試',
      );
    } finally {
      this.imageLoading.set(false);
    }
  }

  /** 恢復網站預設配色 */
  resetTheme(): void {
    const root = document.documentElement.style;
    for (const v of THEME_VARS) root.removeProperty(v);
    this.themed.set(false);
  }

  // ══ 主題取色引擎 ════════════════════════════
  // 縮圖取樣 → 依色相分桶（權重 = 飽和度 × 中間調程度）
  // → 取最強三個色相當強調色，主色相衍生紙色與墨色。
  // 明度/飽和度夾在安全範圍，確保對比與可讀性。

  private async applyThemeFromImage(blob: Blob): Promise<void> {
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
      .filter((b) => b.n >= 8) // 太零星的色相不算
      .sort((a, b) => b.weight - a.weight)
      .map((b) => ({ h: b.h / b.n, s: b.s / b.n, l: b.l / b.n }));

    if (ranked.length === 0) return; // 幾乎無彩度的圖：不動主題

    // 不足三色時，用主色相 ±120° 補成三色組
    const picks: Hsl[] = ranked.slice(0, 3);
    while (picks.length < 3) {
      const base = picks[0];
      picks.push({ h: (base.h + 120 * picks.length) % 360, s: base.s, l: base.l });
    }

    // 角色分配：最亮 → acid（大面積底色），其餘依序 punch / volt
    const byLightness = [...picks].sort((a, b) => b.l - a.l);
    const acid  = this.clampHsl(byLightness[0], [0.65, 1], [0.55, 0.7]);
    const punch = this.clampHsl(byLightness[1], [0.6, 0.95], [0.48, 0.6]);
    const volt  = this.clampHsl(byLightness[2], [0.55, 0.9], [0.42, 0.58]);

    // 紙色與墨色：染上主色相的極淡 / 極深版本
    const domH = ranked[0].h;
    const paper: Hsl = { h: domH, s: 0.24, l: 0.94 };
    const ink:   Hsl = { h: domH, s: 0.3,  l: 0.08 };

    const root = document.documentElement.style;
    root.setProperty('--acid-rgb',  this.hslToTriplet(acid));
    root.setProperty('--punch-rgb', this.hslToTriplet(punch));
    root.setProperty('--volt-rgb',  this.hslToTriplet(volt));
    root.setProperty('--paper-rgb', this.hslToTriplet(paper));
    root.setProperty('--ink-rgb',   this.hslToTriplet(ink));
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

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatScroll?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
