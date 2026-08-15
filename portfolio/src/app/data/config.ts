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
export const NAV_SECTIONS: NavSection[] = [
  { id: 'hero',           label: '首頁',     icon: 'home',                bottom: true },
  { id: 'skills',         label: '核心專業', icon: 'psychology',          bottom: true },
  { id: 'work',           label: '作品集',   icon: 'view_in_ar',          bottom: true },
  { id: 'about',          label: '關於我',   icon: 'person' },
  { id: 'collaborate',    label: '合作方式', icon: 'handshake' },
  { id: 'platforms',      label: '線上展示', icon: 'public' },
  { id: 'experience',     label: '過去經歷', icon: 'timeline' },
  { id: 'ai-lab',         label: 'AI 測試',  icon: 'smart_toy',           bottom: true },
  { id: 'pose-lab',       label: '動態捕捉', icon: 'accessibility_new' },
  { id: 'certifications', label: '專業證照', icon: 'workspace_premium' },
  { id: 'contact',        label: '聯繫',     icon: 'mail',                bottom: true },
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
        title: '模型訓練與整合',
        points: [
          'FLUX.2 klein 的 LoRA 微調訓練，依實際產出需求調校',
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
        title: '產品化',
        points: [
          'Snapbrify 全端獨力開發：Node.js + MongoDB Atlas + Cloudflare R2，含帳號、配額與專案管理',
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
    year: '2025',
    period: '2025/10 — 12',
    title: '作品集製作',
    org: '個人專案',
    description:
      '整理並重製個人作品集，同時投入 Snapbrify 的開發 — ' +
      '一個把照片轉成 3D 可用 PBR 材質貼圖組的線上服務。',
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
