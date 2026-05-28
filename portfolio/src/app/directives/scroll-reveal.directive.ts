import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() revealClass: 'reveal' | 'reveal-left' | 'reveal-right' = 'reveal';
  @Input() revealDelay = 0;

  private observer!: IntersectionObserver;
  private prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const el = this.el.nativeElement;
    el.classList.add(this.revealClass);
    if (this.revealDelay) {
      el.style.transitionDelay = `${this.revealDelay}ms`;
    }

    if (this.prefersReducedMotion) {
      el.classList.add('visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('visible');
          } else {
            // Only remove visible if element is near/past viewport edge (not initial off-screen state)
            const rect = el.getBoundingClientRect();
            const inRange = rect.top < window.innerHeight * 1.5 && rect.bottom > -window.innerHeight * 0.5;
            if (inRange) el.classList.remove('visible');
          }
        });
      },
      // Entry: 60px before bottom; Exit: fires 80px before leaving top (element still 80px visible)
      { threshold: 0.1, rootMargin: '-80px 0px -60px 0px' }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
