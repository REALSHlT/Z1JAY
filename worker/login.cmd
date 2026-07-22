@echo off
rem One-click Cloudflare login for the z1jay-ai Worker (uses portable Node.js)
set "PATH=D:\01-2.Internal\Web\tools\node-v24.18.0-win-x64;%PATH%"
cd /d "%~dp0"
npx wrangler login
pause
