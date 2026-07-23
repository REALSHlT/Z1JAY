/**
 * z1jay-ai — AI proxy for the Z1JAY portfolio (realshlt.github.io/Z1JAY)
 *
 * Endpoints:
 *   GET  /        → service info
 *   POST /chat    → text generation  { prompt } or { messages: [{role, content}] }
 *                   optional: { model: "llama" | "gemma" }  (default "llama")
 *   POST /image   → text-to-image    { prompt, negative_prompt?, width?, height? }
 *                   returns image/png
 *
 * The AI binding is scoped to this Worker only — no API token ever leaves Cloudflare.
 */

const ALLOWED_ORIGINS = [
  'https://realshlt.github.io',
  'http://localhost:4200',
  'http://localhost:8765',
];

const CHAT_MODELS = {
  llama: '@cf/meta/llama-3.1-8b-instruct-fast',
  gemma: '@cf/google/gemma-2b-it-lora',
};

const IMAGE_MODEL = '@cf/lykon/dreamshaper-8-lcm';

const MAX_PROMPT_CHARS = 4000;
const MAX_MESSAGES = 20;
const MAX_OUTPUT_TOKENS = 1024;

/** 每 IP 用量上限（滾動視窗：60 秒 / 24 小時） */
const RATE_LIMITS = {
  chat:  { perMinute: 10, perDay: 100 },
  image: { perMinute: 3,  perDay: 20 },
};

/** 站主個人知識庫 — 讓 AI 能回答關於 Z1JAY 的問題 */
const SYSTEM_PROMPT = `你是 Z1JAY 個人作品集網站（realshlt.github.io/Z1JAY）上的 AI 助手。這個網站的主人是 Z1JAY（林子傑）。訪客說的「站主」「他」「你的主人」「這個網站的作者」「作品的作者」等指稱，一律預設是指 Z1JAY 本人。以下是他的完整資料，回答關於他的問題時以此為準；與他無關的一般問題也可以正常回答。

## 基本資料
- 名字：林子傑（Z. Jay），品牌名 Z1JAY
- 所在地：台灣台中市
- 學歷：嶺東科技大學數位媒體設計系碩士（2024 年畢業），論文「《以柔膛問心》之 3D 動畫創作論述」
- 身分：3D 藝術家 / 動畫師，也具備前端與 AI 工程能力
- 目前狀態：Open for work（歡迎專案合作）

## 核心專業（8 項）
1. 3D Modeling（3D 建模與材質）— 多邊形建模與 PBR 材質系統，應用於角色、道具與場景
2. Rigging（骨架設計）— 骨架綁定與蒙皮權重，角色關節與臉部控制系統
3. Shader（著色器設計）— HLSL/GLSL 與 NPR 風格渲染
4. 3D Animation（3D 動態）— 關鍵幀動畫與動作曲線，結合物理模擬
5. Motion Capture（動態捕捉）— AI 動態捕捉技術整合與資料清理
6. 3D Simulation（3D 模擬）— 流體、布料、粒子（Houdini、Maya nCloth/nParticles）
7. 3D Lighting（燈光設計）— 三點布光、HDRI 環境光與體積光效，營造場景氛圍
8. AI Engineer（AI 工程師）— 生成式 AI 工具與 LLM API 整合

## 代表作品
- 《The Gentle Trigger》（碩士畢業製作）：3D 動畫，主題為立場論與電車難題
- 《骨牌物語》：3D 動畫，NPR Shading，與台中市政府合作
- 《Order》：3D 遊戲，整合聲音辨識，使用 Unreal Engine 5
- 《Where is Noddy?》：VR 動畫，使用動態捕捉，入選高雄電影節

## 經歷
- 2024：碩士畢業（嶺東科技大學），完成《The Gentle Trigger》
- 2023：勞動部發展署 3D 互動講師（MAYA 與 UE5 元宇宙場景互動）；發表「AI 動態捕捉技術對 3D 動畫流程影響之技術報告書」與「語音辨識對遊玩意願之影響——以遊戲 ORDER 為例」
- 2022–2024：嶺東高中、台中高工、明台高中教師；同步攻讀碩士

## 證照
- Autodesk Certified Professional: 3ds Max（2020/12/19）
- Autodesk Certified Professional: Maya（2020/11/15）
- 嶺東科技大學推廣教育部講師服務證明（元宇宙場景設計概述，2023）

## 個人產品
- Snapbrify（snapbrify.com）：免費的照片轉 PBR 材質產生器，支援手機拍攝、HDR 合併、無縫貼圖，涵蓋 Albedo/Normal/Roughness 通道

## 聯絡方式
- Email: w6619willy@gmail.com；電話 +886 984 527 128
- Instagram: @z_jay_0723；Sketchfab: z1jay.FollwMyInstagram；ArtStation: z_jay

## 回答風格
- 使用訪客的語言回答（訪客用中文就回中文）
- 簡潔友善，一般 2-4 句話；被追問再展開
- 不知道的事誠實說不知道，不要編造站主的資料

## 生圖能力
- 當訪客想看圖、或一張圖能明顯幫助說明時，在整段回答的最後附上一行，格式嚴格為：[IMAGE: 英文的圖像描述]
- 這個標記會被系統偵測並自動換成圖片，訪客看不到標記文字本身；所以標記前後「不要」再寫任何說明或提示字樣（例如不要出現「另起一行」「以下是圖片」等字）。描述用英文、具體、適合文生圖。
- 不需要圖時就正常聊天，絕對不要輸出這個標記。一則回覆最多一個標記。`;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  });
}

