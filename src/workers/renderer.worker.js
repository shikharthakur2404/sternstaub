// ─────────────────────────────────────────────────────────────────────────────
// renderer.worker.js — sternstaub Dedicated Render Thread ✦
//
// All Canvas 2D work runs here, completely isolated from the main thread.
// The main thread CANNOT hang this. Spike this to 100% CPU — macOS stays smooth.
//
// Protocol:
//   Main → Worker:  postMessage({ type: 'init', canvas, config })
//   Main → Worker:  postMessage({ type: 'config', ...fields })
//   Main → Worker:  postMessage({ type: 'pointer', relX, relY, active })
//   Main → Worker:  postMessage({ type: 'shockwave', x, y })
//   Main → Worker:  postMessage({ type: 'morph', shape })
//   Main → Worker:  postMessage({ type: 'resize', width, height })
//   Main → Worker:  postMessage({ type: 'rebuild', particleCount })
//   Worker → Main:  postMessage({ type: 'fps', value })
// ─────────────────────────────────────────────────────────────────────────────

// ── Palette data (duplicated from config — workers can't import from main bundle) ──
const PALETTES = {
  cosmicBlue: {
    bgStart: '#102a3a', bgEnd: '#060d14',
    glow: ['#5eead4', '#38bdf8', '#a78bfa', '#ffffff'],
  },
  etherealGold: {
    bgStart: '#241500', bgEnd: '#080400',
    glow: ['#fde047', '#fb923c', '#38bdf8', '#ffffff'],
  },
  navyMauve: {
    bgStart: '#1a1b35', bgEnd: '#080911',
    glow: ['#c084fc', '#e879f9', '#38bdf8', '#fdf4ff'],
  },
  midnightViolet: {
    bgStart: '#2a1538', bgEnd: '#0a0610',
    glow: ['#f59e0b', '#fbbf24', '#ec4899', '#ffffff'],
  },
  auroraGreen: {
    bgStart: '#001a15', bgEnd: '#000a08',
    glow: ['#34d399', '#6ee7b7', '#38bdf8', '#ffffff'],
  },
}

