// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — sternstaub ✦
//
// High-Performance Pure Canvas 2D Celestial Particle Engine (Tier 1).
// Zero 3D dependencies. Up to 10,000 particles at 60-120 FPS.
//
// ARCHITECTURAL UPGRADES:
// - Dynamic HDR Exposure scaling: Prevents #FFFFFF whiteout blowout at high densities
// - 4 Morphing Celestial Geometries: Astral Silhouette, Cosmic Singularity,
//   Spiral Galaxy, Quantum Torus with real-time fluid particle lerping
// - 3-Tier Multi-Spectral Sprite Cache: Nebula Mist (wide gas), Body Mass (chromatic
//   radiance), Stellar Sparkle (twinkling flare points)
// - Real-time Gravitational Cursor Wake & Supernova Shockwave Physics
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import { PALETTES }  from './config/palettes'
import ControlPanel  from './components/ControlPanel'
import './App.css'

const DEFAULT_PARTICLES = 2200

// Helper: Hex string to RGBA
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

// ── Multi-Spectral Sprite Generators ─────────────────────────────────────────

// Tier 0: Nebula Mist (128x128 wide diffuse gas cloud, zero harsh center)
function createNebulaSprite(hexColor) {
  const size = 128
  const half = size / 2
  const offscreen = document.createElement('canvas')
  offscreen.width = offscreen.height = size
  const sCtx = offscreen.getContext('2d')

  const grad = sCtx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, hexToRgba(hexColor, 0.4))
  grad.addColorStop(0.3, hexToRgba(hexColor, 0.2))
  grad.addColorStop(0.6, hexToRgba(hexColor, 0.07))
  grad.addColorStop(1, hexToRgba(hexColor, 0))

  sCtx.fillStyle = grad
  sCtx.fillRect(0, 0, size, size)
  return offscreen
}

// Tier 1: Body Mass (64x64 luminous chromatic orb with glowing core)
function createBodySprite(hexColor) {
  const size = 64
  const half = size / 2
  const offscreen = document.createElement('canvas')
  offscreen.width = offscreen.height = size
  const sCtx = offscreen.getContext('2d')

  const grad = sCtx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  grad.addColorStop(0.18, hexToRgba(hexColor, 0.9))
  grad.addColorStop(0.5, hexToRgba(hexColor, 0.28))
  grad.addColorStop(1, hexToRgba(hexColor, 0))

  sCtx.fillStyle = grad
  sCtx.fillRect(0, 0, size, size)
  return offscreen
}

// Tier 2: Stellar Sparkle (32x32 diffraction star flare with cross rays)
function createSparkleSprite(hexColor) {
  const size = 32
  const half = size / 2
  const offscreen = document.createElement('canvas')
  offscreen.width = offscreen.height = size
  const sCtx = offscreen.getContext('2d')

  // Core point
  const grad = sCtx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.25, hexToRgba(hexColor, 0.8))
  grad.addColorStop(1, hexToRgba(hexColor, 0))

  sCtx.fillStyle = grad
  sCtx.fillRect(0, 0, size, size)

  // 4-point subtle diffraction spikes
  sCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  sCtx.lineWidth = 0.75
  sCtx.beginPath()
  sCtx.moveTo(half, half - 10)
  sCtx.lineTo(half, half + 10)
  sCtx.moveTo(half - 10, half)
  sCtx.lineTo(half + 10, half)
  sCtx.stroke()

  return offscreen
}

// ── Parametric Geometry Generators ───────────────────────────────────────────

