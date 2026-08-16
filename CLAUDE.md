# Z1JAY 作品集 — 開發指南

一頁式作品集（Angular 21 standalone + Tailwind + 自訂 brutalist SCSS），
部署在 GitHub Pages（main 分支根目錄直接就是 build 產物 + `portfolio/` 原始碼）。
AI 功能走 Cloudflare Workers（`worker/`）。

## 常用指令（PowerShell 5.1，不能用 `&&`）

```powershell
npm --prefix portfolio start          # dev server（port 4200）
npm --prefix portfolio run build      # production build
node portfolio/tools/optimize-images.mjs   # sharp 產生 AVIF/WebP/JPG 變體
node portfolio/tools/publish.mjs      # build 產物複製到 repo 根目錄（先跑 build）
npm --prefix worker run deploy        # 部署 Cloudflare Worker
```

⚠️ `publish.mjs` 會**清空根目錄中不在 KEEP 白名單的所有檔案**再複製產物。
根目錄要新增任何非產物檔案，必須同步加進它的 KEEP 清單，否則下次部署就被刪。

## 架構速覽

- `portfolio/src/app/data/config.ts` — **所有內容的單一事實來源**（導覽、技能、專案、
  經歷、產品、文案）。改內容先來這裡，不要進模板找字串。
- `portfolio/src/app/data/images.ts` — 圖片註冊表。**新圖片一定要在這裡登記**
  （寬高 + 變體），否則 `app-img` 會警告並跳過尺寸屬性。
- `portfolio/src/styles.scss` — 設計系統（brutalist 元件、編輯式版面 `.edge`/`.rule-grid`、
  hatching 紋理、進場動畫、捲動場景）。
- `worker/src/index.js` — AI proxy（角色清洗、指令階層防護、每日預算上限、Turnstile）。

## 捲動場景系統（scroll = 時間軸）

全站的「實驗性」捲動動態的骨架，2026-08 加入：

- **`MotionService`**（`services/motion.service.ts`）— 全站唯一 rAF 迴圈：
  驅動 Lenis 平滑捲動、寫捲動速度變數 `--sv`（±1，速度傾斜用）、
  跑所有場景（先全部 read 再全部 write，避免逐場景強制 reflow）。
  迴圈啟動時在 `<html>` 加 `motion-ok`；逃生門只在「前景且穩定、rAF 仍一秒沒跳」
  時才拆掉它（背景分頁的 rAF 凍結是省電不是失效），rAF 恢復跳動會自我修復。
- **`appScene` 指令**（`directives/scroll-scene.directive.ts`）— 把元素的捲動進度
  寫成 CSS 變數 `--p`（0–1）。三種模式：`through`（穿越視窗）、`exit`（捲出畫面，Hero 用）、
  `pin`（sticky 容器釘住期間，畫廊/疊卡用）。`sceneTrack` 會量水平軌道寬度寫成 `--shift`。
- **`appTilt3d` 指令** — 滑鼠 3D 傾斜。只寫 `--mx/--my`（度）兩個變數，
  消費端把它們加進自己的 transform 算式 — 捲動動畫與滑鼠互動疊加不打架。
  平滑靠掛進 MotionService 迴圈的 lerp，不用 CSS transition（會跟每幀更新打架）。
- **動畫全在 CSS**（styles.scss 底部「捲動場景」區）— `calc(var(--p) …)`。
  驅動源是捲動位置所以天生可倒放。規約：
  - `var(--p, 預設值)`，預設值＝動畫終點狀態（JS 掛掉時版面停在可讀狀態）
  - 場景動畫用獨立 `translate`/`scale`/`rotate` 屬性；`transform` 留給 reveal 進場，互不覆蓋
  - 下半部場景用有號進度 `--c = (p-.5)*2`（-1 進場、0 中央、+1 離場）做**連續映射**，
    `--cc = c*c` 拋物線給縮放淡出用
  - 全部包在 `html.motion-ok` 下，媒體查詢擋掉手機上的重效果

每區場景：Hero 逐字散場（`.hl` + `--sx/--sy/--sr`）、作品 TGT 釘住水平畫廊（`.hs` 系列）、
核心專業疊卡（`.deck`，`--k` 序號算覆蓋量）、工具左右滑軌（`.scrub-l/.scrub-r`）、
產品 3D 迴轉展示（`.swing`）、關於我逐字上墨（`appSplitText [scrub]` + `.split-scrub`）、
經歷脊線生長 + 檔案抽屜（`.tl` + `.drawer-l/.drawer-r`）、資歷掀牌浪（`.wave-item`，`--i` 浪次序）、
流程路牌翻字（`.step-scrub` + `.step-badge`）、早期作品鬆脫牆（`.loose`）、
AI 視窗開機展開（`.scrub-boot`）、動捕視窗廣告牌駛過（`.scrub-tilt`）、
Contact 巨字終幕（`.finale`）、巨標橫滑（`.xslide/.xslide-r`）、對流欄（`.flow`/`.flow-3d`）。

### 地雷（都踩過了，不要再踩）

1. **`overflow-x: hidden` 只能放 `html`，不能放 `body`** — body 設了會變成捲動容器，
   全站 `position: sticky`（畫廊、疊卡）失效。根元素是特例。
2. 區塊內要用 sticky 的話，**該 section 不能有 `overflow-hidden`**（見 skills.html —
   裝飾改包在 `absolute inset-0 overflow-hidden` 的裁切層裡）。
3. **背景分頁的 rAF 是凍結的** — 任何「幾秒內沒動靜就判定失效」的邏輯都要先確認
   `document.visibilityState === 'visible'`，否則 Ctrl+點開站的使用者會被誤殺。
4. `.reveal-clip` 要放被觀察元素的**內層**，放本體會裁成零寬度讓 IO 自我鎖死。
5. `.rule-grid` 不可用 `> * { position: relative }` 提升內容（會毀掉 absolute 裝飾）。
6. reveal（transform）與場景（translate/scale/rotate 屬性）同元素共存沒問題，
   但兩邊都寫 `transform` 就會互相覆蓋。

## 動捕（pose-lab）

- 骨架 = PoseLandmarker，`runningMode: 'VIDEO'`（單段式圖，穩定）。
- 臉部 = FaceLandmarker，**必須用 `runningMode: 'IMAGE'` + `detect()`** —
  VIDEO 模式是兩段式圖（偵測→ROI→關鍵點），跨幀追蹤狀態會壞掉且無法恢復
  （症狀：ROI contains NaN 例外，或無例外但永遠回傳 0 張臉）。

## 內容待辦（等本人確認，不要擅自補）

1. **代表作品的呈現方式** — 目前是文字一行；要不要連結／截圖／案例頁，等本人決定。
2. **`PROCESS` 的前兩階段與檢核點是推測** — 「需求與可行性」「資產製作」與各檢核點
   未經本人確認，需要拿他實際的工作流程校對。
3. **報價** — `COLLAB_NOTE` 目前寫「計價依專案範圍與時程而定」，等本人給實際模式。

## 慣例

- Commit 訊息：繁體中文，`type: 描述`（feat/fix/perf…）。**未經本人說「commit／推上去」不 commit。**
- 文案語氣：講「我做了什麼」，不先否定自己；避免論文腔（如「佐證」）與 AI 腔的用詞。
- 內容變更 = 改 `config.ts`；版面變更 = 模板 + `styles.scss`；不要在模板裡硬編內容。
