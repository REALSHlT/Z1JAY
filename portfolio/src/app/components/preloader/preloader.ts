import { Component, NgZone, OnInit, inject, signal } from '@angular/core';
import { MotionService } from '../../services/motion.service';

/**
 * 開場預載動畫 —— 數字從 0 跑到 100，跑完幕簾往上收，首屏才開始播。
 *
 * 這是實驗性作品集的標準開場：一方面替字體與首圖爭取載入時間，
 * 另一方面把「這個站是精心做的」這件事在第一秒就講完。
 *
 * 只播一次（用 sessionStorage 記住），否則每次切回分頁都要等一輪會很煩。
 * 減少動態模式直接跳過。
 */
@Component({
  selector: 'app-preloader',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="preloader" [class.preloader-out]="leaving()" aria-hidden="true">
        <div class="preloader-inner">
          <span class="preloader-mark">Z1JAY<sup>™</sup></span>
          <span class="preloader-count">{{ count() }}</span>
          <span class="preloader-bar"><i [style.transform]="'scaleX(' + count() / 100 + ')'"></i></span>
        </div>
      </div>
    }
  `,
  styleUrl: './preloader.scss',
})
export class Preloader implements OnInit {
  private readonly zone = inject(NgZone);
  private readonly motion = inject(MotionService);

  readonly visible = signal(false);
  readonly leaving = signal(false);
  readonly count = signal(0);

  ngOnInit(): void {
    const seen = sessionStorage.getItem('z1jay-intro') === '1';
    if (seen || this.motion.reduced) {
      this.motion.ready.set(true);
      document.documentElement.classList.add('is-ready');
      return;
    }

    this.visible.set(true);
    document.documentElement.classList.add('is-loading');

    const DURATION = 1500;

    // 計數跑在 zone 外，只在整數變化時進 zone 更新 signal
    this.zone.runOutsideAngular(() => {
      const start = performance.now();

      const tick = (now: number) => {
        if (this.done) return;
        const t = Math.min((now - start) / DURATION, 1);
        // easeOutExpo — 前段衝很快，尾巴慢慢收，像真的在載東西
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        const value = Math.round(eased * 100);

        if (value !== this.count()) this.zone.run(() => this.count.set(value));

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          this.zone.run(() => this.finish());
        }
      };
      requestAnimationFrame(tick);

      /**
       * 保險絲 —— requestAnimationFrame 在「分頁未顯示 / 不合成畫面」時不會觸發，
       * 只靠 rAF 的話幕簾會永遠停在 0% 並把捲動鎖死，整個網站等於打不開。
       * 這裡用 setTimeout（背景分頁仍會計時）強制收尾，動畫再漂亮也不能擋住內容。
       */
      setTimeout(() => {
        if (!this.done) this.zone.run(() => this.finish());
      }, DURATION + 600);
    });
  }

  /** 確保收尾只跑一次（rAF 與保險絲可能同時抵達） */
  private done = false;

  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.count.set(100);
    this.leaving.set(true);
    sessionStorage.setItem('z1jay-intro', '1');
    document.documentElement.classList.remove('is-loading');
    document.documentElement.classList.add('is-ready');
    this.motion.ready.set(true);
    // 等幕簾動畫跑完再把節點移除
    setTimeout(() => this.visible.set(false), 900);
  }
}
