import { AfterViewInit, Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';

/**
 * 動態文字進場 —— 把文字拆成「字」或「詞」，逐一錯開淡入。
 *
 * 這是實驗性作品集網站最有辨識度的一招：標題不是整塊淡入，
 * 而是一個字一個字往上翻出來，讀者的視線會被帶著走。
 *
 * 實作重點：
 * - 每個字外面包一層 overflow:hidden 的遮罩，內層往上位移 → 「從地板翻出來」的感覺
 * - CJK 逐字拆、拉丁文逐詞拆（逐字拆英文會變成亂碼般的跳動）
 * - 只播一次，播完 unobserve
 * - aria 上把原字串留在 aria-label，拆開的字設 aria-hidden，螢幕閱讀器才不會逐字念
 */
@Directive({
  selector: '[appSplitText]',
  standalone: true,
})
export class SplitTextDirective implements AfterViewInit, OnDestroy {
  /** 每個單位之間的延遲（毫秒） */
  readonly stagger = input(28);
  /** 整體延遲 */
  readonly splitDelay = input(0);
  /**
   * 上墨模式：不用 IntersectionObserver 播一次，而是把每個字的序號寫成 --i、
   * 總數寫成 --n，讓 CSS 依祖先的捲動進度 --p 逐字填墨（往回捲會逐字褪回去）。
   * 搭配同一元素或祖先上的 appScene 使用。
   */
  readonly scrub = input(false);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const text = host.textContent?.trim() ?? '';
    if (!text) return;

    host.setAttribute('aria-label', text);
    host.textContent = '';
    host.classList.add('split-text');
    const scrub = this.scrub();
    if (scrub) host.classList.add('split-scrub');

    // CJK 逐字、拉丁逐詞：用「是否含 CJK」決定切法
    const hasCJK = /[㐀-鿿豈-﫿]/.test(text);
    const units = hasCJK ? [...text] : text.split(/(\s+)/);

    let index = 0;
    for (const unit of units) {
      if (/^\s+$/.test(unit)) {
        host.appendChild(document.createTextNode(unit));
        continue;
      }
      const mask = document.createElement('span');
      mask.className = 'split-mask';
      mask.setAttribute('aria-hidden', 'true');

      const inner = document.createElement('span');
      inner.className = 'split-unit';
      inner.textContent = unit;
      if (scrub) {
        inner.style.setProperty('--i', String(index));
      } else {
        inner.style.transitionDelay = `${this.splitDelay() + index * this.stagger()}ms`;
      }

      mask.appendChild(inner);
      host.appendChild(mask);
      index++;
    }

    if (scrub) {
      host.style.setProperty('--n', String(index));
      return; // 進度由 --p 驅動，不需要 IO
    }

    /**
     * 可重複播放 —— 與 scroll-reveal 相同的遲滯策略：
     * 露出兩成就播，完全離開畫面才復位。標題再次捲回來時會重新逐字翻出。
     */
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.2) {
            host.classList.add('split-in');
          } else if (entry.intersectionRatio === 0) {
            host.classList.remove('split-in');
          }
        }
      },
      { threshold: [0, 0.2] },
    );
    this.observer.observe(host);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
