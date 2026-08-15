// Centralized links used throughout the portfolio
export const LINKS = {
  projects: {
    gentleTrigger: 'https://archive.org/details/the-gentle-trigger-trailer',
    dominoStory:   'https://www.youtube.com/watch?v=FOZQS3OSPgU&t=1s',
    order:         'https://youtu.be/E10dBYbr2Ck',
    whereIsNoddy:  'https://www.youtube.com/watch?v=lTqd_apnuCw',
  },
  social: {
    instagram:  'https://www.instagram.com/z_jay_0723',
    email:      'mailto:w6619willy@gmail.com',
    phone:      'tel:+886984527128',
    sketchfab:  'https://sketchfab.com/z1jay.FollwMyInstagram',
    artstation: 'https://www.artstation.com/z_jay',
  },
  platforms: {
    sketchfabProfile: 'https://sketchfab.com/z1jay.FollwMyInstagram',
    sketchfabModel:   'https://sketchfab.com/models/193ce9edac9c4576a6131ff7d588ec2b/embed',
    artstation:       'https://www.artstation.com/z_jay',
    snapbrify:        'https://snapbrify.com/',
  },
  ai: {
    worker: 'https://z1jay-ai.z1jay.workers.dev',
  },
  /** 正式網址 — og:url / canonical 用 */
  site: 'https://realshlt.github.io/Z1JAY/',
} as const;

// ── 導覽 ─────────────────────────────────────────────────────────────────────
export type NavSection = {
  id: string;
  label: string;
  /** Material Symbol，手機底部列與頁尾用 */
  icon: string;
  /** 是否放進手機底部列（只有 5 格，放太多會擠到點不到） */
  bottom?: boolean;
};

/**
 * 單一事實來源 — 頂部導覽、手機底部列、頁尾網站地圖共用同一份，
 * 才不會像先前那樣三個地方各漏掉不同的區塊。
 *
 * 順序＝頁面順序＝區塊編號順序。動這裡就等於動全站導覽，
 * 記得同步各區塊模板裡的「01 /」編號。
 */
/**
 * 順序＝頁面順序＝區塊編號。敘事動線：
 *   先看到作品 → 相信背後的能力 → 看見我做的工具 → 看見完整產品
 *   → 認識這個人 → 查核經歷 → 動手玩玩看 → 談合作
 * 招募者最想先看到的是「作品」，所以它排在能力之前。
 */
export const NAV_SECTIONS: NavSection[] = [
  { id: 'hero',        label: '首頁',     icon: 'home',       bottom: true },
  { id: 'work',        label: '作品',     icon: 'view_in_ar', bottom: true },
  { id: 'skills',      label: '核心專業', icon: 'psychology', bottom: true },
  { id: 'tools',       label: '工具開發', icon: 'build' },
  { id: 'products',    label: '產品',     icon: 'rocket_launch' },
  { id: 'about',       label: '關於我',   icon: 'person' },
  { id: 'experience',  label: '經歷',     icon: 'timeline' },
  { id: 'ai-lab',      label: 'AI 助手',  icon: 'smart_toy',  bottom: true },
  { id: 'pose-lab',    label: '即時動捕', icon: 'accessibility_new' },
  { id: 'credentials', label: '資歷',     icon: 'workspace_premium' },
  { id: 'collaborate', label: '合作',     icon: 'handshake' },
  { id: 'contact',     label: '聯繫',     icon: 'mail',       bottom: true },
];

// ── 核心強項 ─────────────────────────────────────────────────────────────────
export type SkillArea = {
  title: string;
  /** 具體到「做得到什麼」而不是「精通什麼」— 招募者只信前者 */
  points: string[];
};

export type CoreSkill = {
  en: string;
  zh: string;
  /** 一句話定位 */
  tagline: string;
  icon: string;
  /** 主要工具 */
  tools: string[];
  areas: SkillArea[];
  /** data/images.ts 的鍵；沒有就只顯示文字 */
  image?: string;
  /** 佐證：哪個作品的哪個部分 */
  evidence?: string;
};

/**
 * 三個招牌，其餘能力收進 OTHER_SKILLS。
 * 先前是 8 項平列，讀者看不出主次；招募者需要在 5 秒內知道「這個人能補哪個位子」。
 */
