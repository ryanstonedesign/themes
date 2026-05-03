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
];

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
};
const MATERIAL_NAMES = Object.keys(MATERIALS);

// ----------------------------- button styles -----------------------------
const BUTTON_STYLES = [
  {
    name: 'pill',
    radius: '999px',
    primaryGrad: (a, b, c) => `linear-gradient(135deg, ${a} 0%, ${mix(a, b, 0.6)} 100%)`,
    secondaryGrad: (g1, g2) => `linear-gradient(180deg, #ffffff 0%, ${g2} 100%)`,
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
    secondaryGrad: (g1, g2) => `linear-gradient(135deg, #ffffff 0%, ${g2} 100%)`,
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
  return { name, ...MATERIALS[name] };
}

function pickFontPair(materialFontMoods) {
  // weight: pairs whose mood matches the material get higher weight
  const entries = FONT_PAIRS.map((p) => {
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

  const c1 = hslToHex(wrap(h1), clamp(baseSat + satJitter(), 30, 90), clamp(baseLight + lightJitter(), 38, 65));
  const c2 = hslToHex(wrap(h2), clamp(baseSat + satJitter(), 30, 90), clamp(baseLight + lightJitter(), 38, 65));
  const c3 = hslToHex(wrap(h3), clamp(baseSat + satJitter(), 30, 90), clamp(baseLight + lightJitter(), 38, 65));

  // Grayscale tinted toward base hue (very subtle)
  const grayHue = wrap(h1);
  const graySat = clamp(Math.round(baseSat * 0.12), 0, 12);
  const g1 = hslToHex(grayHue, graySat, 97);
  const g2 = hslToHex(grayHue, graySat, 91);
  const g3 = hslToHex(grayHue, graySat, 83);

  // Typography hex values (dark + mid)
  const inkStrong = hslToHex(grayHue, clamp(graySat + 12, 8, 28), 14);
  const inkMute   = hslToHex(grayHue, clamp(graySat + 10, 8, 26), 38);

  return {
    palette: [c1, c2, c3],
    grays: [g1, g2, g3],
    inkStrong, inkMute,
    accent: c1,
    harmony,
    seed: `${harmony}|${c1}|${c2}|${c3}`,
  };
}

function pickButtonStyle() {
  const name = pickFresh(BUTTON_STYLES.map((s) => s.name), 'button');
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
  sansName: $('#sansName'),
  serifName: $('#serifName'),
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
  savedGrid: $('#savedGrid'),
  savedEmpty: $('#savedEmpty'),
  savedCount: $('#savedCount'),
};

// ---- font loading (cumulative, no FOUT after first load) ----
const loadedFontFamilies = new Set();
function ensureFontsLoaded(pair) {
  const need = [pair.sans, pair.serif].filter((f) => !loadedFontFamilies.has(f));
  if (need.length === 0) return;
  need.forEach((f) => loadedFontFamilies.add(f));

  const all = Array.from(loadedFontFamilies).map((f) => {
    const family = f.replace(/ /g, '+');
    return `family=${family}:wght@400;500;600;700;800`;
  }).join('&');
  const href = `https://fonts.googleapis.com/css2?${all}&display=swap`;
  ui.fontLink.href = href;
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
    ui.sansName.textContent = f.sans;
    ui.serifName.textContent = f.serif;
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

  if (opts.applyCard !== false) {
    root.setProperty('--card-bg', m.cardBg);
    root.setProperty('--card-blur', `${m.blur}px`);
    root.setProperty('--card-saturate', m.saturate);
    root.setProperty('--card-shadow', m.cardShadow);
    root.setProperty('--card-noise-opacity', m.noise);
    root.setProperty('--card-border-opacity', m.borderOpacity);
    root.setProperty('--bg-base', m.bgBase);
    root.setProperty('--bg-orb-a', m.bgOrbs[0]);
    root.setProperty('--bg-orb-b', m.bgOrbs[1]);
    root.setProperty('--bg-orb-c', m.bgOrbs[2]);
    root.setProperty('--bg-orb-d', m.bgOrbs[3]);
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

  const newMaterial = () => {
    let m;
    let tries = 0;
    do {
      m = pickMaterial();
      tries++;
    } while (prev && m.name === prev.material.name && tries < 5);
    return m;
  };

  const newFont = (mat) => {
    const pair = pickFontPair(mat.fontMoods);
    const sw = choice(pair.sw);
    const rw = choice(pair.rw);
    const scale = choice(TYPE_SCALES);
    return {
      sans: pair.sans, serif: pair.serif, mood: pair.mood,
      sansWeight: sw, serifWeight: rw, scale,
    };
  };

  const newColors = (mat) => genPalette(mat);
  const newButton = () => pickButtonStyle();

  if (scope === 'all') {
    material = newMaterial();
    font = newFont(material);
    colors = newColors(material);
    button = newButton();
  } else if (scope === 'font') {
    font = newFont(material);
  } else if (scope === 'colors') {
    colors = newColors(material);
  } else if (scope === 'buttons') {
    button = newButton();
  } else if (scope === 'card') {
    material = newMaterial();
    // re-bias only material+atmosphere; keep colors and font palette stable
  }

  const theme = { material, font, colors, button };
  state.theme = theme;
  remember('full', themeId(theme));
  applyTheme(theme, {
    applyFont: scope === 'all' || scope === 'font',
    applyColors: scope === 'all' || scope === 'colors',
    applyButtons: scope === 'all' || scope === 'colors' || scope === 'buttons',
    applyCard: scope === 'all' || scope === 'card',
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

function renderSaved() {
  ui.savedGrid.innerHTML = '';
  if (state.saved.length === 0) {
    ui.savedEmpty.hidden = false;
    ui.savedGrid.hidden = true;
    return;
  }
  ui.savedEmpty.hidden = true;
  ui.savedGrid.hidden = false;
  state.saved.forEach((t, idx) => {
    const tile = document.createElement('button');
    tile.className = 'saved-tile';
    tile.style.background = t.material.cardBg.replace(/[\d.]+\)/, '0.95)');
    tile.innerHTML = `
      <div class="saved-tile-canvas">
        <span class="saved-tile-name">${t.material.name}</span>
        <div class="saved-tile-fonts" style="color:${t.colors.inkStrong}">
          <div class="saved-tile-sans" style="font-family:'${t.font.sans}',system-ui;font-weight:${t.font.sansWeight}">${t.font.sans}</div>
          <div class="saved-tile-serif" style="font-family:'${t.font.serif}',Georgia,serif;font-weight:${t.font.serifWeight};color:${t.colors.inkMute}">${t.font.serif}</div>
        </div>
        <div class="saved-tile-row">
          <div class="saved-tile-chip" style="background:${t.colors.palette[0]}"></div>
          <div class="saved-tile-chip" style="background:${t.colors.palette[1]}"></div>
          <div class="saved-tile-chip" style="background:${t.colors.palette[2]}"></div>
        </div>
      </div>
      <span class="saved-tile-remove" data-remove="${idx}" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </span>
    `;
    tile.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-remove]');
      if (rm) {
        e.stopPropagation();
        state.saved.splice(+rm.dataset.remove, 1);
        persistSaved();
        renderSaved();
        return;
      }
      // Load this theme into Create view
      state.theme = JSON.parse(JSON.stringify(t));
      ensureFontsLoaded(t.font);
      switchMode('create');
      applyTheme(state.theme);
    });
    ui.savedGrid.appendChild(tile);
  });
}

// ---- mode switching ----
function switchMode(mode) {
  state.mode = mode;
  const isCreate = mode === 'create';
  ui.createView.hidden = !isCreate;
  ui.savedView.hidden = isCreate;
  $('#controls').hidden = !isCreate;
  if (mode === 'saved') renderSaved();
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
function openShare() { ui.shareSheet.hidden = false; }
function closeShare() { ui.shareSheet.hidden = true; }

function exportCSS() {
  const t = state.theme;
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
  const t = state.theme;
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
  const t = state.theme;
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
  ui.shareBtn.addEventListener('click', openShare);

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
