// ─── Lipstick Shade Catalogue ────────────────────────────────────────────────
// 32 shades across 8 categories.
// Only `hex` is used by the rendering engine — all other fields are UI metadata.

export const SHADE_CATEGORIES = [
  { id: 'Nude',   label: 'Nude' },
  { id: 'Pink',   label: 'Pink' },
  { id: 'Rose',   label: 'Rose' },
  { id: 'Red',    label: 'Red' },
  { id: 'Berry',  label: 'Berry' },
  { id: 'Brown',  label: 'Brown' },
  { id: 'Mauve',  label: 'Mauve' },
  { id: 'Coral',  label: 'Coral' },
];

export const LIPSTICK_SHADES = [
  // ── Nude ──────────────────────────────────────────────────────────────────
  { id: 'nude-beige',   name: 'Nude Beige',   category: 'Nude',  hex: '#C9956E', description: 'Warm sandy beige' },
  { id: 'peach-nude',   name: 'Peach Nude',   category: 'Nude',  hex: '#D4907A', description: 'Soft peachy warmth' },
  { id: 'rose-nude',    name: 'Rose Nude',    category: 'Nude',  hex: '#C87F78', description: 'Everyday romantic blush' },
  { id: 'caramel-nude', name: 'Caramel Nude', category: 'Nude',  hex: '#B07355', description: 'Rich caramel depth' },

  // ── Pink ──────────────────────────────────────────────────────────────────
  { id: 'soft-pink',   name: 'Soft Pink',   category: 'Pink',  hex: '#F0A0B0', description: 'Fresh youthful glow' },
  { id: 'baby-pink',   name: 'Baby Pink',   category: 'Pink',  hex: '#F2B8C6', description: 'Delicate pastel blush' },
  { id: 'dusty-pink',  name: 'Dusty Pink',  category: 'Pink',  hex: '#D4849A', description: 'Muted vintage pink' },
  { id: 'petal-pink',  name: 'Petal Pink',  category: 'Pink',  hex: '#E8799B', description: 'Lush flower petal tone' },

  // ── Rose ──────────────────────────────────────────────────────────────────
  { id: 'classic-rose', name: 'Classic Rose', category: 'Rose',  hex: '#C96080', description: 'Timeless feminine rose' },
  { id: 'dusty-rose',   name: 'Dusty Rose',   category: 'Rose',  hex: '#B86574', description: 'Timeless vintage rose' },
  { id: 'rosewood',     name: 'Rosewood',     category: 'Rose',  hex: '#A5505A', description: 'Deep warm wood rose' },
  { id: 'warm-rose',    name: 'Warm Rose',    category: 'Rose',  hex: '#C5556A', description: 'Golden-toned rose blush' },

  // ── Red ───────────────────────────────────────────────────────────────────
  { id: 'classic-red', name: 'Classic Red', category: 'Red',   hex: '#C0292E', description: 'Iconic glamorous red' },
  { id: 'cherry-red',  name: 'Cherry Red',  category: 'Red',   hex: '#B01C2E', description: 'Bold juicy cherry' },
  { id: 'brick-red',   name: 'Brick Red',   category: 'Red',   hex: '#9E3030', description: 'Earthy warm brick tone' },
  { id: 'wine-red',    name: 'Wine Red',    category: 'Red',   hex: '#7A1F2E', description: 'Deep velvety wine' },

  // ── Berry ─────────────────────────────────────────────────────────────────
  { id: 'berry',       name: 'Berry',       category: 'Berry', hex: '#872C48', description: 'Deep luscious berry' },
  { id: 'raspberry',   name: 'Raspberry',   category: 'Berry', hex: '#9E2149', description: 'Vivid summer raspberry' },
  { id: 'mulberry',    name: 'Mulberry',    category: 'Berry', hex: '#6B2050', description: 'Rich dark mulberry' },
  { id: 'berry-wine',  name: 'Berry Wine',  category: 'Berry', hex: '#5E1A42', description: 'Moody berry meets wine' },

  // ── Brown ─────────────────────────────────────────────────────────────────
  { id: 'cocoa',         name: 'Cocoa',         category: 'Brown', hex: '#8B4F3A', description: 'Warm cocoa spice' },
  { id: 'mocha',         name: 'Mocha',         category: 'Brown', hex: '#7A3E2E', description: 'Creamy coffee mocha' },
  { id: 'chocolate',    name: 'Chocolate',    category: 'Brown', hex: '#5D2A20', description: 'Rich dark chocolate' },
  { id: 'coffee-brown', name: 'Coffee Brown', category: 'Brown', hex: '#6B3325', description: 'Bold espresso depth' },

  // ── Mauve ─────────────────────────────────────────────────────────────────
  { id: 'soft-mauve',  name: 'Soft Mauve',  category: 'Mauve', hex: '#B8839A', description: 'Gentle lavender pink' },
  { id: 'mauve-rose',  name: 'Mauve Rose',  category: 'Mauve', hex: '#A8607C', description: 'Romantic rose mauve' },
  { id: 'dusty-mauve', name: 'Dusty Mauve', category: 'Mauve', hex: '#9E6476', description: 'Subtle cool purple-pink' },
  { id: 'deep-mauve',  name: 'Deep Mauve',  category: 'Mauve', hex: '#7A4060', description: 'Dramatic deep mauve' },

  // ── Coral ─────────────────────────────────────────────────────────────────
  { id: 'soft-coral',   name: 'Soft Coral',   category: 'Coral', hex: '#E87B6A', description: 'Bright summery coral' },
  { id: 'peach-coral',  name: 'Peach Coral',  category: 'Coral', hex: '#E8896A', description: 'Peachy orange coral' },
  { id: 'coral-pink',   name: 'Coral Pink',   category: 'Coral', hex: '#D96875', description: 'Lively coral-pink flair' },
  { id: 'terracotta',   name: 'Terracotta',   category: 'Coral', hex: '#B8593D', description: 'Earthy sun-baked clay' },
];

// ─── Legacy aliases kept for backward-compatibility ──────────────────────────
// (History items saved under old IDs will still resolve to the closest shade)
export const SHADE_BY_ID = Object.fromEntries(
  LIPSTICK_SHADES.map((s) => [s.id, s])
);

// ─── Finish & Lighting options (unchanged) ───────────────────────────────────
export const LIPSTICK_FINISHES = [
  { id: 'satin', label: 'Satin', icon: '✨' },
  { id: 'matte', label: 'Matte', icon: '☁️' },
  { id: 'gloss', label: 'Gloss', icon: '💧' },
];

export const LIGHTING_PRESETS = [
  { id: 'auto',    label: 'Auto',    desc: 'Balanced' },
  { id: 'natural', label: 'Natural', desc: 'Daylight' },
  { id: 'soft',    label: 'Soft',    desc: 'Diffused' },
  { id: 'warm',    label: 'Warm',    desc: 'Golden' },
  { id: 'cool',    label: 'Cool',    desc: 'Studio' },
];