export const CORE_SKILLS: CoreSkill[] = [
  {
    en: '3D Generalist',
    zh: '一條龍製作',
    tagline: '從基礎建模到動畫算圖交付，能獨立完成整支鏡頭。',
    icon: 'deployed_code',
    tools: ['Blender', 'Substance Painter'],
    image: 'TheGentleTrigger',
    evidence: '《The Gentle Trigger》與《Order》為完全獨立製作',
    areas: [
      {
        title: '建模與材質',
        points: [
          '多邊形建模與 PBR 材質，角色、道具、場景皆可獨立產出',
          '材質以 Substance Painter 製作，或直接在 Blender 中拉材質節點',
        ],
      },
      {
        title: '動畫',
        points: [
          '依動畫十二法則調整動態，涵蓋攝影機、構圖、剪影與節奏',
          'Blocking → Inbetweens → Spline → Final 全段實作經驗',
        ],
      },
      {
        title: 'NPR 風格渲染',
        points: [
          '以 Blender 節點製作非寫實風格：Hatching、水彩、漫畫風',
          'PBR 渲染、燈光與後製亦為日常工作內容',
        ],
      },
    ],
  },
  {
    en: 'Technical Artist',
    zh: '技術美術',
    tagline: '把重複的手工變成可重用的系統 — 綁定、動捕、程序化生成。',
    icon: 'accessibility_new',
    tools: ['Blender', 'Auto-Rig', 'Maya HumanIK'],
    image: 'noddy',
    evidence: '《Where is Noddy?》參與動捕錄製與精修；《骨牌物語》以 Geometry Nodes 生成骨牌',
    areas: [
      {
        title: '角色綁定',
        points: [
          '獨立完成客製化角色骨架與權重繪製',
          'IK / FK 切換、眼部追蹤、Face Rig、Shapekey（等同 Maya Blendshape）',
          '建立可供動捕系統（Auto-Rig、Maya HumanIK）重新指定的骨架',
        ],
      },
      {
        title: '動態捕捉',
        points: [
          '參與動捕現場錄製',
          '後續精修：釘腳、修順、節奏調整、修復穿插',
        ],
      },
      {
        title: '程序化生成',
        points: [
          '以 Blender Geometry Nodes 建立可調參數的資產系統',
          '搭配物理模擬處理大量重複元素的鏡頭',
        ],
      },
    ],
  },
  {
    en: 'AI Workflow',
    zh: 'AI 工作流程',
    tagline: '把生成式模型變成真的能上線的產品，而不是停在實驗腳本。',
    icon: 'auto_awesome',
    tools: ['LoRA 微調', 'transformers.js', 'WebGPU', 'Cloudflare Workers AI'],
    image: 'Order',
    evidence: '獨力開發並營運 Snapbrify（snapbrify.com）— 從模型整合、後端、前端到 Blender 外掛',
    areas: [
      {
        title: '模型訓練',
        points: [
          'LoRA 微調訓練：資料集整理、訓練、成效評估與反覆調校',
          '在本地端環境運行與訓練模型，而非僅呼叫現成 API',
        ],
      },
      {
        title: '流程整合',
        points: [
          '串接多個生成式模型成可重複執行的流程，讓非技術人員也能直接使用',
        ],
      },
      {
        title: '端上 AI 推論',
        points: [
          '在瀏覽器內以 WebGPU 執行深度估計模型（transformers.js，WebGPU → WASM 後備），影像全程不離開使用者裝置',
          '場景深度模型本來不適用於平面材質 — 以去傾斜、超低頻抑制與頻率融合三道修正校正輸出',
          '實測高頻細節提升約 3.9 倍、削波減少約 20 倍，且不增加任何下載量與推論時間',
        ],
      },
      {
        title: '產品化 — Snapbrify',
        points: [
          '拿一個真的要上線的題目來練前後端，最後做成完整的個人產品',
          '全端獨力開發：Node.js + MongoDB Atlas + Cloudflare R2，含帳號、配額與專案管理',
          '產出六通道 PBR（Basecolor / Roughness / AO / Height / Metallic / Normal），ORM 封裝為無損 PNG',
          '另發布 Blender 外掛，可直接把雲端材質建成 Principled BSDF',
        ],
      },
    ],
  },
];

