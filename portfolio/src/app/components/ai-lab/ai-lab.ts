import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { LINKS } from '../../data/config';
import { ThemeService } from '../../services/theme.service';

type Msg = { role: 'user' | 'assistant'; content: string; imageLoading?: boolean; imageUrl?: string };
type Mode = 'cloud' | 'local';
type LocalState = 'idle' | 'loading' | 'ready' | 'error';

const LOCAL_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

// ── 本地對話記憶（存在使用者裝置，跨模型共用）──
const SESSION_KEY = 'z1jay-chat-session'; // localStorage key
const SUMMARY_TURNS = 4;   // 餵給模型的「最近幾輪摘要」— 有上限，context 才不會爆
const PERSIST_MSGS = 24;   // localStorage 最多存幾則顯示訊息
const MSG_CLIP = 1000;     // 每則存檔內容上限字數

// ── 敏感題硬性攔截（不信任 0.5B 會自律；輸入端命中就不呼叫模型，輸出端再掃一次保險）──
// 只放「明確政治/主權/色情/毒品武器暴力」的詞，避免誤傷正常提問（誤判成本只是禮貌帶開，可接受）。
const SENSITIVE =
  /台獨|港獨|藏獨|疆獨|兩岸|一個中國|九二共識|中共|共產黨|民進黨|國民黨|習近平|蔡英文|賴清德|馬英九|六四|天安門|反送中|法輪功|達賴|色情|情色|做愛|性交|裸體|裸照|A片|porn|nude|nsfw|吸毒|製毒|冰毒|安非他命|大麻(?!煩)|炸彈|自製槍|怎麼殺|如何殺人/i;
const REFUSAL = '這類問題我不方便回答，我們聊聊 Z1JAY 的作品或背景吧 🙂';

/** 本地模型（雲端的系統提示在 Worker 端）的回答規則 */
const LOCAL_RULES = `你是「Z1JAY」這個作品集網站的 AI 助手（不是網站主人本人）。嚴格遵守以下規則：
1. 語言：一律用「繁體中文」回答（台灣用語，禁止簡體字）；只有當訪客用英文提問時才改用英文。
2. 依據：只根據下方【資料】回答，用第三人稱稱他為「Z1JAY」或「他」，絕對不要用「我」自稱成他。資料裡沒有的就直接說「這我不清楚」，嚴禁自行編造事實、人名、作品或數字。
3. 簡潔：2-4 句話講完，不要重複同一句話、不要一直換行灌水。
4. 政治與敏感：遇到政治、國家主權、宗教、色情、仇恨、違法等問題，一律回覆「這類問題我不方便回答，我們聊聊 Z1JAY 的作品吧」，不要展開討論、不要選邊站。
5. 生圖：若訪客要你畫圖，不要用文字描述圖片，改成在回答最後單獨輸出一行：[IMAGE: 英文圖像描述]。`;

/**
 * 迷你「檢索」知識庫：把 bio 切成標籤區塊，依問題關鍵字挑出相關區塊只餵那幾塊，
 * 降低 1B 模型的分心/飄移。資料太小，用關鍵字比對就夠，不需要 embedding / 向量庫。
 */
const BIO_SECTIONS: { keys: RegExp; text: string }[] = [
  { keys: /誰|介紹|背景|哪裡人|來自|台中|哪位|about|who/i,
    text: 'Z1JAY（林子傑）是台灣台中人，3D 藝術家／動畫師，也具備前端與 AI 工程能力。' },
  { keys: /學校|讀|念|畢業|學歷|大學|碩士|嶺東|科系|主修|school|study|degree/i,
    text: '學歷：嶺東科技大學數位媒體設計系碩士，2024 年畢業。' },
  { keys: /技能|會什麼|會啥|專長|專業|擅長|能做|會做|技術|skill|good at/i,
    text: '技能：3D 建模、Rigging 骨架、著色器、3D 動畫、動態捕捉、3D 模擬、3D 燈光、AI 工程。' },
  { keys: /作品|代表作|做過|專案|案子|影片|遊戲|gentle|order|noddy|骨牌|trigger|work|project/i,
    text: '代表作：《The Gentle Trigger》（碩士 3D 動畫）、《骨牌物語》（NPR 風格，與台中市政府合作）、《Order》（Unreal Engine 5 遊戲，整合聲音辨識）、《Where is Noddy?》（VR 動態捕捉，入選高雄電影節）。' },
  { keys: /經歷|工作|教|講師|老師|職涯|勞動部|經驗|career|teach/i,
    text: '經歷：2023 年任勞動部發展署 3D 互動講師；2022–2024 年於嶺東高中、台中高工、明台高中任教。' },
  { keys: /產品|snapbrify|材質|pbr|貼圖|工具|product/i,
    text: '個人產品 Snapbrify（snapbrify.com）：拍張照片就能自動生成 3D 用的 PBR 材質貼圖。' },
  { keys: /聯絡|聯繫|email|信箱|ig|instagram|找他|合作|contact/i,
    text: '聯絡方式：Email w6619willy@gmail.com、Instagram @z_jay_0723。' },
  { keys: /框架|前端|後端|技術|技術棧|怎麼(做|寫|建|架|刻)|用(什麼|啥)(做|寫|技術|語言|框架)|這個(網站|網頁|站)|架站|react|angular|vue|svelte|next|framework|tech ?stack|built ?with|made ?with/i,
    text: '這個作品集網站本身的技術：前端用 Angular（搭配 Tailwind CSS），不是 React 也不是 Vue；雲端 AI 聊天走 Cloudflare Workers AI 的 Llama 3.1 8B，本地 AI 用 WebLLM 在瀏覽器裡跑 Qwen 0.5B，圖片生成用 DreamShaper。整個網站由 Z1JAY 自己開發。' },
];

