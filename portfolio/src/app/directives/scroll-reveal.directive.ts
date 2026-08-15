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
     * 只播一次。
     *
     * 舊版在元素離開畫面時會移除 .visible，導致往回捲時內容整片淡出再淡入 —
     * 來回捲動就一直閃，資訊型內容不該這樣。進場動畫的意義是「第一次出現」，
     * 播完就 unobserve，順便省掉後續所有的 observer 回呼。
     */
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.classList.add('visible');
          // 動畫結束後把 transition-delay 清掉，否則之後的 hover 效果也會被延遲
          if (delay) setTimeout(() => (el.style.transitionDelay = ''), delay + 700);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