// ── 其他能力 ─────────────────────────────────────────────────────────────────
export type ToolEntry = {
  name: string;
  /** 'primary' = 主力工具；'working' = 能實際上工 */
  level: 'primary' | 'working';
  note?: string;
};

export const TOOLS: ToolEntry[] = [
  { name: 'Blender',            level: 'primary', note: '主力工具，全流程' },
  { name: 'Substance Painter',  level: 'primary', note: 'PBR 材質繪製' },
  { name: 'Maya',               level: 'working', note: 'Autodesk 認證' },
  { name: '3ds Max',            level: 'working', note: 'Autodesk 認證' },
  { name: 'Unreal Engine',      level: 'working' },
  { name: 'Unity',              level: 'working' },
  { name: 'Marvelous Designer', level: 'working', note: '布料' },
  { name: 'Angular',            level: 'working', note: '前端介面' },
];

/** 招牌之外、仍具備的 3D 能力 */
export const OTHER_ABILITIES: string[] = [
  '3D 模擬 — 流體、布料、粒子',
  '燈光設計 — 三點布光、HDRI 環境光、體積光',
  '後製與合成',
  '數位模型轉實體製造 — 3D 列印、刀模與紙材加工',
];

// ── 工具與整合 ───────────────────────────────────────────────────────────────
export type ToolProject = {
  name: string;
  zh: string;
  version?: string;
  /** 一句話講它解決什麼問題 */
  tagline: string;
  icon: string;
  points: string[];
  /** 若建立在他人研究之上，一定要標註來源 */
  basedOn?: string;
  link?: string;
};

/**
 * 我自己寫的工具。
 * 這一區的重點是「把研究成果變成美術實際可用的東西」— Technical Artist 的核心價值。
 */
export const TOOL_PROJECTS: ToolProject[] = [
  {
    name: 'Blender AI Controller',
    zh: 'Blender 自然語言代理',
    version: 'v4.5.0',
    tagline: '用本地 LLM 在 Blender 裡下自然語言指令，直接建立與修改場景。',
    icon: 'smart_toy',
    points: [
      '完全在本地跑 Ollama 模型 — 不需雲端、不需 API key，場景資料不外流',
      'Ask / Plan / Agent 三種模式；Agent 另有唯讀、逐步確認、全自動三級權限',
      '兩階段規劃：計畫只存步驟名稱，bpy 程式碼在執行前才對當下場景生成 — 提示長度不隨任務複雜度爆增，後續步驟也能依前面的實際結果調整',
      '失敗自動診斷：把錯誤、先前失敗的嘗試與已知陷阱一起回餵，模型先說出根因再給修正版',
      '逐步視覺驗證：AI 自選視角，隱藏攝影機自動取景截圖，交給視覺模型檢查再決定是否繼續',
      'AST 安全掃描：模組白名單、移除危險內建（open / eval / exec）、阻擋 dunder 存取與破壞性操作',
    ],
  },
  {
    name: 'GVHMR Motion Capture',
    zh: '影片轉動捕 Blender 外掛',
    version: 'v1.2.0',
    tagline: '把單目影片轉成 Blender 可用的骨架動畫，一個面板走完全程。',
    icon: 'videocam',
    basedOn: '基於 zju3dv（浙江大學）的 GVHMR 研究專案 — 我做的是 Blender 整合與工作流程',
    points: [
      '五步驟面板：選影片 → 決定存檔位置 → 拍攝設定 → 執行推論 → 匯入骨架',
      '可選 FFmpeg 前處理轉換 FPS，避免影格率不符導致動作抖動',
      '推論跑在背景執行緒，Blender UI 全程不凍結，並即時回報進度',
      'Rodrigues 旋轉向量轉四元數，逐幀套用到 SMPL 的 24 根骨頭',
      '自動搜尋輸出結果；找不到時可手動指定 PKL，不會卡死',
    ],
  },
  {
    name: 'SNAPBRIFY PBR Importer',
    zh: 'Snapbrify 材質匯入外掛',
    tagline: '在 Blender 裡直接登入帳號，把雲端材質接成 Principled BSDF。',
    icon: 'texture',
    points: [
      '於 Blender 內登入 snapbrify.com，瀏覽自己產生的材質庫',
      '一鍵匯入並自動接線成 Principled BSDF，含 ORM 封裝的拆解',
      '同時相容舊版的分離通道格式',
    ],
  },
];