// Shape 1: Astral Humanoid Silhouette (Sculpted anatomy with cranial halo)
function getSilhouetteTarget() {
  const u = Math.random()

  // 1. Cranial Halo Ring (6%)
  if (u < 0.06) {
    const angle = Math.random() * Math.PI * 2
    const r = 32 + (Math.random() - 0.5) * 6
    return {
      x: r * Math.cos(angle),
      y: -140 + r * Math.sin(angle) * 0.35,
    }
  }

  // 2. Head & Brain Core (12%)
  if (u < 0.18) {
    const r = Math.sqrt(Math.random()) * 22
    const theta = Math.random() * Math.PI * 2
    return {
      x: r * Math.cos(theta),
      y: -130 + r * Math.sin(theta) * 1.15,
    }
  }

  // 3. Central Spinal Chakra Line (10% - high energy chord)
  if (u < 0.28) {
    const yProg = Math.random()
    return {
      x: (Math.random() - 0.5) * 6,
      y: -110 + yProg * 140,
    }
  }

  // 4. Clavicle, Chest & Shoulders (24%)
  if (u < 0.52) {
    const yProg = Math.random()
    const shoulderWidth = 84 * Math.sin(yProg * Math.PI)
    return {
      x: (Math.random() - 0.5) * shoulderWidth,
      y: -105 + yProg * 50,
    }
  }

  // 5. Waist & Pelvis (16%)
  if (u < 0.68) {
    const yProg = Math.random()
    // Inverted hourglass contour
    const waistWidth = 36 + Math.pow(yProg - 0.4, 2) * 50
    return {
      x: (Math.random() - 0.5) * waistWidth,
      y: -55 + yProg * 65,
    }
  }

  // 6. Astral Limbs & Legs fading into Stardust (32%)
  const leg = Math.random() > 0.5 ? 17 : -17
  const progress = Math.random()
  // Taper through thighs, calves, and dissolve into ascending vapor
  const spread = 12 + Math.pow(progress, 1.8) * 34
  return {
    x: leg + (Math.random() - 0.5) * spread,
    y: 10 + progress * 140,
  }
}

// Shape 2: Cosmic Singularity (Black Hole & Relativistic Accretion Disk)
function getSingularityTarget() {
  const u = Math.random()

  // Event Horizon Photon Ring (Concentrated bright ring at edge of abyss)
  if (u < 0.22) {
    const theta = Math.random() * Math.PI * 2
    const r = 32 + (Math.random() - 0.5) * 4
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta) * 0.42,
    }
  }

  // Relativistic Plasma Jets (Vertical polar beams)
  if (u < 0.32) {
    const dir = Math.random() > 0.5 ? 1 : -1
    const dist = 30 + Math.pow(Math.random(), 1.5) * 160
    return {
      x: (Math.random() - 0.5) * (14 + dist * 0.08),
      y: dir * dist,
    }
  }

  // Tilted Accretion Disk with Doppler Spiral Asymmetry
  const theta = Math.random() * Math.PI * 2
  const r = 35 + Math.pow(Math.random(), 1.4) * 180
  // Mild warp simulation
  const warp = Math.sin(theta) * 12
  return {
    x: r * Math.cos(theta),
    y: (r * Math.sin(theta) + warp) * 0.38,
  }
}

// Shape 3: Spiral Galaxy (Logarithmic Dual-Arm Milky Way)
function getGalaxyTarget() {
  const u = Math.random()

  // Galactic Bulge Core (20%)
  if (u < 0.20) {
    const r = Math.sqrt(Math.random()) * 36
    const theta = Math.random() * Math.PI * 2
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta) * 0.65,
    }
  }

  // 2 Logarithmic Spiral Arms
  const arm = Math.random() > 0.5 ? 0 : Math.PI
  const t = Math.random() * 3.8
  const r = 30 * Math.exp(0.42 * t)
  const theta = t * 1.7 + arm
  const dispersion = (Math.random() - 0.5) * (12 + t * 9)

  return {
    x: (r + dispersion) * Math.cos(theta),
    y: (r + dispersion) * Math.sin(theta) * 0.62,
  }
}

