// Centralized links used throughout the portfolio
export const LINKS = {
  projects: {
    gentleTrigger: 'https://archive.org/details/the-gentle-trigger-trailer',
    dominoStory:   'https://www.youtube.com/watch?v=FOZQS3OSPgU&t=1s',
    order:         'https://youtu.be/E10dBYbr2Ck',
    whereIsNoddy:  'https://www.youtube.com/watch?v=lTqd_apnuCw',
  },
  social: {
    instagram: 'https://www.instagram.com/z_jay_0723',
    email:     'mailto:w6619willy@gmail.com',
    phone:     'tel:+886984527128',
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
};

export const SKILLS: SkillEntry[] = [
  { en: '3D Modeling',      zh: '3D 建模與材質', image: 'assets/images/TheGentleTrigger.png',
    description: '精細的多邊形建模與 PBR 材質系統，應用於角色、道具與場景的高品質視覺化。' },
  { en: 'Rigging',          zh: '骨架設計',       image: 'assets/images/TheGentleTrigger.png',
    description: '精確的骨架綁定與蒙皮权重調整，打造自然流暢的角色關節與臉部控制系統。' },
  { en: 'Shader',           zh: '著色器設計',     image: 'assets/images/Order.png',
    description: '客製化 HLSL / GLSL 著色器與 NPR 風格渲染，實現高度個性化的視覺風格。' },
  { en: '3D Animation',     zh: '3D 動態',        image: 'assets/images/maxresdefault.jpg',
    description: '關鍵幀動畫與動作曲線調整，結合物理模擬打造充滿生命力的動畫敘事。' },
  { en: 'Motion Capture',   zh: '動態捕捉',       image: 'assets/images/noddy.jpg',
    description: 'AI 動態捕捉技術整合與資料清理，大幅縮短角色動畫的製作週期。' },
  { en: '3D Simulation',    zh: '3D 模擬',
    description: '流體、布料、粒子等動態模擬技術，搭配 Houdini 與 Maya nCloth / nParticles，打造高擬真的視覺特效與場景氛圍。' },
  { en: 'Frontend Engineer', zh: '前端工程師',
    description: '以 Angular、Tailwind CSS 及 TypeScript 構建高品質的互動式介面，結合現代設計系統打造流暢的使用者體驗。' },
  { en: 'AI Engineer',      zh: 'AI 工程師',
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