export type Integration = {
  name: string;
  source: string;
  use: string;
};

/**
 * 明確標示「這些不是我的研究」。
 * 誠實標註來源比含糊帶過更有說服力 — 而且這領域的人一眼就認得出這些專案。
 */
export const INTEGRATIONS: Integration[] = [
  { name: 'GVHMR',        source: 'zju3dv · 浙江大學',        use: '單目影片轉 3D 人體動作 — 自製 Blender 外掛接成可用流程' },
  { name: 'Kimodo',       source: 'NVIDIA Toronto AI Lab',    use: '動作生成 — 輸出後透過 Rokoko 重定向套用到角色骨架' },
  { name: 'Hunyuan3D 2.1', source: '騰訊',                    use: '影像轉 3D 模型 — 建置可運行環境並接入資產流程' },
  { name: 'HY-Motion 1.0', source: '騰訊',                    use: '文字轉動作 — 建置可運行環境並接入動畫流程' },
];

export const INTEGRATION_NOTE =
  '這些是別人的研究專案，不是我的作品。它們多半只有命令列介面與難搞的環境需求 — ' +
  '我做的是把它們在 Windows 上建起來、串進 Blender 或 Rokoko 的實際製作流程，讓美術真的用得到。';

// ── 產品 ─────────────────────────────────────────────────────────────────────
export type ProductEntry = {
  name: string;
  zh: string;
  tagline: string;
  detail: string;
  icon: string;
  stack: string[];
  status: string;
  link?: string;
  linkLabel?: string;
};

export const PRODUCTS: ProductEntry[] = [
  {
    name: 'Snapbrify',
    zh: '照片轉 PBR 材質',
    tagline: '拍一張照片，產生 3D 軟體可直接使用的六通道 PBR 貼圖組。',
    detail:
      '深度估計模型直接在瀏覽器內以 WebGPU 執行，照片全程不離開使用者裝置。' +
      '場景深度模型本來不適用於平面材質 — 以去傾斜、超低頻抑制與頻率融合三道修正校正輸出，' +
      '實測高頻細節提升約 3.9 倍、削波減少約 20 倍，且不增加任何下載量與推論時間。',
    icon: 'texture',
    stack: ['Node.js', 'MongoDB', 'Cloudflare R2', 'transformers.js', 'WebGPU', 'Three.js'],
    status: '已上線營運',
    link: LINKS.platforms.snapbrify,
    linkLabel: '立即使用',
  },
  {
    name: 'Second Guess',
    zh: '《再猜看看》',
    tagline: '以猜拳為外殼、以「宣告 × 拆穿」為核心的雙人心理對戰遊戲。',
    detail:
      '你以為在玩猜拳，其實在判斷「這個人現在有沒有在騙我」。' +
      '包含完整的核心系統設計文件（規則、數值、猜疑鍊引擎），以及一支程序化美術生成器 — ' +
      '用程式產生斜切錯版風格的視覺資產。',
    icon: 'sports_esports',
    stack: ['Godot 4.6', 'GDScript', 'Python'],
    status: 'MVP 開發中',
  },
  {
    name: 'ChessSaga',
    zh: '3D 西洋棋',
    tagline: '以 Unity 製作的 3D 棋類遊戲，自建關卡與棋組資產。',
    detail: '從 3D 模型、關卡場景到 UI 與遊戲邏輯皆自行製作，已有可執行版本。',
    icon: 'view_in_ar',
    stack: ['Unity', 'C#', 'Blender'],
    status: 'v0.1.0 Alpha',
  },
];

// ── 關於我 ───────────────────────────────────────────────────────────────────
export type StoryBlock = {
  heading: string;
  body: string;
  icon: string;
};

export const ABOUT_INTRO =
  '我做 3D，也做讓 3D 更快的工具。前者是我從高中開始一路鑽到現在的專業，後者是我現在每天在解的問題。';