// Shape 4: Quantum Torus (Toroidal Magnetic Flux Knot)
function getTorusTarget() {
  const u = Math.random() * Math.PI * 2
  const v = Math.random() * Math.PI * 2
  const R = 115 // Major radius
  const r = 48  // Minor radius

  // Parametric 3D Torus projected to 2D isometric view
  const x3 = (R + r * Math.cos(v)) * Math.cos(u)
  const y3 = (R + r * Math.cos(v)) * Math.sin(u)
  const z3 = r * Math.sin(v)

  // Isometric rotation
  const isoX = x3 * 0.866 - y3 * 0.5
  const isoY = (x3 * 0.5 + y3 * 0.866) * 0.55 - z3 * 0.7

  return { x: isoX, y: isoY }
}

// Target coordinate dispatcher
function getTargetForShape(shape) {
  switch (shape) {
    case 'singularity': return getSingularityTarget()
    case 'galaxy':      return getGalaxyTarget()
    case 'torus':       return getTorusTarget()
    case 'silhouette':
    default:            return getSilhouetteTarget()
  }
}

// ── Single Particle Class ────────────────────────────────────────────────────
class Particle {
  constructor(initialShape) {
    const target = getTargetForShape(initialShape)
    this.baseX = target.x
    this.baseY = target.y
    this.targetBaseX = this.baseX
    this.targetBaseY = this.baseY

    this.x = this.baseX
    this.y = this.baseY
    this.vx = 0
    this.vy = 0

    // Assign particle tier: 0 = Nebula Mist (18%), 1 = Body Mass (67%), 2 = Sparkle (15%)
    const roll = Math.random()
    if (roll < 0.18) {
      this.tier = 0
      this.baseSize = Math.random() * 22 + 14 // Large diffuse gas
      this.baseAlpha = Math.random() * 0.12 + 0.05
    } else if (roll < 0.85) {
      this.tier = 1
      this.baseSize = Math.random() * 8 + 3 // Chromatic body
      this.baseAlpha = Math.random() * 0.35 + 0.2
    } else {
      this.tier = 2
      this.baseSize = Math.random() * 4 + 2 // Sparkling stars
      this.baseAlpha = Math.random() * 0.7 + 0.3
    }

    this.colorIdx = Math.floor(Math.random() * 4)
    this.angle = Math.random() * Math.PI * 2
    this.frequency = Math.random() * 0.02 + 0.008
    this.amplitude = Math.random() * 20 + 6
    this.twinklePhase = Math.random() * Math.PI * 2
    this.twinkleSpeed = Math.random() * 0.04 + 0.01
  }

  morphTo(shape) {
    const target = getTargetForShape(shape)
    this.targetBaseX = target.x
    this.targetBaseY = target.y
  }

