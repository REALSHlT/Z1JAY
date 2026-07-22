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
    messages,
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
