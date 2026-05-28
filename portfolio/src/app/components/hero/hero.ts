import { Component, HostListener, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  parallaxY = signal(0);

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxY.set(window.scrollY * 0.05);
  }
}
