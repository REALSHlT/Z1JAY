import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { LINKS } from '../../data/config';
import { ThemeService } from '../../services/theme.service';

type Msg = { role: 'user' | 'assistant'; content: string; imageLoading?: boolean; imageUrl?: string };
type Mode = 'cloud' | 'local';
type LocalState = 'idle' | 'loading' | 'ready' | 'error';

const LOCAL_MODEL_ID = 'gemma3-1b-it-q4f16_1-MLC';

/** 本地模型用的精簡個資 + 生圖指令（雲端的系統提示在 Worker 端） */
const LOCAL_SYSTEM_PROMPT = `你是作品集網站的助手，代表主人 Z1JAY（林子傑）。用繁體中文、第三人稱、簡潔回答關於他的問題。

Z1JAY：台灣台中人，嶺東科技大學數位媒體設計碩士（2024）；3D 藝術家／動畫師，也做前端與 AI。技能有 3D 建模、Rigging、著色器、動畫、動態捕捉、模擬、燈光、AI 工程。代表作《The Gentle Trigger》《骨牌物語》《Order》《Where is Noddy?》，個人產品 Snapbrify（照片轉 PBR 材質）。

當訪客要你畫圖／看圖時，「不要用文字描述圖片」，而是在回答最後單獨輸出一行標記，格式例如：
[IMAGE: a shiba inu under cherry blossoms, soft light]
系統會把這行標記自動換成真的圖片。不需要圖時就完全不要輸出這行。`;

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

  // ── 模式：雲端 / 本地 ──
  readonly mode = signal<Mode>('cloud');

  // ── 雲端：開始使用門檻（防一載入就打 API）──
  readonly cloudStarted = signal(false);

  // ── 本地：WebLLM 載入狀態 ──
  readonly localState = signal<LocalState>('idle');
  readonly localProgress = signal(0);
  readonly localProgressText = signal('');
  readonly localError = signal('');
  private engine?: import('@mlc-ai/web-llm').MLCEngine;

  // ── 本地模型快取狀態（讓使用者能清掉裝置上的 ~280MB）──
  readonly modelCached = signal(false);
  readonly cacheInfo = signal('');
  readonly clearing = signal(false);

  readonly isMobile =
    (navigator as unknown as { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ??
    /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);

  // ── 對話 ──
  readonly messages = signal<Msg[]>([]);
  chatInput = '';
  readonly generating = signal(false);
  readonly chatError = signal('');

  // ── 生成圖片作為區塊模糊背景 ──
  readonly bgUrl = signal('');
  readonly bgVisible = signal(false);

  /** 目前模式是否可以聊天 */
  readonly ready = () => (this.mode() === 'cloud' ? this.cloudStarted() : this.localState() === 'ready');
  readonly themed = this.theme.themed;

  /** 使用者訊息是否明顯在要求生圖（模型漏發 [IMAGE:] 標記時的保險） */
  private wantsImage(text: string): boolean {
    return /畫(一|個|張|出|下|給|成|幅|隻|條|朵|棵|我)|幫.{0,3}畫|生成.{0,5}圖|來(一|張).{0,5}圖|draw|generate.{0,12}(image|picture)|(image|picture) of/i.test(text);
  }

  display(content: string): string {
    return content
      .replace(/\[IMAGE:[^\]]*\]/gi, '')
      // 清掉模型可能複誦的指令殘句
      .replace(/(另起一行|以下是?(生成的)?圖片?|這是(生成的)?圖片?|幫你生成.*?圖片?)[:：]?\s*$/g, '')
      .replace(/[:：]\s*$/, '')
      .trim();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => this.bgVisible.set(entry.isIntersecting),
      { threshold: 0.15 },
    );
    this.observer.observe(this.host.nativeElement);
    this.checkCache();
  }

  /** 檢查本地模型是否已快取在裝置上（直接查 Cache Storage，不用載入 WebLLM） */
  private async checkCache(): Promise<void> {
    try {
      const keys = await caches.keys();
      this.modelCached.set(keys.some((k) => k.startsWith('webllm')));
      if (navigator.storage?.estimate) {
        const { usage } = await navigator.storage.estimate();
        if (usage) this.cacheInfo.set(`此站目前在你裝置上約使用 ${Math.round(usage / 1048576)} MB`);
      }
    } catch { /* 忽略 */ }
  }

  /** 清除已下載的本地模型，釋放裝置空間 */
  async clearCache(): Promise<void> {
    if (this.clearing()) return;
    this.clearing.set(true);
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('webllm')).map((k) => caches.delete(k)));
      this.engine = undefined;
      if (this.localState() === 'ready') this.localState.set('idle');
      this.modelCached.set(false);
      await this.checkCache();
    } finally {
      this.clearing.set(false);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.bgObjectUrl) URL.revokeObjectURL(this.bgObjectUrl);
  }

  setMode(m: Mode): void {
    this.mode.set(m);
    this.chatError.set('');
    if (m === 'local') this.checkCache();
  }

  startCloud(): void {
    this.cloudStarted.set(true);
  }

  resetTheme(): void {
    this.theme.reset();
  }

  /** 載入本地模型（一次性下載 + 快取） */
  async loadLocal(): Promise<void> {
    if (this.localState() !== 'idle' && this.localState() !== 'error') return;
    this.localState.set('loading');
    this.localError.set('');
    this.localProgress.set(0);
    this.localProgressText.set('正在快取中…');
    try {
      const webllm = await import('@mlc-ai/web-llm');
      this.engine = await webllm.CreateMLCEngine(
        LOCAL_MODEL_ID,
        {
          initProgressCallback: (r: import('@mlc-ai/web-llm').InitProgressReport) => {
            this.localProgress.set(Math.round((r.progress ?? 0) * 100));
            this.localProgressText.set(r.text?.includes('Loading') ? '編譯模型中…' : '正在快取中…');
          },
        },
        // Gemma 3 原生用滑動視窗：context_window_size 設 -1 保留滑動視窗，並補上 attention_sink_size:0（WebLLM 要求）
        { context_window_size: -1, attention_sink_size: 0 },
      );
      this.localState.set('ready');
      this.modelCached.set(true);
      this.checkCache();
    } catch (err) {
      this.localState.set('error');
      const msg = (err as Error)?.message ?? String(err);
      this.localError.set(
        /WebGPU|adapter|gpu/i.test(msg)
          ? '你的瀏覽器不支援 WebGPU — 請用電腦版 Chrome/Edge，或較新的手機瀏覽器'
          : `模型載入失敗：${msg}`,
      );
    }
  }

  async send(): Promise<void> {
    const prompt = this.chatInput.trim();
    if (!prompt || !this.ready() || this.generating()) return;

    this.chatInput = '';
    this.chatError.set('');
    this.messages.update((m) => [...m, { role: 'user', content: prompt }, { role: 'assistant', content: '' }]);
    this.generating.set(true);
    this.scrollToBottom();

    try {
      const acc = this.mode() === 'cloud' ? await this.runCloud() : await this.runLocal();
      const clean = this.display(acc);
      this.updateLastAssistant(clean || '(無回應)');

      // 優先用模型發出的 [IMAGE:] 標記；小模型沒發標記時，退而用「使用者訊息的生圖意圖」判斷
      const match = acc.match(/\[IMAGE:\s*([^\]]+)\]/i);
      if (match) await this.generateImage(match[1].trim());
      else if (this.wantsImage(prompt)) await this.generateImage(prompt);
    } catch (err) {
      const code = (err as Error).message;
      this.chatError.set(code === '429' ? '請求太頻繁囉，休息一下再試' : '發生錯誤，請稍後再試');
      // 移除空的 assistant 佔位
      this.messages.update((m) => (m[m.length - 1]?.content === '' ? m.slice(0, -1) : m));
      this.chatInput = prompt;
    } finally {
      this.generating.set(false);
      this.scrollToBottom();
    }
  }

  /** 雲端：Cloudflare Worker /chat（系統提示在伺服器端） */
  private async runCloud(): Promise<string> {
    const history = this.messages()
      .slice(0, -1)
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));
    const res = await fetch(`${LINKS.ai.worker}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const text = data.response ?? '';
    this.updateLastAssistant(this.display(text));
    return text;
  }

  /** 本地：WebLLM 串流 */
  private async runLocal(): Promise<string> {
    if (!this.engine) throw new Error('engine');
    const history = this.messages().slice(0, -1).slice(-6).map((m) => ({ role: m.role, content: m.content }));
    // Gemma 沒有獨立 system role — 把指令併進第一則 user 訊息（對所有模型都通用）
    if (history.length && history[0].role === 'user') {
      history[0] = { role: 'user', content: `${LOCAL_SYSTEM_PROMPT}\n\n————\n\n${history[0].content}` };
    } else {
      history.unshift({ role: 'user', content: LOCAL_SYSTEM_PROMPT });
    }
    const stream = await this.engine.chat.completions.create({
      messages: history,
      stream: true,
      temperature: 0.7,
      frequency_penalty: 0.4, // 抑制小模型的跳針/重複
      max_tokens: 400,
    });
    let acc = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (!delta) continue;
      acc += delta;
      this.updateLastAssistant(this.display(acc));
      this.scrollToBottom();
    }
    return acc;
  }

  /** 偵測到 [IMAGE:] → 交給雲端 DreamShaper 生圖，內嵌對話 + 觸發換色 + 設為背景 */
  private async generateImage(imgPrompt: string): Promise<void> {
    this.patchLastAssistant({ imageLoading: true });
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
      this.patchLastAssistant({ imageLoading: false, imageUrl: url });

      if (this.bgObjectUrl) URL.revokeObjectURL(this.bgObjectUrl);
      this.bgObjectUrl = url;
      this.bgUrl.set(url);
      this.theme.applyFromImage(blob).catch(() => { /* 取色失敗維持原主題 */ });
    } catch {
      this.patchLastAssistant({ imageLoading: false });
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

  private patchLastAssistant(patch: Partial<Msg>): void {
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