// ── Hex → RGBA helper ─────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map(ch => ch + ch).join('')
  const num = parseInt(c, 16)
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`
}

// ── Sprite Generators (OffscreenCanvas, runs inside Worker) ───────────────────

function createNebulaSprite(hexColor) {
  const size = 96, half = size / 2
  const oc = new OffscreenCanvas(size, size)
  const sc = oc.getContext('2d')
  const g = sc.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0,   hexToRgba(hexColor, 0.48))
  g.addColorStop(0.3, hexToRgba(hexColor, 0.24))
  g.addColorStop(0.65, hexToRgba(hexColor, 0.08))
  g.addColorStop(1,   hexToRgba(hexColor, 0))
  sc.fillStyle = g
  sc.fillRect(0, 0, size, size)
  return oc
}

function createBodySprite(hexColor) {
  const size = 64, half = size / 2
  const oc = new OffscreenCanvas(size, size)
  const sc = oc.getContext('2d')
  const g = sc.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0,    'rgba(255, 255, 255, 1)')
  g.addColorStop(0.18, hexToRgba(hexColor, 0.95))
  g.addColorStop(0.50, hexToRgba(hexColor, 0.40))
  g.addColorStop(1,    hexToRgba(hexColor, 0))
  sc.fillStyle = g
  sc.fillRect(0, 0, size, size)
  return oc
}

function createSparkleSprite(hexColor) {
  const size = 36, half = size / 2
  const oc = new OffscreenCanvas(size, size)
  const sc = oc.getContext('2d')
  const g = sc.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0,    'rgba(255, 255, 255, 1)')
  g.addColorStop(0.25, hexToRgba(hexColor, 0.90))
  g.addColorStop(1,    hexToRgba(hexColor, 0))
  sc.fillStyle = g
  sc.fillRect(0, 0, size, size)
  sc.strokeStyle = 'rgba(255, 255, 255, 0.75)'
  sc.lineWidth = 1.0
  sc.beginPath()
  sc.moveTo(half, half - 11); sc.lineTo(half, half + 11)
  sc.moveTo(half - 11, half); sc.lineTo(half + 11, half)
  sc.stroke()
  return oc
}

function rebuildSprites(palette) {
  const pal = PALETTES[palette] || PALETTES.cosmicBlue
  return {
    nebula:  pal.glow.map(c => createNebulaSprite(c)),
    body:    pal.glow.map(c => createBodySprite(c)),
    sparkle: pal.glow.map(c => createSparkleSprite(c)),
  }
}

// ── Parametric Geometry Generators ───────────────────────────────────────────

function getSilhouetteTarget() {
  const u = Math.random()
  if (u < 0.06) {
    const angle = Math.random() * Math.PI * 2
    const r = 32 + (Math.random() - 0.5) * 6
    return { x: r * Math.cos(angle), y: -140 + r * Math.sin(angle) * 0.35 }
  }
  if (u < 0.18) {
    const r = Math.sqrt(Math.random()) * 22, theta = Math.random() * Math.PI * 2
    return { x: r * Math.cos(theta), y: -130 + r * Math.sin(theta) * 1.15 }
  }
  if (u < 0.28) {
    return { x: (Math.random() - 0.5) * 6, y: -110 + Math.random() * 140 }
  }
  if (u < 0.52) {
    const h = Math.random()
    return { x: (Math.random() - 0.5) * 84 * Math.sin(h * Math.PI), y: -105 + h * 50 }
  }
  if (u < 0.68) {
    const h = Math.random()
    return { x: (Math.random() - 0.5) * (36 + Math.pow(h - 0.4, 2) * 50), y: -55 + h * 65 }
  }
  const leg = Math.random() > 0.5 ? 17 : -17, prog = Math.random()
  return { x: leg + (Math.random() - 0.5) * (12 + Math.pow(prog, 1.8) * 34), y: 10 + prog * 140 }
}

function getSingularityTarget() {
  const u = Math.random()
  if (u < 0.22) {
    const theta = Math.random() * Math.PI * 2, r = 32 + (Math.random() - 0.5) * 4
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) * 0.42 }
  }
  if (u < 0.32) {
    const dir = Math.random() > 0.5 ? 1 : -1, dist = 30 + Math.pow(Math.random(), 1.5) * 160
    return { x: (Math.random() - 0.5) * (14 + dist * 0.08), y: dir * dist }
  }
  const theta = Math.random() * Math.PI * 2, r = 35 + Math.pow(Math.random(), 1.4) * 180
  return { x: r * Math.cos(theta), y: (r * Math.sin(theta) + Math.sin(theta) * 12) * 0.38 }
}

function getGalaxyTarget() {
  const u = Math.random()
  if (u < 0.20) {
    const r = Math.sqrt(Math.random()) * 36, theta = Math.random() * Math.PI * 2
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) * 0.65 }
  }
  const arm = Math.random() > 0.5 ? 0 : Math.PI
  const t = Math.random() * 3.8, r = 30 * Math.exp(0.42 * t), theta = t * 1.7 + arm
  const d = (Math.random() - 0.5) * (12 + t * 9)
  return { x: (r + d) * Math.cos(theta), y: (r + d) * Math.sin(theta) * 0.62 }
}

function getTorusTarget() {
  const u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 2
  const R = 115, r = 48
  const x3 = (R + r * Math.cos(v)) * Math.cos(u)
  const y3 = (R + r * Math.cos(v)) * Math.sin(u)
  const z3 = r * Math.sin(v)
  return {
    x: x3 * 0.866 - y3 * 0.5,
    y: (x3 * 0.5 + y3 * 0.866) * 0.55 - z3 * 0.7,
  }
}

function getTarget(shape) {
  switch (shape) {
    case 'singularity': return getSingularityTarget()
    case 'galaxy':      return getGalaxyTarget()
    case 'torus':       return getTorusTarget()
    default:            return getSilhouetteTarget()
  }
}

// ── Particle Class ────────────────────────────────────────────────────────────
class Particle {
  constructor(shape) {
    const t = getTarget(shape)
    this.baseX = this.targetBaseX = t.x
    this.baseY = this.targetBaseY = t.y
    this.x = t.x; this.y = t.y
    this.vx = 0;  this.vy = 0

    const roll = Math.random()
    if (roll < 0.18) {
      // Nebula Mist: soft luminous cosmic gas aura
      this.tier = 0; this.baseSize = Math.random() * 16 + 14;  this.baseAlpha = Math.random() * 0.18 + 0.12
    } else if (roll < 0.85) {
      // Body Mass: intense chromatic radiance & core brilliance
      this.tier = 1; this.baseSize = Math.random() * 8 + 6;    this.baseAlpha = Math.random() * 0.35 + 0.50
    } else {
      // Stellar Sparkle: sharp piercing diffraction stars
      this.tier = 2; this.baseSize = Math.random() * 4 + 3;    this.baseAlpha = Math.random() * 0.25 + 0.75
    }

    this.colorIdx     = Math.floor(Math.random() * 4)
    this.angle        = Math.random() * Math.PI * 2
    this.frequency    = Math.random() * 0.02 + 0.008
    this.amplitude    = Math.random() * 20 + 6
    this.twinklePhase = Math.random() * Math.PI * 2
    this.twinkleSpeed = Math.random() * 0.04 + 0.01
  }

  morphTo(shape) {
    const t = getTarget(shape)
    this.targetBaseX = t.x
    this.targetBaseY = t.y
  }

  update(dispersion, drift, pointer, gravityOn, shockwave) {
    // Morph lerp
    this.baseX += (this.targetBaseX - this.baseX) * 0.045
    this.baseY += (this.targetBaseY - this.baseY) * 0.045

    // Harmonic oscillation
    this.angle += this.frequency * drift
    const noiseX = Math.cos(this.angle + this.baseY * 0.04) * this.amplitude
    const noiseY = Math.sin(this.angle + this.baseX * 0.04) * this.amplitude
    const tx = this.baseX + noiseX * dispersion
    const ty = this.baseY + noiseY * dispersion

    this.vx += (tx - this.x) * 0.08
    this.vy += (ty - this.y) * 0.08

    // Cursor gravity wake
    if (gravityOn && pointer.active) {
      const dx = this.x - pointer.relX, dy = this.y - pointer.relY
      const dSq = dx * dx + dy * dy
      const ir = 140
      if (dSq < ir * ir && dSq > 1) {
        const d = Math.sqrt(dSq), f = Math.pow(1 - d / ir, 2) * 5.5
        this.vx += (dx / d) * f - (dy / d) * f * 0.8
        this.vy += (dy / d) * f + (dx / d) * f * 0.8
      }
    }

    // Shockwave
    if (shockwave.active) {
      const dx = this.x - shockwave.x, dy = this.y - shockwave.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const diff = Math.abs(dist - shockwave.radius)
      if (diff < 55) {
        const kick = (1 - diff / 55) * shockwave.force
        this.vx += (dx / (dist || 1)) * kick
        this.vy += (dy / (dist || 1)) * kick
      }
    }

    this.vx *= 0.88; this.vy *= 0.88
    this.x  += this.vx;  this.y += this.vy
  }
}

// ── Worker Engine State ────────────────────────────────────────────────────────
let canvas = null
let ctx    = null
let rafId  = null

let particles = []
let sprites   = { nebula: [], body: [], sparkle: [] }

// Live config — updated via postMessage without halting the RAF loop
let config = {
  palette:       'etherealGold',
  shape:         'silhouette',
  exposure:      1.0,
  dispersion:    1.0,
  driftSpeed:    1.8,
  particleCount: 2200,
  gravity:       true,
}

// Background cache
let bgGrad = null, bgW = 0, bgH = 0, bgPal = ''

// Vignette cache
let vigGrad = null, vigW = 0, vigH = 0

const pointer   = { relX: 0, relY: 0, active: false }
const shockwave = { x: 0, y: 0, radius: 0, maxRadius: 750, speed: 24, force: 35, active: false }

// FPS telemetry
let frameCount = 0
let lastTime   = 0

function rebuild(count, shape) {
  particles = Array.from({ length: count }, () => new Particle(shape || config.shape))
}

function render(now) {
  if (!canvas || !ctx) { rafId = requestAnimationFrame(render); return }

  const { palette: curPal, exposure: curExp, dispersion: curDisp, driftSpeed: curDrift, gravity: curGrav } = config
  const pal = PALETTES[curPal] || PALETTES.cosmicBlue
  const w = canvas.width, h = canvas.height
  const cx = w * 0.5, cy = h * 0.5

  // Advance shockwave
  if (shockwave.active) {
    shockwave.radius += shockwave.speed
    shockwave.force  *= 0.94
    if (shockwave.radius >= shockwave.maxRadius || shockwave.force < 0.2) {
      shockwave.active = false
    }
  }

  // ── 1. Background ──
  if (!bgGrad || bgW !== w || bgH !== h || bgPal !== curPal) {
    bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(w, h) * 0.65)
    bgGrad.addColorStop(0, pal.bgStart)
    bgGrad.addColorStop(1, pal.bgEnd)
    bgW = w; bgH = h; bgPal = curPal
  }
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  // Additive Particle Blit Pass
  ctx.globalCompositeOperation = 'lighter'
  const n = particles.length
  const densityComp = Math.min(1.2, Math.sqrt(2400 / Math.max(n, 800)))
  const timeSec = now * 0.001

  for (let i = 0; i < n; i++) {
    const p = particles[i]
    p.update(curDisp, curDrift, pointer, curGrav, shockwave)

    const twinkle = 0.75 + 0.25 * Math.sin(timeSec * 3 + p.twinklePhase)
    const alpha = Math.min(p.baseAlpha * densityComp * curExp * twinkle, 1.0)
    ctx.globalAlpha = alpha

    const ci = p.colorIdx % 4
    const sprite = p.tier === 0
      ? sprites.nebula[ci]
      : p.tier === 2
        ? sprites.sparkle[ci]
        : sprites.body[ci]

    if (sprite) {
      const sz = p.baseSize
      ctx.drawImage(sprite, cx + p.x - sz * 0.5, cy + p.y - sz * 0.5, sz, sz)
    }
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  // ── 3. Cinematic Vignette ──
  if (!vigGrad || vigW !== w || vigH !== h) {
    vigGrad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.42, cx, cy, Math.max(w, h) * 0.78)
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)')
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.65)')
    vigW = w; vigH = h
  }
  ctx.fillStyle = vigGrad
  ctx.fillRect(0, 0, w, h)

  // ── 4. FPS Telemetry ──
  frameCount++
  if (now - lastTime >= 500) {
    const fps = Math.round((frameCount * 1000) / (now - lastTime))
    self.postMessage({ type: 'fps', value: fps })
    frameCount = 0
    lastTime = now
  }

  rafId = requestAnimationFrame(render)
}

// ── Message Handler ───────────────────────────────────────────────────────────
self.onmessage = ({ data }) => {
  switch (data.type) {

    case 'init': {
      canvas = data.canvas
      // Set the pixel buffer to real viewport dimensions IMMEDIATELY.
      // Without this, OffscreenCanvas defaults to 300×150 and CSS stretch
      // makes every particle appear 4-6× larger than intended.
      canvas.width  = data.width  || 1440
      canvas.height = data.height || 900
      ctx = canvas.getContext('2d', { alpha: false })
      Object.assign(config, data.config)
      sprites = rebuildSprites(config.palette)
      rebuild(config.particleCount, config.shape)
      lastTime = performance.now()
      rafId = requestAnimationFrame(render)
      break
    }

    case 'config': {
      const prevPalette = config.palette
      Object.assign(config, data)
      if (data.palette && data.palette !== prevPalette) {
        sprites = rebuildSprites(data.palette)
      }
      break
    }

    case 'morph': {
      config.shape = data.shape
      for (const p of particles) p.morphTo(data.shape)
      break
    }

    case 'rebuild': {
      config.particleCount = data.particleCount
      rebuild(data.particleCount, config.shape)
      break
    }

    case 'pointer': {
      pointer.relX   = data.relX
      pointer.relY   = data.relY
      pointer.active = data.active
      break
    }

    case 'shockwave': {
      shockwave.x      = data.x
      shockwave.y      = data.y
      shockwave.radius = 5
      shockwave.force  = 35
      shockwave.active = true
      break
    }

    case 'resize': {
      canvas.width  = data.width
      canvas.height = data.height
      bgGrad  = null
      vigGrad = null
      break
    }

    case 'stop': {
      if (rafId) cancelAnimationFrame(rafId)
      break
    }
  }
}
