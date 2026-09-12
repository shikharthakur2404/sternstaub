# STERNSTAUB ✦ ENGINE CHECKPOINT & PROMPT RESTORATION SPEC

> **Permanent Architectural Snapshot & AI Rebuild Prompt**  
> Git Commit Reference: `3a063cf`  
> Last Verified Working State: OffscreenCanvas Worker, 60+ FPS locked, zero main thread CPU load, high-radiance chromatic particle rendering with Keplerian Solar System and recalibrated obsidian spectra.

---

## 1. RESTORATION PROMPT (COPY-PASTE READY FOR ANY AI / AGENT)

```markdown
You are an expert graphics and web performance engineer. 
Your goal is to restore or rebuild the "sternstaub" Tier 1 Canvas 2D engine to its exact peak working state.

Follow these non-negotiable architectural rules:
1. PURE CANVAS 2D + OFFSCREENCANVAS WORKER:
   - ZERO external 3D dependencies (no Three.js, no R3F).
   - ALL Canvas 2D operations, physics, and requestAnimationFrame loops MUST run in a dedicated Web Worker (`src/workers/renderer.worker.js`).
   - The main thread (`src/App.jsx`) is ONLY an event and React state proxy.

2. CRITICAL BUGS PREVENTED:
   - NO REACT STRICTMODE: `src/main.jsx` must NOT use `<StrictMode>`. Calling `canvas.transferControlToOffscreen()` twice throws `InvalidStateError` and crashes with a black screen.
   - EXPLICIT RESOLUTION HANDOFF: In `App.jsx`, when dispatching `{ type: 'init', canvas, width: canvas.offsetWidth, height: canvas.offsetHeight }`, the worker must IMMEDIATELY execute `canvas.width = data.width; canvas.height = data.height;` before drawing the first frame. Failing to do this locks the canvas to the browser default 300x150px, causing CSS stretching to blow up particles 5x into giant blurry orbs.
   - NO SHADOWBLUR: Never use `ctx.shadowBlur` or per-particle `ctx.save()`/`ctx.restore()`. It forces CPU Gaussian rasterization (108,000 passes/sec) and freezes macOS. Use pre-rendered offscreen radial gradient sprites blitted via `ctx.drawImage` with `ctx.globalCompositeOperation = 'lighter'`.

3. THREE-TIER MULTI-SPECTRAL SPRITE TIERS:
   - Tier 0: Nebula Mist (18% of nodes). Size: 14–30px. Base Alpha: 0.12–0.30. Soft 96px radial gradient.
   - Tier 1: Body Mass (67% of nodes). Size: 6–14px. Base Alpha: 0.50–0.85. 64px chromatic radial gradient with #ffffff white-hot core.
   - Tier 2: Stellar Sparkles (15% of nodes). Size: 3–7px. Base Alpha: 0.75–1.00. 36px star flare with 1px 4-point cross diffraction spikes.

4. FIVE CELESTIAL GEOMETRIES:
   - Astral: Sculpted humanoid silhouette with cranial halo ring, spinal chakra axis, clavicle taper, waist curve, and dissipating stardust limbs.
   - Solar: Keplerian Solar System with central radiant Sol Core, 8 orbiting planetary condensations (ω ∝ r^-1.3), dense toroidal Asteroid Belt, tilted Saturnian Ring System, Kuiper Belt, and an eccentric parabolic Comet with ion dust tail.
   - Singularity: Black hole event horizon void, dense relativistic photon ring, inclined accretion disk with Doppler asymmetry, and polar plasma jets.
   - Galaxy: Dense galactic bulge core + dual-arm logarithmic spiral ($r = 30 e^{0.42 t}$).
   - Torus: Isometric 3D projection of a magnetic flux knot toroidal field ($R=115, r=48$).

5. CHROMATIC SPECTRA:
   - Ethereal Gold (Default): Deep bronze obsidian void with rich amber, electric cyan contrast, and white-hot core.
   - Hyperion Blue: Deepest oceanic void with neon cyan, sky azure, royal violet, and white core.
   - Borealis Emerald: Dark black jade void with neon emerald, turquoise, mint aura, and white core.
   - Supernova Iris: Dark cosmic amethyst void with vibrant magenta-orchid, hot crimson, electric cyan, and white core.
   - Solar Flare: Volcanic obsidian void with blazing plasma orange-red, molten gold, cyan spark, and white core.
   - Cosmic Amethyst: Void violet with deep ultraviolet, fuchsia, solar amber, and white core.
```

---

## 2. ARCHITECTURAL FILE MAPPING

| File Path | Role | Key Constraints |
|---|---|---|
| `src/main.jsx` | React Mount | **No `<StrictMode>`**. Direct `createRoot().render(<App />)`. |
| `src/App.jsx` | Main Thread Orchestrator | Owns HUD state. Captures pointer events. Calls `canvas.transferControlToOffscreen()`. Proxies updates to worker via `postMessage`. |
| `src/workers/renderer.worker.js` | Dedicated Graphics Thread | Owns `canvas.getContext('2d')`, RAF loop, sprite generators, particle array, physics, and FPS counter. |
| `src/components/ControlPanel.jsx` | Glassmorphic HUD | Controls Geometry (5 shapes), Exposure slider, Dispersion, Drift, Particles, Gravity toggle, Nova pulse, Palettes (6 themes), Presets. |
| `src/components/ControlPanel.css` | HUD Styling | Promoted to GPU layer via `transform: translateZ(0); will-change: transform;`. |
| `src/config/palettes.js` | Color Themes | Ethereal Gold (Default), Hyperion Blue, Borealis Emerald, Supernova Iris, Solar Flare, Cosmic Amethyst. |

---

## 3. CALIBRATED ENGINE PARAMETERS

```javascript
// Density normalizer in worker render loop:
const densityComp = Math.min(1.2, Math.sqrt(2400 / Math.max(n, 800)))

// Particle Alpha formula:
const twinkle = 0.75 + 0.25 * Math.sin(timeSec * 3 + p.twinklePhase)
const alpha = Math.min(p.baseAlpha * densityComp * curExp * twinkle, 1.0)

// Physics constants:
influenceRadius = 140
force = Math.pow(1 - dist / influenceRadius, 2) * 5.5
friction = 0.88 // aerodynamic velocity damping
morphSpeed = 0.045 // attractor lerp speed
```

---

## 4. EMERGENCY RESTORATION RUNBOOK

If the build breaks or the screen goes black:
1. Verify `main.jsx` has NO `StrictMode`.
2. Ensure `renderer.worker.js` sets `canvas.width` and `canvas.height` in `case 'init'`.
3. Run lint & build:
   ```bash
   npm run lint
   npm run build
   ```
4. Restart the Vite dev server to clear cached HMR module memory:
   ```bash
   kill $(lsof -t -i:5173)
   npm run dev
   ```
