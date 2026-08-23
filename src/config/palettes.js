// ─────────────────────────────────────────────────────────────────────────────
// PALETTES.js — all color themes live here
//
// To add a new palette, just add a new entry to this object.
// Colors are in hex strings — Three.js Color() handles the conversion.
// ─────────────────────────────────────────────────────────────────────────────

export const PALETTES = {
  cosmicBlue: {
    label: "Cosmic Blue",
    primary: "#1a0a3a",      // deep violet — outermost particles
    secondary: "#0a4a8a",    // ocean blue — mid particles
    core: "#c8e8ff",         // pale ice white — the glowing center
  },

  etherealGold: {
    label: "Ethereal Gold",
    primary: "#1a0800",      // deep burnt brown — outer edge
    secondary: "#c84a00",    // amber orange — mid range
    core: "#fff8c0",         // warm white-gold — core glow
  },

  auroraGreen: {
    label: "Aurora Green",
    primary: "#000a10",      // near-black teal — outer edge
    secondary: "#00aa88",    // bright teal — mid range
    core: "#aaffee",         // soft mint white — core
  },

  dustyRose: {
    label: "Dusty Rose",
    primary: "#1a0010",      // deep plum — outer edge
    secondary: "#884466",    // muted rose — mid range
    core: "#ffd8ee",         // pale pink white — core
  },

  voidWhite: {
    label: "Void White",
    primary: "#080808",      // near-black — outer
    secondary: "#444466",    // slate blue — mid
    core: "#ffffff",         // pure white — core
  },
}
