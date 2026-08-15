import { Injectable, signal } from '@angular/core';

export interface ModalState {
  open: boolean;
  src: string;
  alt: string;
}

@Injectable({ providedIn: 'root' })
export class CertModalService {
  readonly state = signal<ModalState>({ open: false, src: '', alt: '' });

  /** 開啟前的聚焦元素 — 關閉時要把焦點還回去，鍵盤使用者才不會迷失位置 */
  private trigger: HTMLElement | null = null;

  open(src: string, alt: string, trigger?: HTMLElement | null): void {
    this.trigger = trigger ?? (document.activeElement as HTMLElement | null);
    this.state.set({ open: true, src, alt });
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    if (!this.state().open) return;
    this.state.update((s) => ({ ...s, open: false }));
    document.body.style.overflow = '';
    this.trigger?.focus?.();
    this.trigger = null;
  }
}
