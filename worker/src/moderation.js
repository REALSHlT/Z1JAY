/**
 * 伺服器端內容審核 — 這裡是「唯一可信」的一層。
 *
 * 前端 ai-lab.ts 也有一份相同用途的攔截，但那份純粹是為了「省一次 API 呼叫 + 即時回饋」，
 * 對安全性沒有任何貢獻 — 任何人都能繞過前端直接打 Worker。
 * 因此規則必須在這裡再跑一次，且以這裡為準。
 */

/** 政治／主權／情色／毒品武器暴力 — 聊天與生圖共用 */
const SENSITIVE_SHARED =
  /台獨|港獨|藏獨|疆獨|兩岸|一個中國|九二共識|中共|共產黨|民進黨|國民黨|習近平|蔡英文|賴清德|馬英九|六四|天安門|反送中|法輪功|達賴|色情|情色|做愛|性交|裸體|裸照|A片|porn|nude|nsfw|explicit|吸毒|製毒|冰毒|安非他命|大麻(?!煩)|炸彈|自製槍|怎麼殺|如何殺人/i;

/**
 * 只擋生圖的字詞 — 生成圖片的濫用後果比文字嚴重得多
 * （會留下實體檔案、可能違反 Cloudflare 使用條款並波及整個帳號）。
 */
const IMAGE_ONLY_BLOCK =
  /\b(nude|naked|topless|nipple|genital|penis|vagina|cum|hentai|rule34|lolicon|shotacon|underage|minor|child(?:ren)?\s*(?:porn|sex)|cp|jailbait|sex|sexual|erotic|fetish|bdsm|orgy|nsfw|onlyfans|deepfake|revenge\s*porn)\b/i;

/** 生圖時「一律」附加的負面提示 — 就算提示詞乾淨，也把模型往安全方向推 */
export const SAFE_NEGATIVE_PROMPT =
  'nsfw, nude, naked, sexual content, explicit, gore, blood, violence, child, minor, underage, disturbing, offensive symbols, watermark, signature';

/**
 * 檢查提示詞。
 * @param {string} text
 * @param {'chat'|'image'} kind
 * @returns {{ blocked: boolean, rule?: string }}
 */
export function moderate(text, kind) {
  if (SENSITIVE_SHARED.test(text)) return { blocked: true, rule: 'sensitive' };
  if (kind === 'image' && IMAGE_ONLY_BLOCK.test(text)) return { blocked: true, rule: 'image-explicit' };
  return { blocked: false };
}

/**
 * 出口防護：模型若把系統提示整段吐出來（prompt leaking），在這裡截掉。
 * 比對系統提示裡「只會出現在系統提示、不會出現在正常回答」的標記。
 */
const LEAK_MARKERS = [
  '## 基本資料',
  '## 回答風格',
  '## 生圖能力',
  '你是 Z1JAY 個人作品集網站',
];

export function stripLeakedPrompt(response) {
  if (typeof response !== 'string') return response;
  for (const marker of LEAK_MARKERS) {
    const i = response.indexOf(marker);
    if (i !== -1) {
      const head = response.slice(0, i).trim();
      return head || '這個問題我不方便回答，我們聊聊 Z1JAY 的作品吧 🙂';
    }
  }
  return response;
}

export const REFUSAL = '這類問題我不方便回答，我們聊聊 Z1JAY 的作品或背景吧 🙂';
