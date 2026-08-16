import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject, viewChild } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { ScrollSceneDirective } from '../../directives/scroll-scene.directive';
import { Img } from '../shared/img';
import { MagneticDirective } from '../../directives/magnetic.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollRevealDirective, ScrollSceneDirective, Img, MagneticDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly photo = viewChild<ElementRef<HTMLElement>>('photo');

  private frame = 0;
  private teardown?: () => void;

  /**
   * 照片視差。與自訂游標同樣的理由：捲動事件極為密集，
   * 舊版每次都寫 signal 觸發變更偵測。改成區域外監聽 + rAF 合併 + 直接改 transform。
   * 使用者若偏好減少動態效果就完全不掛監聽。
   */
  ngAfterViewInit(): void {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        if (!this.frame) this.frame = requestAnimationFrame(this.paint);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      this.teardown = () => window.removeEventListener('scroll', onScroll);
    });
  }

  private paint = (): void => {
    this.frame = 0;
    const el = this.photo()?.nativeElement;
    if (el) el.style.transform = `translateY(${window.scrollY * 0.05}px)`;
  };

  ngOnDestroy(): void {
    this.teardown?.();
    if (this.frame) cancelAnimationFrame(this.frame);
  }
}
