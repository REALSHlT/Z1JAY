import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject, viewChild } from '@angular/core';
import { Nav } from './components/nav/nav';
import { Hero } from './components/hero/hero';
import { Skills } from './components/skills/skills';
import { Projects } from './components/projects/projects';
import { Tools } from './components/tools/tools';
import { Products } from './components/products/products';
import { About } from './components/about/about';
import { Collaborate } from './components/collaborate/collaborate';
import { Experience } from './components/experience/experience';
import { AiLab } from './components/ai-lab/ai-lab';
import { PoseLab } from './components/pose-lab/pose-lab';
import { Certifications } from './components/certifications/certifications';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';
import { CertModal } from './components/cert-modal/cert-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Nav,
    Hero,
    Skills,
    Projects,
    Tools,
    Products,
    About,
    Collaborate,
    Experience,
    AiLab,
    PoseLab,
    Certifications,
    Contact,
    Footer,
    CertModal,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  private readonly dot = viewChild<ElementRef<HTMLElement>>('cursorDot');
  private readonly ring = viewChild<ElementRef<HTMLElement>>('cursorRing');

  private x = -100;
  private y = -100;
  private target: EventTarget | null = null;
  private frame = 0;
  private teardown?: () => void;

  /**
   * 自訂游標。
   *
   * 舊版用 @HostListener('document:mousemove') 每次滑鼠移動就寫兩個 signal —
   * 滑鼠一秒可觸發上千次事件，等於每次都跑一輪變更偵測，整頁都被拖慢。
   *
   * 現在：(1) 觸控裝置直接不掛監聽（那裡本來就看不到游標）；
   *       (2) 監聽掛在 Angular 區域外，完全不觸發變更偵測；
   *       (3) 用 requestAnimationFrame 合併，每個影格最多畫一次，直接改 DOM style。
   */
  ngAfterViewInit(): void {
    if (!matchMedia('(pointer: fine)').matches) return;

    this.zone.runOutsideAngular(() => {
      const onMove = (e: MouseEvent) => {
        this.x = e.clientX;
        this.y = e.clientY;
        this.target = e.target;
        if (!this.frame) this.frame = requestAnimationFrame(this.paint);
      };
      document.addEventListener('mousemove', onMove, { passive: true });
      this.teardown = () => document.removeEventListener('mousemove', onMove);
    });
  }

  private paint = (): void => {
    this.frame = 0;
    const transform = `translate(${this.x}px, ${this.y}px) translate(-50%, -50%)`;
    const dot = this.dot()?.nativeElement;
    const ring = this.ring()?.nativeElement;
    if (dot) dot.style.transform = transform;
    if (ring) {
      ring.style.transform = transform;
      // closest() 是 DOM 走訪，放在 rAF 裡跑（每影格一次）而不是每個事件都跑
      const el = this.target as HTMLElement | null;
      ring.classList.toggle('is-hover', !!el?.closest?.('a, button, input, summary, [role="button"]'));
    }
  };

  ngOnDestroy(): void {
    this.teardown?.();
    if (this.frame) cancelAnimationFrame(this.frame);
  }
}
