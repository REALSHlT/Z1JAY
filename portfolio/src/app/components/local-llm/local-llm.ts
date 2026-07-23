import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { LINKS } from '../../data/config';
import { ThemeService } from '../../services/theme.service';

type Msg = { role: 'user' | 'assistant'; content: string; imageLoading?: boolean; imageUrl?: string };
type EngineState = 'idle' | 'loading' | 'ready' | 'error';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

/** 精簡版個資 — 360M 模型注意力有限，只餵關鍵事實 */
const SYSTEM_PROMPT = `你是在訪客瀏覽器內運行的本地 AI 助手，代表這個作品集網站的主人 Z1JAY（林子傑）。訪客問到「站主／他／你的主人」都是指 Z1JAY。

Z1JAY 檔案：
- 台灣台中人，嶺東科技大學數位媒體設計系碩士（2024）。3D 藝術家／動畫師，也做前端與 AI。
- 技能：3D 建模、Rigging 骨架、著色器、3D 動畫、動態捕捉、3D 模擬、3D 燈光、AI 工程。
- 代表作：《The Gentle Trigger》(碩士3D動畫)、《骨牌物語》(NPR,台中市府)、《Order》(UE5遊戲,聲控)、《Where is Noddy?》(VR動捕,高雄電影節)。
- 個人產品 Snapbrify(snapbrify.com)：照片轉 PBR 材質。
- 聯絡：Email w6619willy@gmail.com、IG @z_jay_0723。

規則：
- 用訪客的語言回答；中文一律用「繁體中文」。簡潔（2-3 句）。不知道就說不知道，別編造。
- 你是助手，不是 Z1JAY 本人；介紹他時用第三人稱。
- 當訪客想看圖、或一張圖能幫助說明時，在回答最後另起一行輸出：[IMAGE: 英文的圖像描述]。不需要圖時就不要輸出這個標記。`;

@Component({
  selector: 'app-local-llm',
  standalone: true,
  imports: [FormsModule, ScrollRevealDirective],
  templateUrl: './local-llm.html',
  styleUrl: './local-llm.scss',
})
export class LocalLlm {
  private readonly theme = inject(ThemeService);
  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  readonly state = signal<EngineState>('idle');
  readonly progress = signal(0);
  readonly progressText = signal('');
  readonly backend = signal('');
  readonly errorText = signal('');
  readonly messages = signal<Msg[]>([]);
  readonly generating = signal(false);
  chatInput = '';

  readonly isMobile =
    (navigator as unknown as { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ??
    /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);

  private engine?: import('@mlc-ai/web-llm').MLCEngine;

  /** 顯示用：把 [IMAGE: ...] 標記從氣泡文字移除 */
  display(content: string): string {
    return content.replace(/\[IMAGE:[^\]]*\]/gi, '').trim();
  }

  async loadModel(): Promise<void> {
    if (this.state() !== 'idle' && this.state() !== 'error') return;
    this.state.set('loading');
    this.errorText.set('');
    this.progress.set(0);
    this.progressText.set('正在快取中…');

    try {
      const webllm = await import('@mlc-ai/web-llm');
      this.engine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (r: import('@mlc-ai/web-llm').InitProgressReport) => {
          this.progress.set(Math.round((r.progress ?? 0) * 100));
          this.progressText.set(
            /* 首次下載權重時 WebLLM 會回報 fetching/cache 進度 */
            r.text?.includes('Loading') ? '編譯模型中…' : '正在快取中…',
          );
        },
      });
      this.backend.set('WebGPU · 100% 本地');
      this.state.set('ready');
    } catch (err) {
      this.state.set('error');
      const msg = (err as Error)?.message ?? String(err);
      this.errorText.set(
        /WebGPU|adapter|gpu/i.test(msg)
          ? '你的瀏覽器不支援 WebGPU — 請用電腦版 Chrome/Edge，或較新的手機瀏覽器'
          : `模型載入失敗：${msg}`,
      );
    }
  }

  async send(): Promise<void> {
    const prompt = this.chatInput.trim();
    if (!prompt || this.state() !== 'ready' || this.generating() || !this.engine) return;

    this.chatInput = '';
    this.messages.update((m) => [...m, { role: 'user', content: prompt }, { role: 'assistant', content: '' }]);
    this.generating.set(true);
    this.scrollToBottom();

    try {
      const history = this.messages()
        .slice(0, -1) // 去掉剛塞入的空 assistant 佔位
        .slice(-6)    // 只留最近幾輪，360M 脈絡有限
        .map((m) => ({ role: m.role, content: m.content }));

      const stream = await this.engine.chat.completions.create({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
        stream: true,
        temperature: 0.6,
        max_tokens: 400,
      });

      let acc = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (!delta) continue;
        acc += delta;
        this.updateLastAssistant(acc);
        this.scrollToBottom();
      }

      // 偵測 [IMAGE: ...] → 交給雲端 DreamShaper 生圖
      const match = acc.match(/\[IMAGE:\s*([^\]]+)\]/i);
      if (match) await this.generateImage(match[1].trim());
    } catch (err) {
      this.updateLastAssistant(`(發生錯誤：${(err as Error)?.message ?? err})`);
    } finally {
      this.generating.set(false);
      this.scrollToBottom();
    }
  }

  /** 本地 LLM 決定要畫圖 → 呼叫既有的 Cloudflare DreamShaper，並觸發全站換色 */
  private async generateImage(imgPrompt: string): Promise<void> {
    this.setLastAssistant({ imageLoading: true });
    this.scrollToBottom();
    try {
      const res = await fetch(`${LINKS.ai.worker}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imgPrompt, width: 768, height: 768 }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      this.setLastAssistant({ imageLoading: false, imageUrl: url });
      this.theme.applyFromImage(blob).catch(() => { /* 取色失敗就維持原主題 */ });
    } catch {
      this.setLastAssistant({ imageLoading: false });
    }
  }

  private updateLastAssistant(content: string): void {
    this.messages.update((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content };
      return copy;
    });
  }

  private setLastAssistant(patch: Partial<Msg>): void {
    this.messages.update((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, ...patch };
      return copy;
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.chatScroll?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
