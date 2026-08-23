# sternstaub ✦

> *German for "stardust"*

An interactive cosmic particle wallpaper built with React Three Fiber + Vite.  
Thousands of particles orbit a glowing nebula core — fully customizable in real time.

![sternstaub preview](./preview.png)

---

## What it does

- **8,000+ particles** rendered via custom GLSL shaders (vertex + fragment)
- **Soft additive blending** — overlapping particles glow brighter, like real light
- **Organic drift animation** — particles breathe and drift via sin/cos wave functions
- **5 color palettes** — Cosmic Blue, Ethereal Gold, Aurora Green, Dusty Rose, Void White
- **JSON preset system** — save and load your exact settings as `.json` files
- **Mouse orbit** — drag to rotate, scroll to zoom

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | React + Vite |
| 3D | React Three Fiber + Three.js |
| Shaders | Custom GLSL (vertex + fragment) |
| UI | Vanilla CSS (glassmorphism) |

---

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` — you'll see the particle cloud immediately.

---

## File structure

```
src/
├── components/
│   ├── ParticleCloud.jsx   # The 3D particle system — geometry + shader wiring
│   ├── ControlPanel.jsx    # The floating UI panel
│   └── ControlPanel.css    # Panel styles
├── shaders/
│   ├── vertex.glsl         # Animates particle positions
│   └── fragment.glsl       # Colors + glow falloff
├── config/
│   └── palettes.js         # All color themes — add new ones here
├── presets/
│   ├── default.json        # Loaded on startup
│   └── goldenNebula.json   # Example preset
└── App.jsx                 # Root — state + layout
```

---

## How to add a new palette

Open `src/config/palettes.js` and add an entry:

```js
myPalette: {
  label: "My Palette",
  primary:   "#hex",   // outer particles
  secondary: "#hex",   // mid-range
  core:      "#hex",   // center glow
}
```

That's it — it appears in the UI automatically.

---

## How to add a new preset

Edit any JSON in `src/presets/` or use the **Save Preset** button in the UI to export your current settings.

---

## Roadmap

- [ ] Tauri wrapper for native macOS `.app`
- [ ] Audio reactivity (Web Audio API → shader uniforms)
- [ ] GLSL hot-reload editor (Monaco embedded)
- [ ] macOS wallpaper mode (`NSWindow.Level.belowNormal`)
- [ ] Geometry picker (sphere / torus / custom SDF)
