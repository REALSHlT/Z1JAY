import { Directive, ElementRef, OnInit, OnDestroy, inject, input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  readonly revealClass = input<'reveal' | 'reveal-left' | 'reveal-right' | 'reveal-scale'>('reveal');
  readonly revealDelay = input(0);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const el = this.el.nativeElement;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // 不加任何 reveal class — 內容直接就位，不需要靠 .visible 覆寫
      return;
    }

    el.classList.add(this.revealClass());
    const delay = this.revealDelay();
    if (delay) el.style.transitionDelay = `${delay}ms`;

    /**
     * 可重複播放：進入視窗就播，完全離開視窗就復位，再進來會再播一次。
     *
     * 關鍵在兩個門檻不同 —— 進場用 0.15，復位用「完全看不到」(ratio === 0)。
     * 如果進出用同一個門檻，元素停在邊界時會不斷跨越那條線而瘋狂閃爍；
     * 拉開成遲滯區間（hysteresis）之後，只有真的整個滑出畫面才會重置。
     */
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.15) {
            el.classList.add('visible');
          } else if (entry.intersectionRatio === 0) {
            el.classList.remove('visible');
          }
        }
      },
      { threshold: [0, 0.15] },
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
