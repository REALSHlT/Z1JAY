import { Injectable, NgZone, inject, signal } from '@angular/core';

/**
 * 全站動態的中樞。
 *
 * 兩個原則貫穿整個檔案：
 * 1. **尊重 prefers-reduced-motion** — 使用者要求減少動態時，這裡的東西一律不啟動，
 *    網站退化成純靜態但完全可用。
 * 2. **不碰 Angular 變更偵測** — 捲動與指標事件極為密集，全部掛在 zone 外，
 *    直接寫 DOM style / CSS 變數。需要跨元件共用的狀態才用 signal（且會去重）。
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly zone = inject(NgZone);

  /** 頁面捲動進度 0–1，給進度條用 */
  readonly progress = signal(0);
  /** 預載動畫是否已結束 — 結束後才播首屏進場 */
  readonly ready = signal(false);

  readonly reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  private lenis?: import('lenis').default;
  private rafId = 0;

  /**
   * IntersectionObserver 失效時的逃生門。
   *
   * 進場動畫的初始狀態是「隱藏」（.split-unit 是 opacity:0、.reveal 是位移+透明），
   * 全靠 IO 加上 .visible / .split-in 才會現形。萬一 IO 沒有觸發，
   * 使用者看到的就是一片空白的標題與內容 —— 這個失敗模式太嚴重，不能不防。
   *
   * 首屏一定有元素在視窗內，所以正常情況下幾秒內必定會有 .visible 出現。
   * 若三秒後一個都沒有，判定 IO 不可靠，直接讓所有動態元素現形。
   */
  installRevealFallback(): void {
    if (this.reduced) return;
    setTimeout(() => {
      const anyRevealed =
        document.querySelector('.visible') || document.querySelector('.split-in');
      if (anyRevealed) return;

      // 直接補上 IO 本來會加的 class，而不是另外掛一套 CSS 覆寫 —
      // 走同一條顯示路徑，就不會有選擇器優先權或樣式載入順序的變數。
      document.documentElement.classList.add('motion-fallback');
      for (const el of document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-clip')) {
        el.classList.add('visible');
      }
      for (const el of document.querySelectorAll('.split-text')) {
        el.classList.add('split-in');
      }
      console.warn('[motion] IntersectionObserver 未觸發，已強制顯示所有進場元素');
    }, 3000);
  }

  /**
   * 啟動平滑捲動。
   * Lenis 會接管 wheel/touch 並自行插值捲動位置，這是這類「實驗性」網站
   * 慣用的手法 — 捲動有慣性與阻尼，視差和進場才不會顯得生硬。
   *
   * 減少動態模式下完全不載入（連 bundle 都不抓），瀏覽器原生捲動照常運作。
   */
  async initSmoothScroll(): Promise<void> {
    if (this.reduced || this.lenis) return;

    const Lenis = (await import('lenis')).default;

    this.zone.runOutsideAngular(() => {
      this.lenis = new Lenis({
        duration: 1.05,
        // 先快後慢的指數衰減 — 停下來時不會突兀
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });

      this.lenis.on('scroll', ({ progress }: { progress: number }) => {
        const next = Math.round(progress * 1000) / 1000;
        // signal 會用 Object.is 去重，但捲動每幀都觸發 —
        // 這裡直接寫 CSS 變數給進度條，避免每幀都跑一次變更偵測。
        document.documentElement.style.setProperty('--scroll-progress', String(next));
      });

      const raf = (time: number) => {
        this.lenis?.raf(time);
        this.rafId = requestAnimationFrame(raf);
      };
      this.rafId = requestAnimationFrame(raf);
    });

    // 錨點交給 Lenis 處理，否則原生跳轉會與插值打架
    document.addEventListener('click', this.onAnchorClick, { capture: true });
  }

  private onAnchorClick = (e: Event): void => {
    const link = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!link) return;
    const id = link.getAttribute('href')?.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target || !this.lenis) return;
    e.preventDefault();
    // offset 對應固定頂欄的高度，與 styles.scss 的 scroll-margin-top 一致
    this.lenis.scrollTo(target, { offset: -88 });
  };

  destroy(): void {
    document.removeEventListener('click', this.onAnchorClick, { capture: true });
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lenis?.destroy();
    this.lenis = undefined;
  }
}