  update(dispersion, drift, pointer, gravityEnabled, shockwave) {
    // 1. Fluid geometric morphing toward active shape target
    this.baseX += (this.targetBaseX - this.baseX) * 0.045
    this.baseY += (this.targetBaseY - this.baseY) * 0.045

    // 2. Harmonic organic wave oscillation
    this.angle += this.frequency * drift
    const noiseX = Math.cos(this.angle + this.baseY * 0.04) * this.amplitude
    const noiseY = Math.sin(this.angle + this.baseX * 0.04) * this.amplitude

    const targetX = this.baseX + noiseX * dispersion
    const targetY = this.baseY + noiseY * dispersion

    // 3. Elastic return to harmonic home
    this.vx += (targetX - this.x) * 0.08
    this.vy += (targetY - this.y) * 0.08

    // 4. Cursor Gravitational Wake (Fluid swirl & repulsion)
    if (gravityEnabled && pointer && pointer.active) {
      const dx = this.x - pointer.relX
      const dy = this.y - pointer.relY
      const distSq = dx * dx + dy * dy
      const influenceRadius = 140
      if (distSq < influenceRadius * influenceRadius && distSq > 1) {
        const dist = Math.sqrt(distSq)
        const force = Math.pow(1 - dist / influenceRadius, 2) * 5.5
        // Radial repulsion + tangential swirl
        this.vx += (dx / dist) * force - (dy / dist) * force * 0.8
        this.vy += (dy / dist) * force + (dx / dist) * force * 0.8
      }
    }

    // 5. Supernova Shockwave interaction
    if (shockwave && shockwave.active) {
      const dx = this.x - shockwave.x
      const dy = this.y - shockwave.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const diff = Math.abs(dist - shockwave.radius)
      if (diff < 50) {
        const kick = (1 - diff / 50) * shockwave.force
        this.vx += (dx / (dist || 1)) * kick
        this.vy += (dy / (dist || 1)) * kick
      }
    }

    // Velocity integration with exponential aerodynamic friction
    this.vx *= 0.88
    this.vy *= 0.88
    this.x += this.vx
    this.y += this.vy
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Component
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef   = useRef(null)
  const fpsBadgeRef = useRef(null)

  // System State
  const [shape,         setShape]         = useState('silhouette') // silhouette | singularity | galaxy | torus
  const [palette,       setPalette]       = useState('etherealGold')
  const [exposure,      setExposure]      = useState(1.0)
  const [dispersion,    setDispersion]    = useState(1.0)
  const [driftSpeed,    setDriftSpeed]    = useState(1.8)
  const [particleCount, setParticleCount] = useState(DEFAULT_PARTICLES)
  const [gravity,       setGravity]       = useState(true)

  // Live refs for 60 FPS animation loop continuity
  const stateRef = useRef({ shape, palette, exposure, dispersion, driftSpeed, gravity })
  useEffect(() => {
    stateRef.current = { shape, palette, exposure, dispersion, driftSpeed, gravity }
  }, [shape, palette, exposure, dispersion, driftSpeed, gravity])

  // Mouse & Shockwave physics refs
  const pointerRef   = useRef({ relX: 0, relY: 0, active: false })
  const shockwaveRef = useRef({ x: 0, y: 0, radius: 0, maxRadius: 650, speed: 22, force: 30, active: false })

  // Trigger supernova blast
  const triggerShockwave = useCallback((relX = 0, relY = 0) => {
    shockwaveRef.current = {
      x: relX,
      y: relY,
      radius: 5,
      maxRadius: 750,
      speed: 24,
      force: 35,
      active: true,
    }
  }, [])

  // Multi-spectral sprite cache: [tier0 (nebula), tier1 (body), tier2 (sparkle)]
  const spritesRef = useRef({ nebula: [], body: [], sparkle: [] })
  useEffect(() => {
    const pal = PALETTES[palette] || PALETTES.cosmicBlue
    spritesRef.current = {
      nebula:  pal.glow.map(color => createNebulaSprite(color)),
      body:    pal.glow.map(color => createBodySprite(color)),
      sparkle: pal.glow.map(color => createSparkleSprite(color)),
    }
  }, [palette])

  // Particle instances
  const shapeRef = useRef(shape)
  useEffect(() => {
    shapeRef.current = shape
  }, [shape])

  const particlesRef = useRef([])
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => new Particle(shapeRef.current))
  }, [particleCount])

  // Morph particles when shape selector changes
  useEffect(() => {
    for (const p of particlesRef.current) {
      p.morphTo(shape)
    }
  }, [shape])

  // Reset defaults
  const reset = useCallback(() => {
    setShape('silhouette')
    setPalette('cosmicBlue')
    setExposure(1.0)
    setDispersion(1.0)
    setDriftSpeed(1.8)
    setGravity(true)
    for (const p of particlesRef.current) {
      p.morphTo('silhouette')
    }
  }, [])

  // ── Main Render Pipeline ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    let rafId

    // Background gradient cache
    let cachedBg  = null
    let cachedW   = 0
    let cachedH   = 0
    let cachedPal = ''

    // Telemetry tracking
    let frameCount = 0
    let lastTime   = performance.now()

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      cachedBg = null
    }
    resize()
    window.addEventListener('resize', resize)

    const render = (now) => {
      const { palette: curPal, exposure: curExp, dispersion: curDisp, driftSpeed: curDrift, gravity: curGrav } = stateRef.current
      const pal = PALETTES[curPal] || PALETTES.cosmicBlue
      const w   = canvas.width
      const h   = canvas.height
      const cx  = w * 0.5
      const cy  = h * 0.5

      // Advance shockwave
      const shockwave = shockwaveRef.current
      if (shockwave.active) {
        shockwave.radius += shockwave.speed
        shockwave.force  *= 0.94
        if (shockwave.radius >= shockwave.maxRadius || shockwave.force < 0.2) {
          shockwave.active = false
        }
      }

      // ── 1. Cosmic Background Gradient ──
      if (!cachedBg || cachedW !== w || cachedH !== h || cachedPal !== curPal) {
        cachedBg = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(w, h) * 0.65)
        cachedBg.addColorStop(0, pal.bgStart)
        cachedBg.addColorStop(1, pal.bgEnd)
        cachedW  = w
        cachedH  = h
        cachedPal = curPal
      }
      ctx.fillStyle = cachedBg
      ctx.fillRect(0, 0, w, h)

      // ── 2. Additive GPU Blitting Pass ──
      ctx.globalCompositeOperation = 'lighter'

      const sprites   = spritesRef.current
      const particles = particlesRef.current
      const pointer   = pointerRef.current
      const numParticles = particles.length

      // Dynamic HDR Density Normalizer: prevents core white-out saturation at large particle counts
      const densityCompensation = Math.sqrt(1800 / Math.max(numParticles, 500))
      const timeSec = now * 0.001

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i]
        p.update(curDisp, curDrift, pointer, curGrav, shockwave)

        // Celestial twinkle modulation
        const twinkle = 0.75 + 0.25 * Math.sin(timeSec * 3 + p.twinklePhase)
        const alpha = Math.min(p.baseAlpha * densityCompensation * curExp * twinkle, 1.0)
        ctx.globalAlpha = alpha

        // Select sprite by tier
        let sprite
        let size = p.baseSize
        const colorIdx = p.colorIdx % 4

        if (p.tier === 0 && sprites.nebula[colorIdx]) {
          sprite = sprites.nebula[colorIdx]
        } else if (p.tier === 2 && sprites.sparkle[colorIdx]) {
          sprite = sprites.sparkle[colorIdx]
        } else if (sprites.body[colorIdx]) {
          sprite = sprites.body[colorIdx]
        }

        if (sprite) {
          ctx.drawImage(sprite, cx + p.x - size * 0.5, cy + p.y - size * 0.5, size, size)
        }
      }

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over'

      // ── 3. Subtle Cinematic Edge Vignette ──
      const vigGrad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.45, cx, cy, Math.max(w, h) * 0.75)
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)')
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.65)')
      ctx.fillStyle = vigGrad
      ctx.fillRect(0, 0, w, h)

      // ── 4. FPS Telemetry (Direct-DOM) ──
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

  // Mouse / Pointer handlers
  const handlePointerMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointerRef.current = {
      relX: e.clientX - rect.left - canvas.width * 0.5,
      relY: e.clientY - rect.top - canvas.height * 0.5,
      active: true,
    }
  }

  const handlePointerLeave = () => {
    pointerRef.current.active = false
  }

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const relX = e.clientX - rect.left - canvas.width * 0.5
    const relY = e.clientY - rect.top - canvas.height * 0.5
    triggerShockwave(relX, relY)
  }

  return (
    <div className="app">
      <canvas
        ref={canvasRef}
        className="main-canvas"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      />
      <ControlPanel
        shape={shape}
        setShape={setShape}
        palette={palette}
        setPalette={setPalette}
        exposure={exposure}
        setExposure={setExposure}
        dispersion={dispersion}
        setDispersion={setDispersion}
        driftSpeed={driftSpeed}
        setDriftSpeed={setDriftSpeed}
        particleCount={particleCount}
        setParticleCount={setParticleCount}
        gravity={gravity}
        setGravity={setGravity}
        onReset={reset}
        onPulseNova={() => triggerShockwave(0, 0)}
        fpsBadgeRef={fpsBadgeRef}
      />
    </div>
  )
}
