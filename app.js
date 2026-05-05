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
  Arcade: '#ffffff', GameBoy: '#ffffff', PixelPop: '#ffffff',
  Notebook: '#ffffff', Sketchpad: '#ffffff', Doodle: '#ffffff', Linen: '#ffffff',
  Graphite: '#ffffff', Watercolor: '#ffffff',
  Parchment: '#ffffff', Inkwell: '#ffffff', Letterpress: '#ffffff', Vellum: '#ffffff',
  Quill: '#ffffff', Manuscript: '#ffffff',
};

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
    cardRadius: prevMat.cardRadius,
    blur: prevMat.blur,
    saturate: prevMat.saturate,
    noise: prevMat.noise,
    cardShadow: prevMat.cardShadow,
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
  font: [], material: [], palette: [], button: [], full: []
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
  }
  const pool = BUTTON_STYLES.filter((s) => !FAMILY_BUTTON_STYLES.has(s.name)).map((s) => s.name);
  const name = pickFresh(pool, 'button');
  remember('button', name);
  return BUTTON_STYLES.find((s) => s.name === name);
}

// ----------------------------- application -----------------------------
const state = {
  mode: 'create',
  scope: 'all',
  theme: null,
  saved: [],
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
  savedCount: $('#savedCount'),
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

  // Card color surface: card bg, page atmosphere, stroke color — changes with "colors" regen
  if (opts.applyCardColors !== false) {
    root.setProperty('--card-bg', m.cardBg);
    root.setProperty('--bg-base', m.bgBase);
    root.setProperty('--bg-orb-a', m.bgOrbs[0]);
    root.setProperty('--bg-orb-b', m.bgOrbs[1]);
    root.setProperty('--bg-orb-c', m.bgOrbs[2]);
    root.setProperty('--bg-orb-d', m.bgOrbs[3]);
    root.setProperty('--card-stroke-color', m.borderColor || '#ffffff');
  }

  // Card structure: blur, shadow, radius, stroke opacity, family — changes with "card" regen
  if (opts.applyCard !== false) {
    root.setProperty('--card-blur', `${m.blur}px`);
    root.setProperty('--card-saturate', m.saturate);
    root.setProperty('--card-shadow', m.cardShadow);
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
  return `${t.material.name}|${t.font.sans}-${t.font.serif}|${t.colors.seed}|${t.button.name}`;
}

// ---- generation (scope-aware) ----
function generate(scope = 'all') {
  const prev = state.theme;
  let material = prev?.material;
  let font = prev?.font;
  let colors = prev?.colors;
  let button = prev?.button;

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
  } else if (scope === 'font') {
    font = newFont(material);
  } else if (scope === 'colors') {
    // Colors regen: new card/bg/stroke colors + new palette. Within the same
    // family (pixel/hand) so structural CSS overrides stay coherent. Generic
    // materials keep the existing blur/shadow/radius (set by the last "all").
    const pool = familyPool(prev?.material);
    const isFamily = getFamilyGroup(prev?.material) !== 'generic';
    const colorMat = pickFromPool(pool);
    material = mergeColorFrom(colorMat, prev.material);
    colors = newColors(material);
    if (isFamily) {
      // Family materials share fontMoods but not fonts — rotate font + button
      // so the typography refreshes alongside the colors.
      font = newFont(material);
      button = newButton(material);
      regenFontAndBtn = true;
    }
  } else if (scope === 'buttons') {
    button = newButton(material);
  }

  const theme = { material, font, colors, button };
  state.theme = theme;
  remember('full', themeId(theme));
  applyTheme(theme, {
    applyFont: scope === 'all' || scope === 'font' || regenFontAndBtn,
    applyColors: scope === 'all' || scope === 'colors',
    applyCardColors: scope === 'all' || scope === 'colors',
    applyButtons: scope === 'all' || scope === 'colors' || scope === 'buttons' || regenFontAndBtn,
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
    showToast('Removed from saved');
  } else {
    state.saved.unshift(JSON.parse(JSON.stringify(state.theme)));
    showToast('Saved');
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

// Bump the alpha of an rgba() string. Used to make saved cards more opaque so
// the backdrop-filter doesn't reveal page bg orbs through the snap-stack.
function withAlpha(rgba, alpha) {
  const m = String(rgba).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return rgba;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}

// Build the same card markup the Create view uses, with theme-scoped CSS vars.
function buildSavedCard(theme, idx) {
  const t = theme;
  const a = t.colors.palette[0], b = t.colors.palette[1], c = t.colors.palette[2];
  const [g1, g2, g3] = t.colors.grays;

  const vars = {
    // Saved cards live inside a scroll container; backdrop-filter renders
    // unreliably there on iOS Safari (visible halos / frame artifacts).
    // We make the card fully opaque and disable backdrop-filter via CSS.
    '--card-bg': withAlpha(t.material.cardBg, 1.0),
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

  card.innerHTML = `
    <div class="card-noise" aria-hidden="true"></div>
    <header class="card-actions">
      <button class="ctrl ctrl--icon" data-action="share" aria-label="Share theme" title="Share">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>
      </button>
      <button class="ctrl ctrl--icon is-saved" data-action="unsave" aria-label="Remove from saved" title="Saved">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.9 6.3 6.6.6-5 4.6 1.5 6.5L12 17.8 6 21l1.5-6.5-5-4.6 6.6-.6L12 3Z"/></svg>
      </button>
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
  card.querySelector('[data-action="share"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openShare(theme);
  });
  card.querySelector('[data-action="unsave"]').addEventListener('click', (e) => {
    e.stopPropagation();
    state.saved.splice(idx, 1);
    persistSaved();
    renderSaved();
    showToast('Removed from saved');
  });

  return card;
}

function escapeHtml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;' }[c]));
}

let savedObserver = null;

function updatePageAtmosphere(material) {
  const root = document.documentElement.style;
  root.setProperty('--bg-base', material.bgBase);
  root.setProperty('--bg-orb-a', material.bgOrbs[0]);
  root.setProperty('--bg-orb-b', material.bgOrbs[1]);
  root.setProperty('--bg-orb-c', material.bgOrbs[2]);
  root.setProperty('--bg-orb-d', material.bgOrbs[3]);
  if (material.family) document.body.dataset.family = material.family;
  else delete document.body.dataset.family;
  if (material.style) document.body.dataset.style = material.style;
  else delete document.body.dataset.style;
}

function renderSaved() {
  // tear down prior observer
  if (savedObserver) { savedObserver.disconnect(); savedObserver = null; }
  ui.snapStack.innerHTML = '';

  if (state.saved.length === 0) {
    ui.savedEmpty.hidden = false;
    ui.snapStack.hidden = true;
    return;
  }
  ui.savedEmpty.hidden = true;
  ui.snapStack.hidden = false;

  state.saved.forEach((raw, idx) => {
    const t = rehydrate(raw);
    state.saved[idx] = t; // keep state in sync with rehydrated functions
    ensureFontsLoaded(t.font);

    const page = document.createElement('div');
    page.className = 'snap-page';
    page.dataset.idx = String(idx);
    page.appendChild(buildSavedCard(t, idx));
    ui.snapStack.appendChild(page);
  });

  // Page-level background follows the visible saved card.
  savedObserver = new IntersectionObserver((entries) => {
    let best = null;
    for (const e of entries) {
      if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
    }
    if (best && best.intersectionRatio > 0.55) {
      const i = +best.target.dataset.idx;
      const t = state.saved[i];
      if (t) updatePageAtmosphere(t.material);
    }
  }, { root: ui.snapStack, threshold: [0.4, 0.6, 0.8, 1.0] });

  ui.snapStack.querySelectorAll('.snap-page').forEach((p) => savedObserver.observe(p));

  // Initial: snap to top + sync background.
  ui.snapStack.scrollTop = 0;
  if (state.saved[0]) updatePageAtmosphere(state.saved[0].material);
}

// ---- mode switching ----
function switchMode(mode) {
  state.mode = mode;
  const isCreate = mode === 'create';
  ui.createView.hidden = !isCreate;
  ui.savedView.hidden = isCreate;
  $('#controls').hidden = !isCreate;
  if (mode === 'saved') {
    renderSaved();
  } else if (state.theme) {
    // Restore Create-theme atmosphere when returning from Saved
    updatePageAtmosphere(state.theme.material);
  }
  // sync top segmented
  ui.topSeg.querySelectorAll('.seg-btn').forEach((b) => {
    const a = b.dataset.mode === mode;
    b.classList.toggle('is-active', a);
    b.setAttribute('aria-selected', a ? 'true' : 'false');
  });
  positionPill(ui.topSeg);
}

// ---- toast ----
let toastT;
function showToast(msg) {
  ui.toast.textContent = msg;
  ui.toast.hidden = false;
  ui.toast.classList.add('is-visible');
  clearTimeout(toastT);
  toastT = setTimeout(() => {
    ui.toast.classList.remove('is-visible');
    setTimeout(() => { ui.toast.hidden = true; }, 240);
  }, 1800);
}

// ---- share / export ----
function openShare(theme) {
  state.shareTarget = theme || state.theme;
  ui.shareSheet.hidden = false;
}
function closeShare() { ui.shareSheet.hidden = true; state.shareTarget = null; }

function exportCSS() {
  const t = state.shareTarget || state.theme;
  if (!t) return;
  const css = `:root {
  --font-sans: '${t.font.sans}', system-ui, sans-serif;
  --font-serif: '${t.font.serif}', Georgia, serif;
  --color-primary-1: ${t.colors.palette[0]};
  --color-primary-2: ${t.colors.palette[1]};
  --color-primary-3: ${t.colors.palette[2]};
  --color-gray-1: ${t.colors.grays[0]};
  --color-gray-2: ${t.colors.grays[1]};
  --color-gray-3: ${t.colors.grays[2]};
  --color-ink-strong: ${t.colors.inkStrong};
  --color-ink-mute: ${t.colors.inkMute};
  --button-radius: ${t.button.radius};
  --material: "${t.material.name}";
}`;
  navigator.clipboard?.writeText(css).then(
    () => showToast('CSS copied to clipboard'),
    () => showToast('Copy failed')
  );
  closeShare();
}

async function exportImage() {
  // Build a self-contained SVG snapshot of the card and download as PNG.
  const t = state.shareTarget || state.theme;
  if (!t) return;
  const W = 800, H = 1100;
  const padding = 56;
  const contentW = W - padding * 2;

  const sansFamily = `'${t.font.sans}', system-ui, sans-serif`;
  const serifFamily = `'${t.font.serif}', Georgia, serif`;
  const cardBg = t.material.cardBg;
  const baseBg = t.material.bgBase;

  const swatchW = (contentW - 24) / 3;
  const swatchH = swatchW;

  // Background gradients
  const bg = `<defs>
    <radialGradient id="ga" cx="20%" cy="15%" r="60%"><stop offset="0%" stop-color="${t.material.bgOrbs[0]}" stop-opacity="0.95"/><stop offset="100%" stop-color="${t.material.bgOrbs[0]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gb" cx="80%" cy="25%" r="55%"><stop offset="0%" stop-color="${t.material.bgOrbs[1]}" stop-opacity="0.85"/><stop offset="100%" stop-color="${t.material.bgOrbs[1]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gc" cx="85%" cy="90%" r="65%"><stop offset="0%" stop-color="${t.material.bgOrbs[2]}" stop-opacity="0.85"/><stop offset="100%" stop-color="${t.material.bgOrbs[2]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gd" cx="15%" cy="95%" r="50%"><stop offset="0%" stop-color="${t.material.bgOrbs[3]}" stop-opacity="0.7"/><stop offset="100%" stop-color="${t.material.bgOrbs[3]}" stop-opacity="0"/></radialGradient>
  </defs>`;

  let y = padding + 56;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    ${bg}
    <rect width="100%" height="100%" fill="${baseBg}"/>
    <rect width="100%" height="100%" fill="url(#ga)"/>
    <rect width="100%" height="100%" fill="url(#gb)"/>
    <rect width="100%" height="100%" fill="url(#gc)"/>
    <rect width="100%" height="100%" fill="url(#gd)"/>
    <rect x="${padding}" y="${padding}" width="${contentW}" height="${H - padding * 2}" rx="36" fill="${cardBg.replace(/[\d.]+\)/, '0.85)')}" stroke="rgba(255,255,255,0.7)"/>`;

  // Type
  svg += `<text x="${padding + 28}" y="${y + 20}" font-family="${sansFamily}" font-weight="${t.font.sansWeight}" font-size="46" fill="${t.colors.inkStrong}" letter-spacing="-1.0">${escapeXml(t.font.sans)}</text>`;
  svg += `<text x="${padding + 28}" y="${y + 50}" font-family="${sansFamily}" font-size="14" font-weight="600" fill="${t.colors.inkMute}">${t.colors.inkStrong}</text>`;
  y += 100;
  svg += `<text x="${padding + 28}" y="${y + 18}" font-family="${serifFamily}" font-weight="${t.font.serifWeight}" font-size="32" fill="${t.colors.inkStrong}">${escapeXml(t.font.serif)}</text>`;
  svg += `<text x="${padding + 28}" y="${y + 46}" font-family="${sansFamily}" font-size="14" font-weight="600" fill="${t.colors.inkMute}">${t.colors.inkMute}</text>`;
  y += 80;

  // Swatches 3x2
  const startX = padding + 28;
  const cellW = (contentW - 56 - 24) / 3;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const hex = row === 0 ? t.colors.palette[col] : t.colors.grays[col];
      const x = startX + col * (cellW + 12);
      const cy = y + row * (cellW + 12);
      const textColor = row === 0 ? '#ffffff' : t.colors.inkStrong;
      svg += `<rect x="${x}" y="${cy}" width="${cellW}" height="${cellW}" rx="18" fill="${hex}"/>`;
      svg += `<text x="${x + 12}" y="${cy + cellW - 12}" font-family="${sansFamily}" font-size="12" font-weight="600" fill="${textColor}">${hex}</text>`;
    }
  }
  y += cellW * 2 + 36;

  // Buttons (simplified)
  const btnW = contentW - 56;
  const btnH = 56;
  const radNum = parseFloat(t.button.radius) || 999;
  const btnX = padding + 28;
  // primary
  svg += `<rect x="${btnX}" y="${y}" width="${btnW}" height="${btnH}" rx="${Math.min(radNum, btnH/2)}" fill="${t.colors.palette[0]}"/>`;
  svg += `<text x="${btnX + btnW/2}" y="${y + btnH/2 + 6}" font-family="${sansFamily}" font-weight="600" font-size="16" fill="#ffffff" text-anchor="middle">Primary action</text>`;
  y += btnH + 10;
  svg += `<rect x="${btnX}" y="${y}" width="${btnW}" height="${btnH}" rx="${Math.min(radNum, btnH/2)}" fill="${t.colors.grays[1]}"/>`;
  svg += `<text x="${btnX + btnW/2}" y="${y + btnH/2 + 6}" font-family="${sansFamily}" font-weight="600" font-size="16" fill="${t.colors.inkStrong}" text-anchor="middle">Secondary</text>`;
  y += btnH + 10;
  svg += `<rect x="${btnX}" y="${y}" width="${btnW}" height="${btnH}" rx="${Math.min(radNum, btnH/2)}" fill="none" stroke="${t.colors.palette[0]}" stroke-width="1.5"/>`;
  svg += `<text x="${btnX + btnW/2}" y="${y + btnH/2 + 6}" font-family="${sansFamily}" font-weight="600" font-size="16" fill="${t.colors.palette[0]}" text-anchor="middle">Tertiary</text>`;
  y += btnH + 24;

  // Material label
  svg += `<text x="${W/2}" y="${H - padding - 16}" font-family="${sansFamily}" font-size="12" font-weight="600" fill="${t.colors.inkMute}" text-anchor="middle" letter-spacing="2">${t.material.name.toUpperCase()}</text>`;
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
        showToast('Image downloaded');
      }, 'image/png');
    };
    img.onerror = () => { showToast('Image export failed'); URL.revokeObjectURL(url); };
    img.src = url;
  } catch (e) {
    showToast('Image export failed');
  }
  closeShare();
}

