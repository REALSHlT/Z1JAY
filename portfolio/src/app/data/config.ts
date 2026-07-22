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
    sketchfabModel: 'https://sketchfab.com/models/193ce9edac9c4576a6131ff7d588ec2b/embed',
  },
  ai: {
    worker: 'https://z1jay-ai.z1jay.workers.dev',
  },
  font: {
    lxgwWenKai: 'https://github.com/lxgw/LxgwWenKai',
    cdn:        'https://fontsapi.zeoseven.com/292/main/result.css',
  },
} as const;

export type SkillEntry = {
  en: string;
  zh: string;
  image?: string;
  description?: string;
  /** Material Symbol name shown in the text-only display panel */
  icon?: string;
};

export const SKILLS: SkillEntry[] = [
  { en: '3D Modeling',      zh: '3D 建模與材質', image: 'assets/images/TheGentleTrigger.png',
    description: '精細的多邊形建模與 PBR 材質系統，應用於角色、道具與場景的高品質視覺化。' },
  { en: 'Rigging',          zh: '骨架設計',       icon: 'accessibility_new',
    description: '精確的骨架綁定與蒙皮权重調整，打造自然流暢的角色關節與臉部控制系統。' },
  { en: 'Shader',           zh: '著色器設計',     image: 'assets/images/Order.png',
    description: '客製化 HLSL / GLSL 著色器與 NPR 風格渲染，實現高度個性化的視覺風格。' },
  { en: '3D Animation',     zh: '3D 動態',        image: 'assets/images/maxresdefault.jpg',
    description: '關鍵幀動畫與動作曲線調整，結合物理模擬打造充滿生命力的動畫敘事。' },
  { en: 'Motion Capture',   zh: '動態捕捉',       image: 'assets/images/noddy.jpg',
    description: 'AI 動態捕捉技術整合與資料清理，大幅縮短角色動畫的製作週期。' },
  { en: '3D Simulation',    zh: '3D 模擬',    icon: 'scatter_plot',
    description: '流體、布料、粒子等動態模擬技術，搭配 Houdini 與 Maya nCloth / nParticles，打造高擬真的視覺特效與場景氛圍。' },
  { en: 'Frontend Engineer', zh: '前端工程師', icon: 'code',
    description: '以 Angular、Tailwind CSS 及 TypeScript 構建高品質的互動式介面，結合現代設計系統打造流暢的使用者體驗。' },
  { en: 'AI Engineer',      zh: 'AI 工程師',   icon: 'auto_awesome',
    description: '運用生成式 AI 工具與 LLM API 整合、優化創作流程與數據分析管道，探索 AI 在媒體設計領域的應用可能。' },
];

export type ProjectEntry = {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  offsetClass: string;
  revealClass: 'reveal' | 'reveal-left' | 'reveal-right';
};

export const PROJECTS: ProjectEntry[] = [
  {
    title: '《The Gentle Trigger》',
    subtitle: '3D動畫 · 立場論 · 電車難題',
    image: 'assets/images/TheGentleTrigger.png',
    link: LINKS.projects.gentleTrigger,
    offsetClass: '',
    revealClass: 'reveal-left',
  },
  {
    title: '《骨牌物語》',
    subtitle: '3D動畫 · NPR Shading · 台中市政府',
    image: 'assets/images/maxresdefault.jpg',
    link: LINKS.projects.dominoStory,
    offsetClass: 'md:mt-24',
    revealClass: 'reveal-right',
  },
  {
    title: '《Order》',
    subtitle: '3D遊戲 · 聲音辨識 · Unreal Engine 5',
    image: 'assets/images/Order.png',
    link: LINKS.projects.order,
    offsetClass: '',
    revealClass: 'reveal-left',
  },
  {
    title: '《Where is Noddy?》',
    subtitle: 'VR動畫 · 動態捕捉 · 高雄電影節',
    image: 'assets/images/noddy.jpg',
    link: LINKS.projects.whereIsNoddy,
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
    image: 'assets/images/autodesk-3dsmax-cert.jpg',
    alt: 'Autodesk Certified Professional: 3ds Max',
    title: 'Autodesk Certified Professional',
    subtitle: '3ds Max®',
    detail: '認證日期：2020 年 12 月 19 日',
    number: 'No. wMFJD-FavC',
  },
  {
    image: 'assets/images/autodesk-maya-cert.jpg',
    alt: 'Autodesk Certified Professional: Maya',
    title: 'Autodesk Certified Professional',
    subtitle: 'Maya®',
    detail: '認證日期：2020 年 11 月 15 日',
    number: 'No. CxUA-XVzo',
  },
  {
    image: 'assets/images/ling-tung-teaching-cert.jpg',
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
  title: string;
  org: string;
  description: string;
  /** Gold dot + primary-colour year label */
  highlight?: boolean;
};

export const EXPERIENCE: ExperienceEntry[] = [
  {
    year: '2024',
    title: '碩士畢業',
    org: '嶺東科技大學',
    description: '《The Gentle Trigger》製作完成，完成論文「《以柔膛問心》之 3D 動畫創作論述」，取得數位媒體設計系碩士學位。',
    highlight: true,
  },
  {
    year: '2023',
    title: '3D 互動講師',
    org: '勞動部發展署',
    description: '受勞動部發展署委託擔任講師，以 MAYA 與 Unreal Engine 5 設計元宇宙場景基本互動。同年完成「AI 動態捕捉技術對 3D 動畫流程影響之技術報告書」與「語音辨識對遊玩意願之影響——以遊戲 ORDER 為例」兩篇論文。',
  },
  {
    year: '2022',
    title: '大學畢業 & 教師',
    org: '嶺東科技大學',
    description: '於嶺東科技大學數位媒體設計系畢業，同年起擔任嶺東高中、台中高工與明台高中教師直至 2024 年，並同步攻讀碩士學位。',
  },
];
