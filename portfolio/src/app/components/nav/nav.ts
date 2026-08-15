import { AfterViewInit, Component, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { NAV_SECTIONS, NavSection } from '../../data/config';
import { Img } from '../shared/img';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [Img],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly sections: NavSection[] = NAV_SECTIONS;
  /** 頂部導覽不放「首頁」（點 logo 就回首頁）與「聯繫」（右側有 CTA 按鈕） */
  readonly topSections = NAV_SECTIONS.filter((s) => s.id !== 'hero' && s.id !== 'contact');
  readonly bottomSections = NAV_SECTIONS.filter((s) => s.bottom);

  readonly scrolled = signal(false);
  readonly active = signal<string>('hero');

  private observer?: IntersectionObserver;
  private teardown?: () => void;

  ngAfterViewInit(): void {
    // ── 目前在哪一區 ──
    // 用 IntersectionObserver 而不是捲動事件：rootMargin 夾出畫面中央一條窄帶，
    // 同一時間只有一個區塊會命中，不需要自己算距離。
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.active.set(e.target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    for (const s of this.sections) {
      const el = document.getElementById(s.id);
      if (el) this.observer.observe(el);
    }

    // ── 頂欄陰影 ──
    // 監聽掛在 Angular 區域外；signal 用 Object.is 去重，
    // 所以只有 true↔false 真的改變時才會觸發一次變更偵測。
    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        const next = window.scrollY > 40;
        if (next !== this.scrolled()) this.zone.run(() => this.scrolled.set(next));
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      this.teardown = () => window.removeEventListener('scroll', onScroll);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.teardown?.();
  }
}