export const STORY: StoryBlock[] = [
  {
    icon: 'school',
    heading: '從高中的第一次接觸開始',
    body:
      '高中時第一次接觸 3D，大學才發現自己不只是有興趣，而是真的擅長。' +
      '那幾年幾乎把手邊能碰到的工具都試過一輪 — 3ds Max、Maya、Blender、Unity、' +
      'Unreal Engine、Marvelous Designer、Substance Painter，最後把 Blender 練成主力。',
  },
  {
    icon: 'psychology_alt',
    heading: '喜歡把突如其來的念頭挖到底',
    body:
      '我習慣對自己做批判性思考，遇到有意思的問題就想一路追下去。' +
      '「電車難題」的兩難是這個過程裡最有趣的題目之一 — 沒有正解，只有你站在哪裡。' +
      '《The Gentle Trigger》就是把這個思考結合我的專業，用 3D 動畫講出來的結果。',
  },
  {
    icon: 'sports_esports',
    heading: '打遊戲、看動畫，然後把它拆開',
    body:
      '我的養分來自遊戲和動畫，但看的方式不太一樣 — 我會去分析背後的製作邏輯與流程，' +
      '想這個效果是怎麼做出來的、從業人員在這裡會遇到什麼問題、他們怎麼解決。' +
      '很多技術上的想法都是這樣長出來的。',
  },
  {
    icon: 'rocket_launch',
    heading: '需要什麼就去學什麼',
    body:
      '前端與後端是我開始工作之後才學的。與其把教學看完再說，我直接挑一個' +
      '真的要上線的題目來練 — 那就是 Snapbrify。從帳號系統、配額管理、雲端儲存' +
      '到讓 AI 直接在瀏覽器裡跑，一路踩坑一路補，最後把它做成一個對外開放、' +
      '任何人都能實際使用的產品。',
  },
  {
    icon: 'precision_manufacturing',
    heading: '也待過螢幕之外的製造現場',
    body:
      '做過 3D 列印與紙紮工程，走完從 3D 建模、出刀檔、紙材切線壓線到實體車輛與道具' +
      '組裝的完整流程。這段經驗讓我在建模時會直覺去想「這東西做得出來嗎」— ' +
      '模型不是只要在畫面裡好看就好。',
  },
];

// ── 合作方式 ─────────────────────────────────────────────────────────────────
export type ServiceEntry = {
  title: string;
  detail: string;
  icon: string;
};

export const SERVICES: ServiceEntry[] = [
  {
    icon: 'person_4',
    title: '角色建模與綁定',
    detail: '從概念到可動角色：建模、材質、客製化骨架與權重，含 Face Rig 與動捕可用骨架。',
  },
  {
    icon: 'animation',
    title: '動畫製作',
    detail: '關鍵幀動畫與鏡頭設計，或動捕資料的清理與精修。含 PBR / NPR 兩種渲染路線。',
  },
  {
    icon: 'auto_awesome',
    title: 'AI 工作流程整合',
    detail: '把生成式 AI 接進既有的 3D 製程，評估哪些環節值得自動化、哪些不該碰。',
  },
];

export type ProcessStep = {
  phase: string;
  title: string;
  detail: string;
  /** 這個階段需要對方確認什麼 */
  checkpoint?: string;
};

/**
 * 動畫製作的實際階段（Blocking → Final 是業界標準流程）。
 * 每個階段標註確認節點 — 合作最容易出事的地方就是「做到一半才發現方向不對」。
 */
export const PROCESS: ProcessStep[] = [
  {
    phase: '01',
    title: '需求與可行性',
    detail: '釐清用途、風格參考、交付格式與時程，評估技術路線。',
    checkpoint: '確認風格方向與交付規格',
  },
  {
    phase: '02',
    title: '資產製作',
    detail: '建模、材質、綁定。角色類專案會先確認 T-Pose 與綁定測試再進動畫。',
    checkpoint: '確認模型與綁定可動性',
  },
  {
    phase: '03',
    title: 'Blocking',
    detail: '先把關鍵姿勢、鏡頭與節奏立起來，此時最容易改方向。',
    checkpoint: '確認鏡頭語言與節奏 — 這是成本最低的修改點',
  },
  {
    phase: '04',
    title: 'Inbetweens → Spline',
    detail: '補中間影格並轉為曲線，處理動態的重量感與流暢度。',
  },
  {
    phase: '05',
    title: 'Final',
    detail: '細修動態、燈光、渲染與後製，輸出交付。',
    checkpoint: '交付前最終確認',
  },
];

