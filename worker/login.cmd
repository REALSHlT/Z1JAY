@echo off
rem One-click Cloudflare login for the z1jay-ai Worker.
rem （原本這裡寫死了 D:\01-2.Internal\... 的免安裝 Node 路徑，該目錄已不存在；
rem   現在直接用系統 PATH 上的 Node。）
cd /d "%~dp0"
npx wrangler login
pause
