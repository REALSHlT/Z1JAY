import { Component, ElementRef, HostListener, OnDestroy, ViewChild, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import type {
  FilesetResolver as FilesetResolverT,
  PoseLandmarker as PoseLandmarkerT,
  FaceLandmarker as FaceLandmarkerT,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision';

type Mode = 'pose' | 'face';
type EngineState = 'idle' | 'loading' | 'ready' | 'running' | 'error';
type Conn = { start: number; end: number };

const WASM_PATH = 'assets/mediapipe-wasm';
const POSE_MODEL = 'assets/models/pose_landmarker_lite.task';
const FACE_MODEL = 'assets/models/face_landmarker.task';

@Component({
  selector: 'app-pose-lab',
  standalone: true,
  imports: [ScrollRevealDirective, SplitTextDirective],
  templateUrl: './pose-lab.html',
  styleUrl: './pose-lab.scss',
})
export class PoseLab implements OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('display') displayRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('stage') stageRef?: ElementRef<HTMLDivElement>;

  readonly isFullscreen = signal(false);

  readonly state = signal<EngineState>('idle');
  readonly statusText = signal('');
  readonly backend = signal('');
  readonly errorText = signal('');
  readonly mode = signal<Mode>('pose');

  readonly faceMissing = signal(false);
  /** 目前這一幀實際偵測到幾個點 —— 讓使用者一眼看出「有沒有在算」，
      而不是只能猜「是沒偵測到還是畫不出來」。值很少變動，signal 會自動去重。 */
  readonly detectedPoints = signal(0);
  /** 疊圖階段的錯誤訊息 —— 直接顯示在畫面上。
      先前偵測與繪製共用一個 try/catch 且只印 console.warn，
      結果「偵測成功但繪製拋錯」看起來就跟「什麼都沒發生」一模一樣。 */
  readonly overlayError = signal('');

  private pose?: PoseLandmarkerT;
  private face?: FaceLandmarkerT;
  private poseConnections: Conn[] = [];
  private faceMesh: Conn[] = [];
  private faceOval: Conn[] = [];
  private faceContours: Conn[] = [];

  /** 保留 fileset，臉部任務追蹤狀態壞掉時要用它重建 */
  private fileset?: Awaited<ReturnType<typeof FilesetResolverT.forVisionTasks>>;
  /** VIDEO 模式要求時間戳嚴格遞增；用整數並自行保證單調，不直接信 performance.now() */
  private lastTs = 0;
  private faceResetting = false;

  private stream?: MediaStream;
  private facingMode: 'user' | 'environment' = 'user';
  private rafId = 0;
  private running = false;
  private lastVideoTime = -1;

  /** 步驟一：載入 MediaPipe WASM 與兩個模型（不需要鏡頭權限） */
  async initEngine(): Promise<void> {
    if (this.state() !== 'idle' && this.state() !== 'error') return;
    this.state.set('loading');
    this.errorText.set('');

    try {
      this.statusText.set('載入 MediaPipe 引擎…');
      const vision = await import('@mediapipe/tasks-vision');
      const { FilesetResolver, PoseLandmarker, FaceLandmarker } = vision;

      const fileset = await (FilesetResolver as typeof FilesetResolverT).forVisionTasks(WASM_PATH);
      this.fileset = fileset;

      this.statusText.set('初始化骨架 + 臉部模型…');
      let delegate: 'GPU' | 'CPU' = 'GPU';
      try {
        [this.pose, this.face] = await Promise.all([
          (PoseLandmarker as typeof PoseLandmarkerT).createFromOptions(fileset, {
            baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          }),
          (FaceLandmarker as typeof FaceLandmarkerT).createFromOptions(fileset, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numFaces: 1,
          }),
        ]);
      } catch {
        delegate = 'CPU';
        [this.pose, this.face] = await Promise.all([
          (PoseLandmarker as typeof PoseLandmarkerT).createFromOptions(fileset, {
            baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          }),
          (FaceLandmarker as typeof FaceLandmarkerT).createFromOptions(fileset, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numFaces: 1,
          }),
        ]);
      }

      this.poseConnections = (PoseLandmarker as typeof PoseLandmarkerT).POSE_CONNECTIONS as Conn[];
      this.faceMesh = (FaceLandmarker as typeof FaceLandmarkerT).FACE_LANDMARKS_TESSELATION as Conn[];
      this.faceOval = (FaceLandmarker as typeof FaceLandmarkerT).FACE_LANDMARKS_FACE_OVAL as Conn[];
      // 五官輪廓（眼/眉/唇/臉型/虹膜）— 用來加粗畫，讓網格清楚可見
      this.faceContours = ((FaceLandmarker as typeof FaceLandmarkerT).FACE_LANDMARKS_CONTOURS as Conn[]) ?? this.faceOval;
      this.backend.set(delegate === 'GPU' ? 'GPU · WebGL 加速' : 'CPU · WASM');

      this.state.set('ready');
      this.statusText.set('引擎就緒 — 開啟鏡頭開始追蹤');
    } catch (err) {
      this.state.set('error');
      this.errorText.set(`引擎初始化失敗：${(err as Error)?.message ?? err}`);
    }
  }

  /** 步驟二：開鏡頭並開始即時追蹤 */
  async startCamera(): Promise<void> {
    if (this.state() !== 'ready') return;
    await this.openStream();
  }

  private async openStream(): Promise<void> {
    this.errorText.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: this.facingMode },
        audio: false,
      });
      const video = this.videoRef!.nativeElement;
      video.srcObject = this.stream;
      await video.play();

      const display = this.displayRef!.nativeElement;
      display.width = video.videoWidth;
      display.height = video.videoHeight;

      this.running = true;
      this.lastVideoTime = -1;
      this.state.set('running');
      this.statusText.set('');
      this.loop();
    } catch (err) {
      this.state.set('ready');
      this.errorText.set(
        (err as Error)?.name === 'NotAllowedError'
          ? '需要鏡頭權限才能體驗 — 影像只在你的瀏覽器內處理，不會上傳'
          : `鏡頭開啟失敗：${(err as Error)?.message ?? err}`,
      );
    }
  }

  /** 前後鏡頭切換 */
  async flipCamera(): Promise<void> {
    if (this.state() !== 'running') return;
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    await this.openStream();
  }

  setMode(m: Mode): void {
    this.mode.set(m);
    this.faceMissing.set(false);
    this.detectedPoints.set(0);
    this.overlayError.set('');
  }

  /** 全螢幕切換（把顯示區送進全螢幕，看追蹤更大）。含 Safari webkit 前綴後備。 */
  async toggleFullscreen(): Promise<void> {
    const el = this.stageRef?.nativeElement as
      (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }) | undefined;
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };
    try {
      if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
        await (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.());
      } else {
        await (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      }
    } catch { /* 使用者取消或不支援就忽略 */ }
  }

  /** 全螢幕狀態改變（含按 Esc 離開）時同步按鈕圖示 */
  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  onFullscreenChange(): void {
    const doc = document as Document & { webkitFullscreenElement?: Element };
    this.isFullscreen.set(!!(document.fullscreenElement ?? doc.webkitFullscreenElement));
  }

  stopCamera(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.faceMissing.set(false);
    if (this.state() === 'running') {
      this.state.set('ready');
      this.statusText.set('已停止 — 可再次開啟鏡頭');
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.pose?.close();
    this.face?.close();
  }

  private loop = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    this.processFrame();
  };

  private processFrame(): void {
    const video = this.videoRef?.nativeElement;
    const display = this.displayRef?.nativeElement;
    if (!video || !display || video.readyState < 2) return;
    if (video.currentTime === this.lastVideoTime) return; // 同一影格不重算
    this.lastVideoTime = video.currentTime;

    // MediaPipe 的 VIDEO 模式要求時間戳「嚴格遞增的整數」。
    // performance.now() 是浮點且在高更新率下可能兩次取到同一毫秒，
    // 重複或倒退的時間戳會讓追蹤狀態算出 NaN 的 ROI。
    const ts = this.lastTs = Math.max(Math.round(performance.now()), this.lastTs + 1);
    const mirror = this.facingMode === 'user';
    const ctx = display.getContext('2d')!;
    const w = display.width;
    const h = display.height;

    // 鏡像顯示影像
    ctx.save();
    if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    const acid = this.themeColor('--acid-rgb');
    const punch = this.themeColor('--punch-rgb');
    const ink = this.themeColor('--ink-rgb');
    const volt = this.themeColor('--volt-rgb');

    // ── 偵測與繪製分開包 ──
    // 兩段共用一個 catch 的話，「算得出來但畫不出來」與「根本沒算」在畫面上
    // 完全無法區分（點數已經先寫進 signal 了）。分開才能指出是哪一段壞掉。
    let landmarkSets: NormalizedLandmark[][] = [];
    try {
      if (this.mode() === 'pose' && this.pose) {
        landmarkSets = this.pose.detectForVideo(video, ts).landmarks ?? [];
      } else if (this.mode() === 'face' && this.face) {
        landmarkSets = this.face.detectForVideo(video, ts).faceLandmarks ?? [];
        this.faceMissing.set(landmarkSets.length === 0);
      }
      this.detectedPoints.set(landmarkSets[0]?.length ?? 0);
    } catch (e) {
      const msg = (e as Error)?.message ?? String(e);
      this.detectedPoints.set(0);

      /**
       * 「ROI contains NaN values」是 FaceLandmarker 的已知狀況：
       * 它是偵測 → ROI → 關鍵點的兩段式圖，VIDEO 模式會用上一幀的結果推算
       * 下一幀的 ROI。追蹤狀態一旦算出 NaN 就會固定在壞掉的狀態，
       * 之後每一幀都拋同樣的錯（骨架是單段式的圖，所以不受影響）。
       * 唯一可靠的復原方式是重建這個任務，把追蹤狀態清乾淨。
       */
      if (/NaN|ROI/i.test(msg) && this.mode() === 'face') {
        this.overlayError.set('臉部追蹤狀態異常，正在重建…');
        this.resetFace();
      } else {
        this.overlayError.set(`偵測失敗：${msg}`);
      }
      return;
    }

    try {
      for (const lms of landmarkSets) {
        if (this.mode() === 'pose') this.drawPose(ctx, lms, w, h, mirror, acid, punch, ink);
        else this.drawFace(ctx, lms, w, h, mirror, acid, punch, volt);
      }
      if (this.overlayError()) this.overlayError.set('');
    } catch (e) {
      // 疊圖失敗 —— 這正是「478 PTS 但看不到網格」的情況
      this.overlayError.set(`疊圖失敗：${(e as Error)?.message ?? e}`);
    }
  }

  /** 重建臉部任務以清除壞掉的追蹤狀態（見 processFrame 的說明） */
  private async resetFace(): Promise<void> {
    if (this.faceResetting || !this.fileset) return;
    this.faceResetting = true;
    try {
      const old = this.face;
      this.face = undefined;
      old?.close();
      const { FaceLandmarker } = await import('@mediapipe/tasks-vision');
      this.face = await (FaceLandmarker as typeof FaceLandmarkerT).createFromOptions(this.fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      this.overlayError.set('');
    } catch (err) {
      this.overlayError.set(`臉部模型重建失敗：${(err as Error)?.message ?? err}`);
    } finally {
      this.faceResetting = false;
    }
  }

  private drawPose(
    ctx: CanvasRenderingContext2D, lms: NormalizedLandmark[], w: number, h: number,
    mirror: boolean, acid: string, punch: string, ink: string,
  ): void {
    const X = (lm: NormalizedLandmark) => (mirror ? 1 - lm.x : lm.x) * w;
    const Y = (lm: NormalizedLandmark) => lm.y * h;

    ctx.strokeStyle = acid;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const c of this.poseConnections) {
      const a = lms[c.start], b = lms[c.end];
      if (!a || !b) continue;
      ctx.moveTo(X(a), Y(a));
      ctx.lineTo(X(b), Y(b));
    }
    ctx.stroke();

    ctx.fillStyle = punch;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    for (const lm of lms) {
      ctx.beginPath();
      ctx.arc(X(lm), Y(lm), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawFace(
    ctx: CanvasRenderingContext2D, lms: NormalizedLandmark[], w: number, h: number,
    mirror: boolean, acid: string, punch: string, volt: string,
  ): void {
    const X = (lm: NormalizedLandmark) => (mirror ? 1 - lm.x : lm.x) * w;
    const Y = (lm: NormalizedLandmark) => lm.y * h;
    const s = Math.max(w / 640, 0.75); // 線寬隨畫布尺寸縮放，全螢幕放大也清楚

    /**
     * 每條線畫兩次：先鋪一層較寬的深色底，再疊上細的彩色線。
     *
     * 只畫單層彩色線的話，在真實鏡頭下幾乎看不見 —— 網格是黃色的，
     * 而臉的膚色也偏亮，兩者對比極低；再加上 1px 級的線在縮放後容易變成次像素。
     * 深色描邊讓線在任何膚色與背景上都讀得出來（動捕疊圖的標準做法）。
     */
    const strokeConns = (conns: Conn[], style: string, width: number) => {
      // 任何一層的連線資料缺了就跳過那一層，不要讓整個疊圖掛掉 —
      // 網格畫不出來時，至少五官輪廓還要能顯示
      if (!conns?.length) return;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const c of conns) {
        const a = lms[c.start], b = lms[c.end];
        if (!a || !b) continue;
        ctx.moveTo(X(a), Y(a));
        ctx.lineTo(X(b), Y(b));
      }
      // 深色底線
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.lineWidth = width + 1.6 * s;
      ctx.stroke();
      // 彩色主線（沿用同一條路徑，不用重建）
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    // 1) 細網格（tesselation）
    strokeConns(this.faceMesh, this.rgba('--acid-rgb', 0.95), 1.5 * s);
    // 2) 五官輪廓（眼/眉/唇/臉型）加粗，讓結構清楚
    strokeConns(this.faceContours, punch, 3.4 * s);

    // 3) 虹膜點（478 點含雙眼虹膜 468–477）
    for (let i = 468; i < lms.length; i++) {
      const lm = lms[i];
      if (!lm) continue;
      ctx.beginPath();
      ctx.arc(X(lm), Y(lm), 3 * s, 0, Math.PI * 2);
      ctx.fillStyle = volt;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = 1.2 * s;
      ctx.stroke();
    }
  }

  private themeColor(varName: string): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return `rgb(${v.split(/\s+/).join(',')})`;
  }

  private rgba(varName: string, alpha: number): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return `rgba(${v.split(/\s+/).join(',')},${alpha})`;
  }
}
