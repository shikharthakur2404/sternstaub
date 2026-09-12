// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — sternstaub
//
// Pure HTML5 Canvas 2D particle system. No Three.js, no GLSL, no heavy deps.
// ~1800 particles shaped into a humanoid silhouette using parametric point
// distribution. Additive blending ("lighter") creates the optical glow effect.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import { PALETTES }  from './config/palettes'
import ControlPanel  from './components/ControlPanel'
import './App.css'

const PARTICLE_COUNT = 1800

// ── Humanoid silhouette point generator ──────────────────────────────────────
// Returns a random {x, y} coordinate shaped like a human body.
// Origin (0,0) is the center of the canvas — coordinates are offsets from center.
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
    this.radius      = Math.random() * 2.6 + 0.8
    this.angle       = Math.random() * Math.PI * 2
    this.frequency   = Math.random() * 0.02 + 0.01   // how fast it oscillates
    this.amplitude   = Math.random() * 25 + 5         // how far it can drift
    this.colorIdx    = Math.floor(Math.random() * 4)  // which palette color to use
    this.alpha       = Math.random() * 0.7 + 0.3
  }

  update(dispersion, drift) {
    // Advance the oscillation angle
    this.angle += this.frequency * drift

    // Compute organic offset using trig — cheap alternative to Perlin noise
    const noiseX = Math.cos(this.angle + this.baseY * 0.05) * this.amplitude
    const noiseY = Math.sin(this.angle + this.baseX * 0.05) * this.amplitude

    // Target position = base silhouette position + noise * dispersion
    const targetX = this.baseX + noiseX * dispersion
    const targetY = this.baseY + noiseY * dispersion

    // Smooth lerp towards target — feels organic, not snappy
    this.x += (targetX - this.x) * 0.1
    this.y += (targetY - this.y) * 0.1
  }

  draw(ctx, colors, cx, cy) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx + this.x, cy + this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle     = colors[this.colorIdx]
    ctx.globalAlpha   = this.alpha
    ctx.shadowColor   = colors[this.colorIdx]
    ctx.shadowBlur    = this.radius * 4  // glow halo around each particle
    ctx.fill()
    ctx.restore()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef = useRef(null)

  // All tunable state
  const [dispersion,    setDispersion]    = useState(1)
  const [driftSpeed,    setDriftSpeed]    = useState(2)
  const [particleCount, setParticleCount] = useState(PARTICLE_COUNT)
  const [palette,       setPalette]       = useState('cosmicBlue')

  // Refs so the animation loop always reads the latest values
  // without needing to re-register the loop on every state change
  const stateRef = useRef({ dispersion, driftSpeed, palette })
  useEffect(() => {
    stateRef.current = { dispersion, driftSpeed, palette }
  }, [dispersion, driftSpeed, palette])

  // Rebuild particles when count changes
  const particlesRef = useRef([])
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => new Particle())
  }, [particleCount])

  // Reset everything to defaults
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
    const ctx    = canvas.getContext('2d')
    let rafId

    // Resize canvas to match its CSS size
    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // particles initialized via separate hook below

    const render = () => {
      const { dispersion, driftSpeed, palette } = stateRef.current
      const pal = PALETTES[palette]
      const w   = canvas.width
      const h   = canvas.height
      const cx  = w / 2  // center x
      const cy  = h / 2  // center y

      // ── Background: radial gradient from config ──
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.6)
      bgGrad.addColorStop(0, pal.bgStart)
      bgGrad.addColorStop(1, pal.bgEnd)
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // ── Additive blending: overlapping particles brighten each other ──
      // This is the key to the "white-hot core" optical glow effect
      ctx.globalCompositeOperation = 'lighter'

      for (const p of particlesRef.current) {
        p.update(dispersion, driftSpeed)
        p.draw(ctx, pal.glow, cx, cy)
      }

      // Reset to normal blending before next frame
      ctx.globalCompositeOperation = 'source-over'

      rafId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, []) // only runs once — stateRef handles live updates

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
      />
    </div>
  )
}
