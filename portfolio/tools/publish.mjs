/**
 * 把建置產物複製到倉庫根目錄（GitHub Pages 直接吃 main 分支的根目錄）。
 *
 *   npm run deploy   →  ng build --base-href /Z1JAY/ && node tools/publish.mjs
 *
 * 為什麼要有這支：
 * 先前有兩套互相衝突的部署流程 — README 說「手動把 dist 複製到根目錄」，
 * package.json 卻用 angular-cli-ghpages 推到 gh-pages 分支。兩者會產生
 * 不同的線上結果，而且手動複製容易留下上一版的雜檔（舊的 hash 檔名不會被覆蓋）。
 * 這裡統一成「複製到根目錄」這一套，並且會先清掉上一版的產物。
 *
 * 複製完成後仍需自行 git add / commit / push —— 部署這一步刻意保留給人決定。
 */
import { cp, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist/portfolio/browser');
const REPO = path.resolve(ROOT, '..');

/** 倉庫根目錄裡「不是建置產物」的東西，絕對不能刪 */
const KEEP = new Set([
  '.git', '.github', '.claude', '.gitignore', '.nojekyll',
  'portfolio', 'worker', 'LOGO', 'README.md',
]);

try {
  await stat(DIST);
} catch {
  console.error(`找不到建置產物：${DIST}\n請先執行 ng build --base-href /Z1JAY/`);
  process.exit(1);
}

// 1) 清掉上一版的產物（hash 檔名每次都不同，不清會越積越多）
for (const entry of await readdir(REPO)) {
  if (KEEP.has(entry)) continue;
  await rm(path.join(REPO, entry), { recursive: true, force: true });
  console.log(`  removed  ${entry}`);
}

// 2) 複製新產物
for (const entry of await readdir(DIST)) {
  await cp(path.join(DIST, entry), path.join(REPO, entry), { recursive: true });
  console.log(`  copied   ${entry}`);
}

// 3) GitHub Pages 的 SPA fallback：找不到路徑時回傳 index.html 的內容
await cp(path.join(DIST, 'index.html'), path.join(REPO, '404.html'));
console.log('  copied   404.html (SPA fallback)');

console.log('\n完成。接著：git add -A && git commit && git push');
