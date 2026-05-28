import { Component, inject } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { CERTS, CertEntry } from '../../data/config';
import { CertModalService } from '../cert-modal/cert-modal.service';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './certifications.html',
  styleUrl: './certifications.scss',
})
export class Certifications {
  readonly certs: CertEntry[] = CERTS;
  private modalService = inject(CertModalService);

  openModal(cert: CertEntry): void {
    this.modalService.open(cert.image, cert.alt);
  }
}
