import { Injectable, signal } from '@angular/core';

export interface ModalState {
  open: boolean;
  src: string;
  alt: string;
}

@Injectable({ providedIn: 'root' })
export class CertModalService {
  state = signal<ModalState>({ open: false, src: '', alt: '' });

  open(src: string, alt: string): void {
    this.state.set({ open: true, src, alt });
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.state.update(s => ({ ...s, open: false }));
    document.body.style.overflow = '';
  }
}
