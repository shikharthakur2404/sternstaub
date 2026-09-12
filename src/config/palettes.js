// ─────────────────────────────────────────────────────────────────────────────
// palettes.js — all color themes
//
// Each palette has:
//   bgStart / bgEnd  → radial background gradient colors
//   glow             → array of 4 particle colors (randomly assigned per particle)
// ─────────────────────────────────────────────────────────────────────────────

export const PALETTES = {
  cosmicBlue: {
    label:   'Cosmic Blue',
    bgStart: '#102a3a',
    bgEnd:   '#060d14',
    glow:    ['#5eead4', '#38bdf8', '#a78bfa', '#ffffff'],
  },

  etherealGold: {
    label:   'Ethereal Gold',
    bgStart: '#241500',
    bgEnd:   '#080400',
    glow:    ['#fde047', '#fb923c', '#38bdf8', '#ffffff'],
  },

  navyMauve: {
    label:   'Navy & Mauve',
    bgStart: '#1a1b35',
    bgEnd:   '#080911',
    glow:    ['#c084fc', '#e879f9', '#38bdf8', '#fdf4ff'],
  },

  midnightViolet: {
    label:   'Midnight Violet',
    bgStart: '#2a1538',
    bgEnd:   '#0a0610',
    glow:    ['#f59e0b', '#fbbf24', '#ec4899', '#ffffff'],
  },

  auroraGreen: {
    label:   'Aurora',
    bgStart: '#001a15',
    bgEnd:   '#000a08',
    glow:    ['#34d399', '#6ee7b7', '#38bdf8', '#ffffff'],
  },
}
