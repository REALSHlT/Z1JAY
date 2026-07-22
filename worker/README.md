# z1jay-ai Worker

Cloudflare Worker,作為作品集網站呼叫 Workers AI 的中繼層(API token 不會出現在前端)。

## 端點

| 端點 | 說明 |
|---|---|
| `GET /` | 服務資訊 |
| `POST /chat` | 文字生成。Body:`{ "prompt": "..." }` 或 `{ "messages": [...] }`,可選 `"model": "llama"`(預設,llama-3.1-8b-instruct-fast)或 `"gemma"`(gemma-2b-it-lora) |
| `POST /image` | 文生圖(dreamshaper-8-lcm)。Body:`{ "prompt": "...", "negative_prompt"?, "width"?, "height"?, "seed"? }`,回傳 PNG |

CORS 只允許 `https://realshlt.github.io` 與本機開發埠(4200 / 8765)。

## 使用的模型(目前皆不計費)

- `@cf/meta/llama-3.1-8b-instruct-fast`
- `@cf/google/gemma-2b-it-lora`
- `@cf/lykon/dreamshaper-8-lcm`

## 指令

```bash
# 首次:登入 Cloudflare(或直接雙擊 login.cmd)
npx wrangler login

npm run dev      # 本機測試 http://localhost:8787
npm run deploy   # 部署
npm run tail     # 看即時 log
```

Node.js 使用免安裝版:`D:\01-2.Internal\Web\tools\node-v24.18.0-win-x64\`(需先加入 PATH)。
