import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() revealClass: 'reveal' | 'reveal-left' | 'reveal-right' | 'reveal-scale' = 'reveal';
  @Input() revealDelay = 0;

  private observer!: IntersectionObserver;
  private lastScrollY = window.scrollY;
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
        const scrollY = window.scrollY;
        this.lastScrollY = scrollY;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.removeAttribute('data-exit');
            el.classList.add('visible');
          } else {
            const rect = el.getBoundingClientRect();
            const inRange = rect.top < window.innerHeight * 1.5 && rect.bottom > -window.innerHeight * 0.5;
            if (inRange) {
              // Element is near or at the viewport edge — set exit direction
              // rect.top < half viewport → element is leaving from the top
              el.setAttribute('data-exit', rect.top < window.innerHeight * 0.5 ? 'top' : 'bottom');
              el.classList.remove('visible');
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '-80px 0px -60px 0px' }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