/** 沒命中任何關鍵字時的預設概覽（身分 + 技能 + 作品） */
const BIO_DEFAULT = [0, 2, 3];

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
  private s2t?: (text: string) => string; // 簡→繁轉換器（lazy load，本地模式才需要）

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

  /** 迷你檢索：依問題關鍵字挑出相關 bio 區塊（沒命中就給預設概覽），只餵這幾塊給小模型 */
  private focusedBio(question: string): string {
    const hits = BIO_SECTIONS.filter((s) => s.keys.test(question));
    const picked = hits.length ? hits : BIO_DEFAULT.map((i) => BIO_SECTIONS[i]);
    // 一律附上身分區塊當錨點（避免只命中細節區塊時模型不知道「他」是誰）
    const withAnchor = picked.includes(BIO_SECTIONS[0]) ? picked : [BIO_SECTIONS[0], ...picked];
    return withAnchor.map((s) => `- ${s.text}`).join('\n');
  }

  private clip(s: string, n: number): string {
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  /**
   * 取得簡→繁轉換器（OpenCC，lazy import，只在本地模式用到時才載入）。
   * Qwen 0.5B 訓練以簡體為主、prompt 壓不住簡體漂移 → 直接在輸出端強制轉繁，不靠模型自律。
   * 載入失敗就退化成原樣（不轉），不阻斷聊天。
   */
  private async loadS2T(): Promise<(text: string) => string> {
    if (this.s2t) return this.s2t;
    try {
      const OpenCC = await import('opencc-js/cn2t');
      this.s2t = OpenCC.Converter({ from: 'cn', to: 'tw' });
    } catch {
      this.s2t = (t) => t;
    }
    return this.s2t;
  }

  /**
   * 滾動摘要：從對話中取「已完成的最近幾輪」，每輪只留截短的問與答。
   * 直接由 messages 推導 → 不論哪個模型答的都算數（自動涵蓋跨模型切換的內容），
   * 且有輪數上限 → context 保持很小，不會重蹈成長型脈絡卡住的覆轍。
   */
  private conversationSummary(): string {
    const msgs = this.messages();
    const pairs: { q: string; a: string }[] = [];
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].role === 'user' && msgs[i + 1]?.role === 'assistant') {
        const a = this.display(msgs[i + 1].content);
        if (a) { pairs.push({ q: msgs[i].content, a }); i++; }
      }
    }
    const recent = pairs.slice(-SUMMARY_TURNS);
    if (!recent.length) return '';
    const lines = recent.map((p, i) => `${i + 1}. 訪客問「${this.clip(p.q, 50)}」，你答「${this.clip(p.a, 90)}」`);
    return `【先前對話摘要（僅摘要，供你保持連貫，不必逐字複述）】\n${lines.join('\n')}`;
  }

  /** 把對話（純文字、截短、限量）存到使用者裝置 */
  private persistSession(): void {
    try {
      const slim = this.messages()
        .filter((m) => this.display(m.content))
        .slice(-PERSIST_MSGS)
        .map((m) => ({ role: m.role, content: this.clip(m.content, MSG_CLIP) }));
      localStorage.setItem(SESSION_KEY, JSON.stringify(slim));
    } catch { /* localStorage 滿了或被禁用就算了 */ }
  }

  /** 從裝置還原上次的對話（圖片是暫時性的 blob，不還原） */
  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        this.messages.set(arr.map((m) => ({ role: m.role, content: m.content })));
        this.cloudStarted.set(true); // 曾經用過 → 直接顯示歷史，不再擋開始門檻
      }
    } catch { /* 壞資料就忽略 */ }
  }

  /** 清除本地對話紀錄（保持裝置乾淨） */
  clearSession(): void {
    this.messages.set([]);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }

  /**
   * 鬼打牆終結器：就算 penalty 失效，也用程式硬性截斷退化重複。
   * 1) 折疊同一短字串連續重複多次（如「小黑小黑小黑」「。。。」）。
   * 2) 依句子去重：一旦出現「已看過的整句」就截斷後面（殺掉整段刷屏的迴圈尾巴）。
   */
  private stopRepetition(text: string): string {
    let t = text.replace(/(.{1,16}?)\1{2,}/g, '$1'); // 連續重複的短片段只留一次
    const parts = t.split(/(?<=[。！？!?\n])/);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      const key = p.trim();
      if (!key) { out.push(p); continue; }
      if (seen.has(key)) break; // 整句開始重複 → 截斷
      seen.add(key);
      out.push(p);
    }
    return out.join('').trim();
  }

  /** 使用者訊息是否明顯在要求生圖（模型漏發 [IMAGE:] 標記時的保險） */
  private wantsImage(text: string): boolean {
    return /畫(一|個|張|出|下|給|成|幅|隻|條|朵|棵|我)|幫.{0,3}畫|生成.{0,5}圖|來(一|張).{0,5}圖|draw|generate.{0,12}(image|picture)|(image|picture) of/i.test(text);
  }

  display(content: string): string {
    return content
      .replace(/\[IMAGE:[^\]]*\]/gi, '')
      // 去掉亂入的程式碼框（小模型偶爾會 ``` 刷屏）
      .replace(/```[a-z]*\n?/gi, '').replace(/```/g, '')
      // 去掉洩漏的系統標籤 / 區塊標題 / 規則行
      .replace(/【\s*(資料|訪客問題|先前對話摘要[^】]*|規則|系統[^】]*)\s*】/g, '')
      .replace(/^\s*(訪客問題|資料|規則|系統提示|system|assistant|user)\s*[:：].*$/gim, '')
      .replace(/^\s*\d+\.\s*(語言|依據|簡潔|政治與敏感|生圖)[:：].*$/gm, '') // 複誦 LOCAL_RULES 的條列
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
    this.restoreSession();
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

    // 🛡️ 輸入端攔截：敏感題直接固定回覆，根本不呼叫任何模型（雲端也省一次 API）
    if (SENSITIVE.test(prompt)) {
      this.updateLastAssistant(REFUSAL);
      this.generating.set(false);
      this.persistSession();
      this.scrollToBottom();
      return;
    }

    try {
      const acc = this.mode() === 'cloud' ? await this.runCloud() : await this.runLocal();

      // 🛡️ 輸出端保險：模型若仍吐出敏感/不當內容，整段換成固定回覆
      if (SENSITIVE.test(acc)) {
        this.updateLastAssistant(REFUSAL);
        return;
      }

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
      this.persistSession();
      this.scrollToBottom();
    }
  }

  /** 雲端：Cloudflare Worker /chat（系統提示在伺服器端）。用共用的滾動摘要當脈絡。 */
  private async runCloud(): Promise<string> {
    const question = this.messages().at(-2)?.content ?? '';
    const summary = this.conversationSummary();
    const userMsg = summary ? `${summary}\n\n【訪客問題】${question}` : question;
    const res = await fetch(`${LINKS.ai.worker}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }] }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const text = this.stopRepetition(data.response ?? '');
    this.updateLastAssistant(this.display(text));
    return text;
  }

  /**
   * 本地：WebLLM 串流。刻意「單輪無狀態」— 每次只送 規則+bio+摘要 當 system、這一句問題當 user。
   * Qwen 0.5B 有正常的 32k context，支援 system 角色 → 約束規則放 system 最能被遵守。
   * 仍維持單輪（不累積歷史）避免小模型跳針；多輪連貫靠共用的滾動摘要。另加逾時中斷。
   */
  private async runLocal(): Promise<string> {
    if (!this.engine) throw new Error('engine');
    const question = this.messages().at(-2)?.content ?? '';
    const summary = this.conversationSummary();
    const systemMsg = [
      LOCAL_RULES,
      `【資料】\n${this.focusedBio(question)}`,
      summary,
    ].filter(Boolean).join('\n\n');

    const toTW = await this.loadS2T(); // 先備好簡→繁轉換器
    const timeout = setTimeout(() => { try { this.engine?.interruptGenerate(); } catch { /* ignore */ } }, 30_000);
    try {
      const stream = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: question },
        ],
        stream: true,
        temperature: 0.5, // 適度隨機，避免完全貼字卻又不亂飄
        frequency_penalty: 0.6, // 較重的跳針懲罰 — 小模型很容易鬼打牆
        presence_penalty: 0.4,  // 鼓勵換話題詞彙，進一步降低整句重複
        max_tokens: 300,
      });
      let acc = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (!delta) continue;
        acc += delta;
        // 每次都轉整段 acc（簡→繁）並終結鬼打牆 → 串流中就看不到刷屏，最終結果必為繁體
        this.updateLastAssistant(this.display(this.stopRepetition(toTW(acc))));
        this.scrollToBottom();
      }
      return this.stopRepetition(toTW(acc)); // 繁體 + 去重後回傳 → 圖片標記/存檔/摘要都用乾淨版
    } finally {
      clearTimeout(timeout);
    }
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
