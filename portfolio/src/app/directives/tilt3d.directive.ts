import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { MotionService } from '../services/motion.service';

/**
 * 滑鼠 3D 傾斜 — 卡片朝游標方向立體傾斜。
 *
 * 只寫兩個 CSS 變數（--mx / --my，單位是「度」的數值），不碰 transform —
 * 消費端的場景 CSS 把它們加進自己的 rotateX/rotateY 運算式裡，
 * 捲動動畫與滑鼠互動因此能疊加在同一個 transform 上而不互相覆蓋。
 *
 * 平滑不靠 CSS transition（那會跟每幀更新的捲動 transform 打架），
 * 而是掛進 MotionService 的 rAF 迴圈做 lerp — 追游標與歸位都是彈性的。
 * 觸控裝置與減少動態模式下完全不啟動。
 */
@Directive({
  selector: '[appTilt3d]',
  standalone: true,
})
export class Tilt3dDirective implements OnInit, OnDestroy {
  /** 最大傾斜角（度） */
  private static readonly MAX = 7;

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  private targetX = 0;
  private targetY = 0;
  private curX = 0;
  private curY = 0;
  private off?: () => void;
  private teardown?: () => void;

  ngOnInit(): void {
    if (this.motion.reduced || !matchMedia('(pointer: fine)').matches) return;

    const onMove = (e: PointerEvent) => {
      const r = this.el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // 游標在卡片上的位置 → ±MAX 度
      this.targetX = ((e.clientX - r.left) / r.width - 0.5) * 2 * Tilt3dDirective.MAX;
      this.targetY = -((e.clientY - r.top) / r.height - 0.5) * 2 * Tilt3dDirective.MAX;
    };
    const onLeave = () => { this.targetX = 0; this.targetY = 0; };

    this.el.addEventListener('pointermove', onMove, { passive: true });
    this.el.addEventListener('pointerleave', onLeave, { passive: true });
    this.teardown = () => {
      this.el.removeEventListener('pointermove', onMove);
      this.el.removeEventListener('pointerleave', onLeave);
    };

    this.off = this.motion.addScene({
      read: () => {},
      write: () => {
        // 靜止且已歸位 → 什麼都不寫
        if (this.curX === this.targetX && this.curY === this.targetY) return;
        this.curX += (this.targetX - this.curX) * 0.16;
        this.curY += (this.targetY - this.curY) * 0.16;
        if (Math.abs(this.curX - this.targetX) < 0.02) this.curX = this.targetX;
        if (Math.abs(this.curY - this.targetY) < 0.02) this.curY = this.targetY;
        this.el.style.setProperty('--mx', this.curX.toFixed(2));
        this.el.style.setProperty('--my', this.curY.toFixed(2));
      },
    });
  }

  ngOnDestroy(): void {
    this.off?.();
    this.teardown?.();
  }
}