export const COLLAB_NOTE =
  '目前為在職狀態，合作方式與時程歡迎先聊聊再談。計價依專案範圍與時程而定。';

// ── 作品 ─────────────────────────────────────────────────────────────────────
export type ProjectEntry = {
  title: string;
  subtitle: string;
  /** data/images.ts 清單中的鍵，不是路徑 */
  image: string;
  link: string;
  /** 我在這個專案負責什麼 — 招募者最想知道的一行 */
  role: string;
  offsetClass: string;
  revealClass: 'reveal' | 'reveal-left' | 'reveal-right';
};

// ── 主打作品：《The Gentle Trigger》案例 ──────────────────────────────────────
export type Still = { image: string; caption: string; note: string };

/**
 * 成品影格取自 03.3D/04.render。
 * 本作有一個較早的版本《Where do we stand》，兩版共用部分鏡頭 —
 * 其中「水桶與水管」那顆在兩版之間從寫實渲染改成 NPR，剛好成為現成的前後對照。
 */
export const TGT_STILLS: Still[] = [
  { image: 'tgt-npr',     caption: 'NPR 風格渲染', note: '以 Blender 節點做描邊與半調網點，讓實拍質感的場景轉成印刷風格' },
  { image: 'tgt-water',   caption: '水體與構圖',   note: '空拍視角的水面著色與泡沫細節，大量留白帶出孤立感' },
  { image: 'tgt-hand',    caption: '光影與材質',   note: '水面下的手部打光，處理透光、折射與濕潤感' },
  { image: 'tgt-rooftop', caption: '大氣與體積光', note: '黃昏頂樓的體積雲與城市剪影，磚牆帶半調處理' },
  { image: 'tgt-bottle',  caption: '液體與玻璃',   note: '傾倒的瓶身與流動液體，玻璃折射與地面磁磚的反射' },
  { image: 'tgt-court',   caption: '角色與室內光', note: '法庭場景的角色配置與多光源室內佈光' },
];

export const TGT_COMPARISON = {
  before: 'tgt-npr-before',
  after:  'tgt-npr',
  beforeLabel: '寫實渲染',
  afterLabel:  'NPR 風格化',
  note:
    '同一顆鏡頭在前後兩版之間的變化 — 從物理寫實的 PBR 渲染，' +
    '改為以 Blender 節點加上描邊與半調網點的印刷風格。場景與燈光不變，只換掉著色策略。',
};

export const PROJECTS: ProjectEntry[] = [
  {
    title: '《The Gentle Trigger》',
    subtitle: '3D動畫 · 立場論 · 電車難題',
    image: 'TheGentleTrigger',
    link: LINKS.projects.gentleTrigger,
    role: '完全獨立製作 — 建模、材質、綁定、動畫、燈光、渲染、後製',
    offsetClass: '',
    revealClass: 'reveal-left',
  },
  {
    title: '《骨牌物語》',
    subtitle: '3D動畫 · NPR Shading · 台中市政府',
    image: 'maxresdefault',
    link: LINKS.projects.dominoStory,
    role: '以 Geometry Nodes 程序化生成骨牌，部分鏡頭採物理模擬；並負責建模、材質、渲染與動態',
    offsetClass: 'md:mt-24',
    revealClass: 'reveal-right',
  },
  {
    title: '《Order》',
    subtitle: '3D遊戲 · 聲音辨識 · Unreal Engine 5',
    image: 'Order',
    link: LINKS.projects.order,
    role: '完全獨立製作 — 美術資產與遊戲實作',
    offsetClass: '',
    revealClass: 'reveal-left',
  },
  {
    title: '《Where is Noddy?》',
    subtitle: 'VR動畫 · 動態捕捉 · 高雄電影節',
    image: 'noddy',
    link: LINKS.projects.whereIsNoddy,
    role: '參與動態捕捉現場錄製，以及後續資料精修（釘腳、修順、節奏、穿插修復）',
    offsetClass: 'md:mt-24',
    revealClass: 'reveal-right',
  },
];

export type CertEntry = {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  detail: string;
  number: string;
};

