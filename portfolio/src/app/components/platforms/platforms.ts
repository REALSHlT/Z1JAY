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
    { icon: 'photo_camera', title: '拍攝材質',
      detail: '手機直接叫用系統相機拍攝，沿用手機自身的多幀合成與穩定處理，再裁切構圖。' },
    { icon: 'memory',       title: '端上 AI 推論',
      detail: '深度估計模型在瀏覽器內以 WebGPU 執行，照片全程不離開你的裝置。' },
    { icon: 'layers',       title: '輸出貼圖',
      detail: '產生六通道 PBR，可下載 ZIP 或存雲端；另有 Blender 外掛可一鍵建成材質。' },
  ];

  /** Snapbrify 實際產出的六個通道（儲存時 AO/Roughness/Metallic 會 ORM 封裝成一張） */
  readonly pbrChannels = [
    { name: 'Basecolor', zh: '基礎色',   swatch: 'linear-gradient(135deg,#b08968,#7f5539)' },
    { name: 'Normal',    zh: '法線',     swatch: 'linear-gradient(135deg,#8ca0ff,#7f88d8)' },
    { name: 'Roughness', zh: '粗糙度',   swatch: 'linear-gradient(135deg,#f2f2f2,#565656)' },
    { name: 'Height',    zh: '高度/位移', swatch: 'linear-gradient(135deg,#ffffff,#1a1a1a)' },
    { name: 'AO',        zh: '環境遮蔽', swatch: 'linear-gradient(135deg,#e8e8e8,#3a3a3a)' },
    { name: 'Metallic',  zh: '金屬度',   swatch: 'linear-gradient(135deg,#d9d9d9,#2b2b2b)' },
  ];

  constructor() {
    const sanitizer = inject(DomSanitizer);
    this.sketchfabModelUrl = sanitizer.bypassSecurityTrustResourceUrl(LINKS.platforms.sketchfabModel);
  }
}
