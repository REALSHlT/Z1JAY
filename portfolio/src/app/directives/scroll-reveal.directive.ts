import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() revealClass: 'reveal' | 'reveal-left' | 'reveal-right' | 'reveal-scale' = 'reveal';
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
            // Element entered viewport — reveal it
            el.removeAttribute('data-exit');
            el.classList.add('visible');
          } else if (el.classList.contains('visible')) {
            // Element WAS visible and is now leaving — animate the exit direction
            const rect = el.getBoundingClientRect();
            el.setAttribute('data-exit', rect.top < window.innerHeight * 0.5 ? 'top' : 'bottom');
            el.classList.remove('visible');
          }
          // else: element hasn't been seen yet — leave it at opacity 0, wait for real entry
        });
      },
      // threshold 0.15: reveal fires when 15% is visible (entering);
      // exit fires when <15% remains — element is still partially on screen so animation is perceptible
      { threshold: 0.15 }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
