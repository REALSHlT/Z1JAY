import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { CertModalService } from './cert-modal.service';

@Component({
  selector: 'app-cert-modal',
  standalone: true,
  imports: [],
  templateUrl: './cert-modal.html',
  styleUrl: './cert-modal.scss',
})
export class CertModal {
  readonly modal = inject(CertModalService);
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  constructor() {
    // 開啟後把焦點移進對話框，否則焦點還留在背景頁面上
    effect(() => {
      if (this.modal.state().open) {
        queueMicrotask(() => this.closeBtn()?.nativeElement?.focus());
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.modal.close();
  }

  /**
   * 焦點鎖定：對話框裡只有「關閉」一個可聚焦元素，
   * 所以 Tab / Shift+Tab 一律導回它，焦點不會跑到背後的頁面。
   */
  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  onTab(event: Event): void {
    if (!this.modal.state().open) return;
    event.preventDefault();
    this.closeBtn()?.nativeElement?.focus();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'certModalBackdrop') {
      this.modal.close();
    }
  }
}
