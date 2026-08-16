import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { MotionService } from '../services/motion.service';

/**
 * 捲動場景 — 把「這個元素捲到哪裡了」寫成 CSS 變數 --p（0 到 1）。
 *
 * 動畫本體全部寫在 CSS 裡（calc + var(--p)），JS 只負責量進度。
 * 這個分工是整套系統的核心：
 * - 捲動軸就是時間軸 — 往回捲，所有動畫天生會倒放，不需要任何額外程式
 * - 每個區塊可以用完全不同的機制（釘住畫廊、疊卡、逐字上墨…），只要各自吃 --p
 * - CSS 變數會繼承，--p 放在區塊上，子孫任何元素都能各自解讀同一個進度
 *
 * 三種進度模式：
 * - through：元素從「頂端碰到視窗底」到「底端離開視窗頂」— 一般區塊的視差／滑入用
 * - exit：  元素從「頂端對齊視窗頂」到「完全捲出畫面」— Hero 散場用
 * - pin：   sticky 容器從釘住到釋放 — 水平畫廊、疊卡用（容器要比視窗高）
 *
 * CSS 端一律寫 var(--p, 預設值)，預設值選「動畫完成後的自然狀態」——
 * 萬一 JS 沒跑（rAF 失效），版面停在可讀的最終狀態而不是半途。
 */
@Directive({
  selector: '[appScene]',
  standalone: true,
})
export class ScrollSceneDirective implements OnInit, OnDestroy {
  readonly sceneMode = input<'through' | 'exit' | 'pin'>('through');
  /** 水平畫廊用：量測 .hs-track 超出 .hs-view 的寬度，寫成 --shift（px） */
  readonly sceneTrack = input(false);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  private off?: () => void;
  private ro?: ResizeObserver;
  private written = -1;
  private next = 0;

  ngOnInit(): void {
    if (this.motion.reduced) return;

    const mode = this.sceneMode();

    if (this.sceneTrack()) {
      // 圖片載入、字型套用、視窗縮放都會改變軌道長度 — 交給 ResizeObserver 重量
      const view = this.el.querySelector<HTMLElement>('.hs-view');
      const track = this.el.querySelector<HTMLElement>('.hs-track');
      if (view && track) {
        const measure = () => {
          const shift = Math.max(0, track.scrollWidth - view.clientWidth);
          this.el.style.setProperty('--shift', `${shift}px`);
        };
        measure();
        this.ro = new ResizeObserver(measure);
        this.ro.observe(view);
        this.ro.observe(track);
      }
    }

    const hook = {
      read: (vh: number) => {
        const r = this.el.getBoundingClientRect();
        let p: number;
        switch (mode) {
          case 'exit':
            p = -r.top / Math.max(r.height, 1);
            break;
          case 'pin':
            p = -r.top / Math.max(r.height - vh, 1);
            break;
          default:
            p = (vh - r.top) / (vh + r.height);
        }
        // 量化到 1/500 再比對，靜止時完全不寫 style
        this.next = Math.round(Math.max(0, Math.min(1, p)) * 500) / 500;
      },
      write: () => {
        if (this.next === this.written) return;
        this.written = this.next;
        this.el.style.setProperty('--p', String(this.next));
      },
    };

    // 先同步算一次，首屏才不會先閃「動畫終點」再跳回實際進度
    hook.read(window.innerHeight);
    hook.write();

    this.off = this.motion.addScene(hook);
  }

  ngOnDestroy(): void {
    this.off?.();
    this.ro?.disconnect();
  }
}
