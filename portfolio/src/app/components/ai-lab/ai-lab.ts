import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { LINKS } from '../../data/config';
import { ThemeService } from '../../services/theme.service';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Component({
  selector: 'app-ai-lab',
  standalone: true,
  imports: [FormsModule, ScrollRevealDirective],
  templateUrl: './ai-lab.html',
  styleUrl: './ai-lab.scss',
})
export class AiLab implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly theme = inject(ThemeService);
  private observer?: IntersectionObserver;
  private bgObjectUrl?: string;

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  // ── Chat ──
  readonly messages = signal<ChatMessage[]>([]);
  chatInput = '';
  readonly chatLoading = signal(false);
  readonly chatError = signal('');

  // ── Image generation ──
  imageInput = '';
  readonly imageLoading = signal(false);
  readonly imageError = signal('');
  readonly imageUrl = signal('');

  /** 目前是否套用了由生成圖片取出的主題色（共用 service 狀態） */
  readonly themed = this.theme.themed;

  /** section 在視窗內時背景才顯示；捲到過去經歷/證書認證時淡出 */
  readonly bgVisible = signal(false);

  // ── 開始使用門檻：按下前 AI 面板不可操作 ──
  readonly started = signal(false);
  readonly gateGone = signal(false);

  start(): void {
    if (this.started()) return;
    this.started.set(true);
    setTimeout(() => this.gateGone.set(true), 650);
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => this.bgVisible.set(entry.isIntersecting),
      { threshold: 0.15 },
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.bgObjectUrl) URL.revokeObjectURL(this.bgObjectUrl);
  }

  async sendChat(): Promise<void> {
    if (!this.started()) return;
    const prompt = this.chatInput.trim();
    if (!prompt || this.chatLoading()) return;

    this.chatInput = '';
    this.chatError.set('');
    this.messages.update((m) => [...m, { role: 'user', content: prompt }]);
    this.chatLoading.set(true);
    this.scrollChatToBottom();

    try {
      const res = await fetch(`${LINKS.ai.worker}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Worker 上限 20 則訊息，保留最近 12 則對話脈絡
        body: JSON.stringify({ messages: this.messages().slice(-12) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      this.messages.update((m) => [...m, { role: 'assistant', content: data.response ?? '(無回應)' }]);
    } catch (err) {
      this.chatError.set(
        (err as Error).message === '429' ? '訊息傳太快囉，休息一下再試' : '連線失敗，請稍後再試',
      );
      this.messages.update((m) => m.slice(0, -1));
      this.chatInput = prompt;
    } finally {
      this.chatLoading.set(false);
      this.scrollChatToBottom();
    }
  }

  async generateImage(): Promise<void> {
    if (!this.started()) return;
    const prompt = this.imageInput.trim();
    if (!prompt || this.imageLoading()) return;

    this.imageError.set('');
    this.imageLoading.set(true);

    try {
      const res = await fetch(`${LINKS.ai.worker}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width: 768, height: 768 }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();

      if (this.bgObjectUrl) URL.revokeObjectURL(this.bgObjectUrl);
      this.bgObjectUrl = URL.createObjectURL(blob);
      this.imageUrl.set(this.bgObjectUrl);

      // 從生成圖片取色，替整個網站換上同色系主題
      this.theme.applyFromImage(blob).catch(() => { /* 取色失敗就維持原主題 */ });
    } catch (err) {
      this.imageError.set(
        (err as Error).message === '429' ? '生圖太頻繁囉（每分鐘最多 3 張），休息一下再試' : '生成失敗，請稍後再試',
      );
    } finally {
      this.imageLoading.set(false);
    }
  }

  /** 恢復網站預設配色 */
  resetTheme(): void {
    this.theme.reset();
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatScroll?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
