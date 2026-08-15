import { Component, computed, input } from '@angular/core';
import { IMAGES, srcsetFor, fallbackFor } from '../../data/images';

/**
 * 響應式圖片。輸出 <picture> + avif/webp/jpg 三層後備，並自動帶上
 * width/height（避免版面位移 CLS）與 lazy loading。
 *
 * host 與 <picture> 都是 display:contents — 讓 <img> 直接參與父層排版，
 * 沿用原本的 w-full / h-full / object-cover 等 class，不需要改動既有版型。
 *
 * 用法：<app-img name="Order" alt="《Order》" sizes="(min-width:768px) 60vw, 100vw"
 *                imgClass="w-full h-full object-cover" />
 */
@Component({
  selector: 'app-img',
  standalone: true,
  styles: [`
    :host, picture { display: contents; }
  `],
  template: `
    <picture>
      <source type="image/avif" [srcset]="avif()" [attr.sizes]="sizes()" />
      <source type="image/webp" [srcset]="webp()" [attr.sizes]="sizes()" />
      <img
        [src]="fallback()"
        [alt]="alt()"
        [attr.width]="dim().w"
        [attr.height]="dim().h"
        [attr.loading]="priority() ? null : 'lazy'"
        [attr.fetchpriority]="priority() ? 'high' : null"
        [attr.decoding]="priority() ? null : 'async'"
        [class]="imgClass()" />
    </picture>
  `,
})
export class Img {
  /** 檔名（不含副檔名），需存在於 data/images.ts 的清單中 */
  readonly name = input.required<string>();
  readonly alt = input.required<string>();
  /** CSS sizes 屬性 — 告訴瀏覽器這張圖在各斷點的顯示寬度，才挑得到對的檔案 */
  readonly sizes = input('100vw');
  readonly imgClass = input('');
  /** 首屏圖片設 true：改為 eager + fetchpriority=high */
  readonly priority = input(false);

  readonly avif = computed(() => srcsetFor(this.name(), 'avif'));
  readonly webp = computed(() => srcsetFor(this.name(), 'webp'));
  readonly fallback = computed(() => fallbackFor(this.name()));
  readonly dim = computed(() => IMAGES[this.name()]);
}
