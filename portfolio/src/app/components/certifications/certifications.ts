import { Component, inject } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { Img } from '../shared/img';
import { CERTS, CertEntry } from '../../data/config';
import { fallbackFor } from '../../data/images';
import { CertModalService } from '../cert-modal/cert-modal.service';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [ScrollRevealDirective, Img],
  templateUrl: './certifications.html',
  styleUrl: './certifications.scss',
})
export class Certifications {
  readonly certs: CertEntry[] = CERTS;
  private modalService = inject(CertModalService);

  openModal(cert: CertEntry, trigger: HTMLElement): void {
    // 放大檢視用最大的那張（jpg 後備檔即為最大寬度）
    this.modalService.open(fallbackFor(cert.image), cert.alt, trigger);
  }
}