function exportPDF() {
  // Lightweight: use browser print of just the card area.
  const t = state.shareTarget || state.theme;
  if (!t) return;
  const w = window.open('', '_blank', 'noopener,width=820,height=1100');
  if (!w) { showToast('Pop-up blocked'); return; }
  const swatches = (arr, light) => arr.map((h) =>
    `<div style="aspect-ratio:1/1;border-radius:18px;background:${h};display:flex;align-items:flex-end;padding:10px;color:${light ? '#0b0d12' : '#fff'};font-weight:600;font-size:12px;font-family:Inter,sans-serif">${h}</div>`
  ).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${t.material.name} — Palette</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${t.font.sans.replace(/ /g,'+')}:wght@400;600;700&family=${t.font.serif.replace(/ /g,'+')}:wght@400;600;700&family=Inter:wght@400;600;700&display=swap">
    <style>
      @page { size: A4; margin: 16mm; }
      body { font-family: '${t.font.sans}', sans-serif; color: ${t.colors.inkStrong}; margin: 0; padding: 32px; background: ${t.material.bgBase}; }
      .card { background: rgba(255,255,255,0.92); border-radius: 32px; padding: 36px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); max-width: 700px; margin: 0 auto; }
      h1 { font-weight:${t.font.sansWeight}; font-size:42px; margin: 0; letter-spacing: -0.02em; }
      h2 { font-family: '${t.font.serif}', serif; font-weight:${t.font.serifWeight}; font-size:28px; margin: 0; }
      .hex { color: ${t.colors.inkMute}; font-size:13px; font-weight:600; margin-top:4px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
      .meta { text-align:center; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color: ${t.colors.inkMute}; margin-top: 24px; }
    </style></head><body>
    <div class="card">
      <h1>${t.font.sans}</h1><div class="hex">${t.colors.inkStrong}</div>
      <h2 style="margin-top:16px">${t.font.serif}</h2><div class="hex">${t.colors.inkMute}</div>
      <div class="grid">${swatches(t.colors.palette, false)}</div>
      <div class="grid">${swatches(t.colors.grays, true)}</div>
      <div class="meta">${t.material.name}</div>
    </div>
    <script>window.onload = () => setTimeout(() => window.print(), 300)</script>
  </body></html>`);
  w.document.close();
  closeShare();
  showToast('Opening PDF...');
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;' }[c]));
}

// ----------------------------- wire up -----------------------------
function init() {
  loadSaved();

  wireSegmented(ui.topSeg, (btn) => switchMode(btn.dataset.mode));
  wireSegmented(ui.scopeSeg, (btn) => { state.scope = btn.dataset.scope; });

  ui.regenBtn.addEventListener('click', () => generate(state.scope));
  ui.starBtn.addEventListener('click', toggleSave);
  ui.shareBtn.addEventListener('click', () => openShare(state.theme));

  ui.shareSheet.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) { closeShare(); return; }
    const exp = e.target.closest('[data-export]');
    if (!exp) return;
    const kind = exp.dataset.export;
    if (kind === 'css') exportCSS();
    else if (kind === 'image') exportImage();
    else if (kind === 'pdf') exportPDF();
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
  });

  // Initial layout — defer pill until layout is settled
  const layoutPills = () => {
    positionPill(ui.topSeg);
    positionPill(ui.scopeSeg);
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
