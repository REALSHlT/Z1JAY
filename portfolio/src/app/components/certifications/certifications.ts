import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { Img } from '../shared/img';
import { CERTS, CertEntry, LINKS } from '../../data/config';
import { fallbackFor } from '../../data/images';
import { CertModalService } from '../cert-modal/cert-modal.service';

/**
 * 「資歷」區塊 — 證照 + 作品平台 + 可互動 3D 展示。
 * 原本的「線上展示」區塊已併入這裡：Snapbrify 升格到「產品」區塊，
 * 剩下的平台連結與 Sketchfab 嵌入本質上都是「可查核的資歷」，放一起比較合理。
 */
@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [ScrollRevealDirective, Img, SplitTextDirective],
  templateUrl: './certifications.html',
  styleUrl: './certifications.scss',
})
export class Certifications {
  readonly certs: CertEntry[] = CERTS;
  readonly links = LINKS;
  readonly sketchfabModelUrl: SafeResourceUrl;

  private modalService = inject(CertModalService);

  constructor() {
    const sanitizer = inject(DomSanitizer);
    this.sketchfabModelUrl = sanitizer.bypassSecurityTrustResourceUrl(LINKS.platforms.sketchfabModel);
  }

  openModal(cert: CertEntry, trigger: HTMLElement): void {
    // 放大檢視用最大的那張（jpg 後備檔即為最大寬度）
    this.modalService.open(fallbackFor(cert.image), cert.alt, trigger);
  }
}
