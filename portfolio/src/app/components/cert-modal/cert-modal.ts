import { Component, inject, HostListener } from '@angular/core';
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

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.modal.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'certModalBackdrop') {
      this.modal.close();
    }
  }
}
