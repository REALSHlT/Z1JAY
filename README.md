# Z1JAY_

個人作品集網站 — 3D 動畫、建模、著色器與互動設計。

🔗 **線上網址**: https://realshlt.github.io/Z1JAY/

## 專案結構

| 路徑 | 說明 |
|---|---|
| 倉庫根目錄 | GitHub Pages 部署產物（由 `npm run deploy` 產生，**不要手動編輯**） |
| `portfolio/` | Angular 21 原始碼（Tailwind CSS + DaisyUI） |
| `portfolio/public/assets/` | 圖片與 logo 原始素材 |
| `portfolio/tools/` | 圖片最佳化與發布腳本 |
| `worker/` | Cloudflare Worker（AI 中繼層）— 安全模型見 [worker/README.md](worker/README.md) |
| `LOGO/` | SVG logo 原始檔 |

## 開發

> Windows PowerShell 5.1 **不支援 `&&`**（會噴 `'&&' 語彙基元不是有效的陳述式分隔符號`）。
> 下面的指令都用 `--prefix`，在倉庫根目錄直接執行，不需要先 `cd`。

```bash
npm --prefix portfolio install
```

```bash
npm --prefix portfolio start
```

開發伺服器：http://localhost:4200

## 圖片

原始素材放 `portfolio/public/assets/images/`，然後跑：

```bash
npm --prefix portfolio run images
```

會在 `images/opt/` 產生每張圖的 400 / 800 / 1200 / 1600 寬度 × AVIF + WebP，
外加一張最大尺寸的 JPG 後備。跑完把終端機印出的清單貼進
`src/app/data/images.ts` 的 `IMAGES`，模板裡用 `<app-img name="檔名（不含副檔名）" …>` 引用。

> 為什麼要這樣做：原始素材是 2560px、4MB 的 PNG，站上最寬只顯示到約 880px。
> 直接送原圖會浪費 99% 的位元組。

## 圖示

Material Symbols 走 **子集化**載入 —— 完整可變字體是 3.96MB，
只取站上實際用到的 50 個圖示後是 58KB。

新增圖示時**必須**同步把名稱加進 `src/index.html` 的 `icon_names=` 清單，
否則新圖示會顯示成空白方框。

## 建置與部署

```bash
npm --prefix portfolio run deploy
```

這會 `ng build --base-href /Z1JAY/`，接著由 `tools/publish.mjs` 清掉根目錄的舊產物、
複製新產物、並產生 SPA fallback 用的 `404.html`。

複製完成後自行檢查再送出：

```bash
git add -A
```

```bash
git commit -m "deploy"
```

```bash
git push
```

## AI 服務

聊天與生圖走 `worker/` 裡的 Cloudflare Worker。
它是公開端點且掛在站主的 Workers AI 額度上，**修改前請先讀 [worker/README.md](worker/README.md) 的威脅模型**。
