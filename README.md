# sternstaub ✦

> *German for "stardust"*

A lightweight, high-performance cosmic particle engine built with HTML5 Canvas 2D + React + Vite.  
Zero external 3D dependencies (`three` / `@react-three/fiber` free). Multi-spectral sprite cache running on an isolated OffscreenCanvas Web Worker with 5 morphing celestial geometries at locked 60+ FPS.

**✦ Live Deployment:** [shikharthakur2404.github.io/sternstaub](https://shikharthakur2404.github.io/sternstaub/)

---

## Architecture & Features

- **Pure Canvas 2D Pipeline** — No WebGL/Three.js overhead. Direct buffer drawing via `CanvasRenderingContext2D`.
- **Additive Optical Blending** — Uses `globalCompositeOperation = 'lighter'` to generate natural white-hot core radiance when particle clusters overlap.
- **Parametric Silhouette Generator** — Distributes particles across head, shoulders, torso, and aura clusters using custom parametric probability distributions.
- **Drift & Dispersion Physics** — Particles orbit home anchor coordinates with harmonic oscillator displacement (`Math.sin`, `Math.cos`).
- **Dynamic Palettes** — Real-time gradient mapping and glow coloring across 5 cosmic themes.
- **Glassmorphic Control HUD** — Interactive control panel to tune dispersion, drift speed, particle density, and color grading in real time.

---

## Visual Computing Triad

`sternstaub` is Tier 1 of the visual computing triad:

1. **`sternstaub` (Tier 1)**: Pure HTML5 Canvas 2D particle simulation, zero 3D dependencies.
2. **[`nebelkern`](https://github.com/shikharthakur2404/nebelkern) (Tier 2)**: Three.js / React Three Fiber / custom GLSL shaders with 3D curl noise, post-processing bloom, and velocity persistence trails.
3. **[`nebelkern-metal`](https://github.com/shikharthakur2404/nebelkern-metal) (Tier 3)**: Native Swift + Metal compute pipeline with Apple Silicon UMA shared memory, Liquid Retina XDR EDR headroom, and live desktop wallpaper mode.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | React 19 + Vite |
| Graphics | HTML5 2D Canvas API (`CanvasRenderingContext2D`) |
| Blending | Additive (`lighter`) |
| Linting | Oxlint |
| Styling | Modular CSS (Glassmorphic HUD) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Production build
npm run build

# Run linter
npm run lint
```

---

## License

MIT © [Shikhar Thakur](https://github.com/shikharthakur2404)
