// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — sternstaub
//
// Pure HTML5 Canvas 2D particle engine. Zero external 3D dependencies.
// ~1,800 particles shaped into a humanoid silhouette with parametric distribution.
//
// PERFORMANCE ARCHITECTURE:
// - Hardware-accelerated GPU sprite blitting (offscreen radial gradient cache)
// - Additive blending ("lighter" composite) for white-hot core optical radiance
// - Zero per-frame shadowBlur / save / restore calls (eliminates 100k+ CPU blurs/sec)
// - Cached background gradients & decoupled direct-DOM FPS telemetry
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import { PALETTES }  from './config/palettes'
import ControlPanel  from './components/ControlPanel'
import './App.css'

const PARTICLE_COUNT = 1800

// Helper to convert hex strings to rgba
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '')
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('')
  }
  const num = parseInt(c, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ── Offscreen Sprite Generator ───────────────────────────────────────────────
// Pre-renders a radial glow particle once into an offscreen canvas.
// Enables direct GPU texture blits via drawImage() at 60-120 FPS.
function createGlowSprite(hexColor) {
  const size = 64
  const half = size / 2
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const sCtx = offscreen.getContext('2d')

  const grad = sCtx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.18, hexToRgba(hexColor, 0.95))
  grad.addColorStop(0.48, hexToRgba(hexColor, 0.32))
  grad.addColorStop(1, hexToRgba(hexColor, 0))

  sCtx.fillStyle = grad
  sCtx.fillRect(0, 0, size, size)
  return offscreen
}

// ── Humanoid silhouette point generator ──────────────────────────────────────
function getSilhouetteTarget() {
  const u = Math.random()

  if (u < 0.18) {
    // HEAD — tight circular cluster near top
    const r     = Math.sqrt(Math.random()) * 26
    const theta = Math.random() * Math.PI * 2
    return {
      x: r * Math.cos(theta),
      y: -110 + r * Math.sin(theta),
    }
  }

  if (u < 0.65) {
    // TORSO & SHOULDERS — vertical band, wider at shoulders
    const h    = Math.random()
    const span = 55 * Math.sin(h * Math.PI)  // widest at mid-torso
    return {
      x: (Math.random() - 0.5) * span * 2,
      y: -80 + h * 120,
    }
  }

  // LEGS — two columns that dissolve at the bottom
  const leg      = Math.random() > 0.5 ? 16 : -16
  const progress = Math.random()
  return {
    x: leg + (Math.random() - 0.5) * (18 + progress * 24),
    y: 40 + progress * 100,
  }
}

// ── Single particle class ─────────────────────────────────────────────────────
class Particle {
  constructor() { this.reset() }

  reset() {
    const target     = getSilhouetteTarget()
    this.baseX       = target.x
    this.baseY       = target.y
    this.x           = this.baseX
    this.y           = this.baseY
    this.radius      = Math.random() * 2.5 + 0.8
    this.angle       = Math.random() * Math.PI * 2
    this.frequency   = Math.random() * 0.02 + 0.01   // oscillation velocity
    this.amplitude   = Math.random() * 25 + 5         // drift range
    this.colorIdx    = Math.floor(Math.random() * 4)  // palette color index
    this.alpha       = Math.random() * 0.6 + 0.4
  }

  update(dispersion, drift) {
    this.angle += this.frequency * drift

    // Fast harmonic trigonometric displacement
    const noiseX = Math.cos(this.angle + this.baseY * 0.05) * this.amplitude
    const noiseY = Math.sin(this.angle + this.baseX * 0.05) * this.amplitude

    const targetX = this.baseX + noiseX * dispersion
    const targetY = this.baseY + noiseY * dispersion

    // Smooth lerp
    this.x += (targetX - this.x) * 0.1
    this.y += (targetY - this.y) * 0.1
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef = useRef(null)
  const fpsBadgeRef = useRef(null)

  // State
  const [dispersion,    setDispersion]    = useState(1)
  const [driftSpeed,    setDriftSpeed]    = useState(2)
  const [particleCount, setParticleCount] = useState(PARTICLE_COUNT)
  const [palette,       setPalette]       = useState('cosmicBlue')

  // Live ref to avoid re-binding RAF loop on slider drag
  const stateRef = useRef({ dispersion, driftSpeed, palette })
  useEffect(() => {
    stateRef.current = { dispersion, driftSpeed, palette }
  }, [dispersion, driftSpeed, palette])

  // Pre-render offscreen sprite cache on palette change
  const spritesRef = useRef([])
  useEffect(() => {
    const pal = PALETTES[palette] || PALETTES.cosmicBlue
    spritesRef.current = pal.glow.map(color => createGlowSprite(color))
  }, [palette])

  // Particle instances
  const particlesRef = useRef([])
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => new Particle())
  }, [particleCount])

  // Reset handler
  const reset = useCallback(() => {
    setDispersion(1)
    setDriftSpeed(2)
    particlesRef.current = Array.from(
      { length: particleCount },
      () => new Particle()
    )
  }, [particleCount])

  // ── Main animation loop ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false }) // alpha: false enables direct framebuffer blits
    let rafId

    // Background gradient cache
    let cachedBg = null
    let cachedW  = 0
    let cachedH  = 0
    let cachedPal = ''

    // FPS Telemetry
    let frameCount = 0
    let lastTime   = performance.now()

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      cachedBg = null // invalidate cache on resize
    }
    resize()
    window.addEventListener('resize', resize)

    const render = (now) => {
      const { dispersion, driftSpeed, palette: curPal } = stateRef.current
      const pal = PALETTES[curPal] || PALETTES.cosmicBlue
      const w   = canvas.width
      const h   = canvas.height
      const cx  = w * 0.5
      const cy  = h * 0.5

      // ── Background pass ──
      if (!cachedBg || cachedW !== w || cachedH !== h || cachedPal !== curPal) {
        cachedBg = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.6)
        cachedBg.addColorStop(0, pal.bgStart)
        cachedBg.addColorStop(1, pal.bgEnd)
        cachedW  = w
        cachedH  = h
        cachedPal = curPal
      }
      ctx.fillStyle = cachedBg
      ctx.fillRect(0, 0, w, h)

      // ── Additive GPU Blitting pass ──
      ctx.globalCompositeOperation = 'lighter'

      const sprites = spritesRef.current
      const particles = particlesRef.current
      const numSprites = sprites.length

      if (numSprites > 0) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          p.update(dispersion, driftSpeed)

          ctx.globalAlpha = p.alpha
          const sprite = sprites[p.colorIdx % numSprites]
          const size = p.radius * 7 // scaled optical glow halo
          ctx.drawImage(sprite, cx + p.x - size * 0.5, cy + p.y - size * 0.5, size, size)
        }
      }

      ctx.globalCompositeOperation = 'source-over'

      // ── Telemetry (Every 500ms) ──
      frameCount++
      if (now - lastTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime))
        if (fpsBadgeRef.current) {
          fpsBadgeRef.current.textContent = `${fps} FPS`
        }
        frameCount = 0
        lastTime = now
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="app">
      <canvas ref={canvasRef} className="main-canvas" />
      <ControlPanel
        dispersion={dispersion}
        driftSpeed={driftSpeed}
        particleCount={particleCount}
        palette={palette}
        setDispersion={setDispersion}
        setDriftSpeed={setDriftSpeed}
        setParticleCount={setParticleCount}
        setPalette={setPalette}
        onReset={reset}
        fpsBadgeRef={fpsBadgeRef}
      />
    </div>
  )
}
