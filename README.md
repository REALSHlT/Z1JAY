# Z1JAY_

個人作品集網站 — 3D 動畫、建模、著色器與互動設計。

🔗 **線上網址**: https://realshlt.github.io/Z1JAY/

## 專案結構

- 倉庫根目錄 = GitHub Pages 部署產物(由 Angular 建置後複製至此)
- `portfolio/` = Angular 21 原始碼(Tailwind CSS + DaisyUI)
- `assets/` = 圖片與 logo 資源
- `LOGO/` = SVG logo 原始檔

## 開發

```bash
cd portfolio
npm install
npm start          # 本機開發伺服器 http://localhost:4200
```

## 建置與部署

```bash
cd portfolio
npm run build -- --base-href /Z1JAY/
```

建置完成後,將 `portfolio/dist/portfolio/browser/` 內容複製到倉庫根目錄,commit 並 push 至 `main` 分支即完成部署。
