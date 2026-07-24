import { Component, ElementRef, HostListener, OnDestroy, ViewChild, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
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
  imports: [ScrollRevealDirective],
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

  private pose?: PoseLandmarkerT;
  private face?: FaceLandmarkerT;
  private poseConnections: Conn[] = [];
  private faceMesh: Conn[] = [];
  private faceOval: Conn[] = [];
  private faceContours: Conn[] = [];

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

    const ts = performance.now();
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

    try {
      if (this.mode() === 'pose' && this.pose) {
        const res = this.pose.detectForVideo(video, ts);
        for (const lms of res.landmarks ?? []) this.drawPose(ctx, lms, w, h, mirror, acid, punch, ink);
      } else if (this.mode() === 'face' && this.face) {
        const res = this.face.detectForVideo(video, ts);
        const faces = res.faceLandmarks ?? [];
        this.faceMissing.set(faces.length === 0);
        for (const lms of faces) this.drawFace(ctx, lms, w, h, mirror, acid, punch, volt);
      }
    } catch (e) {
      // 單一影格偵測失敗就跳過，不中斷串流；但把錯誤印出來方便診斷
      console.warn('mocap detectForVideo failed:', e);
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

    const strokeConns = (conns: Conn[], style: string, width: number) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (const c of conns) {
        const a = lms[c.start], b = lms[c.end];
        if (!a || !b) continue;
        ctx.moveTo(X(a), Y(a));
        ctx.lineTo(X(b), Y(b));
      }
      ctx.stroke();
    };

    // 1) 細網格（tesselation）— 提高不透明度與線寬，避免糊到看不見
    strokeConns(this.faceMesh, this.rgba('--acid-rgb', 0.65), 1.1 * s);
    // 2) 五官輪廓（眼/眉/唇/臉型）加粗，讓結構清楚
    strokeConns(this.faceContours, punch, 2.8 * s);

    // 3) 虹膜點（478 點含雙眼虹膜 468–477）
    ctx.fillStyle = volt;
    for (let i = 468; i < lms.length; i++) {
      const lm = lms[i];
      if (!lm) continue;
      ctx.beginPath();
      ctx.arc(X(lm), Y(lm), 2.4 * s, 0, Math.PI * 2);
      ctx.fill();
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
