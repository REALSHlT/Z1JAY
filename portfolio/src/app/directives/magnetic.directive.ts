import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';

/**
 * 磁吸按鈕 —— 指標靠近時元素被輕輕「吸」過去，離開就彈回。
 *
 * 只在有精確指標（滑鼠）的裝置啟用；觸控裝置沒有 hover，掛了只是浪費效能。
 * 監聽掛在 Angular 區域外、以 rAF 合併，直接寫 transform — 不觸發變更偵測。
 */
@Directive({
  selector: '[appMagnetic]',
  standalone: true,
})
export class MagneticDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  /** 位移幅度上限（px）— 太大會讓按鈕難以點中 */
  private readonly strength = 14;
  private readonly radius = 90;

  private frame = 0;
  private teardown?: () => void;

  ngAfterViewInit(): void {
    if (!matchMedia('(pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const host = this.el.nativeElement;
    host.classList.add('magnetic');

    let targetX = 0;
    let targetY = 0;

    this.zone.runOutsideAngular(() => {
      const onMove = (e: MouseEvent) => {
        const r = host.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < r.width / 2 + this.radius) {
          const pull = 1 - Math.min(dist / (r.width / 2 + this.radius), 1);
          targetX = dx * pull * (this.strength / 20);
          targetY = dy * pull * (this.strength / 20);
        } else {
          targetX = 0;
          targetY = 0;
        }
        if (!this.frame) this.frame = requestAnimationFrame(this.paint);
      };

      const onLeave = () => {
        targetX = 0;
        targetY = 0;
        if (!this.frame) this.frame = requestAnimationFrame(this.paint);
      };

      this.paint = () => {
        this.frame = 0;
        host.style.transform = `translate(${targetX.toFixed(2)}px, ${targetY.toFixed(2)}px)`;
      };

      document.addEventListener('mousemove', onMove, { passive: true });
      host.addEventListener('mouseleave', onLeave);
      this.teardown = () => {
        document.removeEventListener('mousemove', onMove);
        host.removeEventListener('mouseleave', onLeave);
      };
    });
  }

  private paint: () => void = () => {};

  ngOnDestroy(): void {
    this.teardown?.();
    if (this.frame) cancelAnimationFrame(this.frame);
  }
}
