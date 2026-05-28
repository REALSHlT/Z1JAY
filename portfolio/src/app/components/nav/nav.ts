import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
  }

  smoothScroll(id: string): void {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
