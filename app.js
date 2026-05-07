/* =========================================================
   Palette — Visual Design Generator
   Generation engine: intentional, harmonious, non-repeating.
   ========================================================= */

// ----------------------------- utilities -----------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const rand = (min, max) => Math.random() * (max - min) + min;
const randi = (min, max) => Math.floor(rand(min, max + 1));
const choice = (arr) => arr[randi(0, arr.length - 1)];
const choiceWeighted = (entries) => {
  // entries: [[item, weight], ...]
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of entries) { r -= w; if (r <= 0) return item; }
  return entries[entries.length - 1][0];
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ----------------------------- color math -----------------------------
const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
};
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};
const luminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const mix = (h1, h2, t) => {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

// ----------------------------- font system -----------------------------
// Generous pool — each pair has a "mood" that biases palette selection.
const FONT_PAIRS = [
  // Minimal / structured
  { sans: 'Inter',                serif: 'Source Serif 4',     mood: 'minimal',    sw: [600, 700], rw: [600, 700] },
  { sans: 'Geist',                serif: 'Newsreader',         mood: 'minimal',    sw: [600, 700], rw: [500, 600] },
  { sans: 'DM Sans',              serif: 'DM Serif Display',   mood: 'minimal',    sw: [700],      rw: [400] },
  { sans: 'Hanken Grotesk',       serif: 'Spectral',           mood: 'minimal',    sw: [700, 800], rw: [500, 600] },
  { sans: 'Onest',                serif: 'EB Garamond',        mood: 'minimal',    sw: [600, 700], rw: [500, 600] },
  { sans: 'IBM Plex Sans',        serif: 'IBM Plex Serif',     mood: 'minimal',    sw: [600, 700], rw: [500, 600] },
  { sans: 'Public Sans',          serif: 'Libre Caslon Text',  mood: 'minimal',    sw: [700],      rw: [400, 700] },

  // Classic
  { sans: 'Inter',                serif: 'Merriweather',       mood: 'classic',    sw: [700],      rw: [700] },
  { sans: 'Work Sans',            serif: 'Bitter',             mood: 'classic',    sw: [600, 700], rw: [600, 700] },
  { sans: 'Albert Sans',          serif: 'Cormorant Garamond', mood: 'classic',    sw: [600, 700], rw: [500, 600] },
  { sans: 'Manrope',              serif: 'Lora',               mood: 'classic',    sw: [700],      rw: [600] },

  // Modern
  { sans: 'Space Grotesk',        serif: 'Lora',               mood: 'modern',     sw: [600, 700], rw: [600] },
  { sans: 'Be Vietnam Pro',       serif: 'Crimson Text',       mood: 'modern',     sw: [600, 700], rw: [600] },
  { sans: 'Plus Jakarta Sans',    serif: 'Crimson Pro',        mood: 'modern',     sw: [700],      rw: [600] },
  { sans: 'Sora',                 serif: 'Literata',           mood: 'modern',     sw: [600, 700], rw: [500, 600] },

  // Expressive
  { sans: 'Outfit',               serif: 'Fraunces',           mood: 'expressive', sw: [700, 800], rw: [600, 700] },
  { sans: 'Manrope',              serif: 'Playfair Display',   mood: 'expressive', sw: [800],      rw: [700] },
  { sans: 'Plus Jakarta Sans',    serif: 'Fraunces',           mood: 'expressive', sw: [700, 800], rw: [600, 700] },
  { sans: 'Outfit',               serif: 'Playfair Display',   mood: 'expressive', sw: [700, 800], rw: [700] },
  { sans: 'DM Sans',              serif: 'Fraunces',           mood: 'expressive', sw: [700],      rw: [600] },

  // Editorial / magazine
  { sans: 'Cormorant Garamond',   serif: 'Instrument Serif',   mood: 'editorial',  sw: [600, 700], rw: [400] },
  { sans: 'Libre Baskerville',    serif: 'Newsreader',         mood: 'editorial',  sw: [700],      rw: [500, 600] },
  { sans: 'DM Serif Display',     serif: 'Instrument Serif',   mood: 'editorial',  sw: [400],      rw: [400] },

  // Technical / mono
  { sans: 'IBM Plex Mono',        serif: 'IBM Plex Sans',      mood: 'technical',  sw: [500, 600], rw: [600, 700] },
  { sans: 'JetBrains Mono',       serif: 'Inter',              mood: 'technical',  sw: [500, 700], rw: [600, 700] },
  { sans: 'Roboto Mono',          serif: 'Public Sans',        mood: 'technical',  sw: [500, 700], rw: [600, 700] },
  { sans: 'Space Mono',           serif: 'Space Grotesk',      mood: 'technical',  sw: [700],      rw: [600, 700] },

  // Swiss / severe systems
  { sans: 'Archivo',              serif: 'Source Serif 4',     mood: 'swiss',      sw: [600, 700], rw: [600, 700] },
  { sans: 'Azeret Mono',          serif: 'IBM Plex Serif',     mood: 'swiss',      sw: [600, 700], rw: [500, 600] },

  // Soft product
  { sans: 'Nunito Sans',          serif: 'Lora',               mood: 'soft',       sw: [700, 800], rw: [600] },
  { sans: 'Afacad',               serif: 'Newsreader',         mood: 'soft',       sw: [600, 700], rw: [500, 600] },
  { sans: 'Urbanist',             serif: 'Fraunces',           mood: 'soft',       sw: [700, 800], rw: [600, 700] },

  // Luxury display
  { sans: 'Bodoni Moda',          serif: 'Prata',              mood: 'luxury',     sw: [600, 700], rw: [400] },
  { sans: 'Italiana',             serif: 'Baskervville',       mood: 'luxury',     sw: [400],      rw: [400] },
  { sans: 'Playfair Display',     serif: 'Prata',              mood: 'luxury',     sw: [700, 800], rw: [400] },

  // Condensed / poster
  { sans: 'Oswald',               serif: 'Merriweather',       mood: 'condensed',  sw: [600, 700], rw: [700] },
  { sans: 'Barlow Condensed',     serif: 'Bitter',             mood: 'condensed',  sw: [600, 700], rw: [600, 700] },
  { sans: 'Roboto Condensed',     serif: 'Libre Baskerville',  mood: 'condensed',  sw: [700],      rw: [700] },
  { sans: 'Archivo Narrow',       serif: 'Source Serif 4',     mood: 'condensed',  sw: [600, 700], rw: [600, 700] },

  // Pixel / 8-bit (used only by family: 'pixel' materials)
  { sans: 'Press Start 2P',       serif: 'Press Start 2P',     mood: 'pixel',      sw: [400],      rw: [400] },
  { sans: 'VT323',                serif: 'VT323',              mood: 'pixel',      sw: [400],      rw: [400] },
  { sans: 'Silkscreen',           serif: 'Silkscreen',         mood: 'pixel',      sw: [400, 700], rw: [400, 700] },
  { sans: 'Pixelify Sans',        serif: 'Pixelify Sans',      mood: 'pixel',      sw: [500, 700], rw: [500, 700] },
  { sans: 'Jersey 10',            serif: 'Jersey 10',          mood: 'pixel',      sw: [400],      rw: [400] },
  { sans: 'Workbench',            serif: 'Workbench',          mood: 'pixel',      sw: [400],      rw: [400] },

  // Sketch (used only by family: 'hand' + style: 'sketch')
  { sans: 'Caveat',               serif: 'Caveat',             mood: 'sketch',     sw: [500, 700], rw: [500, 700] },
  { sans: 'Gloria Hallelujah',    serif: 'Gloria Hallelujah',  mood: 'sketch',     sw: [400],      rw: [400] },
  { sans: 'Indie Flower',         serif: 'Indie Flower',       mood: 'sketch',     sw: [400],      rw: [400] },
  { sans: 'Patrick Hand',         serif: 'Patrick Hand',       mood: 'sketch',     sw: [400],      rw: [400] },
  { sans: 'Architects Daughter',  serif: 'Architects Daughter',mood: 'sketch',     sw: [400],      rw: [400] },
  { sans: 'Kalam',                serif: 'Kalam',              mood: 'sketch',     sw: [400, 700], rw: [400, 700] },
  { sans: 'Permanent Marker',     serif: 'Permanent Marker',   mood: 'sketch',     sw: [400],      rw: [400] },
  { sans: 'Cabin Sketch',         serif: 'Cabin Sketch',       mood: 'sketch',     sw: [400, 700], rw: [400, 700] },

  // Calligraphic (used only by family: 'hand' + style: 'calligraphic')
  { sans: 'Dancing Script',       serif: 'Dancing Script',     mood: 'calligraphic', sw: [400, 700], rw: [400, 700] },
  { sans: 'Great Vibes',          serif: 'Great Vibes',        mood: 'calligraphic', sw: [400], rw: [400] },
  { sans: 'Pacifico',             serif: 'Pacifico',           mood: 'calligraphic', sw: [400], rw: [400] },
];

// Moods that lock pairs to specific material families. A non-family material
// will never select pairs with these moods, and vice versa.
const EXCLUSIVE_MOODS = new Set(['pixel', 'sketch', 'calligraphic']);

const TYPE_SCALES = [
  { sansSize: 'clamp(2.0rem, 4.6vw, 2.6rem)', serifSize: 'clamp(1.45rem, 3.4vw, 1.85rem)', sansTrack: '-0.02em', serifTrack: '-0.005em' },
  { sansSize: 'clamp(2.2rem, 5.0vw, 2.85rem)', serifSize: 'clamp(1.4rem, 3.2vw, 1.7rem)',  sansTrack: '-0.03em', serifTrack: '0' },
  { sansSize: 'clamp(1.85rem, 4.2vw, 2.4rem)', serifSize: 'clamp(1.55rem, 3.6vw, 2.0rem)', sansTrack: '-0.015em', serifTrack: '-0.01em' },
  { sansSize: 'clamp(2.1rem, 4.8vw, 2.7rem)',  serifSize: 'clamp(1.35rem, 3.0vw, 1.6rem)', sansTrack: '-0.025em', serifTrack: '0.005em' },
];

// ----------------------------- material system -----------------------------
// Each material drives the card visuals AND the page atmosphere AND palette mood.
const MATERIALS = {
  Chrome: {
    // Cool, structured — silvers, blues
    cardBg: 'rgba(245,247,252,0.62)', borderOpacity: 1.0, blur: 30, saturate: 1.5, noise: 0.04,
    cardShadow: '0 1px 1px rgba(20,24,38,0.05), 0 24px 60px rgba(20,24,38,0.10), 0 50px 120px rgba(20,24,38,0.10)',
    bgBase: '#e8ecf4',
    bgOrbs: ['#b8c8e8', '#d6e0f0', '#a8b8d8', '#dde4ef'],
    paletteMood: { hueRange: [195, 235], satRange: [40, 65], lightRange: [50, 62], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['minimal', 'modern'],
  },
  Frost: {
    cardBg: 'rgba(255,255,255,0.55)', borderOpacity: 1.0, blur: 36, saturate: 1.4, noise: 0.05,
    cardShadow: '0 1px 1px rgba(20,40,60,0.05), 0 24px 60px rgba(20,40,60,0.10), 0 50px 120px rgba(20,40,60,0.08)',
    bgBase: '#eaf3f8',
    bgOrbs: ['#c8e4f0', '#b4ddd8', '#d8e8f4', '#e0f0ec'],
    paletteMood: { hueRange: [165, 215], satRange: [50, 78], lightRange: [48, 60], harmony: ['analogous', 'split'], contrast: 'medium' },
    fontMoods: ['minimal', 'modern'],
  },
  Pearl: {
    cardBg: 'rgba(255,250,248,0.62)', borderOpacity: 1.0, blur: 24, saturate: 1.3, noise: 0.06,
    cardShadow: '0 1px 1px rgba(80,40,40,0.05), 0 22px 56px rgba(80,40,40,0.10), 0 48px 110px rgba(80,40,40,0.08)',
    bgBase: '#f5ecec',
    bgOrbs: ['#ffd8d0', '#f4d8e4', '#ffe2d4', '#f0dde6'],
    paletteMood: { hueRange: [330, 30], satRange: [40, 65], lightRange: [55, 68], harmony: ['analogous', 'mono'], contrast: 'soft' },
    fontMoods: ['classic', 'expressive'],
  },
  Mist: {
    cardBg: 'rgba(250,251,253,0.55)', borderOpacity: 0.85, blur: 40, saturate: 1.1, noise: 0.04,
    cardShadow: '0 1px 1px rgba(15,18,25,0.04), 0 24px 60px rgba(15,18,25,0.08), 0 50px 120px rgba(15,18,25,0.06)',
    bgBase: '#eef0f2',
    bgOrbs: ['#d8dee6', '#dfe4ec', '#e8ecf2', '#d4dae4'],
    paletteMood: { hueRange: [200, 260], satRange: [25, 50], lightRange: [50, 64], harmony: ['mono', 'analogous'], contrast: 'soft' },
    fontMoods: ['minimal'],
  },
  Prism: {
    cardBg: 'rgba(255,255,255,0.45)', borderOpacity: 1.0, blur: 26, saturate: 1.6, noise: 0.07,
    cardShadow: '0 1px 1px rgba(40,30,80,0.06), 0 28px 64px rgba(40,30,80,0.12), 0 56px 130px rgba(40,30,80,0.10)',
    bgBase: '#ece6f4',
    bgOrbs: ['#c9b8ff', '#ffd2e0', '#a8e0d6', '#ffe0b8'],
    paletteMood: { hueRange: [0, 360], satRange: [55, 80], lightRange: [50, 62], harmony: ['triadic', 'split'], contrast: 'expressive' },
    fontMoods: ['expressive', 'modern'],
  },
  Porcelain: {
    cardBg: 'rgba(255,255,255,0.78)', borderOpacity: 0.6, blur: 18, saturate: 1.2, noise: 0.05,
    cardShadow: '0 1px 1px rgba(15,18,25,0.04), 0 18px 48px rgba(15,18,25,0.08), 0 40px 100px rgba(15,18,25,0.06)',
    bgBase: '#f4f5f7',
    bgOrbs: ['#e6eaf2', '#eef1f6', '#dfe4ec', '#e8ecf2'],
    paletteMood: { hueRange: [200, 260], satRange: [50, 70], lightRange: [48, 60], harmony: ['mono', 'analogous'], contrast: 'medium' },
    fontMoods: ['minimal', 'classic'],
  },
  Aurora: {
    cardBg: 'rgba(240,250,248,0.55)', borderOpacity: 1.0, blur: 30, saturate: 1.5, noise: 0.06,
    cardShadow: '0 1px 1px rgba(20,60,50,0.05), 0 24px 60px rgba(20,60,50,0.12), 0 50px 120px rgba(20,60,50,0.10)',
    bgBase: '#e6f1ec',
    bgOrbs: ['#b4e8d2', '#c4d8ff', '#d4f0c8', '#b8d8f0'],
    paletteMood: { hueRange: [120, 200], satRange: [50, 75], lightRange: [45, 60], harmony: ['analogous', 'split'], contrast: 'medium' },
    fontMoods: ['modern', 'expressive'],
  },
  Quartz: {
    cardBg: 'rgba(252,248,255,0.6)', borderOpacity: 1.0, blur: 28, saturate: 1.4, noise: 0.05,
    cardShadow: '0 1px 1px rgba(60,40,80,0.05), 0 24px 60px rgba(60,40,80,0.10), 0 50px 120px rgba(60,40,80,0.08)',
    bgBase: '#f0eaf4',
    bgOrbs: ['#e4d4f4', '#ffe0e8', '#dcc8f0', '#fad8e8'],
    paletteMood: { hueRange: [280, 340], satRange: [40, 70], lightRange: [50, 64], harmony: ['analogous', 'split'], contrast: 'medium' },
    fontMoods: ['classic', 'expressive'],
  },
  Sunstone: {
    cardBg: 'rgba(255,250,242,0.6)', borderOpacity: 1.0, blur: 26, saturate: 1.4, noise: 0.06,
    cardShadow: '0 1px 1px rgba(80,50,20,0.06), 0 24px 60px rgba(80,50,20,0.12), 0 50px 120px rgba(80,50,20,0.10)',
    bgBase: '#f5ece0',
    bgOrbs: ['#ffd8a8', '#ffd0a0', '#f4d4b8', '#ffe2c0'],
    paletteMood: { hueRange: [15, 50], satRange: [55, 80], lightRange: [50, 62], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['classic', 'expressive', 'modern'],
  },
  Lagoon: {
    cardBg: 'rgba(240,248,250,0.5)', borderOpacity: 1.0, blur: 32, saturate: 1.5, noise: 0.05,
    cardShadow: '0 1px 1px rgba(10,40,60,0.06), 0 24px 60px rgba(10,40,60,0.14), 0 50px 120px rgba(10,40,60,0.10)',
    bgBase: '#dce8ec',
    bgOrbs: ['#a4d8e0', '#b8d8d8', '#c0e0e8', '#a8c8d4'],
    paletteMood: { hueRange: [170, 210], satRange: [60, 85], lightRange: [38, 52], harmony: ['analogous'], contrast: 'medium' },
    fontMoods: ['minimal', 'modern'],
  },
  Nebula: {
    cardBg: 'rgba(245,243,255,0.5)', borderOpacity: 1.0, blur: 30, saturate: 1.5, noise: 0.07,
    cardShadow: '0 1px 1px rgba(30,20,80,0.06), 0 24px 60px rgba(30,20,80,0.14), 0 50px 120px rgba(30,20,80,0.10)',
    bgBase: '#e8e4f4',
    bgOrbs: ['#c9b8ff', '#a8b8e8', '#d4c0f0', '#b8c8f0'],
    paletteMood: { hueRange: [240, 290], satRange: [55, 80], lightRange: [45, 60], harmony: ['analogous', 'split'], contrast: 'expressive' },
    fontMoods: ['modern', 'expressive'],
  },
  Sage: {
    cardBg: 'rgba(245,250,244,0.55)', borderOpacity: 1.0, blur: 26, saturate: 1.3, noise: 0.05,
    cardShadow: '0 1px 1px rgba(40,60,30,0.05), 0 24px 60px rgba(40,60,30,0.10), 0 50px 120px rgba(40,60,30,0.08)',
    bgBase: '#e8eee2',
    bgOrbs: ['#cce0c0', '#d4e4d0', '#dde4d0', '#c8d8c0'],
    paletteMood: { hueRange: [80, 140], satRange: [30, 55], lightRange: [42, 58], harmony: ['analogous', 'mono'], contrast: 'soft' },
    fontMoods: ['classic', 'minimal'],
  },

  // ----- Metal materials — warm and cool refined surfaces -----
  Gold: {
    cardBg: 'rgba(255,248,224,0.6)', borderOpacity: 1.0, blur: 26, saturate: 1.5, noise: 0.06,
    cardShadow: '0 1px 1px rgba(120,80,10,0.06), 0 24px 60px rgba(120,80,10,0.14), 0 50px 120px rgba(120,80,10,0.10)',
    bgBase: '#f6ecd0',
    bgOrbs: ['#f4d98a', '#ffe6a8', '#e8c878', '#fff0c4'],
    paletteMood: { hueRange: [38, 55], satRange: [60, 88], lightRange: [48, 60], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['classic', 'expressive'],
  },
  Copper: {
    cardBg: 'rgba(252,238,224,0.6)', borderOpacity: 1.0, blur: 26, saturate: 1.5, noise: 0.07,
    cardShadow: '0 1px 1px rgba(120,55,20,0.06), 0 24px 60px rgba(120,55,20,0.14), 0 50px 120px rgba(120,55,20,0.10)',
    bgBase: '#f3dcc8',
    bgOrbs: ['#e8a878', '#f0bc94', '#d8895a', '#f4cca8'],
    paletteMood: { hueRange: [12, 32], satRange: [55, 80], lightRange: [45, 58], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['classic', 'expressive', 'modern'],
  },
  Platinum: {
    cardBg: 'rgba(248,250,253,0.6)', borderOpacity: 1.0, blur: 30, saturate: 1.3, noise: 0.04,
    cardShadow: '0 1px 1px rgba(40,50,70,0.05), 0 24px 60px rgba(40,50,70,0.10), 0 50px 120px rgba(40,50,70,0.08)',
    bgBase: '#e6eaf0',
    bgOrbs: ['#d4dae4', '#dfe4ec', '#c8d0dc', '#e2e8f0'],
    paletteMood: { hueRange: [200, 240], satRange: [15, 35], lightRange: [55, 68], harmony: ['mono', 'analogous'], contrast: 'soft' },
    fontMoods: ['minimal', 'modern'],
  },
  Brass: {
    cardBg: 'rgba(250,240,210,0.6)', borderOpacity: 1.0, blur: 24, saturate: 1.5, noise: 0.07,
    cardShadow: '0 1px 1px rgba(110,80,15,0.06), 0 24px 60px rgba(110,80,15,0.14), 0 50px 120px rgba(110,80,15,0.10)',
    bgBase: '#ecdfa8',
    bgOrbs: ['#d8c068', '#e4cc80', '#c8a850', '#ecd690'],
    paletteMood: { hueRange: [42, 60], satRange: [55, 78], lightRange: [42, 55], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['classic', 'expressive'],
  },
  Bronze: {
    cardBg: 'rgba(245,228,200,0.6)', borderOpacity: 1.0, blur: 24, saturate: 1.4, noise: 0.07,
    cardShadow: '0 1px 1px rgba(90,50,15,0.07), 0 24px 60px rgba(90,50,15,0.16), 0 50px 120px rgba(90,50,15,0.12)',
    bgBase: '#e6cba0',
    bgOrbs: ['#c89860', '#d8a878', '#a87848', '#e0b888'],
    paletteMood: { hueRange: [22, 42], satRange: [50, 75], lightRange: [38, 52], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['classic', 'expressive'],
  },

  // ----- Dark materials -----
  Obsidian: {
    cardBg: 'rgba(20,24,34,0.55)', borderOpacity: 0.7, blur: 32, saturate: 1.6, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(0,0,0,0.55), 0 50px 120px rgba(0,0,0,0.4)',
    bgBase: '#0a0c14',
    bgOrbs: ['#202a4a', '#1a2540', '#2a1a3a', '#15182a'],
    paletteMood: { hueRange: [200, 260], satRange: [55, 80], lightRange: [55, 70], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['minimal', 'modern'],
  },
  Midnight: {
    cardBg: 'rgba(15,22,42,0.55)', borderOpacity: 0.75, blur: 30, saturate: 1.6, noise: 0.07,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(0,10,40,0.55), 0 50px 120px rgba(0,10,40,0.4)',
    bgBase: '#070d1c',
    bgOrbs: ['#1a2a55', '#162540', '#22184a', '#102045'],
    paletteMood: { hueRange: [210, 270], satRange: [60, 85], lightRange: [55, 70], harmony: ['analogous', 'split'], contrast: 'expressive', mode: 'dark' },
    fontMoods: ['modern', 'expressive'],
  },
  Carbon: {
    cardBg: 'rgba(28,30,36,0.6)', borderOpacity: 0.55, blur: 28, saturate: 1.4, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 22px 56px rgba(0,0,0,0.5), 0 48px 110px rgba(0,0,0,0.35)',
    bgBase: '#14161c',
    bgOrbs: ['#28252e', '#1f1d24', '#2c2a30', '#1c1d22'],
    paletteMood: { hueRange: [200, 260], satRange: [30, 55], lightRange: [55, 68], harmony: ['mono', 'analogous'], contrast: 'soft', mode: 'dark' },
    fontMoods: ['minimal'],
  },
  Eclipse: {
    cardBg: 'rgba(28,18,38,0.55)', borderOpacity: 0.8, blur: 30, saturate: 1.7, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(20,0,40,0.55), 0 50px 120px rgba(20,0,40,0.4)',
    bgBase: '#100620',
    bgOrbs: ['#3a1850', '#2a1845', '#401a3a', '#20102a'],
    paletteMood: { hueRange: [280, 340], satRange: [60, 85], lightRange: [58, 72], harmony: ['triadic', 'split'], contrast: 'expressive', mode: 'dark' },
    fontMoods: ['expressive', 'modern'],
  },
  Forest: {
    cardBg: 'rgba(15,28,22,0.55)', borderOpacity: 0.6, blur: 28, saturate: 1.5, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(0,20,10,0.5), 0 50px 120px rgba(0,20,10,0.35)',
    bgBase: '#061410',
    bgOrbs: ['#163025', '#1a2820', '#122a25', '#0e2018'],
    paletteMood: { hueRange: [110, 170], satRange: [45, 70], lightRange: [52, 68], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['classic', 'minimal'],
  },
  Espresso: {
    cardBg: 'rgba(38,26,20,0.55)', borderOpacity: 0.65, blur: 26, saturate: 1.5, noise: 0.07,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(40,15,5,0.5), 0 50px 120px rgba(40,15,5,0.35)',
    bgBase: '#18100a',
    bgOrbs: ['#3a2418', '#2a1810', '#3a1a08', '#20100a'],
    paletteMood: { hueRange: [15, 50], satRange: [55, 80], lightRange: [58, 72], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['classic', 'expressive'],
  },
  Slate: {
    cardBg: 'rgba(28,32,40,0.55)', borderOpacity: 0.6, blur: 30, saturate: 1.4, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(0,5,20,0.5), 0 50px 120px rgba(0,5,20,0.35)',
    bgBase: '#0e1218',
    bgOrbs: ['#1c2530', '#182028', '#20283a', '#14182a'],
    paletteMood: { hueRange: [180, 240], satRange: [40, 65], lightRange: [55, 70], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['minimal', 'modern'],
  },

  // ----- Editorial / magazine -----
  Ivory: {
    cardBg: 'rgba(255,252,244,0.74)', borderOpacity: 0.75, blur: 18, saturate: 1.15, noise: 0.05,
    cardShadow: '0 1px 1px rgba(40,30,20,0.04), 0 18px 46px rgba(40,30,20,0.08), 0 36px 90px rgba(40,30,20,0.06)',
    bgBase: '#f5efe2',
    bgOrbs: ['#efe2c8', '#f8ead6', '#e6dac6', '#fff6e2'],
    paletteMood: { hueRange: [32, 62], satRange: [18, 38], lightRange: [32, 48], harmony: ['mono', 'analogous'], contrast: 'soft' },
    fontMoods: ['editorial', 'classic', 'luxury'],
    buttonStyles: ['editorial-line', 'outline-pill', 'inset-soft'],
  },
  Newsprint: {
    cardBg: 'rgba(248,246,238,0.88)', borderOpacity: 0.55, blur: 10, saturate: 1, noise: 0.12,
    cardShadow: '0 1px 1px rgba(20,18,14,0.04), 0 12px 32px rgba(20,18,14,0.08), 0 30px 70px rgba(20,18,14,0.06)',
    bgBase: '#ece7dc',
    bgOrbs: ['#d8d0c0', '#eee7d8', '#cfc8ba', '#f7efe2'],
    paletteMood: { hueRange: [20, 55], satRange: [8, 26], lightRange: [26, 42], harmony: ['mono', 'analogous'], contrast: 'soft' },
    fontMoods: ['editorial', 'condensed'],
    buttonStyles: ['editorial-line', 'outline-rect', 'sharp-rect'],
  },
  Gallery: {
    cardBg: 'rgba(255,255,252,0.86)', borderOpacity: 0.65, blur: 16, saturate: 1.1, noise: 0.03,
    cardShadow: '0 1px 1px rgba(10,10,12,0.04), 0 20px 52px rgba(10,10,12,0.08), 0 46px 100px rgba(10,10,12,0.06)',
    bgBase: '#f2f0ea',
    bgOrbs: ['#e8e4da', '#f4f0e6', '#dcd8d0', '#fffaf0'],
    paletteMood: { hueRange: [0, 360], satRange: [12, 28], lightRange: [30, 46], harmony: ['mono', 'analogous'], contrast: 'medium' },
    fontMoods: ['editorial', 'swiss', 'minimal'],
    buttonStyles: ['outline-pill', 'editorial-line', 'glass-pill'],
  },
  Runway: {
    cardBg: 'rgba(18,16,18,0.58)', borderOpacity: 0.65, blur: 24, saturate: 1.25, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(0,0,0,0.5), 0 50px 120px rgba(0,0,0,0.34)',
    bgBase: '#0d0b0d',
    bgOrbs: ['#34212c', '#1a161c', '#4a3a30', '#171217'],
    paletteMood: { hueRange: [330, 390], satRange: [30, 60], lightRange: [58, 74], harmony: ['mono', 'analogous'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['luxury', 'editorial', 'condensed'],
    buttonStyles: ['editorial-line', 'outline-rect', 'sharp-rect'],
  },

  // ----- Clinical / technical -----
  Sterile: {
    cardBg: 'rgba(250,253,255,0.78)', borderOpacity: 0.8, blur: 18, saturate: 1.1, noise: 0.02,
    cardShadow: '0 1px 1px rgba(20,40,55,0.04), 0 18px 46px rgba(20,40,55,0.08), 0 40px 90px rgba(20,40,55,0.06)',
    bgBase: '#eef5f7',
    bgOrbs: ['#d8edf2', '#e8f6f8', '#d2e6ee', '#f2fbfc'],
    paletteMood: { hueRange: [175, 215], satRange: [22, 48], lightRange: [42, 56], harmony: ['mono', 'analogous'], contrast: 'soft' },
    fontMoods: ['technical', 'minimal', 'swiss'],
    buttonStyles: ['outline-pill', 'inset-soft', 'rounded-rect'],
  },
  Blueprint: {
    cardBg: 'rgba(226,238,255,0.62)', borderOpacity: 0.8, blur: 18, saturate: 1.25, noise: 0.05,
    cardShadow: '0 1px 1px rgba(0,40,90,0.08), 0 22px 54px rgba(0,40,90,0.14), 0 44px 100px rgba(0,40,90,0.1)',
    bgBase: '#0f3f78',
    bgOrbs: ['#2f6db2', '#174f90', '#6fb4ff', '#14396a'],
    paletteMood: { hueRange: [195, 225], satRange: [55, 88], lightRange: [54, 72], harmony: ['mono', 'analogous'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['technical', 'swiss'],
    buttonStyles: ['outline-rect', 'terminal-block', 'sharp-rect'],
  },
  Diagnostic: {
    cardBg: 'rgba(244,252,250,0.7)', borderOpacity: 0.75, blur: 22, saturate: 1.3, noise: 0.03,
    cardShadow: '0 1px 1px rgba(0,70,70,0.05), 0 24px 58px rgba(0,70,70,0.12), 0 48px 110px rgba(0,70,70,0.08)',
    bgBase: '#e5f4f1',
    bgOrbs: ['#b9ece2', '#c8e8ff', '#d8f2e8', '#a8d8d0'],
    paletteMood: { hueRange: [150, 205], satRange: [45, 72], lightRange: [42, 58], harmony: ['analogous', 'split'], contrast: 'medium' },
    fontMoods: ['technical', 'minimal'],
    buttonStyles: ['outline-pill', 'glass-pill', 'rounded-rect'],
  },
  Instrument: {
    cardBg: 'rgba(238,242,244,0.72)', borderOpacity: 0.7, blur: 14, saturate: 1.05, noise: 0.04,
    cardShadow: '0 1px 1px rgba(10,15,18,0.06), 0 18px 48px rgba(10,15,18,0.1), 0 42px 96px rgba(10,15,18,0.08)',
    bgBase: '#dfe5e8',
    bgOrbs: ['#c7d0d6', '#eef3f5', '#b8c2ca', '#d6dde2'],
    paletteMood: { hueRange: [185, 235], satRange: [12, 36], lightRange: [36, 54], harmony: ['mono', 'analogous'], contrast: 'soft' },
    fontMoods: ['technical', 'swiss'],
    buttonStyles: ['inset-soft', 'outline-rect', 'sharp-rect'],
  },

  // ----- Neon / nightlife -----
  Neon: {
    cardBg: 'rgba(8,10,20,0.62)', borderOpacity: 0.85, blur: 24, saturate: 1.8, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 70px rgba(0,255,220,0.14), 0 50px 130px rgba(255,0,180,0.12)',
    bgBase: '#050612',
    bgOrbs: ['#00f5ff', '#ff2bd6', '#8cff00', '#551bff'],
    paletteMood: { hueRange: [0, 360], satRange: [82, 100], lightRange: [58, 74], harmony: ['triadic', 'split'], contrast: 'expressive', mode: 'dark' },
    fontMoods: ['technical', 'modern', 'condensed'],
    buttonStyles: ['glass-pill', 'duotone-pill', 'outline-pill'],
  },
  Afterhours: {
    cardBg: 'rgba(12,8,28,0.58)', borderOpacity: 0.75, blur: 28, saturate: 1.75, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.55), 0 24px 70px rgba(70,20,160,0.26), 0 52px 130px rgba(0,0,0,0.38)',
    bgBase: '#090416',
    bgOrbs: ['#6b2bff', '#0dd6ff', '#ff2b8a', '#1a0d36'],
    paletteMood: { hueRange: [250, 330], satRange: [70, 95], lightRange: [58, 74], harmony: ['split', 'triadic'], contrast: 'expressive', mode: 'dark' },
    fontMoods: ['modern', 'expressive', 'technical'],
    buttonStyles: ['duotone-pill', 'glass-pill', 'flat-pill'],
  },
  Synthwave: {
    cardBg: 'rgba(24,8,36,0.6)', borderOpacity: 0.75, blur: 26, saturate: 1.8, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.55), 0 24px 70px rgba(255,50,180,0.18), 0 52px 130px rgba(0,180,255,0.12)',
    bgBase: '#160820',
    bgOrbs: ['#ff3cac', '#784bff', '#2bd9ff', '#ffb000'],
    paletteMood: { hueRange: [285, 380], satRange: [72, 96], lightRange: [56, 72], harmony: ['split', 'triadic'], contrast: 'expressive', mode: 'dark' },
    fontMoods: ['condensed', 'modern', 'technical'],
    buttonStyles: ['duotone-pill', 'glass-pill', 'sharp-rect'],
  },
  Laser: {
    cardBg: 'rgba(4,8,12,0.64)', borderOpacity: 0.8, blur: 22, saturate: 1.9, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.6), 0 22px 68px rgba(50,255,140,0.16), 0 50px 120px rgba(255,40,40,0.12)',
    bgBase: '#030609',
    bgOrbs: ['#39ff14', '#ff204e', '#00e5ff', '#101820'],
    paletteMood: { hueRange: [90, 180], satRange: [85, 100], lightRange: [56, 72], harmony: ['triadic', 'split'], contrast: 'expressive', mode: 'dark' },
    fontMoods: ['technical', 'condensed'],
    buttonStyles: ['terminal-block', 'outline-rect', 'flat-pill'],
  },

  // ----- Earth / organic -----
  Clay: {
    cardBg: 'rgba(238,214,190,0.66)', borderOpacity: 0.8, blur: 22, saturate: 1.2, noise: 0.08,
    cardShadow: '0 1px 1px rgba(80,45,25,0.06), 0 24px 58px rgba(80,45,25,0.12), 0 48px 110px rgba(80,45,25,0.09)',
    bgBase: '#dcc3aa',
    bgOrbs: ['#c9805a', '#d8a078', '#a86648', '#e6c0a0'],
    paletteMood: { hueRange: [12, 38], satRange: [35, 62], lightRange: [36, 52], harmony: ['analogous', 'mono'], contrast: 'soft' },
    fontMoods: ['soft', 'classic', 'editorial'],
    buttonStyles: ['inset-soft', 'soft-rect', 'outline-pill'],
  },
  Moss: {
    cardBg: 'rgba(226,236,214,0.64)', borderOpacity: 0.8, blur: 22, saturate: 1.18, noise: 0.07,
    cardShadow: '0 1px 1px rgba(35,55,25,0.06), 0 24px 58px rgba(35,55,25,0.12), 0 48px 110px rgba(35,55,25,0.08)',
    bgBase: '#d7dfc8',
    bgOrbs: ['#9fb27a', '#c0d29a', '#718a5a', '#e0e7ce'],
    paletteMood: { hueRange: [65, 125], satRange: [24, 50], lightRange: [34, 52], harmony: ['analogous', 'mono'], contrast: 'soft' },
    fontMoods: ['soft', 'classic', 'minimal'],
    buttonStyles: ['inset-soft', 'soft-rect', 'flat-pill'],
  },
  Terracotta: {
    cardBg: 'rgba(246,222,204,0.66)', borderOpacity: 0.85, blur: 20, saturate: 1.25, noise: 0.08,
    cardShadow: '0 1px 1px rgba(110,50,28,0.07), 0 24px 60px rgba(110,50,28,0.14), 0 50px 110px rgba(110,50,28,0.1)',
    bgBase: '#e7b99c',
    bgOrbs: ['#c95f3f', '#e08b62', '#9f4a36', '#f0c0a0'],
    paletteMood: { hueRange: [8, 28], satRange: [48, 75], lightRange: [40, 58], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['classic', 'soft', 'expressive'],
    buttonStyles: ['soft-rect', 'inset-soft', 'rounded-rect'],
  },
  Basalt: {
    cardBg: 'rgba(42,44,42,0.62)', borderOpacity: 0.55, blur: 20, saturate: 1.1, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.5), 0 24px 60px rgba(0,0,0,0.5), 0 50px 120px rgba(0,0,0,0.34)',
    bgBase: '#171918',
    bgOrbs: ['#313630', '#232826', '#4a4237', '#141615'],
    paletteMood: { hueRange: [28, 80], satRange: [12, 32], lightRange: [52, 68], harmony: ['mono', 'analogous'], contrast: 'soft', mode: 'dark' },
    fontMoods: ['minimal', 'technical', 'soft'],
    buttonStyles: ['inset-soft', 'outline-rect', 'sharp-rect'],
  },
  Olive: {
    cardBg: 'rgba(235,235,210,0.64)', borderOpacity: 0.78, blur: 20, saturate: 1.16, noise: 0.07,
    cardShadow: '0 1px 1px rgba(55,60,25,0.06), 0 24px 58px rgba(55,60,25,0.12), 0 48px 110px rgba(55,60,25,0.08)',
    bgBase: '#deddb8',
    bgOrbs: ['#a5a05e', '#c8c28a', '#7d834b', '#e6e0b8'],
    paletteMood: { hueRange: [45, 95], satRange: [30, 58], lightRange: [36, 54], harmony: ['analogous', 'mono'], contrast: 'soft' },
    fontMoods: ['classic', 'soft', 'minimal'],
    buttonStyles: ['flat-pill', 'inset-soft', 'outline-pill'],
  },

  // ----- Candy / toy -----
  Bubblegum: {
    cardBg: 'rgba(255,240,250,0.72)', borderOpacity: 0.95, blur: 24, saturate: 1.5, noise: 0.04,
    cardShadow: '0 1px 1px rgba(160,50,120,0.05), 0 24px 60px rgba(160,50,120,0.12), 0 50px 120px rgba(160,50,120,0.08)',
    bgBase: '#ffe0f0',
    bgOrbs: ['#ff9ad5', '#b9a8ff', '#8ee8ff', '#ffd37a'],
    paletteMood: { hueRange: [300, 380], satRange: [58, 88], lightRange: [56, 70], harmony: ['split', 'triadic'], contrast: 'expressive' },
    fontMoods: ['soft', 'expressive'],
    buttonStyles: ['duotone-pill', 'soft-rect', 'glass-pill'],
  },
  Sorbet: {
    cardBg: 'rgba(255,248,240,0.72)', borderOpacity: 0.95, blur: 24, saturate: 1.45, noise: 0.04,
    cardShadow: '0 1px 1px rgba(160,90,60,0.05), 0 24px 60px rgba(160,90,60,0.12), 0 50px 120px rgba(160,90,60,0.08)',
    bgBase: '#fff0dc',
    bgOrbs: ['#ffbf8a', '#ffe080', '#a8eadc', '#f6a6c8'],
    paletteMood: { hueRange: [5, 75], satRange: [55, 85], lightRange: [55, 70], harmony: ['analogous', 'split'], contrast: 'soft' },
    fontMoods: ['soft', 'modern'],
    buttonStyles: ['soft-rect', 'duotone-pill', 'pill'],
  },
  Confetti: {
    cardBg: 'rgba(255,255,255,0.68)', borderOpacity: 1, blur: 22, saturate: 1.55, noise: 0.05,
    cardShadow: '0 1px 1px rgba(80,60,120,0.05), 0 24px 60px rgba(80,60,120,0.12), 0 50px 120px rgba(80,60,120,0.08)',
    bgBase: '#f3f1ff',
    bgOrbs: ['#ff6b9d', '#ffd166', '#06d6a0', '#4d96ff'],
    paletteMood: { hueRange: [0, 360], satRange: [68, 92], lightRange: [50, 66], harmony: ['triadic', 'split'], contrast: 'expressive' },
    fontMoods: ['soft', 'expressive', 'modern'],
    buttonStyles: ['duotone-pill', 'rounded-rect', 'soft-rect'],
  },
  Gelato: {
    cardBg: 'rgba(250,252,250,0.74)', borderOpacity: 0.95, blur: 24, saturate: 1.35, noise: 0.04,
    cardShadow: '0 1px 1px rgba(80,120,100,0.05), 0 24px 60px rgba(80,120,100,0.11), 0 50px 120px rgba(80,120,100,0.08)',
    bgBase: '#eaf4ee',
    bgOrbs: ['#b8f0d0', '#ffc8d8', '#d8c8ff', '#fff0b8'],
    paletteMood: { hueRange: [120, 220], satRange: [42, 70], lightRange: [54, 68], harmony: ['analogous', 'split'], contrast: 'soft' },
    fontMoods: ['soft', 'minimal'],
    buttonStyles: ['soft-rect', 'pill', 'glass-pill'],
  },

  // ----- Brutalist / utility -----
  Concrete: {
    cardBg: 'rgba(226,226,220,0.82)', borderOpacity: 0.35, blur: 4, saturate: 1, noise: 0.12,
    cardShadow: '8px 8px 0 rgba(20,20,18,0.18), 0 20px 50px rgba(20,20,18,0.12)',
    bgBase: '#d5d4cc',
    bgOrbs: ['#bfc0ba', '#e4e2d8', '#a9aaa4', '#d0cec4'],
    paletteMood: { grayscale: true, accentLightRange: [22, 42], grayLightRange: [96, 86, 74], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['swiss', 'technical', 'condensed'],
    buttonStyles: ['brutal-block', 'outline-rect', 'sharp-rect'],
  },
  Terminal: {
    cardBg: 'rgba(6,18,12,0.82)', borderOpacity: 0.4, blur: 0, saturate: 1.3, noise: 0.04,
    cardShadow: '0 0 0 1px rgba(80,255,140,0.2), 0 20px 60px rgba(0,0,0,0.5)',
    bgBase: '#020806',
    bgOrbs: ['#0d3b22', '#113018', '#04140c', '#46ff7a'],
    paletteMood: { hueRange: [95, 155], satRange: [60, 100], lightRange: [52, 72], harmony: ['mono', 'analogous'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['technical'],
    buttonStyles: ['terminal-block'],
  },
  Wireframe: {
    cardBg: 'rgba(252,252,250,0.78)', borderOpacity: 0.28, blur: 8, saturate: 1, noise: 0.02,
    cardShadow: '0 0 0 1px rgba(10,10,10,0.08), 0 18px 42px rgba(10,10,10,0.08)',
    bgBase: '#f4f4f0',
    bgOrbs: ['#ffffff', '#e8e8e4', '#d8d8d2', '#f8f8f4'],
    paletteMood: { grayscale: true, accentLightRange: [20, 38], grayLightRange: [98, 92, 82], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['swiss', 'technical', 'minimal'],
    buttonStyles: ['outline-rect', 'brutal-block', 'editorial-line'],
  },
  Mono: {
    cardBg: 'rgba(245,245,242,0.82)', borderOpacity: 0.45, blur: 8, saturate: 1, noise: 0.04,
    cardShadow: '0 1px 1px rgba(0,0,0,0.04), 0 18px 42px rgba(0,0,0,0.08), 0 36px 88px rgba(0,0,0,0.06)',
    bgBase: '#e9e9e4',
    bgOrbs: ['#d8d8d2', '#f4f4f0', '#c8c8c2', '#ffffff'],
    paletteMood: { grayscale: true, accentLightRange: [18, 42], grayLightRange: [96, 90, 80], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['swiss', 'minimal', 'technical'],
    buttonStyles: ['outline-pill', 'outline-rect', 'sharp-rect'],
  },

  // ----- Luxury dark warm -----
  Velvet: {
    cardBg: 'rgba(36,12,30,0.62)', borderOpacity: 0.65, blur: 26, saturate: 1.5, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.55), 0 24px 70px rgba(60,0,40,0.5), 0 50px 120px rgba(0,0,0,0.35)',
    bgBase: '#180818',
    bgOrbs: ['#4a1238', '#2a0d24', '#7a244e', '#1a0c16'],
    paletteMood: { hueRange: [315, 370], satRange: [45, 72], lightRange: [58, 74], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['luxury', 'editorial', 'expressive'],
    buttonStyles: ['editorial-line', 'glass-pill', 'outline-pill'],
  },
  Burgundy: {
    cardBg: 'rgba(42,12,18,0.62)', borderOpacity: 0.65, blur: 24, saturate: 1.45, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.55), 0 24px 70px rgba(80,0,10,0.46), 0 50px 120px rgba(0,0,0,0.35)',
    bgBase: '#1d070b',
    bgOrbs: ['#5a1420', '#321018', '#7a2430', '#241014'],
    paletteMood: { hueRange: [345, 385], satRange: [50, 78], lightRange: [56, 72], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['luxury', 'classic', 'editorial'],
    buttonStyles: ['editorial-line', 'outline-rect', 'glass-pill'],
  },
  Lacquer: {
    cardBg: 'rgba(18,8,8,0.64)', borderOpacity: 0.75, blur: 24, saturate: 1.6, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.6), 0 24px 70px rgba(120,0,0,0.28), 0 50px 120px rgba(0,0,0,0.42)',
    bgBase: '#0c0404',
    bgOrbs: ['#5a0505', '#240606', '#9a1f12', '#140606'],
    paletteMood: { hueRange: [0, 30], satRange: [58, 88], lightRange: [56, 72], harmony: ['mono', 'analogous'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['luxury', 'condensed', 'editorial'],
    buttonStyles: ['glass-pill', 'editorial-line', 'sharp-rect'],
  },
  Mahogany: {
    cardBg: 'rgba(48,24,14,0.62)', borderOpacity: 0.65, blur: 24, saturate: 1.4, noise: 0.08,
    cardShadow: '0 1px 1px rgba(0,0,0,0.55), 0 24px 70px rgba(70,25,10,0.45), 0 50px 120px rgba(0,0,0,0.34)',
    bgBase: '#20100a',
    bgOrbs: ['#5a2a16', '#36180d', '#7a3a20', '#180c08'],
    paletteMood: { hueRange: [12, 42], satRange: [48, 75], lightRange: [56, 72], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['luxury', 'classic', 'expressive'],
    buttonStyles: ['editorial-line', 'inset-soft', 'outline-pill'],
  },

  // ----- High-fashion monochrome -----
  Noir: {
    cardBg: 'rgba(12,12,12,0.66)', borderOpacity: 0.55, blur: 22, saturate: 1, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.6), 0 24px 70px rgba(0,0,0,0.55), 0 50px 120px rgba(0,0,0,0.42)',
    bgBase: '#050505',
    bgOrbs: ['#202020', '#101010', '#333333', '#080808'],
    paletteMood: { grayscale: true, accentLightRange: [62, 78], grayLightRange: [30, 20, 12], harmony: ['mono'], contrast: 'soft', mode: 'dark' },
    fontMoods: ['luxury', 'editorial', 'swiss'],
    buttonStyles: ['editorial-line', 'outline-rect', 'sharp-rect'],
  },
  Bone: {
    cardBg: 'rgba(252,249,240,0.86)', borderOpacity: 0.45, blur: 10, saturate: 1, noise: 0.04,
    cardShadow: '0 1px 1px rgba(20,18,14,0.04), 0 18px 46px rgba(20,18,14,0.08), 0 36px 88px rgba(20,18,14,0.06)',
    bgBase: '#eee9de',
    bgOrbs: ['#ded8ca', '#faf4e8', '#cbc4b8', '#ffffff'],
    paletteMood: { grayscale: true, accentLightRange: [18, 36], grayLightRange: [98, 91, 80], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['editorial', 'luxury', 'swiss'],
    buttonStyles: ['editorial-line', 'outline-pill', 'outline-rect'],
  },
  Ink: {
    cardBg: 'rgba(8,12,18,0.66)', borderOpacity: 0.6, blur: 22, saturate: 1.1, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.6), 0 24px 70px rgba(0,10,25,0.55), 0 50px 120px rgba(0,0,0,0.42)',
    bgBase: '#04070d',
    bgOrbs: ['#111827', '#0b1220', '#1f2937', '#070a10'],
    paletteMood: { grayscale: true, accentLightRange: [60, 76], grayLightRange: [28, 18, 10], harmony: ['mono'], contrast: 'soft', mode: 'dark' },
    fontMoods: ['editorial', 'swiss', 'minimal'],
    buttonStyles: ['editorial-line', 'outline-rect', 'terminal-block'],
  },
  EditorialBlack: {
    cardBg: 'rgba(18,18,16,0.64)', borderOpacity: 0.65, blur: 20, saturate: 1.05, noise: 0.06,
    cardShadow: '0 1px 1px rgba(0,0,0,0.6), 0 24px 70px rgba(0,0,0,0.55), 0 50px 120px rgba(0,0,0,0.42)',
    bgBase: '#090908',
    bgOrbs: ['#2a2925', '#111110', '#4a4036', '#0d0c0b'],
    paletteMood: { grayscale: true, accentLightRange: [58, 74], grayLightRange: [32, 22, 14], harmony: ['mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['luxury', 'editorial', 'condensed'],
    buttonStyles: ['editorial-line', 'outline-rect', 'brutal-block'],
  },

  // ----- True grayscale -----
  Ash: {
    cardBg: 'rgba(238,238,236,0.78)', borderOpacity: 0.5, blur: 14, saturate: 1, noise: 0.05,
    cardShadow: '0 1px 1px rgba(0,0,0,0.04), 0 18px 46px rgba(0,0,0,0.08), 0 38px 88px rgba(0,0,0,0.06)',
    bgBase: '#dedede',
    bgOrbs: ['#c8c8c8', '#eeeeee', '#b6b6b6', '#f8f8f8'],
    paletteMood: { grayscale: true, accentLightRange: [24, 46], grayLightRange: [96, 88, 76], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['swiss', 'minimal', 'technical'],
    buttonStyles: ['outline-pill', 'inset-soft', 'sharp-rect'],
  },
  Silvergel: {
    cardBg: 'rgba(246,247,248,0.68)', borderOpacity: 0.85, blur: 30, saturate: 1, noise: 0.03,
    cardShadow: '0 1px 1px rgba(0,0,0,0.04), 0 24px 60px rgba(0,0,0,0.09), 0 50px 120px rgba(0,0,0,0.07)',
    bgBase: '#e8e9ea',
    bgOrbs: ['#d7d9dc', '#f5f6f7', '#c3c6ca', '#ffffff'],
    paletteMood: { grayscale: true, accentLightRange: [34, 58], grayLightRange: [98, 91, 82], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['minimal', 'swiss', 'modern'],
    buttonStyles: ['glass-pill', 'outline-pill', 'inset-soft'],
  },
  Charcoal: {
    cardBg: 'rgba(28,28,28,0.66)', borderOpacity: 0.55, blur: 18, saturate: 1, noise: 0.07,
    cardShadow: '0 1px 1px rgba(0,0,0,0.6), 0 24px 70px rgba(0,0,0,0.55), 0 50px 120px rgba(0,0,0,0.4)',
    bgBase: '#101010',
    bgOrbs: ['#2e2e2e', '#1a1a1a', '#3a3a3a', '#080808'],
    paletteMood: { grayscale: true, accentLightRange: [56, 74], grayLightRange: [34, 23, 14], harmony: ['mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['swiss', 'technical', 'minimal'],
    buttonStyles: ['outline-rect', 'brutal-block', 'terminal-block'],
  },
  Paperwhite: {
    cardBg: 'rgba(255,255,252,0.9)', borderOpacity: 0.35, blur: 6, saturate: 1, noise: 0.05,
    cardShadow: '0 1px 1px rgba(0,0,0,0.03), 0 12px 34px rgba(0,0,0,0.06), 0 28px 70px rgba(0,0,0,0.05)',
    bgBase: '#f3f3f0',
    bgOrbs: ['#ffffff', '#eeeeec', '#ddddda', '#f8f8f6'],
    paletteMood: { grayscale: true, accentLightRange: [16, 34], grayLightRange: [99, 94, 84], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['editorial', 'swiss', 'minimal'],
    buttonStyles: ['editorial-line', 'outline-pill', 'outline-rect'],
  },
  Onyx: {
    cardBg: 'rgba(4,4,4,0.72)', borderOpacity: 0.7, blur: 16, saturate: 1, noise: 0.04,
    cardShadow: '0 1px 1px rgba(0,0,0,0.7), 0 24px 70px rgba(0,0,0,0.65), 0 50px 120px rgba(0,0,0,0.5)',
    bgBase: '#000000',
    bgOrbs: ['#181818', '#080808', '#303030', '#000000'],
    paletteMood: { grayscale: true, accentLightRange: [68, 84], grayLightRange: [24, 16, 8], harmony: ['mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['luxury', 'swiss', 'condensed'],
    buttonStyles: ['editorial-line', 'outline-rect', 'glass-pill'],
  },
  Halftone: {
    cardBg: 'rgba(242,242,240,0.82)', borderOpacity: 0.45, blur: 4, saturate: 1, noise: 0.16,
    cardShadow: '6px 6px 0 rgba(0,0,0,0.12), 0 18px 42px rgba(0,0,0,0.08)',
    bgBase: '#e2e2df',
    bgOrbs: ['#d0d0cd', '#f0f0ee', '#b8b8b5', '#ffffff'],
    paletteMood: { grayscale: true, accentLightRange: [18, 40], grayLightRange: [95, 87, 72], harmony: ['mono'], contrast: 'soft' },
    fontMoods: ['condensed', 'swiss', 'editorial'],
    buttonStyles: ['brutal-block', 'editorial-line', 'outline-rect'],
  },

  // ----- 8-bit / Pixel materials (family: 'pixel') -----
  Arcade: {
    family: 'pixel',
    cardBg: 'rgba(255,248,224,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0,
    cardShadow: 'none',
    bgBase: '#5b8dee',
    bgOrbs: ['#ff6b6b', '#ffe066', '#4ecdc4', '#a78bfa'],
    paletteMood: { hueRange: [0, 360], satRange: [80, 100], lightRange: [50, 65], harmony: ['triadic', 'split'], contrast: 'expressive' },
    fontMoods: ['pixel'],
  },
  GameBoy: {
    family: 'pixel',
    cardBg: 'rgba(155,188,15,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0,
    cardShadow: 'none',
    bgBase: '#0f380f',
    bgOrbs: ['#306230', '#8bac0f', '#0f380f', '#306230'],
    paletteMood: { hueRange: [80, 130], satRange: [40, 70], lightRange: [22, 48], harmony: ['mono', 'analogous'], contrast: 'soft' },
    fontMoods: ['pixel'],
  },
  PixelPop: {
    family: 'pixel',
    cardBg: 'rgba(255,245,251,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0,
    cardShadow: 'none',
    bgBase: '#f8c8dc',
    bgOrbs: ['#ff80c0', '#a78bfa', '#80e8ff', '#ffd180'],
    paletteMood: { hueRange: [280, 360], satRange: [70, 95], lightRange: [50, 65], harmony: ['triadic', 'split'], contrast: 'expressive' },
    fontMoods: ['pixel'],
  },

  // ----- Hand-drawn sketch family -----
  Notebook: {
    family: 'hand', style: 'sketch',
    cardBg: 'rgba(248,250,252,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.12,
    cardShadow: '3px 4px 0 rgba(20,40,80,0.08), 8px 12px 24px rgba(20,40,80,0.08)',
    bgBase: '#eef3f8',
    bgOrbs: ['#dbe6f0', '#d4dde8', '#e2eaf2', '#d8e0e8'],
    paletteMood: { hueRange: [200, 240], satRange: [55, 80], lightRange: [40, 55], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['sketch'],
  },
  Sketchpad: {
    family: 'hand', style: 'sketch',
    cardBg: 'rgba(252,247,238,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.16,
    cardShadow: '3px 4px 0 rgba(60,40,20,0.1), 8px 10px 20px rgba(60,40,20,0.08)',
    bgBase: '#f4ead8',
    bgOrbs: ['#e8d8c0', '#f0e0c8', '#e4d0b8', '#ebd9c2'],
    paletteMood: { hueRange: [20, 60], satRange: [40, 65], lightRange: [38, 52], harmony: ['analogous', 'mono'], contrast: 'soft' },
    fontMoods: ['sketch'],
  },
  Doodle: {
    family: 'hand', style: 'sketch',
    cardBg: 'rgba(255,255,255,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.1,
    cardShadow: '5px 5px 0 rgba(0,0,0,0.08), 10px 12px 24px rgba(0,0,0,0.08)',
    bgBase: '#fff5e1',
    bgOrbs: ['#ffe8a8', '#ffd2c8', '#c8e8ff', '#d8f0c8'],
    paletteMood: { hueRange: [0, 360], satRange: [70, 90], lightRange: [48, 62], harmony: ['triadic', 'split'], contrast: 'expressive' },
    fontMoods: ['sketch'],
  },
  Linen: {
    family: 'hand', style: 'sketch',
    cardBg: 'rgba(248,242,232,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.18,
    cardShadow: '2px 3px 0 rgba(80,60,40,0.08), 6px 8px 16px rgba(80,60,40,0.08)',
    bgBase: '#ebe3d0',
    bgOrbs: ['#dccebc', '#e2d4bf', '#d4c8b0', '#e8dcc4'],
    paletteMood: { hueRange: [10, 50], satRange: [30, 55], lightRange: [36, 50], harmony: ['analogous', 'mono'], contrast: 'soft' },
    fontMoods: ['sketch'],
  },
  Graphite: {
    family: 'hand', style: 'sketch',
    cardBg: 'rgba(38,40,46,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.1,
    cardShadow: '3px 4px 0 rgba(0,0,0,0.4), 10px 14px 28px rgba(0,0,0,0.35)',
    bgBase: '#1c1e22',
    bgOrbs: ['#2a2c32', '#252a30', '#30333c', '#1f2226'],
    paletteMood: { hueRange: [200, 260], satRange: [25, 50], lightRange: [55, 70], harmony: ['mono', 'analogous'], contrast: 'soft', mode: 'dark' },
    fontMoods: ['sketch'],
  },
  Watercolor: {
    family: 'hand', style: 'sketch',
    cardBg: 'rgba(252,248,252,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.1,
    cardShadow: '3px 4px 0 rgba(80,60,80,0.06), 8px 12px 24px rgba(80,60,80,0.1)',
    bgBase: '#f3eaef',
    bgOrbs: ['#e8d8e8', '#f0e0d8', '#d8e8f0', '#e8e0e8'],
    paletteMood: { hueRange: [240, 360], satRange: [40, 65], lightRange: [48, 62], harmony: ['analogous', 'split'], contrast: 'soft' },
    fontMoods: ['sketch'],
  },

  // ----- Hand-drawn calligraphic family -----
  Parchment: {
    family: 'hand', style: 'calligraphic',
    cardBg: 'rgba(250,240,218,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.16,
    cardShadow: '0 2px 4px rgba(80,50,20,0.1), 0 14px 36px rgba(80,50,20,0.14)',
    bgBase: '#ecdfbe',
    bgOrbs: ['#e0d0a8', '#d8c898', '#e8d8b0', '#dcccab'],
    paletteMood: { hueRange: [20, 50], satRange: [50, 75], lightRange: [28, 45], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['calligraphic'],
  },
  Inkwell: {
    family: 'hand', style: 'calligraphic',
    cardBg: 'rgba(22,28,46,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.08,
    cardShadow: '0 3px 8px rgba(0,0,0,0.4), 0 18px 44px rgba(0,0,10,0.45)',
    bgBase: '#0d1226',
    bgOrbs: ['#1c2540', '#252a4a', '#1f2238', '#222a48'],
    paletteMood: { hueRange: [30, 60], satRange: [60, 85], lightRange: [58, 72], harmony: ['mono', 'analogous'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['calligraphic'],
  },
  Letterpress: {
    family: 'hand', style: 'calligraphic',
    cardBg: 'rgba(250,246,240,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.12,
    cardShadow: '0 1px 2px rgba(40,30,15,0.06), 0 14px 36px rgba(40,30,15,0.12)',
    bgBase: '#eae3d6',
    bgOrbs: ['#dcd2c0', '#e2d8c8', '#d4cab8', '#e6dcd0'],
    paletteMood: { hueRange: [340, 30], satRange: [40, 70], lightRange: [28, 45], harmony: ['analogous', 'mono'], contrast: 'medium' },
    fontMoods: ['calligraphic'],
  },
  Vellum: {
    family: 'hand', style: 'calligraphic',
    cardBg: 'rgba(252,245,228,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.14,
    cardShadow: '0 2px 6px rgba(100,70,20,0.1), 0 16px 40px rgba(100,70,20,0.14)',
    bgBase: '#efe2c2',
    bgOrbs: ['#e8d4a0', '#dcc890', '#f0e0b8', '#e4d8a8'],
    paletteMood: { hueRange: [30, 70], satRange: [55, 80], lightRange: [32, 48], harmony: ['analogous', 'split'], contrast: 'medium' },
    fontMoods: ['calligraphic'],
  },
  Quill: {
    family: 'hand', style: 'calligraphic',
    cardBg: 'rgba(28,18,28,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.08,
    cardShadow: '0 3px 8px rgba(0,0,0,0.4), 0 18px 44px rgba(20,0,15,0.45)',
    bgBase: '#180d18',
    bgOrbs: ['#3a1e30', '#2a1825', '#321a2a', '#1c1018'],
    paletteMood: { hueRange: [340, 30], satRange: [50, 75], lightRange: [58, 74], harmony: ['analogous', 'mono'], contrast: 'medium', mode: 'dark' },
    fontMoods: ['calligraphic'],
  },
  Manuscript: {
    family: 'hand', style: 'calligraphic',
    cardBg: 'rgba(248,238,222,1)', borderOpacity: 0, blur: 0, saturate: 1, noise: 0.16,
    cardShadow: '0 3px 8px rgba(80,40,30,0.12), 0 16px 40px rgba(80,40,30,0.16)',
    bgBase: '#e8d8b8',
    bgOrbs: ['#d8b888', '#c89878', '#a86848', '#88486a'],
    paletteMood: { hueRange: [350, 60], satRange: [60, 85], lightRange: [25, 42], harmony: ['triadic', 'split'], contrast: 'expressive' },
    fontMoods: ['calligraphic'],
  },
};
const MATERIAL_NAMES = Object.keys(MATERIALS);

// Corner radius per material (applied via --card-radius; family CSS overrides take priority)
const MATERIAL_CARD_RADIUS = {
  Chrome: '32px', Frost: '40px', Pearl: '28px', Mist: '44px', Prism: '32px',
  Porcelain: '36px', Aurora: '28px', Quartz: '36px', Sunstone: '32px', Lagoon: '44px',
  Nebula: '36px', Sage: '28px',
  Gold: '32px', Copper: '28px', Platinum: '40px', Brass: '28px', Bronze: '32px',
  Obsidian: '28px', Midnight: '32px', Carbon: '24px', Eclipse: '36px', Forest: '28px',
  Espresso: '24px', Slate: '32px',
  Ivory: '22px', Newsprint: '10px', Gallery: '20px', Runway: '12px',
  Sterile: '24px', Blueprint: '10px', Diagnostic: '24px', Instrument: '12px',
  Neon: '22px', Afterhours: '28px', Synthwave: '22px', Laser: '8px',
  Clay: '26px', Moss: '28px', Terracotta: '24px', Basalt: '18px', Olive: '24px',
  Bubblegum: '30px', Sorbet: '30px', Confetti: '24px', Gelato: '30px',
  Concrete: '4px', Terminal: '4px', Wireframe: '2px', Mono: '8px',
  Velvet: '24px', Burgundy: '22px', Lacquer: '18px', Mahogany: '20px',
  Noir: '8px', Bone: '12px', Ink: '10px', EditorialBlack: '6px',
  Ash: '16px', Silvergel: '34px', Charcoal: '14px', Paperwhite: '6px',
  Onyx: '10px', Halftone: '2px',
  Arcade: '6px', GameBoy: '6px', PixelPop: '6px',
  Notebook: '18px', Sketchpad: '18px', Doodle: '18px', Linen: '18px',
  Graphite: '18px', Watercolor: '18px',
  Parchment: '8px', Inkwell: '8px', Letterpress: '8px', Vellum: '8px',
  Quill: '8px', Manuscript: '8px',
};

// Stroke (border ring) tint color per material — light materials use white-ish tints,
// dark materials use a lighter desaturated color so the ring is visible against the bg
const MATERIAL_BORDER_COLOR = {
  Chrome: '#e8f0ff', Frost: '#ddf0f8', Pearl: '#ffe8e4', Mist: '#dce8f4', Prism: '#ead8ff',
  Porcelain: '#ffffff', Aurora: '#c8f0e8', Quartz: '#ead8ff', Sunstone: '#fff4e0',
  Lagoon: '#c8e8f4', Nebula: '#d8d0ff', Sage: '#d0e8d0',
  Gold: '#fff4c0', Copper: '#ffe8d0', Platinum: '#eef0f8', Brass: '#f0e0a0', Bronze: '#f4ddb0',
  Obsidian: '#7080b0', Midnight: '#6070b8', Carbon: '#606070', Eclipse: '#9070c8',
  Forest: '#507068', Espresso: '#806040', Slate: '#6070a0',
  Ivory: '#fff7e8', Newsprint: '#d8d0c0', Gallery: '#ffffff', Runway: '#b89a82',
  Sterile: '#e4f8ff', Blueprint: '#8fc8ff', Diagnostic: '#b8f4e8', Instrument: '#dce4e8',
  Neon: '#00f5ff', Afterhours: '#7a58ff', Synthwave: '#ff5fc8', Laser: '#39ff14',
  Clay: '#e8c4a8', Moss: '#c6d8a8', Terracotta: '#f0b090', Basalt: '#787870', Olive: '#d8d09a',
  Bubblegum: '#ffd6ee', Sorbet: '#ffe4c4', Confetti: '#ffffff', Gelato: '#d8f4e8',
  Concrete: '#2a2a28', Terminal: '#46ff7a', Wireframe: '#111111', Mono: '#111111',
  Velvet: '#a85880', Burgundy: '#a84858', Lacquer: '#c83024', Mahogany: '#a86a40',
  Noir: '#f5f5f0', Bone: '#f8f0e0', Ink: '#d8e4f0', EditorialBlack: '#d8c2a8',
  Ash: '#f4f4f4', Silvergel: '#ffffff', Charcoal: '#d8d8d8', Paperwhite: '#ffffff',
  Onyx: '#f0f0f0', Halftone: '#111111',
  Arcade: '#ffffff', GameBoy: '#ffffff', PixelPop: '#ffffff',
  Notebook: '#ffffff', Sketchpad: '#ffffff', Doodle: '#ffffff', Linen: '#ffffff',
  Graphite: '#ffffff', Watercolor: '#ffffff',
  Parchment: '#ffffff', Inkwell: '#ffffff', Letterpress: '#ffffff', Vellum: '#ffffff',
  Quill: '#ffffff', Manuscript: '#ffffff',
};

// Page styles only alter presentation of existing material background colors.
const PAGE_STYLES = [
  {
    name: 'aurora-blur',
    bg: (m) => `
      radial-gradient(circle at 8% 8%, ${m.bgOrbs[0]} 0, transparent 34vw),
      radial-gradient(circle at 92% 18%, ${m.bgOrbs[1]} 0, transparent 30vw),
      radial-gradient(circle at 88% 92%, ${m.bgOrbs[2]} 0, transparent 36vw),
      radial-gradient(circle at 18% 94%, ${m.bgOrbs[3]} 0, transparent 28vw),
      ${m.bgBase}`,
    overlay: () => 'linear-gradient(180deg, transparent, rgba(255,255,255,0.18) 80%)',
    overlayOpacity: '1',
    overlayBlend: 'normal',
    orbFilter: 'blur(110px)',
    orbOpacity: '0.85',
    orbScale: [1, 1, 1, 1],
  },
  {
    name: 'solid-field',
    bg: (m) => m.bgBase,
    overlay: () => 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 55%, rgba(0,0,0,0.04))',
    overlayOpacity: '0.55',
    overlayBlend: 'normal',
    orbFilter: 'blur(90px)',
    orbOpacity: '0',
    orbScale: [0.7, 0.7, 0.7, 0.7],
  },
  {
    name: 'soft-corner-wash',
    bg: (m) => `
      linear-gradient(135deg, color-mix(in srgb, ${m.bgOrbs[0]} 28%, ${m.bgBase}) 0%, ${m.bgBase} 48%, color-mix(in srgb, ${m.bgOrbs[2]} 24%, ${m.bgBase}) 100%)`,
    overlay: () => 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.24), transparent 58%)',
    overlayOpacity: '0.8',
    overlayBlend: 'soft-light',
    orbFilter: 'blur(135px)',
    orbOpacity: '0.32',
    orbScale: [1.15, 0.85, 1.05, 0.75],
  },
  {
    name: 'mesh-gradient',
    bg: (m) => `
      radial-gradient(circle at 20% 20%, ${m.bgOrbs[0]} 0, transparent 30%),
      radial-gradient(circle at 82% 18%, ${m.bgOrbs[1]} 0, transparent 28%),
      radial-gradient(circle at 75% 82%, ${m.bgOrbs[2]} 0, transparent 34%),
      linear-gradient(135deg, ${m.bgBase}, color-mix(in srgb, ${m.bgOrbs[3]} 24%, ${m.bgBase}))`,
    overlay: () => 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02))',
    overlayOpacity: '0.75',
    overlayBlend: 'normal',
    orbFilter: 'blur(80px)',
    orbOpacity: '0.42',
    orbScale: [0.75, 0.65, 0.85, 0.6],
  },
  {
    name: 'paper-texture',
    bg: (m) => m.bgBase,
    overlay: (m) => `
      radial-gradient(circle at 25% 20%, color-mix(in srgb, ${m.bgOrbs[0]} ${m.paletteMood.mode === 'dark' ? 26 : 18}%, transparent), transparent 34%),
      radial-gradient(circle at 80% 75%, color-mix(in srgb, ${m.bgOrbs[2]} ${m.paletteMood.mode === 'dark' ? 22 : 14}%, transparent), transparent 36%),
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.26 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
    overlayOpacity: (m) => m.paletteMood.mode === 'dark' ? '0.62' : '0.5',
    overlayBlend: (m) => m.paletteMood.mode === 'dark' ? 'screen' : 'multiply',
    orbFilter: 'blur(120px)',
    orbOpacity: '0.14',
    orbScale: [0.9, 0.7, 0.8, 0.65],
  },
  {
    name: 'fine-grid',
    bg: (m) => `
      linear-gradient(135deg, ${m.bgBase}, color-mix(in srgb, ${m.bgOrbs[1]} 12%, ${m.bgBase}))`,
    overlay: (m) => `
      linear-gradient(color-mix(in srgb, ${m.bgOrbs[0]} ${m.paletteMood.mode === 'dark' ? 38 : 18}%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, ${m.bgOrbs[2]} ${m.paletteMood.mode === 'dark' ? 32 : 16}%, transparent) 1px, transparent 1px)`,
    overlayOpacity: (m) => m.paletteMood.mode === 'dark' ? '0.54' : '0.42',
    overlayBlend: (m) => m.paletteMood.mode === 'dark' ? 'screen' : 'multiply',
    orbFilter: 'blur(100px)',
    orbOpacity: '0.18',
    orbScale: [0.8, 0.8, 0.8, 0.8],
    overlaySize: '28px 28px',
  },
  {
    name: 'dot-grid',
    bg: (m) => `
      linear-gradient(135deg, ${m.bgBase}, color-mix(in srgb, ${m.bgOrbs[1]} 10%, ${m.bgBase}))`,
    overlay: (m) => `
      radial-gradient(circle, color-mix(in srgb, ${m.bgOrbs[0]} ${m.paletteMood.mode === 'dark' ? 48 : 28}%, ${m.paletteMood.mode === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)'}) 1px, transparent 1.5px)`,
    overlayOpacity: (m) => m.paletteMood.mode === 'dark' ? '0.5' : '0.42',
    overlayBlend: (m) => m.paletteMood.mode === 'dark' ? 'screen' : 'multiply',
    orbFilter: 'blur(115px)',
    orbOpacity: '0.18',
    orbScale: [0.8, 0.65, 0.75, 0.55],
    overlaySize: '18px 18px',
  },
  {
    name: 'spotlight',
    bg: (m) => `
      radial-gradient(circle at 50% 42%, color-mix(in srgb, ${m.bgOrbs[0]} 34%, ${m.bgBase}) 0, ${m.bgBase} 48%, color-mix(in srgb, #000 8%, ${m.bgBase}) 100%)`,
    overlay: () => 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.34), transparent 42%)',
    overlayOpacity: '0.72',
    overlayBlend: 'soft-light',
    orbFilter: 'blur(160px)',
    orbOpacity: '0.16',
    orbScale: [1.4, 0.5, 0.7, 0.5],
  },
  {
    name: 'quiet-vignette',
    bg: (m) => m.bgBase,
    overlay: () => `
      radial-gradient(circle at 50% 45%, transparent 0, transparent 44%, rgba(0,0,0,0.12) 100%),
      linear-gradient(180deg, rgba(255,255,255,0.1), transparent 55%)`,
    overlayOpacity: '0.7',
    overlayBlend: 'normal',
    orbFilter: 'blur(150px)',
    orbOpacity: '0.22',
    orbScale: [1, 0.55, 0.9, 0.5],
  },
];

const DEFAULT_PAGE_STYLE = PAGE_STYLES[0];

// Family group used to restrict scope-aware regen to compatible materials
function getFamilyGroup(mat) {
  if (!mat) return 'generic';
  if (mat.family === 'pixel') return 'pixel';
  if (mat.family === 'hand' && mat.style === 'calligraphic') return 'hand-calligraphic';
  if (mat.family === 'hand') return 'hand-sketch';
  return 'generic';
}

// Merge: take color-surface props from colorMat, keep structural props from prevMat
function mergeColorFrom(colorMat, prevMat) {
  if (!prevMat) return colorMat;
  return {
    name: colorMat.name,
    cardBg: colorMat.cardBg,
    bgBase: colorMat.bgBase,
    bgOrbs: colorMat.bgOrbs,
    borderColor: colorMat.borderColor,
    paletteMood: colorMat.paletteMood,
    fontMoods: colorMat.fontMoods,
    cardShadow: colorMat.cardShadow,
    cardRadius: prevMat.cardRadius,
    blur: prevMat.blur,
    saturate: prevMat.saturate,
    noise: prevMat.noise,
    borderOpacity: prevMat.borderOpacity,
    family: prevMat.family,
    style: prevMat.style,
  };
}

// ----------------------------- button styles -----------------------------
const BUTTON_STYLES = [
  {
    name: 'pill',
    radius: '999px',
    primaryGrad: (a, b, c) => `linear-gradient(135deg, ${a} 0%, ${mix(a, b, 0.6)} 100%)`,
    secondaryGrad: (g1, g2) => `linear-gradient(180deg, ${g1} 0%, ${g2} 100%)`,
    primaryShadow: (a) => `0 8px 22px ${a}55, 0 1px 0 rgba(255,255,255,0.45) inset`,
    secondaryShadow: '0 1px 2px rgba(15,18,25,0.06), 0 6px 18px rgba(15,18,25,0.06)',
    tertiaryBorder: (a) => `1.5px solid ${a}55`,
    tertiaryShadow: 'none',
  },
  {
    name: 'rounded-rect',
    radius: '14px',
    primaryGrad: (a, b) => `linear-gradient(180deg, ${a} 0%, ${mix(a, b, 0.4)} 100%)`,
    secondaryGrad: (g1, g2, g3) => `linear-gradient(180deg, ${g1} 0%, ${g2} 100%)`,
    primaryShadow: (a) => `0 4px 14px ${a}40, 0 1px 0 rgba(255,255,255,0.35) inset`,
    secondaryShadow: '0 1px 2px rgba(15,18,25,0.05), 0 3px 10px rgba(15,18,25,0.05)',
    tertiaryBorder: (a) => `1.5px solid ${a}66`,
    tertiaryShadow: '0 1px 2px rgba(15,18,25,0.03)',
  },
  {
    name: 'soft-rect',
    radius: '20px',
    primaryGrad: (a, b, c) => `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
    secondaryGrad: (g1, g2) => `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
    primaryShadow: (a) => `0 12px 28px ${a}3a, 0 0 0 1px rgba(255,255,255,0.25) inset`,
    secondaryShadow: '0 6px 20px rgba(15,18,25,0.06)',
    tertiaryBorder: (a) => `1px solid ${a}40`,
    tertiaryShadow: '0 1px 2px rgba(15,18,25,0.03)',
  },
  {
    name: 'flat-pill',
    radius: '999px',
    primaryGrad: (a) => a,
    secondaryGrad: (g1, g2) => g2,
    primaryShadow: (a) => `0 1px 0 rgba(255,255,255,0.35) inset, 0 6px 16px ${a}30`,
    secondaryShadow: '0 1px 2px rgba(15,18,25,0.04)',
    tertiaryBorder: (a) => `2px solid ${a}`,
    tertiaryShadow: 'none',
  },
  {
    name: 'duotone-pill',
    radius: '999px',
    primaryGrad: (a, b, c) => `linear-gradient(110deg, ${a} 0%, ${c || b} 100%)`,
    secondaryGrad: (g1, g2, g3) => `linear-gradient(110deg, ${g1} 0%, ${g3} 100%)`,
    primaryShadow: (a, b) => `0 8px 22px ${a}40, 0 4px 12px ${(b || a)}30, 0 1px 0 rgba(255,255,255,0.4) inset`,
    secondaryShadow: '0 1px 2px rgba(15,18,25,0.06), 0 8px 18px rgba(15,18,25,0.05)',
    tertiaryBorder: (a) => `1.5px dashed ${a}66`,
    tertiaryShadow: 'none',
  },
  {
    name: 'sharp-rect',
    radius: '8px',
    primaryGrad: (a, b) => `linear-gradient(180deg, ${a} 0%, ${mix(a, b, 0.3)} 100%)`,
    secondaryGrad: (g1, g2) => `linear-gradient(180deg, #ffffff 0%, ${g2} 100%)`,
    primaryShadow: (a) => `0 2px 0 ${mix(a, '#000000', 0.25)}, 0 4px 10px ${a}30`,
    secondaryShadow: '0 1px 0 rgba(15,18,25,0.06), 0 2px 6px rgba(15,18,25,0.04)',
    tertiaryBorder: (a) => `1.5px solid ${a}80`,
    tertiaryShadow: 'none',
  },
  {
    name: 'brutal-block',
    radius: '2px',
    primaryGrad: (a) => a,
    secondaryGrad: (g1) => g1,
    primaryShadow: (a) => `5px 5px 0 ${mix(a, '#000000', 0.68)}, 0 0 0 2px rgba(0,0,0,0.85)`,
    secondaryShadow: '5px 5px 0 rgba(0,0,0,0.22), 0 0 0 2px rgba(0,0,0,0.75)',
    tertiaryBorder: (a) => `2px solid ${mix(a, '#000000', 0.35)}`,
    tertiaryShadow: '4px 4px 0 rgba(0,0,0,0.18)',
  },
  {
    name: 'outline-pill',
    radius: '999px',
    primaryGrad: (a, b) => `linear-gradient(180deg, ${a} 0%, ${mix(a, b, 0.18)} 100%)`,
    secondaryGrad: (g1, g2) => `linear-gradient(180deg, ${g1} 0%, ${g2} 100%)`,
    primaryShadow: (a) => `0 0 0 2px ${a}, 0 8px 18px ${a}24`,
    secondaryShadow: '0 0 0 1.5px rgba(15,18,25,0.12), 0 6px 16px rgba(15,18,25,0.04)',
    tertiaryBorder: (a) => `1.5px solid ${a}`,
    tertiaryShadow: 'none',
  },
  {
    name: 'outline-rect',
    radius: '8px',
    primaryGrad: (a, b) => `linear-gradient(180deg, ${a} 0%, ${mix(a, b, 0.18)} 100%)`,
    secondaryGrad: (g1, g2) => g1,
    primaryShadow: (a) => `0 0 0 2px ${a}, 0 6px 14px ${a}22`,
    secondaryShadow: '0 0 0 1.5px rgba(15,18,25,0.16)',
    tertiaryBorder: (a) => `1.5px solid ${a}`,
    tertiaryShadow: 'none',
  },
  {
    name: 'glass-pill',
    radius: '999px',
    primaryGrad: (a, b, c) => `linear-gradient(135deg, ${a}aa 0%, ${(c || b)}66 100%)`,
    secondaryGrad: (g1, g2, g3) => `linear-gradient(135deg, ${g1}cc 0%, ${g2}88 100%)`,
    primaryShadow: (a) => `0 10px 26px ${a}36, 0 1px 0 rgba(255,255,255,0.55) inset, 0 0 0 1px rgba(255,255,255,0.28) inset`,
    secondaryShadow: '0 8px 22px rgba(15,18,25,0.08), 0 1px 0 rgba(255,255,255,0.55) inset, 0 0 0 1px rgba(255,255,255,0.25) inset',
    tertiaryBorder: (a) => `1px solid ${a}88`,
    tertiaryShadow: '0 6px 16px rgba(15,18,25,0.05)',
  },
  {
    name: 'editorial-line',
    radius: '2px',
    primaryGrad: (a) => `linear-gradient(180deg, ${a} 0%, ${mix(a, '#000000', 0.18)} 100%)`,
    secondaryGrad: (g1) => g1,
    primaryShadow: (a) => `0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px ${mix(a, '#000000', 0.25)}`,
    secondaryShadow: '0 0 0 1px rgba(15,18,25,0.14)',
    tertiaryBorder: (a) => `1px solid ${a}`,
    tertiaryShadow: 'none',
  },
  {
    name: 'inset-soft',
    radius: '18px',
    primaryGrad: (a, b) => `linear-gradient(145deg, ${mix(a, '#ffffff', 0.18)} 0%, ${a} 100%)`,
    secondaryGrad: (g1, g2) => `linear-gradient(145deg, ${g1} 0%, ${g2} 100%)`,
    primaryShadow: (a) => `0 10px 24px ${a}28, 0 2px 5px rgba(255,255,255,0.35) inset, 0 -4px 8px rgba(0,0,0,0.12) inset`,
    secondaryShadow: '0 8px 20px rgba(15,18,25,0.06), 0 2px 5px rgba(255,255,255,0.65) inset, 0 -4px 8px rgba(15,18,25,0.08) inset',
    tertiaryBorder: (a) => `1px solid ${a}55`,
    tertiaryShadow: '0 2px 5px rgba(255,255,255,0.35) inset',
  },
  {
    name: 'radial-glow',
    radius: '18px',
    primaryGrad: (a, b, c) => `
      radial-gradient(ellipse 145% 118% at 50% 40%, ${mix(a, '#ffffff', 0.1)} 0%, ${mix(a, '#ffffff', 0.055)} 22%, ${mix(a, '#000000', 0.06)} 54%, transparent 88%),
      radial-gradient(ellipse 135% 118% at 50% 124%, ${mix(a, '#000000', 0.42)} 0%, ${mix(a, '#000000', 0.22)} 48%, transparent 84%),
      linear-gradient(180deg, ${mix(a, b || a, 0.08)} 0%, ${mix(a, '#000000', 0.12)} 58%, ${mix(a, '#000000', 0.34)} 100%)`,
    secondaryGrad: (g1, g2, g3) => `
      radial-gradient(ellipse 145% 118% at 50% 40%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 26%, rgba(15,18,25,0.035) 56%, transparent 88%),
      radial-gradient(ellipse 135% 118% at 50% 124%, rgba(15,18,25,0.16) 0%, rgba(15,18,25,0.08) 48%, transparent 84%),
      linear-gradient(180deg, ${g1} 0%, ${g2} 60%, ${g3} 100%)`,
    primaryShadow: (a) => `0 9px 24px ${a}2e, 0 1px 0 rgba(255,255,255,0.24) inset, 0 -9px 20px rgba(0,0,0,0.12) inset`,
    secondaryShadow: '0 8px 20px rgba(15,18,25,0.06), 0 1px 0 rgba(255,255,255,0.48) inset, 0 -8px 18px rgba(15,18,25,0.07) inset',
    tertiaryBorder: (a) => `1px solid ${a}66`,
    tertiaryShadow: '0 1px 2px rgba(15,18,25,0.04)',
  },
  {
    name: 'terminal-block',
    radius: '0px',
    primaryGrad: (a) => a,
    secondaryGrad: (g1, g2) => g2,
    primaryShadow: (a) => `0 0 0 1px ${a}, 0 0 18px ${a}44`,
    secondaryShadow: '0 0 0 1px rgba(100,255,160,0.28)',
    tertiaryBorder: (a) => `1px solid ${a}`,
    tertiaryShadow: '0 0 14px rgba(100,255,160,0.18)',
  },
  {
    // Used exclusively by family: 'pixel' materials. Hard-edged, solid fills,
    // chunky offset shadow (no blur) — that classic 8-bit button feel.
    name: 'arcade-block',
    radius: '4px',
    primaryGrad: (a) => a,
    secondaryGrad: (g1) => g1,
    primaryShadow: (a) => `4px 4px 0 ${mix(a, '#000000', 0.55)}`,
    secondaryShadow: '4px 4px 0 rgba(0,0,0,0.35)',
    tertiaryBorder: (a) => `3px solid ${a}`,
    tertiaryShadow: '4px 4px 0 rgba(0,0,0,0.25)',
  },
  {
    // family: 'hand' + style: 'sketch' — solid marker fills, dashed tertiary
    // outline, small hand-drawn ink offset.
    name: 'hand-sketch',
    radius: '14px',
    primaryGrad: (a) => a,
    secondaryGrad: (g1) => g1,
    primaryShadow: (a) => `2px 3px 0 ${mix(a, '#000000', 0.4)}`,
    secondaryShadow: '2px 3px 0 rgba(0,0,0,0.12)',
    tertiaryBorder: (a) => `2px dashed ${a}`,
    tertiaryShadow: 'none',
  },
  {
    // family: 'hand' + style: 'calligraphic' — restrained, refined fill,
    // hairline tertiary border, soft elegant shadow.
    name: 'hand-calligraphic',
    radius: '6px',
    primaryGrad: (a, b) => `linear-gradient(180deg, ${a} 0%, ${mix(a, b, 0.3)} 100%)`,
    secondaryGrad: (g1, g2) => `linear-gradient(180deg, ${g1} 0%, ${g2} 100%)`,
    primaryShadow: (a) => `0 2px 4px ${a}30, 0 6px 14px ${a}25`,
    secondaryShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)',
    tertiaryBorder: (a) => `1px solid ${a}`,
    tertiaryShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
];

// ----------------------------- non-repetition history -----------------------------
const HISTORY_LIMIT = 6;
const history = {
  font: [], material: [], palette: [], button: [], page: [], full: []
};
const remember = (key, value) => {
  history[key].push(value);
  if (history[key].length > HISTORY_LIMIT) history[key].shift();
};
const isRecent = (key, value) => history[key].includes(value);

// Pick from a pool, avoiding recent values. Falls back when pool is exhausted.
const pickFresh = (pool, key, identityFn = (x) => x) => {
  const fresh = pool.filter((x) => !isRecent(key, identityFn(x)));
  if (fresh.length === 0) {
    // Reshuffle: drop oldest entries
    history[key] = history[key].slice(-2);
    return choice(pool);
  }
  return choice(fresh);
};

// ----------------------------- generation pieces -----------------------------
function pickMaterial() {
  const name = pickFresh(MATERIAL_NAMES, 'material');
  remember('material', name);
  return {
    name,
    ...MATERIALS[name],
    cardRadius: MATERIAL_CARD_RADIUS[name] || '32px',
    borderColor: MATERIAL_BORDER_COLOR[name] || '#ffffff',
  };
}

function pickFontPair(materialFontMoods) {
  // Some moods (pixel/sketch/calligraphic) are exclusive families — pairs
  // with that mood only show up for materials asking for that mood, and a
  // material asking for an exclusive mood only sees pairs with that mood.
  const wantedExclusive = materialFontMoods.find((m) => EXCLUSIVE_MOODS.has(m));
  const candidates = FONT_PAIRS.filter((p) => {
    const pairExclusive = EXCLUSIVE_MOODS.has(p.mood);
    if (wantedExclusive) return p.mood === wantedExclusive;
    return !pairExclusive;
  });

  const entries = candidates.map((p) => {
    const matches = materialFontMoods.includes(p.mood);
    const id = `${p.sans}|${p.serif}`;
    const recent = isRecent('font', id);
    let w = matches ? 3 : 1;
    if (recent) w *= 0.05;
    return [p, w];
  });
  let pair = choiceWeighted(entries);
  // safety: avoid same as last
  if (history.font.length && `${pair.sans}|${pair.serif}` === history.font[history.font.length - 1]) {
    pair = choiceWeighted(entries.filter(([p]) => `${p.sans}|${p.serif}` !== history.font[history.font.length - 1])) || pair;
  }
  remember('font', `${pair.sans}|${pair.serif}`);
  return pair;
}

function genPalette(material) {
  const mood = material.paletteMood;
  const isDark = mood.mode === 'dark';

  if (mood.grayscale) {
    const toGray = (light) => hslToHex(0, 0, clamp(light, 0, 100));
    const [minAccent, maxAccent] = mood.accentLightRange || (isDark ? [58, 76] : [18, 42]);
    const base = randi(minAccent, maxAccent);
    const palette = [
      toGray(base),
      toGray(base + randi(isDark ? 8 : 10, isDark ? 18 : 20)),
      toGray(base + randi(isDark ? -18 : -16, isDark ? -8 : -6)),
    ].sort((a, b) => luminance(a) - luminance(b));
    if (isDark) palette.reverse();

    const grayStops = mood.grayLightRange || (isDark ? [32, 22, 14] : [97, 91, 83]);
    const grays = grayStops.map(toGray);
    const inkStrong = toGray(isDark ? 92 : 12);
    const inkMute = toGray(isDark ? 68 : 38);

    return {
      palette,
      grays,
      inkStrong, inkMute,
      accent: palette[0],
      harmony: 'grayscale',
      mode: isDark ? 'dark' : 'light',
      seed: `grayscale|${palette[0]}|${palette[1]}|${palette[2]}`,
    };
  }

  const harmony = choice(mood.harmony);
  const baseHue = randi(mood.hueRange[0], mood.hueRange[1]);
  const baseSat = randi(mood.satRange[0], mood.satRange[1]);
  const baseLight = randi(mood.lightRange[0], mood.lightRange[1]);

  let h1, h2, h3;
  switch (harmony) {
    case 'mono':
      h1 = baseHue;
      h2 = baseHue + randi(-8, 8);
      h3 = baseHue + randi(-12, 12);
      break;
    case 'analogous':
      h1 = baseHue;
      h2 = baseHue + randi(20, 40);
      h3 = baseHue - randi(20, 40);
      break;
    case 'triadic':
      h1 = baseHue;
      h2 = (baseHue + 120 + randi(-10, 10)) % 360;
      h3 = (baseHue + 240 + randi(-10, 10)) % 360;
      break;
    case 'split':
      h1 = baseHue;
      h2 = (baseHue + 150 + randi(-10, 10)) % 360;
      h3 = (baseHue + 210 + randi(-10, 10)) % 360;
      break;
    default:
      h1 = baseHue; h2 = baseHue + 30; h3 = baseHue - 30;
  }
  const wrap = (x) => ((x % 360) + 360) % 360;

  const satJitter = () => randi(-10, 10);
  const lightJitter = () => randi(-6, 6);

  // Palette accents — light mode caps at 65L, dark mode bumps brighter to pop on dark bg
  const lMin = isDark ? 50 : 38;
  const lMax = isDark ? 75 : 65;
  const c1 = hslToHex(wrap(h1), clamp(baseSat + satJitter(), 30, 90), clamp(baseLight + lightJitter(), lMin, lMax));
  const c2 = hslToHex(wrap(h2), clamp(baseSat + satJitter(), 30, 90), clamp(baseLight + lightJitter(), lMin, lMax));
  const c3 = hslToHex(wrap(h3), clamp(baseSat + satJitter(), 30, 90), clamp(baseLight + lightJitter(), lMin, lMax));

  // Grayscale + ink invert based on mode (dark themes: dark grays + light ink)
  const grayHue = wrap(h1);
  const graySat = clamp(Math.round(baseSat * 0.12), 0, 12);

  let g1, g2, g3, inkStrong, inkMute;
  if (isDark) {
    g1 = hslToHex(grayHue, graySat + 4, 32);
    g2 = hslToHex(grayHue, graySat + 4, 22);
    g3 = hslToHex(grayHue, graySat + 4, 14);
    inkStrong = hslToHex(grayHue, clamp(graySat + 6, 4, 18), 92);
    inkMute   = hslToHex(grayHue, clamp(graySat + 6, 4, 18), 65);
  } else {
    g1 = hslToHex(grayHue, graySat, 97);
    g2 = hslToHex(grayHue, graySat, 91);
    g3 = hslToHex(grayHue, graySat, 83);
    inkStrong = hslToHex(grayHue, clamp(graySat + 12, 8, 28), 14);
    inkMute   = hslToHex(grayHue, clamp(graySat + 10, 8, 26), 38);
  }

  return {
    palette: [c1, c2, c3],
    grays: [g1, g2, g3],
    inkStrong, inkMute,
    accent: c1,
    harmony,
    mode: isDark ? 'dark' : 'light',
    seed: `${harmony}|${c1}|${c2}|${c3}`,
  };
}

// Button styles locked to a family (or family + style). Every other material
// picks from the remaining "general" pool.
const FAMILY_BUTTON_STYLES = new Set(['arcade-block', 'hand-sketch', 'hand-calligraphic']);

function pickButtonStyle(material) {
  if (material) {
    if (material.family === 'pixel') return BUTTON_STYLES.find((s) => s.name === 'arcade-block');
    if (material.family === 'hand') {
      const target = material.style === 'sketch' ? 'hand-sketch' : 'hand-calligraphic';
      return BUTTON_STYLES.find((s) => s.name === target);
    }
    if (Array.isArray(material.buttonStyles) && material.buttonStyles.length) {
      const pool = material.buttonStyles.filter((name) => BUTTON_STYLES.some((s) => s.name === name));
      if (pool.length) {
        const name = pickFresh(pool, 'button');
        remember('button', name);
        return BUTTON_STYLES.find((s) => s.name === name);
      }
    }
  }
  const pool = BUTTON_STYLES.filter((s) => !FAMILY_BUTTON_STYLES.has(s.name)).map((s) => s.name);
  const name = pickFresh(pool, 'button');
  remember('button', name);
  return BUTTON_STYLES.find((s) => s.name === name);
}

function pickPageStyle() {
  const name = pickFresh(PAGE_STYLES.map((s) => s.name), 'page');
  remember('page', name);
  return PAGE_STYLES.find((s) => s.name === name) || DEFAULT_PAGE_STYLE;
}

// ----------------------------- application -----------------------------
const state = {
  mode: 'create',
  scope: 'all',
  theme: null,
  saved: [],
  savedEdit: null,
};

const ui = {
  card: $('#card'),
  subhead: $('#subhead'),
  swatches: $$('.swatch'),
  starBtn: $('#starBtn'),
  shareBtn: $('#shareBtn'),
  regenBtn: $('#regenBtn'),
  topSeg: $('.segmented--top'),
  scopeSeg: $('.segmented--scope'),
  shareSheet: $('#shareSheet'),
  toast: $('#toast'),
  fontLink: $('#font-link'),
  createView: $('#createView'),
  savedView: $('#savedView'),
  snapStack: $('#snapStack'),
  savedEmpty: $('#savedEmpty'),
  savedEditBtn: $('#savedEditBtn'),
  savedCount: $('#savedCount'),
  controls: $('#controls'),
};

// ---- font loading (cumulative, only request weights that exist) ----
// Map<fontName, Set<weight>>. Some fonts (Press Start 2P, VT323) only ship
// a single weight on Google Fonts — requesting unavailable weights returns
// a 400 from the API and the font silently fails to load.
const loadedFontWeights = new Map();
function ensureFontsLoaded(pair) {
  let dirty = false;
  // pair may be an old saved-theme font object that lacks `sw`. Fall back
  // to its single sansWeight so we still request something valid.
  const available = pair.sw || (pair.sansWeight ? [pair.sansWeight] : [400]);
  const sansWeights = [...new Set([400, ...available])];
  if (!loadedFontWeights.has(pair.sans)) loadedFontWeights.set(pair.sans, new Set());
  const sansSet = loadedFontWeights.get(pair.sans);
  for (const w of sansWeights) {
    if (!sansSet.has(w)) { sansSet.add(w); dirty = true; }
  }
  if (!dirty) return;

  const families = Array.from(loadedFontWeights.entries()).map(([name, weights]) => {
    const family = name.replace(/ /g, '+');
    const sorted = Array.from(weights).sort((a, b) => a - b).join(';');
    return `family=${family}:wght@${sorted}`;
  });
  ui.fontLink.href = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

// ---- apply theme to DOM ----
function applyTheme(theme, opts = {}) {
  const root = document.documentElement.style;
  const m = theme.material;
  const f = theme.font;
  const c = theme.colors;
  const b = theme.button;
  const p = theme.page || DEFAULT_PAGE_STYLE;

  if (opts.applyFont !== false) {
    ensureFontsLoaded(f);
    root.setProperty('--font-sans', `'${f.sans}', system-ui, -apple-system, sans-serif`);
    root.setProperty('--font-serif', `'${f.serif}', Georgia, serif`);
    root.setProperty('--sans-weight', String(f.sansWeight));
    root.setProperty('--serif-weight', String(f.serifWeight));
    root.setProperty('--sans-size', f.scale.sansSize);
    root.setProperty('--serif-size', f.scale.serifSize);
    root.setProperty('--sans-tracking', f.scale.sansTrack);
    root.setProperty('--serif-tracking', f.scale.serifTrack);
    ui.subhead.textContent = f.sans;
  }

  if (opts.applyColors !== false) {
    root.setProperty('--p1', c.palette[0]);
    root.setProperty('--p2', c.palette[1]);
    root.setProperty('--p3', c.palette[2]);
    root.setProperty('--g1', c.grays[0]);
    root.setProperty('--g2', c.grays[1]);
    root.setProperty('--g3', c.grays[2]);
    root.setProperty('--ink-strong', c.inkStrong);
    root.setProperty('--ink-mute', c.inkMute);
    root.setProperty('--accent', c.accent);
    ui.swatches.forEach((el) => {
      const role = el.dataset.role;
      const i = +el.dataset.i;
      const hex = role === 'palette' ? c.palette[i] : c.grays[i];
      el.style.background = hex;
      el.querySelector('.swatch-hex').textContent = hex;
    });
  }

  if (opts.applyButtons !== false) {
    const [a, bb, ccc] = c.palette;
    const [, g2, g3] = c.grays;
    root.setProperty('--btn-radius', b.radius);
    root.setProperty('--btn-primary-bg', b.primaryGrad(a, bb, ccc));
    root.setProperty('--btn-secondary-bg', b.secondaryGrad(c.grays[0], g2, g3));
    root.setProperty('--btn-primary-shadow', b.primaryShadow(a, bb));
    root.setProperty('--btn-secondary-shadow', b.secondaryShadow);
    root.setProperty('--btn-tertiary-border', b.tertiaryBorder(a));
    root.setProperty('--btn-tertiary-shadow', b.tertiaryShadow);
  }

  // Card color surface: card bg, page atmosphere, stroke/shadow color — changes with "colors" regen
  if (opts.applyCardColors !== false) {
    root.setProperty('--card-bg', m.cardBg);
    root.setProperty('--bg-base', m.bgBase);
    root.setProperty('--bg-orb-a', m.bgOrbs[0]);
    root.setProperty('--bg-orb-b', m.bgOrbs[1]);
    root.setProperty('--bg-orb-c', m.bgOrbs[2]);
    root.setProperty('--bg-orb-d', m.bgOrbs[3]);
    root.setProperty('--card-stroke-color', m.borderColor || '#ffffff');
    root.setProperty('--card-shadow', m.cardShadow);
  }

  if (opts.applyPage !== false) {
    applyPageStyle(m, p);
  }

  // Card structure: blur, radius, stroke opacity, family — changes with "card" regen
  if (opts.applyCard !== false) {
    root.setProperty('--card-blur', `${m.blur}px`);
    root.setProperty('--card-saturate', m.saturate);
    root.setProperty('--card-noise-opacity', m.noise);
    root.setProperty('--card-border-opacity', m.borderOpacity);
    root.setProperty('--card-radius', m.cardRadius || '32px');
    if (m.family) ui.card.dataset.family = m.family;
    else delete ui.card.dataset.family;
    if (m.style) ui.card.dataset.style = m.style;
    else delete ui.card.dataset.style;
    if (m.family) document.body.dataset.family = m.family;
    else delete document.body.dataset.family;
    if (m.style) document.body.dataset.style = m.style;
    else delete document.body.dataset.style;
  }

  // Update saved star state
  const id = themeId(theme);
  const isSaved = state.saved.some((t) => themeId(t) === id);
  ui.starBtn.classList.toggle('is-saved', isSaved);
}

function themeId(t) {
  return `${t.material.name}|${t.font.sans}-${t.font.serif}|${t.colors.seed}|${t.button.name}|${t.page?.name || DEFAULT_PAGE_STYLE.name}`;
}

// ---- generation (scope-aware) ----
function buildNextTheme(prev, scope = 'all') {
  let material = prev?.material;
  let font = prev?.font;
  let colors = prev?.colors;
  let button = prev?.button;
  let page = prev?.page || DEFAULT_PAGE_STYLE;

  const newFont = (mat) => {
    const pair = pickFontPair(mat.fontMoods);
    const sw = choice(pair.sw);
    const rw = choice(pair.rw);
    const scale = choice(TYPE_SCALES);
    return {
      sans: pair.sans, serif: pair.serif, mood: pair.mood,
      sansWeight: sw, serifWeight: rw, scale,
      sw: pair.sw, rw: pair.rw,
    };
  };

  const newColors = (mat) => genPalette(mat);
  const newButton = (mat) => pickButtonStyle(mat);
  const newPage = () => pickPageStyle();

  // Pick a material from a given pool, avoiding the current one and recent picks
  const pickFromPool = (pool) => {
    const fresh = pool.filter((n) => !isRecent('material', n) && n !== prev?.material?.name);
    const candidates = fresh.length > 0 ? fresh : pool.filter((n) => n !== prev?.material?.name);
    const name = candidates.length > 0 ? choice(candidates) : choice(pool);
    remember('material', name);
    return {
      name,
      ...MATERIALS[name],
      cardRadius: MATERIAL_CARD_RADIUS[name] || '32px',
      borderColor: MATERIAL_BORDER_COLOR[name] || '#ffffff',
    };
  };

  // Pool of material names in the same family group as the given material
  const familyPool = (mat) => {
    const group = getFamilyGroup(mat);
    return MATERIAL_NAMES.filter((n) => getFamilyGroup(MATERIALS[n]) === group);
  };

  let regenFontAndBtn = false;

  if (scope === 'all') {
    // Full material change from the whole pool
    let tries = 0;
    do {
      material = pickFromPool(MATERIAL_NAMES);
      tries++;
    } while (prev && material.name === prev.material.name && tries < 5);
    font = newFont(material);
    colors = newColors(material);
    button = newButton(material);
    page = newPage();
  } else if (scope === 'font') {
    font = newFont(material);
  } else if (scope === 'colors') {
    // Colors regen: new card/bg/stroke/shadow colors + new palette. Within the same
    // family (pixel/hand) so structural CSS overrides stay coherent. Generic
    // materials keep the existing blur/radius (set by the last "all").
    const pool = familyPool(prev?.material);
    const colorMat = pickFromPool(pool);
    material = mergeColorFrom(colorMat, prev.material);
    colors = newColors(material);
  } else if (scope === 'buttons') {
    button = newButton(material);
  } else if (scope === 'page') {
    page = newPage();
  }

  const theme = { material, font, colors, button, page };
  remember('full', themeId(theme));
  return { theme, regenFontAndBtn };
}

function generate(scope = 'all') {
  const { theme, regenFontAndBtn } = buildNextTheme(state.theme, scope);
  state.theme = theme;
  applyTheme(theme, {
    applyFont: scope === 'all' || scope === 'font' || regenFontAndBtn,
    applyColors: scope === 'all' || scope === 'colors',
    applyCardColors: scope === 'all' || scope === 'colors',
    applyButtons: scope === 'all' || scope === 'colors' || scope === 'buttons' || regenFontAndBtn,
    applyPage: scope === 'all' || scope === 'colors' || scope === 'page',
    applyCard: scope === 'all',
  });

  // Subtle flash on the card to acknowledge the change
  ui.card.classList.remove('is-flashing');
  void ui.card.offsetWidth;
  ui.card.classList.add('is-flashing');
}

// ---- segmented pill positioning ----
function positionPill(seg) {
  const pill = seg.querySelector('.seg-pill');
  const active = seg.querySelector('.seg-btn.is-active');
  if (!pill || !active) return;
  const segRect = seg.getBoundingClientRect();
  const aRect = active.getBoundingClientRect();
  const x = aRect.left - segRect.left;
  pill.style.transform = `translateX(${x}px)`;
  pill.style.width = `${aRect.width}px`;
}

function wireSegmented(seg, onChange) {
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn || btn.classList.contains('is-active')) return;
    seg.querySelectorAll('.seg-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    positionPill(seg);
    onChange(btn);
  });
}

function setScope(scope) {
  state.scope = scope;
  ui.scopeSeg.querySelectorAll('.seg-btn').forEach((b) => {
    const active = b.dataset.scope === scope;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  positionPill(ui.scopeSeg);
}

// ---- saved themes ----
const STORAGE_KEY = 'palette.saved.v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.saved = raw ? JSON.parse(raw) : [];
  } catch { state.saved = []; }
  updateSavedCount();
}
function persistSaved() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved));
  updateSavedCount();
}
function updateSavedCount() {
  const n = state.saved.length;
  if (n > 0) {
    ui.savedCount.hidden = false;
    ui.savedCount.textContent = n;
  } else {
    ui.savedCount.hidden = true;
  }
}

function toggleSave() {
  if (!state.theme) return;
  const id = themeId(state.theme);
  const idx = state.saved.findIndex((t) => themeId(t) === id);
  if (idx >= 0) {
    state.saved.splice(idx, 1);
  } else {
    state.saved.unshift(JSON.parse(JSON.stringify(state.theme)));
  }
  persistSaved();
  ui.starBtn.classList.toggle('is-saved', idx < 0);
  if (state.mode === 'saved') renderSaved();
}

// Saved themes are persisted as plain JSON; restore live function refs.
// Material is pure data — no function refs. We expand MATERIALS[name] as defaults
// then overlay the saved values so any mixed-state material (colors regen swaps
// the surface but keeps prev structure) is preserved exactly, while old saves
// get current defaults for new fields like cardRadius / borderColor.
function rehydrate(theme) {
  const bs = BUTTON_STYLES.find((s) => s.name === theme.button.name);
  if (bs) theme.button = bs;
  const ps = PAGE_STYLES.find((s) => s.name === theme.page?.name);
  theme.page = ps || DEFAULT_PAGE_STYLE;
  if (theme.material?.name && MATERIALS[theme.material.name]) {
    const name = theme.material.name;
    const base = {
      name,
      ...MATERIALS[name],
      cardRadius: MATERIAL_CARD_RADIUS[name] || '32px',
      borderColor: MATERIAL_BORDER_COLOR[name] || '#ffffff',
    };
    theme.material = { ...base, ...theme.material };
  }
  return theme;
}

// Build the same card markup the Create view uses, with theme-scoped CSS vars.
function buildSavedCard(theme, idx) {
  const t = theme;
  const isEditingThisCard = isEditingSaved() && state.savedEdit.index === idx;
  const a = t.colors.palette[0], b = t.colors.palette[1], c = t.colors.palette[2];
  const [g1, g2, g3] = t.colors.grays;

  const vars = {
    '--card-bg': t.material.cardBg,
    '--card-blur': `${t.material.blur}px`,
    '--card-saturate': t.material.saturate,
    '--card-shadow': t.material.cardShadow,
    '--card-noise-opacity': t.material.noise,
    '--card-border-opacity': t.material.borderOpacity,
    '--card-radius': t.material.cardRadius || '32px',
    '--card-stroke-color': t.material.borderColor || '#ffffff',

    '--font-sans': `'${t.font.sans}', system-ui, sans-serif`,
    '--font-serif': `'${t.font.serif}', Georgia, serif`,
    '--sans-weight': t.font.sansWeight,
    '--serif-weight': t.font.serifWeight,
    '--sans-size': t.font.scale.sansSize,
    '--serif-size': t.font.scale.serifSize,
    '--sans-tracking': t.font.scale.sansTrack,
    '--serif-tracking': t.font.scale.serifTrack,

    '--p1': a, '--p2': b, '--p3': c,
    '--g1': g1, '--g2': g2, '--g3': g3,
    '--ink-strong': t.colors.inkStrong,
    '--ink-mute': t.colors.inkMute,
    '--accent': t.colors.accent,

    '--btn-radius': t.button.radius,
    '--btn-primary-bg': t.button.primaryGrad(a, b, c),
    '--btn-secondary-bg': t.button.secondaryGrad(g1, g2, g3),
    '--btn-primary-shadow': t.button.primaryShadow(a, b),
    '--btn-secondary-shadow': t.button.secondaryShadow,
    '--btn-tertiary-border': t.button.tertiaryBorder(a),
    '--btn-tertiary-shadow': t.button.tertiaryShadow,
  };

  const card = document.createElement('article');
  card.className = 'card saved-card';
  card.dataset.idx = String(idx);
  if (t.material.family) card.dataset.family = t.material.family;
  if (t.material.style) card.dataset.style = t.material.style;
  Object.entries(vars).forEach(([k, v]) => card.style.setProperty(k, v));

  const swatchHTML = (role, hex, i) =>
    `<div class="swatch" data-role="${role}" data-i="${i}" style="background:${hex}"><span class="swatch-hex">${hex}</span></div>`;

  const cardActionsHTML = isEditingThisCard
    ? `
      <button class="ctrl ctrl--icon" data-action="save-edit" aria-label="Save edited theme" title="Save edits">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      </button>
      <button class="ctrl ctrl--icon" data-action="discard-edit" aria-label="Discard edits" title="Discard edits">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
      </button>
    `
    : `
      <button class="ctrl ctrl--icon" data-action="share" aria-label="Share theme" title="Share">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>
      </button>
      <button class="ctrl ctrl--icon is-saved" data-action="unsave" aria-label="Remove from saved" title="Saved">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.9 6.3 6.6.6-5 4.6 1.5 6.5L12 17.8 6 21l1.5-6.5-5-4.6 6.6-.6L12 3Z"/></svg>
      </button>
    `;

  card.innerHTML = `
    <div class="card-noise" aria-hidden="true"></div>
    <header class="card-actions">
      ${cardActionsHTML}
    </header>
    <div class="card-body">
      <section class="type-pair" aria-label="Typography">
        <h2 class="type-sample type-sample--sans">Hello world</h2>
        <h3 class="type-sample type-sample--serif">${escapeHtml(t.font.sans)}</h3>
      </section>
      <section class="swatch-grid" aria-label="Colors">
        ${swatchHTML('palette', a, 0)}
        ${swatchHTML('palette', b, 1)}
        ${swatchHTML('palette', c, 2)}
        ${swatchHTML('gray', g1, 0)}
        ${swatchHTML('gray', g2, 1)}
        ${swatchHTML('gray', g3, 2)}
      </section>
      <section class="btn-stack" aria-label="Button preview">
        <button class="pv pv--primary" type="button">Primary action</button>
        <button class="pv pv--secondary" type="button">Secondary</button>
        <button class="pv pv--tertiary" type="button">Tertiary</button>
      </section>
    </div>
  `;

  // Per-card actions
  card.querySelector('[data-action="share"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openShare(theme);
  });
  card.querySelector('[data-action="unsave"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.savedEdit = null;
    state.saved.splice(idx, 1);
    persistSaved();
    updateControlsVisibility();
    renderSaved();
  });
  card.querySelector('[data-action="save-edit"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    saveSavedEdit();
  });
  card.querySelector('[data-action="discard-edit"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    discardSavedEdit();
  });

  return card;
}

function escapeHtml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;' }[c]));
}

let savedObserver = null;
let savedActiveIndex = null;
let savedAtmosphereFrame = 0;
const savedIntersectionRatios = new Map();

function cloneTheme(theme) {
  return JSON.parse(JSON.stringify(theme));
}

function isEditingSaved() {
  return state.mode === 'saved' && state.savedEdit?.index != null;
}

function syncSavedFrame() {
  if (!ui.savedView || !ui.snapStack || ui.savedView.hidden) return;
  const rect = ui.savedView.getBoundingClientRect();
  const editButtonHeight = ui.regenBtn.getBoundingClientRect().height || 44;
  const remainingBelowCard = window.innerHeight - rect.bottom;
  const editButtonTop = rect.bottom + Math.max(0, (remainingBelowCard - editButtonHeight) / 2) + 8;
  const root = document.documentElement.style;
  root.setProperty('--saved-card-top', `${rect.top}px`);
  root.setProperty('--saved-card-left', `${rect.left}px`);
  root.setProperty('--saved-card-center', `${rect.left + rect.width / 2}px`);
  root.setProperty('--saved-card-width', `${rect.width}px`);
  root.setProperty('--saved-card-height', `${rect.height}px`);
  root.setProperty('--saved-edit-top', `${editButtonTop}px`);
  root.setProperty('--saved-card-transform', 'none');
}

function updateControlsVisibility() {
  const controls = $('#controls');
  const editing = isEditingSaved();
  const controlsVisible = state.mode === 'create' || editing;
  const savedEditVisible = state.mode === 'saved' && state.saved.length > 0 && !editing;
  controls.hidden = false;
  controls.classList.toggle('is-hidden', !controlsVisible);
  controls.classList.toggle('is-saved-edit', editing);
  controls.setAttribute('aria-hidden', controlsVisible ? 'false' : 'true');
  ui.savedEditBtn.hidden = !savedEditVisible;
  ui.savedEditBtn.setAttribute('aria-hidden', savedEditVisible ? 'false' : 'true');
  ui.topSeg.classList.toggle('is-disabled', editing);
  ui.topSeg.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.disabled = editing;
    btn.setAttribute('aria-disabled', editing ? 'true' : 'false');
  });
  if (editing && state.scope === 'all') setScope('font');
  else positionPill(ui.scopeSeg);
}

function displayedSavedTheme(idx) {
  return isEditingSaved() && state.savedEdit.index === idx
    ? state.savedEdit.draft
    : state.saved[idx];
}

function activeSavedIndex() {
  const fallback = Math.round(ui.snapStack.scrollTop / Math.max(1, window.innerHeight));
  return clamp(savedActiveIndex ?? fallback, 0, Math.max(0, state.saved.length - 1));
}

function applyPageStyle(material, pageStyle = DEFAULT_PAGE_STYLE) {
  const root = document.documentElement.style;
  const p = pageStyle || DEFAULT_PAGE_STYLE;
  root.setProperty('--page-bg', p.bg(material).replace(/\s+/g, ' ').trim());
  root.setProperty('--page-overlay', p.overlay(material).replace(/\s+/g, ' ').trim());
  root.setProperty('--page-overlay-opacity', typeof p.overlayOpacity === 'function' ? p.overlayOpacity(material) : (p.overlayOpacity || '1'));
  root.setProperty('--page-overlay-blend', typeof p.overlayBlend === 'function' ? p.overlayBlend(material) : (p.overlayBlend || 'normal'));
  root.setProperty('--page-orb-filter', p.orbFilter || 'blur(110px)');
  root.setProperty('--page-orb-opacity', p.orbOpacity || '0.85');
  root.setProperty('--page-orb-scale-a', p.orbScale?.[0] ?? 1);
  root.setProperty('--page-orb-scale-b', p.orbScale?.[1] ?? 1);
  root.setProperty('--page-orb-scale-c', p.orbScale?.[2] ?? 1);
  root.setProperty('--page-orb-scale-d', p.orbScale?.[3] ?? 1);
  root.setProperty('--page-overlay-size', p.overlaySize || 'auto');
}

function updatePageAtmosphere(material, pageStyle = DEFAULT_PAGE_STYLE) {
  const root = document.documentElement.style;
  root.setProperty('--bg-base', material.bgBase);
  root.setProperty('--bg-orb-a', material.bgOrbs[0]);
  root.setProperty('--bg-orb-b', material.bgOrbs[1]);
  root.setProperty('--bg-orb-c', material.bgOrbs[2]);
  root.setProperty('--bg-orb-d', material.bgOrbs[3]);
  applyPageStyle(material, pageStyle);
  if (material.family) document.body.dataset.family = material.family;
  else delete document.body.dataset.family;
  if (material.style) document.body.dataset.style = material.style;
  else delete document.body.dataset.style;
}

function startSavedEdit(idx) {
  const theme = state.saved[idx];
  if (!theme) return;
  state.savedEdit = {
    index: idx,
    draft: rehydrate(cloneTheme(theme)),
  };
  setScope(state.scope === 'all' ? 'font' : state.scope);
  updateControlsVisibility();
  renderSaved(idx);
  updatePageAtmosphere(state.savedEdit.draft.material, state.savedEdit.draft.page);
}

function regenerateSavedDraft() {
  if (!isEditingSaved()) return;
  const { theme } = buildNextTheme(state.savedEdit.draft, state.scope);
  state.savedEdit.draft = theme;
  ensureFontsLoaded(theme.font);
  renderSaved(state.savedEdit.index);
  updatePageAtmosphere(theme.material, theme.page);
  const card = ui.snapStack.querySelector(`.saved-card[data-idx="${state.savedEdit.index}"]`);
  if (card) {
    card.classList.remove('is-flashing');
    void card.offsetWidth;
    card.classList.add('is-flashing');
  }
}

function saveSavedEdit() {
  if (!isEditingSaved()) return;
  const idx = state.savedEdit.index;
  state.saved[idx] = cloneTheme(state.savedEdit.draft);
  state.savedEdit = null;
  persistSaved();
  updateControlsVisibility();
  renderSaved(idx);
}

function discardSavedEdit() {
  if (!isEditingSaved()) return;
  const idx = state.savedEdit.index;
  state.savedEdit = null;
  updateControlsVisibility();
  renderSaved(idx);
  const theme = state.saved[idx];
  if (theme) updatePageAtmosphere(theme.material, theme.page);
}

function renderSaved(focusIndex = 0) {
  syncSavedFrame();

  // tear down prior observer
  if (savedObserver) { savedObserver.disconnect(); savedObserver = null; }
  if (savedAtmosphereFrame) cancelAnimationFrame(savedAtmosphereFrame);
  savedAtmosphereFrame = 0;
  savedActiveIndex = null;
  savedIntersectionRatios.clear();
  ui.snapStack.innerHTML = '';
  ui.snapStack.classList.toggle('is-editing', isEditingSaved());

  if (state.saved.length === 0) {
    ui.savedEmpty.hidden = false;
    ui.snapStack.hidden = true;
    return;
  }
  ui.savedEmpty.hidden = true;
  ui.snapStack.hidden = false;

  state.saved.forEach((raw, idx) => {
    const t = isEditingSaved() && state.savedEdit.index === idx
      ? state.savedEdit.draft
      : rehydrate(raw);
    if (!(isEditingSaved() && state.savedEdit.index === idx)) {
      state.saved[idx] = t; // keep state in sync with rehydrated functions
    }
    ensureFontsLoaded(t.font);

    const page = document.createElement('div');
    page.className = 'snap-page';
    page.dataset.idx = String(idx);
    page.appendChild(buildSavedCard(t, idx));
    ui.snapStack.appendChild(page);
  });

  // Page-level background follows the visible saved card, batched to animation
  // frames so quick scrolls do not trigger multiple atmosphere updates.
  savedObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      savedIntersectionRatios.set(+e.target.dataset.idx, e.intersectionRatio);
    }
    if (savedAtmosphereFrame) return;
    savedAtmosphereFrame = requestAnimationFrame(() => {
      savedAtmosphereFrame = 0;
      let bestIndex = null;
      let bestRatio = 0;
      savedIntersectionRatios.forEach((ratio, idx) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIndex = idx;
        }
      });
      if (bestIndex == null || bestRatio < 0.52 || bestIndex === savedActiveIndex) return;
      savedActiveIndex = bestIndex;
      ui.savedEditBtn.disabled = false;
      const t = displayedSavedTheme(bestIndex);
      if (t) updatePageAtmosphere(t.material, t.page);
    });
  }, { root: ui.snapStack, threshold: [0, 0.25, 0.52, 0.75, 1] });

  ui.snapStack.querySelectorAll('.snap-page').forEach((p) => savedObserver.observe(p));

  // Initial: snap to top + sync background.
  ui.snapStack.scrollTop = focusIndex * window.innerHeight;
  const focusedTheme = displayedSavedTheme(focusIndex);
  savedActiveIndex = focusIndex;
  updateControlsVisibility();
  if (focusedTheme) updatePageAtmosphere(focusedTheme.material, focusedTheme.page);
}

// ---- mode switching ----
function switchMode(mode) {
  if (mode !== 'saved') state.savedEdit = null;
  state.mode = mode;
  const isCreate = mode === 'create';
  ui.createView.hidden = !isCreate;
  ui.savedView.hidden = isCreate;
  updateControlsVisibility();
  if (mode === 'saved') {
    syncSavedFrame();
    renderSaved();
  } else if (state.theme) {
    // Restore Create-theme atmosphere when returning from Saved
    updatePageAtmosphere(state.theme.material, state.theme.page);
  }
  // sync top segmented
  ui.topSeg.querySelectorAll('.seg-btn').forEach((b) => {
    const a = b.dataset.mode === mode;
    b.classList.toggle('is-active', a);
    b.setAttribute('aria-selected', a ? 'true' : 'false');
  });
  positionPill(ui.topSeg);
}

// ---- share / export ----
function openShare(theme) {
  state.shareTarget = theme || state.theme;
  ui.shareSheet.hidden = false;
}
function closeShare() { ui.shareSheet.hidden = true; state.shareTarget = null; }

function buildDesignMarkdown(t) {
  const toGFParam = (name, weight) => `family=${name.replace(/ /g, '+')}:wght@${weight}`;
  const fontUrl = `https://fonts.googleapis.com/css2?${toGFParam(t.font.sans, t.font.sansWeight)}&display=swap`;
  const cardRadius = t.material.cardRadius || '32px';
  const m = t.material;
  const [a, b2, c2] = t.colors.palette;
  const [g1, g2, g3] = t.colors.grays;
  const btnPrimaryBg = t.button.primaryGrad(a, b2, c2);
  const btnSecondaryBg = t.button.secondaryGrad(g1, g2, g3);
  const btnPrimaryShadow = t.button.primaryShadow(a, b2);
  const btnSecondaryShadow = t.button.secondaryShadow;
  const btnTertiaryBorder = t.button.tertiaryBorder(a);
  const family = m.family || 'glass';
  const familyDesc = m.family === 'pixel'
    ? 'Hard-edged 8-bit/pixel surface — no blur, no translucency. Solid fill with 4px outer ink ring and an offset 8px ink shadow (no soft glow).'
    : m.family === 'hand' && m.style === 'sketch'
      ? 'Hand-drawn sketch surface — solid paper fill with a hand-inked stroke and offset hand-shadow. No backdrop blur.'
      : m.family === 'hand' && m.style === 'calligraphic'
        ? 'Calligraphic hand surface — refined paper fill with a soft hairline stroke. No backdrop blur.'
        : `Glassmorphic surface — translucent fill (${m.cardBg}) over the page background, blurred ${m.blur}px and saturated ${m.saturate}× via backdrop-filter, framed by a 1px gradient stroke (${m.borderColor} at ${Math.round((m.borderOpacity ?? 1) * 100)}% opacity) and a layered ambient shadow.`;

  // Google DESIGN.md format: YAML front matter (machine-readable tokens)
  // + markdown prose (human/agent-readable rationale).
  // Spec: https://github.com/google-labs-code/design.md
  return `---
version: alpha
name: "${m.name}"
description: "Generated theme — ${m.name} material, ${t.button.name} button shape, ${t.font.sans} typeface."
page:
  style: "${t.page?.name || DEFAULT_PAGE_STYLE.name}"
  background: "${m.bgBase}"
  orbs: ["${m.bgOrbs[0]}", "${m.bgOrbs[1]}", "${m.bgOrbs[2]}", "${m.bgOrbs[3]}"]
colors:
  primary: "${t.colors.palette[0]}"
  secondary: "${t.colors.palette[1]}"
  tertiary: "${t.colors.palette[2]}"
  surface: "${t.colors.grays[0]}"
  surfaceMuted: "${t.colors.grays[1]}"
  border: "${t.colors.grays[2]}"
  inkStrong: "${t.colors.inkStrong}"
  inkMute: "${t.colors.inkMute}"
typography:
  display:
    fontFamily: "${t.font.sans}"
    fontSize: "48px"
    fontWeight: ${t.font.sansWeight}
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "${t.font.sans}"
    fontSize: "32px"
    fontWeight: ${t.font.sansWeight}
    lineHeight: 1.15
    letterSpacing: "-0.005em"
  body:
    fontFamily: "${t.font.sans}"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  button: "${t.button.radius}"
  card: "${cardRadius}"
components:
  card:
    family: "${family}"
    background: "${m.cardBg}"
    rounded: "{rounded.card}"
    backdropFilter: "${m.family ? 'none' : `blur(${m.blur}px) saturate(${m.saturate})`}"
    border: "1px gradient stroke, color ${m.borderColor}, opacity ${m.borderOpacity ?? 1}"
    shadow: "${m.cardShadow}"
    noiseOpacity: ${m.noise}
  button-primary:
    background: "${btnPrimaryBg}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    shadow: "${btnPrimaryShadow}"
  button-secondary:
    background: "${btnSecondaryBg}"
    textColor: "{colors.inkStrong}"
    rounded: "{rounded.button}"
    shadow: "${btnSecondaryShadow}"
  button-tertiary:
    background: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.button}"
    border: "${btnTertiaryBorder}"
---

# ${m.name}

## Overview
A **${m.name}** theme using the **${t.button.name}** button shape and **${t.font.sans}** (weight ${t.font.sansWeight}) across all type roles, over a controlled palette of three primary accents and three neutrals.

Load the typefaces from Google Fonts:

\`\`\`html
<link rel="stylesheet" href="${fontUrl}">
\`\`\`

## Colors
Use \`{colors.primary}\` for the dominant brand action and the single most important call-to-action on a screen. \`{colors.secondary}\` and \`{colors.tertiary}\` are supporting accents — use them sparingly to add chromatic depth without competing with primary. \`{colors.surface}\` is the default container fill; \`{colors.surfaceMuted}\` is for nested or quieter surfaces; \`{colors.border}\` is for hairlines and dividers. \`{colors.inkStrong}\` is for headings and body copy; \`{colors.inkMute}\` is for secondary labels and meta text.

| Role | Token | Value |
|------|-------|-------|
| Primary | \`{colors.primary}\` | \`${t.colors.palette[0]}\` |
| Secondary | \`{colors.secondary}\` | \`${t.colors.palette[1]}\` |
| Tertiary | \`{colors.tertiary}\` | \`${t.colors.palette[2]}\` |
| Surface | \`{colors.surface}\` | \`${t.colors.grays[0]}\` |
| Surface muted | \`{colors.surfaceMuted}\` | \`${t.colors.grays[1]}\` |
| Border | \`{colors.border}\` | \`${t.colors.grays[2]}\` |
| Ink strong | \`{colors.inkStrong}\` | \`${t.colors.inkStrong}\` |
| Ink mute | \`{colors.inkMute}\` | \`${t.colors.inkMute}\` |

## Typography
**${t.font.sans}** is the single typeface across all roles. Use weight ${t.font.sansWeight} for display and heading, and weight 400 for body copy.

## Shapes
- Button corners: \`${t.button.radius}\`
- Card corners: \`${cardRadius}\`
- Page background: \`${t.page?.name || DEFAULT_PAGE_STYLE.name}\`

## Card surface
${familyDesc}

The card is **not** a flat color — its fill is intentionally translucent and (for the default glass family) sits over a blurred copy of whatever is behind it. To reproduce it accurately:

\`\`\`css
.card {
  background: ${m.cardBg};
  border-radius: ${cardRadius};
  ${m.family ? '/* no backdrop-filter for this family */' : `backdrop-filter: blur(${m.blur}px) saturate(${m.saturate});
  -webkit-backdrop-filter: blur(${m.blur}px) saturate(${m.saturate});`}
  box-shadow: ${m.cardShadow};
  position: relative;
  overflow: hidden;
}
/* 1px gradient stroke (rendered as a masked ::before, not a hard border) */
.card::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(150deg,
    color-mix(in srgb, ${m.borderColor} 85%, transparent) 0%,
    color-mix(in srgb, ${m.borderColor} 25%, transparent) 30%,
    transparent 55%,
    color-mix(in srgb, ${m.borderColor} 18%, transparent) 80%,
    color-mix(in srgb, ${m.borderColor} 55%, transparent) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  opacity: ${m.borderOpacity ?? 1};
  pointer-events: none;
}
\`\`\`

## Components
- **button-primary** — \`${btnPrimaryBg}\` background with a white label, \`{rounded.button}\` corners, and \`box-shadow: ${btnPrimaryShadow}\`. Use for the single most important action on a screen.
- **button-secondary** — \`${btnSecondaryBg}\` background with an \`{colors.inkStrong}\` label, \`{rounded.button}\` corners, and \`box-shadow: ${btnSecondaryShadow}\`. Use for the next-most-important action; pair at most one secondary with each primary.
- **button-tertiary** — transparent fill with a \`{colors.primary}\` label and a \`${btnTertiaryBorder}\` border at \`{rounded.button}\` corners. Use for low-priority links, "Cancel"/"Dismiss"-style actions, and inline navigation.
- **card** — see "Card surface" above. Use as the default container for grouped content.
`;
}

function exportCSS() {
  const t = state.shareTarget || state.theme;
  if (!t) return;

  const slug = t.material.name.toLowerCase().replace(/\s+/g, '-');
  const md = buildDesignMarkdown(t);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const dl = document.createElement('a');
  dl.href = url;
  dl.download = `DESIGN-${slug}.md`;
  dl.click();
  URL.revokeObjectURL(url);
  closeShare();
}

function updateToastPosition() {
  if (!ui.controls) return;
  const rect = ui.controls.getBoundingClientRect();
  const bottomOffset = window.innerHeight - rect.top + 20;
  document.documentElement.style.setProperty('--toast-bottom', `${bottomOffset}px`);
}

function showToast(message = 'Copied') {
  if (!ui.toast) return;
  window.clearTimeout(showToast.timer);
  ui.toast.textContent = message;
  ui.toast.classList.add('is-visible');
  showToast.timer = window.setTimeout(() => {
    ui.toast.classList.remove('is-visible');
  }, 2000);
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.select();
  const copied = document.execCommand('copy');
  ta.remove();
  if (!copied) throw new Error('Copy failed');
}

async function copyDesignMarkdown() {
  const t = state.shareTarget || state.theme;
  if (!t) return;
  const md = buildDesignMarkdown(t);

  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(md);
    else fallbackCopyText(md);
  } catch (err) {
    try {
      fallbackCopyText(md);
    } catch (fallbackErr) {
      console.warn('Unable to copy DESIGN.md to clipboard', fallbackErr || err);
      return;
    }
  }

  closeShare();
  showToast('Copied');
}

async function exportImage() {
  // Build a self-contained SVG snapshot of the card and download as PNG.
  const t = state.shareTarget || state.theme;
  if (!t) return;
  const W = 800, H = 1100;
  const padding = 56;
  const contentW = W - padding * 2;

  // Both type-sample--sans and type-sample--serif use --font-sans in CSS.
  const sansFamily = `'${t.font.sans}', system-ui, sans-serif`;
  const cardBg = t.material.cardBg;
  const baseBg = t.material.bgBase;
  const family = t.material.family || '';
  const matStyle = t.material.style || '';

  const [a, b, c] = t.colors.palette;
  const [g1, g2, g3] = t.colors.grays;

  // Convert a CSS linear-gradient() string to an SVG <linearGradient> def.
  // Returns { def, fill } where fill is either "url(#id)" or a solid color.
  function parseCssGrad(id, cssVal) {
    const m = cssVal.match(/linear-gradient\((\d+)deg,\s*(.+)\)$/);
    if (!m) return { def: '', fill: cssVal };
    const rad = (parseFloat(m[1]) * Math.PI) / 180;
    const vx = Math.sin(rad), vy = -Math.cos(rad);
    const x1 = (0.5 - 0.5 * vx).toFixed(4), y1 = (0.5 - 0.5 * vy).toFixed(4);
    const x2 = (0.5 + 0.5 * vx).toFixed(4), y2 = (0.5 + 0.5 * vy).toFixed(4);
    const stops = [];
    const re = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s+(\d+%)/g;
    let sm;
    while ((sm = re.exec(m[2])) !== null) stops.push(`<stop offset="${sm[2]}" stop-color="${sm[1]}"/>`);
    if (!stops.length) return { def: '', fill: cssVal };
    return {
      def: `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.join('')}</linearGradient>`,
      fill: `url(#${id})`,
    };
  }

  // Parse a CSS border shorthand like "1.5px solid #abc55" or "2px dashed #abc".
  function parseBorder(str) {
    const m = str.match(/^([\d.]+)px\s+(solid|dashed|dotted)\s+(.+)$/);
    return m ? { width: parseFloat(m[1]), dashed: m[2] === 'dashed', color: m[3].trim() } : { width: 1.5, dashed: false, color: a };
  }

  const primaryGrad = parseCssGrad('btnP', t.button.primaryGrad(a, b, c));
  const secondaryGrad = parseCssGrad('btnS', t.button.secondaryGrad(g1, g2, g3));
  const tertiaryBorder = parseBorder(t.button.tertiaryBorder(a));

  // Card corner radius: CSS overrides per family take precedence over material value.
  let cardRx;
  if (family === 'pixel') cardRx = 6;
  else if (family === 'hand' && matStyle === 'calligraphic') cardRx = 8;
  else if (family === 'hand' && matStyle === 'sketch') cardRx = 18;
  else cardRx = parseFloat(t.material.cardRadius) || 32;

  // Card fill: boost opacity for glass (rgba) materials so the card reads well without backdrop-filter.
  const cardFill = cardBg.startsWith('rgba(') ? cardBg.replace(/[\d.]+\)$/, '0.88)') : cardBg;

  // Card border/shadow per material family.
  let cardShadowEl = '';
  let cardStrokeAttrs;
  if (family === 'pixel') {
    // Offset hard shadow + thick outline
    cardShadowEl = `<rect x="${padding + 8}" y="${padding + 8}" width="${contentW}" height="${H - padding * 2}" rx="${cardRx}" fill="${t.colors.inkStrong}"/>`;
    cardStrokeAttrs = `stroke="${t.colors.inkStrong}" stroke-width="4"`;
  } else if (family === 'hand' && matStyle === 'sketch') {
    cardStrokeAttrs = `stroke="${t.colors.inkStrong}" stroke-width="2" stroke-dasharray="8,5" stroke-opacity="0.5"`;
  } else if (family === 'hand' && matStyle === 'calligraphic') {
    cardStrokeAttrs = `stroke="${t.colors.inkStrong}" stroke-width="1" stroke-opacity="0.25"`;
  } else {
    const strokeColor = t.material.borderColor || '#ffffff';
    const strokeOpacity = t.material.borderOpacity != null ? t.material.borderOpacity : 0.7;
    cardStrokeAttrs = `stroke="${strokeColor}" stroke-opacity="${strokeOpacity}" stroke-width="1"`;
  }

  // Swatch corner radius per family.
  const swatchRx = family === 'pixel' ? 4 : (family === 'hand' && matStyle === 'calligraphic') ? 6 : (family === 'hand' && matStyle === 'sketch') ? 12 : 18;

  const bgDefs = `
    <radialGradient id="ga" cx="20%" cy="15%" r="60%"><stop offset="0%" stop-color="${t.material.bgOrbs[0]}" stop-opacity="0.95"/><stop offset="100%" stop-color="${t.material.bgOrbs[0]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gb" cx="80%" cy="25%" r="55%"><stop offset="0%" stop-color="${t.material.bgOrbs[1]}" stop-opacity="0.85"/><stop offset="100%" stop-color="${t.material.bgOrbs[1]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gc" cx="85%" cy="90%" r="65%"><stop offset="0%" stop-color="${t.material.bgOrbs[2]}" stop-opacity="0.85"/><stop offset="100%" stop-color="${t.material.bgOrbs[2]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gd" cx="15%" cy="95%" r="50%"><stop offset="0%" stop-color="${t.material.bgOrbs[3]}" stop-opacity="0.7"/><stop offset="100%" stop-color="${t.material.bgOrbs[3]}" stop-opacity="0"/></radialGradient>`;

  let y = padding + 56;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>${bgDefs}${primaryGrad.def}${secondaryGrad.def}</defs>
    <rect width="100%" height="100%" fill="${baseBg}"/>
    <rect width="100%" height="100%" fill="url(#ga)"/>
    <rect width="100%" height="100%" fill="url(#gb)"/>
    <rect width="100%" height="100%" fill="url(#gc)"/>
    <rect width="100%" height="100%" fill="url(#gd)"/>
    ${cardShadowEl}
    <rect x="${padding}" y="${padding}" width="${contentW}" height="${H - padding * 2}" rx="${cardRx}" fill="${cardFill}" ${cardStrokeAttrs}/>`;

  // Type — both lines use sansFamily; subhead shows the sans name at muted color (matches live card).
  svg += `<text x="${padding + 28}" y="${y + 20}" font-family="${sansFamily}" font-weight="${t.font.sansWeight}" font-size="46" fill="${t.colors.inkStrong}" letter-spacing="-1.0">${escapeXml(t.font.sans)}</text>`;
  svg += `<text x="${padding + 28}" y="${y + 50}" font-family="${sansFamily}" font-size="14" font-weight="600" fill="${t.colors.inkMute}">${t.colors.inkStrong}</text>`;
  y += 100;
  svg += `<text x="${padding + 28}" y="${y + 18}" font-family="${sansFamily}" font-weight="400" font-size="32" fill="${t.colors.inkMute}">${escapeXml(t.font.sans)}</text>`;
  svg += `<text x="${padding + 28}" y="${y + 46}" font-family="${sansFamily}" font-size="14" font-weight="600" fill="${t.colors.inkMute}">${t.colors.inkMute}</text>`;
  y += 80;

  // Swatches 3×2
  const startX = padding + 28;
  const cellW = (contentW - 56 - 24) / 3;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const hex = row === 0 ? t.colors.palette[col] : t.colors.grays[col];
      const sx = startX + col * (cellW + 12);
      const sy = y + row * (cellW + 12);
      const textColor = row === 0 ? '#ffffff' : t.colors.inkStrong;
      svg += `<rect x="${sx}" y="${sy}" width="${cellW}" height="${cellW}" rx="${swatchRx}" fill="${hex}"/>`;
      svg += `<text x="${sx + 12}" y="${sy + cellW - 12}" font-family="${sansFamily}" font-size="12" font-weight="600" fill="${textColor}">${hex}</text>`;
    }
  }
  y += cellW * 2 + 36;

  // Buttons — use actual gradient functions and button radius from theme.
  const btnW = contentW - 56;
  const btnH = 56;
  const radNum = parseFloat(t.button.radius) || 999;
  const btnRx = Math.min(radNum, btnH / 2);
  const btnX = padding + 28;

  svg += `<rect x="${btnX}" y="${y}" width="${btnW}" height="${btnH}" rx="${btnRx}" fill="${primaryGrad.fill}"/>`;
  svg += `<text x="${btnX + btnW / 2}" y="${y + btnH / 2 + 6}" font-family="${sansFamily}" font-weight="600" font-size="16" fill="#ffffff" text-anchor="middle">Primary action</text>`;
  y += btnH + 10;

  svg += `<rect x="${btnX}" y="${y}" width="${btnW}" height="${btnH}" rx="${btnRx}" fill="${secondaryGrad.fill}"/>`;
  svg += `<text x="${btnX + btnW / 2}" y="${y + btnH / 2 + 6}" font-family="${sansFamily}" font-weight="600" font-size="16" fill="${t.colors.inkStrong}" text-anchor="middle">Secondary</text>`;
  y += btnH + 10;

  const tertiaryDash = tertiaryBorder.dashed ? ' stroke-dasharray="6,4"' : '';
  svg += `<rect x="${btnX}" y="${y}" width="${btnW}" height="${btnH}" rx="${btnRx}" fill="none" stroke="${tertiaryBorder.color}" stroke-width="${tertiaryBorder.width}"${tertiaryDash}/>`;
  svg += `<text x="${btnX + btnW / 2}" y="${y + btnH / 2 + 6}" font-family="${sansFamily}" font-weight="600" font-size="16" fill="${t.colors.accent}" text-anchor="middle">Tertiary</text>`;
  y += btnH + 24;

  // Material label
  svg += `<text x="${W / 2}" y="${H - padding - 16}" font-family="${sansFamily}" font-size="12" font-weight="600" fill="${t.colors.inkMute}" text-anchor="middle" letter-spacing="2">${t.material.name.toUpperCase()}</text>`;
  svg += `</svg>`;

  // Convert SVG to PNG via canvas
  try {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = W * 2; canvas.height = H * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        const dl = document.createElement('a');
        dl.href = URL.createObjectURL(b);
        dl.download = `palette-${t.material.name.toLowerCase()}.png`;
        dl.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); };
    img.src = url;
  } catch (e) {
  }
  closeShare();
}


function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;' }[c]));
}

// ----------------------------- wire up -----------------------------
function init() {
  loadSaved();

  document.addEventListener('dblclick', (e) => {
    if (e.target.closest('button, .segmented, .controls')) e.preventDefault();
  }, { capture: true });

  wireSegmented(ui.topSeg, (btn) => switchMode(btn.dataset.mode));
  wireSegmented(ui.scopeSeg, (btn) => { state.scope = btn.dataset.scope; });

  ui.regenBtn.addEventListener('click', () => {
    if (isEditingSaved()) regenerateSavedDraft();
    else generate(state.scope);
  });
  ui.starBtn.addEventListener('click', toggleSave);
  ui.shareBtn.addEventListener('click', () => openShare(state.theme));
  ui.savedEditBtn.addEventListener('click', () => startSavedEdit(activeSavedIndex()));

  ui.shareSheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeShare(); return; }
    const exp = e.target.closest('[data-export]');
    if (!exp) return;
    const kind = exp.dataset.export;
    if (kind === 'css') exportCSS();
    else if (kind === 'image') exportImage();
    else if (kind === 'clipboard') copyDesignMarkdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !ui.shareSheet.hidden) closeShare();
    if (e.key === ' ' && state.mode === 'create' && !e.target.closest('button')) {
      e.preventDefault();
      generate(state.scope);
    }
    if ((e.key === 'r' || e.key === 'R') && state.mode === 'create' && !e.target.closest('input,textarea')) {
      generate(state.scope);
    }
  });

  window.addEventListener('resize', () => {
    positionPill(ui.topSeg);
    positionPill(ui.scopeSeg);
    updateToastPosition();
    if (state.mode === 'saved') syncSavedFrame();
  });

  // Initial layout — defer pill until layout is settled
  const layoutPills = () => {
    positionPill(ui.topSeg);
    positionPill(ui.scopeSeg);
    updateToastPosition();
  };
  requestAnimationFrame(layoutPills);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutPills);
  }

  // First theme
  generate('all');
}

// Wait until fonts CSS is at least requested
init();
