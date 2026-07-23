import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

/** COCO 17 關鍵點的骨架連線（MoveNet 輸出順序） */
const SKELETON: ReadonlyArray<[number, number]> = [
  [0, 1], [0, 2], [1, 3], [2, 4],        // 頭部
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // 手臂
  [5, 11], [6, 12], [11, 12],             // 軀幹
  [11, 13], [13, 15], [12, 14], [14, 16], // 腿
];

const MODEL_URL = 'assets/models/movenet-lightning-int8.tflite';
const WASM_DIR = 'assets/litert-wasm/';
const SCORE_THRESHOLD = 0.3;

type EngineState = 'idle' | 'loading' | 'ready' | 'running' | 'error';

@Component({
  selector: 'app-pose-lab',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './pose-lab.html',
  styleUrl: './pose-lab.scss',
})
export class PoseLab implements OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('display') displayRef?: ElementRef<HTMLCanvasElement>;

  readonly state = signal<EngineState>('idle');
  readonly statusText = signal('');
  readonly backend = signal('');
  readonly fps = signal(0);
  readonly errorText = signal('');

  // LiteRT 相關（動態載入，避免拖慢首頁）
  private litert?: typeof import('@litertjs/core');
  private model?: import('@litertjs/core').CompiledModel;
  private inputDtype: 'uint8' | 'float32' | 'int32' = 'uint8';
  private inputSize = 192;

  private stream?: MediaStream;
  private rafId = 0;
  private running = false;
  private inferring = false;
  private sampleCanvas = document.createElement('canvas');
  private lastFrameTime = 0;

  /** 步驟一：載入 WASM 引擎與模型（不需要鏡頭權限） */
  async initEngine(): Promise<void> {
    if (this.state() !== 'idle' && this.state() !== 'error') return;
    this.state.set('loading');
    this.errorText.set('');

    try {
      this.statusText.set('載入 LiteRT.js WASM 引擎…');
      this.litert = await import('@litertjs/core');
      await this.litert.loadLiteRt(WASM_DIR);

      this.statusText.set('下載並編譯 MoveNet 模型（2.8MB）…');
      let accelerator: 'webgpu' | 'wasm' = 'webgpu';
      try {
        this.model = await this.litert.loadAndCompile(MODEL_URL, { accelerator: 'webgpu' });
      } catch {
        accelerator = 'wasm';
        this.model = await this.litert.loadAndCompile(MODEL_URL, { accelerator: 'wasm' });
      }
      this.backend.set(accelerator === 'webgpu' ? 'WebGPU · GPU 加速' : 'WASM · XNNPACK CPU');

      const input = this.model.getInputDetails()[0];
      console.info('[pose.exe] input:', JSON.stringify(this.model.getInputDetails()),
                   'output:', JSON.stringify(this.model.getOutputDetails()));
      this.inputDtype = (input.dtype as typeof this.inputDtype) ?? 'uint8';
      // shape 形如 [1, H, W, 3]
      if (input.shape?.length === 4) this.inputSize = Number(input.shape[1]) || 192;
      this.sampleCanvas.width = this.inputSize;
      this.sampleCanvas.height = this.inputSize;

      this.state.set('ready');
      this.statusText.set('引擎就緒 — 開啟鏡頭開始追蹤');
    } catch (err) {
      this.state.set('error');
      this.errorText.set(`引擎初始化失敗：${(err as Error)?.message ?? err}`);
    }
  }

  /** 步驟二：開鏡頭並開始即時推論 */
  async startCamera(): Promise<void> {
    if (this.state() !== 'ready') return;
    this.errorText.set('');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      const video = this.videoRef!.nativeElement;
      video.srcObject = this.stream;
      await video.play();

      const display = this.displayRef!.nativeElement;
      display.width = video.videoWidth;
      display.height = video.videoHeight;

      this.running = true;
      this.state.set('running');
      this.statusText.set('');
      this.loop();
    } catch (err) {
      this.errorText.set(
        (err as Error)?.name === 'NotAllowedError'
          ? '需要鏡頭權限才能體驗 — 影像只在你的瀏覽器內處理，不會上傳'
          : `鏡頭開啟失敗：${(err as Error)?.message ?? err}`,
      );
    }
  }

  stopCamera(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    if (this.state() === 'running') {
      this.state.set('ready');
      this.statusText.set('已停止 — 可再次開啟鏡頭');
    }
    this.fps.set(0);
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.model?.delete();
  }

  private loop = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    if (this.inferring) return; // 上一幀還在推論就跳過
    void this.inferFrame();
  };

  private async inferFrame(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    const display = this.displayRef?.nativeElement;
    if (!video || !display || !this.model || !this.litert) return;
    this.inferring = true;

    try {
      // 取樣：把當前影格縮到模型輸入尺寸
      const sctx = this.sampleCanvas.getContext('2d', { willReadFrequently: true })!;
      sctx.drawImage(video, 0, 0, this.inputSize, this.inputSize);
      const { data } = sctx.getImageData(0, 0, this.inputSize, this.inputSize);

      const px = this.inputSize * this.inputSize;
      let typed: Uint8Array<ArrayBuffer> | Float32Array<ArrayBuffer> | Int32Array<ArrayBuffer>;
      if (this.inputDtype === 'float32') typed = new Float32Array(px * 3);
      else if (this.inputDtype === 'int32') typed = new Int32Array(px * 3);
      else typed = new Uint8Array(px * 3);
      for (let i = 0, j = 0; i < px * 4; i += 4) {
        typed[j++] = data[i];
        typed[j++] = data[i + 1];
        typed[j++] = data[i + 2];
      }

      const input = new this.litert.Tensor(typed, [1, this.inputSize, this.inputSize, 3]);
      const outputs = await this.model.run(input);
      input.delete();

      const first = Array.isArray(outputs) ? outputs[0] : outputs;
      const cpu = await first.moveTo('wasm');
      const kp = cpu.toTypedArray() as Float32Array; // [1,1,17,3] → y,x,score
      cpu.delete();
      if (Array.isArray(outputs)) outputs.forEach((o) => { try { o.delete(); } catch { /* moved */ } });

      this.drawFrame(video, display, kp);

      // FPS
      const now = performance.now();
      if (this.lastFrameTime) this.fps.set(Math.round(1000 / (now - this.lastFrameTime)));
      this.lastFrameTime = now;
    } catch (err) {
      this.running = false;
      this.errorText.set(`推論錯誤：${(err as Error)?.message ?? err}`);
      this.stopCamera();
    } finally {
      this.inferring = false;
    }
  }

  private drawFrame(video: HTMLVideoElement, display: HTMLCanvasElement, kp: Float32Array): void {
    const ctx = display.getContext('2d')!;
    const w = display.width;
    const h = display.height;

    // 鏡像顯示
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();

    const pt = (i: number) => ({
      x: w - kp[i * 3 + 1] * w, // 鏡像後 x 反轉
      y: kp[i * 3] * h,
      score: kp[i * 3 + 2],
    });

    // 骨架線
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--acid-rgb').trim().split(' ').join(',')})`;
    for (const [a, b] of SKELETON) {
      const p1 = pt(a);
      const p2 = pt(b);
      if (p1.score < SCORE_THRESHOLD || p2.score < SCORE_THRESHOLD) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // 關鍵點
    ctx.fillStyle = `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--punch-rgb').trim().split(' ').join(',')})`;
    for (let i = 0; i < 17; i++) {
      const p = pt(i);
      if (p.score < SCORE_THRESHOLD) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
