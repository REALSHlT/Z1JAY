import { Injectable, NgZone, inject, signal } from '@angular/core';

/** 一個捲動場景：read 階段量 DOM、write 階段寫 CSS 變數（兩段分開，避免每個場景各自強制 reflow） */
export interface SceneHook {
  read(viewportHeight: number): void;
  write(): void;
}

/**
 * 全站動態的中樞。
 *
 * 兩個原則貫穿整個檔案：
 * 1. **尊重 prefers-reduced-motion** — 使用者要求減少動態時，這裡的東西一律不啟動，
 *    網站退化成純靜態但完全可用。
 * 2. **不碰 Angular 變更偵測** — 捲動與指標事件極為密集，全部掛在 zone 外，
 *    直接寫 DOM style / CSS 變數。需要跨元件共用的狀態才用 signal（且會去重）。
 *
 * 捲動場景系統：
 * 全站只有這裡的一個 rAF 迴圈。每幀先跑所有場景的 read（getBoundingClientRect），
 * 再跑所有 write（寫 --p 這類 CSS 變數）。讀寫若交錯，每個場景都會各自
 * 觸發一次強制版面重算，場景一多低階裝置直接掉幀 — 所以嚴格分兩段。
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
  private loopRunning = false;
  /** 最後一次 rAF 的時間戳 — 逃生門用「最近有沒有跳動」判斷 rAF 健康度 */
  private lastTickMs = 0;
  /** motion-ok 目前是否掛在 <html> 上（迴圈恢復跳動時會自我修復） */
  private motionOkOn = false;
  /** 最近一次回到前景的時刻 — 剛回前景時 IO/rAF 還在暖機，逃生門要再等等 */
  private becameVisibleAt = 0;

  private readonly scenes = new Set<SceneHook>();

  /** 捲動速度（平滑化後，約 -1 到 1），寫到 :root 的 --sv 給 CSS 用 */
  private lastY = 0;
  private smoothVel = 0;
  private writtenVel = NaN;

  /**
   * IntersectionObserver / rAF 失效時的逃生門。
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

    // ⚠️ 背景分頁的 rAF 與 IO 會被瀏覽器凍結 — 那不是失效，是省電。
    // 使用者用 Ctrl+點在背景分頁開站是常態，逃生門若在此時判定
    // 「rAF 壞了」而拆掉 motion-ok，整套捲動場景就被永久誤殺。
    // 所以：頁面不可見（或剛回前景還在暖機）時一律延後，重新排程再量。
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.becameVisibleAt = performance.now();
    });
    this.becameVisibleAt = performance.now();

    const check = () => setTimeout(() => {
      const now = performance.now();
      if (document.visibilityState === 'hidden' || now - this.becameVisibleAt < 1500) {
        check();
        return;
      }

      // 前景且穩定，但 rAF 最近一秒都沒跳 → 環境真的不合成畫面
      // （某些嵌入式瀏覽器）。拿掉 motion-ok 讓場景 CSS 整層失效，
      // 版面回到靜態排版。若 rAF 之後恢復，迴圈會自己把 class 加回來。
      if (now - this.lastTickMs > 1000) {
        document.documentElement.classList.remove('motion-ok');
        this.motionOkOn = false;
      }

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
    check();
  }

  /**
   * 註冊一個捲動場景。回傳解除函式。
   * 減少動態模式下什麼都不做（場景 CSS 也被 motion-ok 擋住）。
   */
  addScene(hook: SceneHook): () => void {
    if (this.reduced) return () => {};
    this.scenes.add(hook);
    this.ensureLoop();
    return () => this.scenes.delete(hook);
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

      this.ensureLoop();
    });

    // 錨點交給 Lenis 處理，否則原生跳轉會與插值打架
    document.addEventListener('click', this.onAnchorClick, { capture: true });
  }

  /**
   * 全站唯一的 rAF 迴圈：驅動 Lenis 插值、捲動速度變數、所有捲動場景。
   * 場景與 Lenis 誰先初始化都可以 — 迴圈只建一次。
   */
  private ensureLoop(): void {
    if (this.loopRunning || this.reduced) return;
    this.loopRunning = true;

    // 場景 CSS 的總開關。逃生門若發現 rAF 根本沒在跑會把它拿掉；
    // 迴圈恢復跳動時（例如背景分頁回到前景）會在下面自我修復。
    document.documentElement.classList.add('motion-ok');
    this.motionOkOn = true;
    this.lastY = window.scrollY;

    this.zone.runOutsideAngular(() => {
      const raf = (time: number) => {
        this.lastTickMs = performance.now();
        // rAF 活著就保證 motion-ok 在 — 逃生門若曾誤殺（背景載入），這裡救回來
        if (!this.motionOkOn) {
          document.documentElement.classList.add('motion-ok');
          this.motionOkOn = true;
        }
        this.lenis?.raf(time);

        // 捲動速度 → 平滑化 → clamp 到 ±1 → 寫 --sv（marquee/標題的速度傾斜用）
        const y = window.scrollY;
        this.smoothVel += (y - this.lastY - this.smoothVel) * 0.12;
        this.lastY = y;
        const sv = Math.round(Math.max(-1, Math.min(1, this.smoothVel / 44)) * 100) / 100;
        if (sv !== this.writtenVel) {
          this.writtenVel = sv;
          document.documentElement.style.setProperty('--sv', String(sv));
        }

        // 先全部讀、再全部寫 — 見類別註解
        const vh = window.innerHeight;
        for (const s of this.scenes) s.read(vh);
        for (const s of this.scenes) s.write();

        this.rafId = requestAnimationFrame(raf);
      };
      this.rafId = requestAnimationFrame(raf);
    });
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
    this.loopRunning = false;
    this.scenes.clear();
    this.lenis?.destroy();
    this.lenis = undefined;
  }
}
