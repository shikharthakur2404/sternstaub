// ─────────────────────────────────────────────────────────────────────────────
// palettes.js — All Cosmic Color Spectra
//
// Each palette is engineered with:
//   bgStart / bgEnd  → Deep obsidian void radial background
//   glow             → 4 multi-spectral chromatic particle emitters:
//                      [Primary Chromatic, Secondary Resonance, Accent Contrast, Stellar Core]
// ─────────────────────────────────────────────────────────────────────────────

export const PALETTES = {
  etherealGold: {
    label:   'Ethereal Gold',
    bgStart: '#241500',
    bgEnd:   '#080400',
    glow:    ['#fde047', '#fb923c', '#38bdf8', '#ffffff'],
  },

  cosmicBlue: {
    label:   'Hyperion Blue',
    bgStart: '#061a2c',
    bgEnd:   '#020810',
    glow:    ['#00f2fe', '#38bdf8', '#818cf8', '#ffffff'],
  },

  auroraGreen: {
    label:   'Borealis Emerald',
    bgStart: '#002017',
    bgEnd:   '#010906',
    glow:    ['#10b981', '#06b6d4', '#6ee7b7', '#ffffff'],
  },

  supernovaRose: {
    label:   'Supernova Iris',
    bgStart: '#200a2c',
    bgEnd:   '#07020d',
    glow:    ['#e879f9', '#f43f5e', '#38bdf8', '#ffffff'],
  },

  solarFlare: {
    label:   'Solar Flare',
    bgStart: '#2a0c02',
    bgEnd:   '#0a0200',
    glow:    ['#ff5722', '#ffb300', '#38bdf8', '#ffffff'],
  },

  midnightViolet: {
    label:   'Cosmic Amethyst',
    bgStart: '#1a0d2e',
    bgEnd:   '#05010a',
    glow:    ['#a855f7', '#ec4899', '#f59e0b', '#ffffff'],
  },
}
