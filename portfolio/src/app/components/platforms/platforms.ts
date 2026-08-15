import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { LINKS } from '../../data/config';

@Component({
  selector: 'app-platforms',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './platforms.html',
  styleUrl: './platforms.scss',
})
export class Platforms {
  readonly links = LINKS;

  /** Sketchfab 允許嵌入（Snapbrify 不允許 — 見 platforms.html 的說明） */
  readonly sketchfabModelUrl: SafeResourceUrl;

  readonly snapbrifySteps = [
    { icon: 'photo_camera', title: '拍攝材質', detail: '用手機或相機對著實體表面拍幾張照，支援 HDR 多張合併。' },
    { icon: 'wb_auto',      title: '自動校正', detail: '自動白平衡與去除光影，把拍攝當下的環境光從材質裡剝離出來。' },
    { icon: 'layers',       title: '輸出貼圖', detail: '產生可直接匯入 Maya / Blender / UE 的 PBR 通道，支援無縫平鋪。' },
  ];

  readonly pbrChannels = [
    { name: 'Albedo',    zh: '基礎色',   swatch: 'linear-gradient(135deg,#b08968,#7f5539)' },
    { name: 'Normal',    zh: '法線',     swatch: 'linear-gradient(135deg,#8ca0ff,#7f88d8)' },
    { name: 'Roughness', zh: '粗糙度',   swatch: 'linear-gradient(135deg,#f2f2f2,#565656)' },
    { name: 'Height',    zh: '高度/位移', swatch: 'linear-gradient(135deg,#ffffff,#1a1a1a)' },
  ];

  constructor() {
    const sanitizer = inject(DomSanitizer);
    this.sketchfabModelUrl = sanitizer.bypassSecurityTrustResourceUrl(LINKS.platforms.sketchfabModel);
  }
}