export const CERTS: CertEntry[] = [
  {
    image: 'autodesk-3dsmax-cert',
    alt: 'Autodesk Certified Professional: 3ds Max',
    title: 'Autodesk Certified Professional',
    subtitle: '3ds Max®',
    detail: '認證日期：2020 年 12 月 19 日',
    number: 'No. wMFJD-FavC',
  },
  {
    image: 'autodesk-maya-cert',
    alt: 'Autodesk Certified Professional: Maya',
    title: 'Autodesk Certified Professional',
    subtitle: 'Maya®',
    detail: '認證日期：2020 年 11 月 15 日',
    number: 'No. CxUA-XVzo',
  },
  {
    image: 'ling-tung-teaching-cert',
    alt: '嶺東科技大學推廣教育部服務證明',
    title: '嶺東科技大學推廣教育部',
    subtitle: '服務證明 — 講師',
    detail: '元宇宙場景設計概述 · MAYA · Unreal',
    number: '112年6月15日 — 112年9月1日',
  },
];

// ── Experience timeline ──────────────────────────────────────────────────────
export type ExperienceEntry = {
  year: string;
  /** 年份底下的細部期間，例如「2025/08 — 09」 */
  period?: string;
  title: string;
  org: string;
  description: string;
  /** Gold dot + primary-colour year label */
  highlight?: boolean;
};

/**
 * 時間軸完整覆蓋 2022 → 現在，中間不留無法解釋的空白。
 * 招募者掃履歷時第一個找的就是斷點。
 */
export const EXPERIENCE: ExperienceEntry[] = [
  {
    year: '2026',
    period: '2026/01 — 現在',
    title: '3D 動畫 & AI 工作流程開發',
    org: '寶成國際集團',
    description:
      '負責 3D 動畫製作，涵蓋動態、PBR 渲染與燈光、後製。' +
      '同時獨立建置生成式 AI 工作流程與模型訓練架構，並參與相關前端開發。',
    highlight: true,
  },
  {
    year: '2026',
    period: '2026/04 — 現在',
    title: 'Snapbrify — 個人產品開發',
    org: '個人專案',
    description:
      '以「必須真的能上線」為前提自學前後端，獨力完成並營運 snapbrify.com：' +
      '照片轉 PBR 材質的線上服務，含帳號與配額系統、端上 AI 推論，以及 Blender 外掛。',
  },
  {
    year: '2025',
    period: '2025/10 — 12',
    title: '作品集製作',
    org: '個人專案',
    description: '整理並重製個人作品集，重新梳理過去幾年的作品與技術脈絡。',
  },
  {
    year: '2025',
    period: '2025/08 — 09',
    title: '3D 列印與紙紮工程',
    org: '義聖香',
    description:
      '除 3D 列印模型製作外，完整參與紙紮工程：從 3D 建模、輸出刀檔、' +
      '紙材切線與壓線，到紙紮車輛與道具的實體製作。' +
      '這段經驗補上了「數位模型如何落地成實體」的完整認識。',
  },
  {
    year: '2025',
    period: '2025 上半年',
    title: '服義務役',
    org: '中華民國國軍',
    description: '役期四個月。',
  },
  {
    year: '2025',
    period: '2025/01',
    title: '取得碩士學位',
    org: '嶺東科技大學',
    description:
      '數位媒體設計系碩士。畢業製作《The Gentle Trigger》與論文' +
      '「《以柔膛問心》之 3D 動畫創作論述」於 2024 年完成。',
    highlight: true,
  },
  {
    year: '2023',
    title: '3D 互動講師',
    org: '勞動部發展署',
    description:
      '受勞動部發展署委託擔任講師，以 MAYA 與 Unreal Engine 5 設計元宇宙場景基本互動。' +
      '同年完成「AI 動態捕捉技術對 3D 動畫流程影響之技術報告書」與' +
      '「語音辨識對遊玩意願之影響——以遊戲 ORDER 為例」兩篇論文。',
  },
  {
    year: '2022',
    title: '大學畢業 & 教師',
    org: '嶺東科技大學',
    description:
      '於嶺東科技大學數位媒體設計系畢業，同年起擔任嶺東高中、台中高工與明台高中教師' +
      '直至 2024 年，並同步攻讀碩士學位。',
  },
];