/** POST 只接受來自允許網域的瀏覽器請求（curl 等無 Origin 的請求一律擋掉） */
function checkOrigin(request, cors) {
  const origin = request.headers.get('Origin') ?? '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'forbidden origin' }, 403, cors);
  }
  return null;
}

/** 每 IP 精確限速（Durable Object 計數）；超過回 429 */
async function checkRateLimit(request, env, kind, cors) {
  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  const stub = env.IP_LIMITER.get(env.IP_LIMITER.idFromName(ip));
  const res = await stub.fetch('https://limiter/', {
    method: 'POST',
    body: JSON.stringify({ kind, limits: RATE_LIMITS[kind] }),
  });
  const verdict = await res.json();
  if (!verdict.ok) {
    return json(
      {
        error: 'rate limited',
        scope: verdict.daily ? 'day' : 'minute',
        message: verdict.daily ? '今日免費額度已用完，明天再來吧' : '請求太頻繁，請稍後再試',
      },
      429,
      cors,
    );
  }
  return null;
}

/** 每個 IP 一個實例，維護分鐘/每日兩層計數器 */
export class IpLimiter {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async fetch(request) {
    const { kind, limits } = await request.json();
    const now = Date.now();

    const state = (await this.ctx.storage.get(kind)) ?? {
      m: 0, mReset: now + 60_000,
      d: 0, dReset: now + 86_400_000,
    };
    if (now >= state.mReset) { state.m = 0; state.mReset = now + 60_000; }
    if (now >= state.dReset) { state.d = 0; state.dReset = now + 86_400_000; }

    if (state.d >= limits.perDay)    return Response.json({ ok: false, daily: true });
    if (state.m >= limits.perMinute) return Response.json({ ok: false, daily: false });

    state.m += 1;
    state.d += 1;
    await this.ctx.storage.put(kind, state);
    return Response.json({ ok: true });
  }
}

async function handleChat(request, env, cors) {
  const body = await request.json();

  const modelKey = body.model ?? 'llama';
  const model = CHAT_MODELS[modelKey];
  if (!model) {
    return json({ error: `unknown model "${modelKey}" — use one of: ${Object.keys(CHAT_MODELS).join(', ')}` }, 400, cors);
  }

  let messages;
  if (Array.isArray(body.messages)) {
    messages = body.messages;
  } else if (typeof body.prompt === 'string') {
    messages = [{ role: 'user', content: body.prompt }];
  } else {
    return json({ error: 'provide "prompt" (string) or "messages" (array)' }, 400, cors);
  }

  if (messages.length > MAX_MESSAGES) {
    return json({ error: `too many messages (max ${MAX_MESSAGES})` }, 400, cors);
  }
  for (const m of messages) {
    if (typeof m?.content !== 'string' || typeof m?.role !== 'string') {
      return json({ error: 'each message needs string "role" and "content"' }, 400, cors);
    }
    if (m.content.length > MAX_PROMPT_CHARS) {
      return json({ error: `message too long (max ${MAX_PROMPT_CHARS} chars)` }, 400, cors);
    }
  }

  const result = await env.AI.run(model, {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    max_tokens: Math.min(body.max_tokens ?? MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
  });

  return json({ model, response: result.response ?? result }, 200, cors);
}

async function handleImage(request, env, cors) {
  const body = await request.json();

  if (typeof body.prompt !== 'string' || body.prompt.length === 0) {
    return json({ error: 'provide "prompt" (string)' }, 400, cors);
  }
  if (body.prompt.length > MAX_PROMPT_CHARS) {
    return json({ error: `prompt too long (max ${MAX_PROMPT_CHARS} chars)` }, 400, cors);
  }

  const clamp = (v, lo, hi, dflt) =>
    Number.isFinite(v) ? Math.min(Math.max(Math.round(v), lo), hi) : dflt;

  const input = {
    prompt: body.prompt,
    width: clamp(body.width, 256, 1024, 768),
    height: clamp(body.height, 256, 1024, 768),
    num_steps: 20,
  };
  if (typeof body.negative_prompt === 'string' && body.negative_prompt.length <= MAX_PROMPT_CHARS) {
    input.negative_prompt = body.negative_prompt;
  }
  if (Number.isFinite(body.seed)) {
    input.seed = Math.round(body.seed);
  }

  const stream = await env.AI.run(IMAGE_MODEL, input);

  return new Response(stream, {
    headers: { 'Content-Type': 'image/png', ...cors },
  });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const { pathname } = new URL(request.url);

    try {
      if (request.method === 'GET' && pathname === '/') {
        return json({
          service: 'z1jay-ai',
          endpoints: {
            'POST /chat': { body: '{ prompt } or { messages }', optional: '{ model: "llama" | "gemma" }' },
            'POST /image': { body: '{ prompt, negative_prompt?, width?, height?, seed? }', returns: 'image/png' },
          },
        }, 200, cors);
      }

      if (request.method === 'POST' && pathname === '/chat') {
        const blocked = checkOrigin(request, cors) ?? (await checkRateLimit(request, env, 'chat', cors));
        if (blocked) return blocked;
        return await handleChat(request, env, cors);
      }

      if (request.method === 'POST' && pathname === '/image') {
        const blocked = checkOrigin(request, cors) ?? (await checkRateLimit(request, env, 'image', cors));
        if (blocked) return blocked;
        return await handleImage(request, env, cors);
      }

      return json({ error: 'not found' }, 404, cors);
    } catch (err) {
      if (err instanceof SyntaxError) {
        return json({ error: 'invalid JSON body' }, 400, cors);
      }
      console.error(err);
      return json({ error: 'AI request failed', detail: String(err?.message ?? err) }, 500, cors);
    }
  },
};
