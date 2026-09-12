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

// ── Palette data ─────────────────────────────────────────────────────────────
const PALETTES = {
  etherealGold: {
    bgStart: '#241500', bgEnd: '#080400',
    glow: ['#fde047', '#fb923c', '#38bdf8', '#ffffff'],
  },
  cosmicBlue: {
    bgStart: '#061a2c', bgEnd: '#020810',
    glow: ['#00f2fe', '#38bdf8', '#818cf8', '#ffffff'],
  },
  auroraGreen: {
    bgStart: '#002017', bgEnd: '#010906',
    glow: ['#10b981', '#06b6d4', '#6ee7b7', '#ffffff'],
  },
  supernovaRose: {
    bgStart: '#200a2c', bgEnd: '#07020d',
    glow: ['#e879f9', '#f43f5e', '#38bdf8', '#ffffff'],
  },
  solarFlare: {
    bgStart: '#2a0c02', bgEnd: '#0a0200',
    glow: ['#ff5722', '#ffb300', '#38bdf8', '#ffffff'],
  },
  midnightViolet: {
    bgStart: '#1a0d2e', bgEnd: '#05010a',
    glow: ['#a855f7', '#ec4899', '#f59e0b', '#ffffff'],
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

// ── Quantum Anomaly & Astronomical Planet Sprites ────────────────────────────
function createAnomalySprite() {
  const size = 64, half = size / 2
  const oc = new OffscreenCanvas(size, size)
  const sc = oc.getContext('2d')
  const g = sc.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0,    'rgba(255, 255, 255, 1)')
  g.addColorStop(0.16, 'rgba(167, 139, 250, 0.95)') // violet halo
  g.addColorStop(0.38, 'rgba(56, 189, 248, 0.70)')  // electric cyan
  g.addColorStop(0.70, 'rgba(253, 224, 71, 0.30)')  // golden fringe
  g.addColorStop(1,    'rgba(0, 0, 0, 0)')
  sc.fillStyle = g
  sc.fillRect(0, 0, size, size)

  // Prismatic 8-point diffraction star
  sc.strokeStyle = 'rgba(255, 255, 255, 0.95)'
  sc.lineWidth = 1.2
  sc.beginPath()
  sc.moveTo(half, half - 14); sc.lineTo(half, half + 14)
  sc.moveTo(half - 14, half); sc.lineTo(half + 14, half)
  sc.moveTo(half - 7, half - 7); sc.lineTo(half + 7, half + 7)
  sc.moveTo(half - 7, half + 7); sc.lineTo(half + 7, half - 7)
  sc.stroke()
  return oc
}

const PLANET_COLORS = [
  '#cbd5e1', // 0: Mercury (slate silver)
  '#fde047', // 1: Venus (golden sulphur)
  '#38bdf8', // 2: Earth (azure ocean)
  '#f87171', // 3: Mars (crimson red)
  '#fb923c', // 4: Jupiter (amber storm)
  '#facc15', // 5: Saturn (golden ring)
  '#22d3ee', // 6: Uranus (cyan ice)
  '#60a5fa', // 7: Neptune (deep blue)
]

let anomalySprite = createAnomalySprite()
let planetSprites = PLANET_COLORS.map(c => createBodySprite(c))
let solSprite = createBodySprite('#fff7ed')

function rebuildSprites(palette) {
  const pal = PALETTES[palette] || PALETTES.etherealGold
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

function getTarget(shape, particle) {
  if (particle && particle.isAnomaly) {
    switch (shape) {
      case 'solar':       return { x: 108 * Math.cos(particle.orbitTheta || 1.2), y: 108 * Math.sin(particle.orbitTheta || 1.2) * 0.65 }
      case 'singularity': return { x: 44 * Math.cos(1.8), y: 44 * Math.sin(1.8) * 0.42 }
      case 'galaxy':      return { x: 75 * Math.cos(2.2), y: 75 * Math.sin(2.2) * 0.62 }
      case 'torus':       return { x: 110 * 0.866, y: 110 * 0.5 * 0.55 }
      default:            return { x: 0, y: -65 }
    }
  }
  switch (shape) {
    case 'solar':       return getSolarTarget(particle)
    case 'singularity': return getSingularityTarget()
    case 'galaxy':      return getGalaxyTarget()
    case 'torus':       return getTorusTarget()
    default:            return getSilhouetteTarget()
  }
}

// ── Solar System Orbital Physics ─────────────────────────────────────────────
function initSolarParticle(p) {
  const u = Math.random()
  if (u < 0.12) {
    // Sol Core (The Sun)
    p.solarType = 'sun'
    p.orbitR = Math.sqrt(Math.random()) * 26
    p.orbitTheta = Math.random() * Math.PI * 2
    p.orbitOmega = 0.004
    p.orbitInc = 0.70
  } else if (u < 0.36) {
    // 8 Planetary Spheres + Major Moons
    p.solarType = 'planet'
    const pIdx = Math.floor(Math.random() * 8)
    const orbits = [46, 68, 94, 122, 192, 256, 310, 362]
    const omegas = [0.038, 0.027, 0.020, 0.015, 0.008, 0.0055, 0.0038, 0.0026]
    p.orbitR = orbits[pIdx]
    p.orbitOmega = omegas[pIdx]
    const rad = pIdx === 4 ? 8.5 : (pIdx === 5 ? 7.5 : (pIdx === 6 || pIdx === 7 ? 5.5 : 4.0))
    p.clusterR = Math.sqrt(Math.random()) * rad
    p.clusterAngle = Math.random() * Math.PI * 2
    p.orbitTheta = pIdx * 0.785
    p.orbitInc = 0.65
  } else if (u < 0.64) {
    // Main Asteroid Belt (between Mars & Jupiter)
    p.solarType = 'asteroid'
    p.orbitR = 142 + (Math.random() - 0.5) * 36
    p.orbitTheta = Math.random() * Math.PI * 2
    p.orbitOmega = 0.011 + (Math.random() - 0.5) * 0.002
    p.orbitInc = 0.65 + (Math.random() - 0.5) * 0.06
  } else if (u < 0.82) {
    // Saturn Ring System (dense tilted disc orbiting Saturn at R=256)
    p.solarType = 'saturn_ring'
    p.orbitR = 256
    p.orbitOmega = 0.0055
    p.ringR = 12 + Math.random() * 24
    p.ringAngle = Math.random() * Math.PI * 2
    p.orbitTheta = 5 * 0.785
    p.orbitInc = 0.65
  } else if (u < 0.93) {
    // Kuiper Belt & Outskirts
    p.solarType = 'kuiper'
    p.orbitR = 380 + Math.random() * 65
    p.orbitTheta = Math.random() * Math.PI * 2
    p.orbitOmega = 0.0018 + (Math.random() - 0.5) * 0.0006
    p.orbitInc = 0.62 + (Math.random() - 0.5) * 0.10
  } else {
    // Eccentric Comet with Ion Dust Tail
    p.solarType = 'comet'
    p.cometProg = Math.random()
    p.tailOffset = Math.random() * 42
    p.orbitOmega = 0.010
    p.orbitInc = 0.65
  }
}

function getSolarTarget(p) {
  if (!p.solarType) initSolarParticle(p)

  switch (p.solarType) {
    case 'sun': {
      return {
        x: p.orbitR * Math.cos(p.orbitTheta),
        y: p.orbitR * Math.sin(p.orbitTheta) * p.orbitInc,
      }
    }
    case 'planet': {
      const px = p.orbitR * Math.cos(p.orbitTheta)
      const py = p.orbitR * Math.sin(p.orbitTheta) * p.orbitInc
      return {
        x: px + p.clusterR * Math.cos(p.clusterAngle),
        y: py + p.clusterR * Math.sin(p.clusterAngle) * 0.65,
      }
    }
    case 'saturn_ring': {
      const px = p.orbitR * Math.cos(p.orbitTheta)
      const py = p.orbitR * Math.sin(p.orbitTheta) * p.orbitInc
      return {
        x: px + p.ringR * Math.cos(p.ringAngle),
        y: py + p.ringR * Math.sin(p.ringAngle) * 0.28,
      }
    }
    case 'comet': {
      const nu = p.cometProg * Math.PI * 2
      const e = 0.84, a = 190
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu))
      const hx = r * Math.cos(nu - 0.7)
      const hy = r * Math.sin(nu - 0.7) * p.orbitInc
      const dist = Math.sqrt(hx * hx + hy * hy) || 1
      const ux = hx / dist, uy = hy / dist
      return {
        x: hx + ux * p.tailOffset,
        y: hy + uy * p.tailOffset,
      }
    }
    case 'asteroid':
    case 'kuiper':
    default: {
      return {
        x: p.orbitR * Math.cos(p.orbitTheta),
        y: p.orbitR * Math.sin(p.orbitTheta) * p.orbitInc,
      }
    }
  }
}

// ── Particle Class ────────────────────────────────────────────────────────────
class Particle {
  constructor(shape) {
    this.currentShape = shape
    initSolarParticle(this)
    const t = getTarget(shape, this)
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
    this.currentShape = shape
    if (shape === 'solar') {
      initSolarParticle(this)
    }
    const t = getTarget(shape, this)
    this.targetBaseX = t.x
    this.targetBaseY = t.y
  }

  update(dispersion, drift, pointer, gravityOn, shockwave) {
    // Advance continuous orbital movement in solar mode
    if (this.currentShape === 'solar') {
      this.orbitTheta += this.orbitOmega * drift
      if (this.ringAngle !== undefined) this.ringAngle += 0.012 * drift
      if (this.cometProg !== undefined) this.cometProg = (this.cometProg + 0.003 * drift) % 1

      const target = getSolarTarget(this)
      this.targetBaseX = target.x
      this.targetBaseY = target.y
      this.baseX += (this.targetBaseX - this.baseX) * 0.065
      this.baseY += (this.targetBaseY - this.baseY) * 0.065
    } else {
      // Morph lerp
      this.baseX += (this.targetBaseX - this.baseX) * 0.045
      this.baseY += (this.targetBaseY - this.baseY) * 0.045
    }

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
  gravity:       false,
}

// Background cache
let bgGrad = null, bgW = 0, bgH = 0, bgPal = ''

// Vignette cache
let vigGrad = null, vigW = 0, vigH = 0

const pointer   = { relX: 0, relY: 0, active: false }
const shockwave = { x: 0, y: 0, radius: 0, maxRadius: 750, speed: 24, force: 35, active: false }
let autoNova    = false
let lastNovaTime = 0

// ── Wormhole Spacetime State Machine ─────────────────────────────────────────
const wormhole = {
  state:       'idle', // 'idle' | 'collapse' | 'horizon' | 'emergence'
  startTime:   0,
  collapseX:   0,
  collapseY:   0,
  targetShape: 'solar',
  morphed:     false,
  lastHovered: false,
}

const CELESTIAL_ORDER = ['silhouette', 'solar', 'singularity', 'galaxy', 'torus']

function getNextShape(current) {
  const idx = CELESTIAL_ORDER.indexOf(current)
  return idx >= 0 ? CELESTIAL_ORDER[(idx + 1) % CELESTIAL_ORDER.length] : 'solar'
}

function triggerWormhole(forcedTarget) {
  if (wormhole.state !== 'idle') return
  const anomaly = particles[0]
  wormhole.state = 'collapse'
  wormhole.startTime = performance.now()
  wormhole.collapseX = (anomaly ? anomaly.x : 0)
  wormhole.collapseY = (anomaly ? anomaly.y : 0)
  wormhole.targetShape = forcedTarget || getNextShape(config.shape)
  wormhole.morphed = false
  self.postMessage({ type: 'wormholePhase', phase: 'collapse', target: wormhole.targetShape })
}

// FPS telemetry
let frameCount = 0
let lastTime   = 0

function rebuild(count, shape) {
  particles = Array.from({ length: count }, (_, i) => {
    const p = new Particle(shape || config.shape)
    if (i === 0) {
      p.isAnomaly = true
      p.tier = 2
      p.baseSize = 24
      p.baseAlpha = 1.0
    }
    return p
  })
}

function render(now) {
  if (!canvas || !ctx) { rafId = requestAnimationFrame(render); return }

  const { palette: curPal, exposure: curExp, dispersion: curDisp, driftSpeed: curDrift, gravity: curGrav } = config
  const pal = PALETTES[curPal] || PALETTES.etherealGold
  const w = canvas.width, h = canvas.height
  const cx = w * 0.5, cy = h * 0.5

  // Advance shockwave
  if (shockwave.active) {
    shockwave.radius += shockwave.speed
    shockwave.force  *= 0.94
    if (shockwave.radius >= shockwave.maxRadius || shockwave.force < 0.2) {
      shockwave.active = false
      lastNovaTime = now
    }
  } else if (autoNova && (now - lastNovaTime >= 650)) {
    shockwave.x = 0
    shockwave.y = 0
    shockwave.radius = 5
    shockwave.force = 35
    shockwave.active = true
    lastNovaTime = now
  }

  // Check Quantum Anomaly Hover
  const anomaly = particles[0]
  let isAnomalyHovered = false
  if (anomaly && anomaly.isAnomaly && pointer.active && wormhole.state === 'idle') {
    const adx = anomaly.x - pointer.relX
    const ady = anomaly.y - pointer.relY
    const aDist = Math.sqrt(adx * adx + ady * ady)
    isAnomalyHovered = aDist < 48
  }
  if (isAnomalyHovered !== wormhole.lastHovered) {
    wormhole.lastHovered = isAnomalyHovered
    self.postMessage({
      type: 'anomalyHover',
      hovered: isAnomalyHovered,
      x: anomaly ? cx + anomaly.x : cx,
      y: anomaly ? cy + anomaly.y : cy,
    })
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

  // ── 2. Keplerian Orbital Track Lines (Solar Mode Only) ──
  if (config.shape === 'solar' && wormhole.state === 'idle') {
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.045)'
    ctx.lineWidth = 1.0
    const orbits = [46, 68, 94, 122, 192, 256, 310, 362]
    for (let i = 0; i < orbits.length; i++) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, orbits[i], orbits[i] * 0.65, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // ── 3. Wormhole Physics & State Advances ──
  const n = particles.length

  if (wormhole.state === 'collapse') {
    const elapsed = (now - wormhole.startTime) / 1000
    const duration = 1.8
    const prog = Math.min(elapsed / duration, 1.0)

    // Extreme relativistic vortex suction
    for (let i = 0; i < n; i++) {
      const p = particles[i]
      const dx = wormhole.collapseX - p.x
      const dy = wormhole.collapseY - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const pull = Math.min(26, 650 / (dist + 10)) * (0.8 + prog * 0.9)
      p.vx += (dx / (dist || 1)) * pull
      p.vy += (dy / (dist || 1)) * pull
      // Relativistic frame-dragging rotation
      p.vx += -(dy / (dist || 1)) * pull * 1.6
      p.vy +=  (dx / (dist || 1)) * pull * 1.6
      p.vx *= 0.89
      p.vy *= 0.89
      p.x += p.vx
      p.y += p.vy
    }

    if (elapsed >= duration) {
      wormhole.state = 'horizon'
      wormhole.startTime = now
      wormhole.morphed = false
      self.postMessage({ type: 'wormholePhase', phase: 'horizon' })
    }
  } else if (wormhole.state === 'horizon') {
    const elapsed = (now - wormhole.startTime) / 1000
    const duration = 0.8
    const prog = Math.min(elapsed / duration, 1.0)

    if (prog >= 0.4 && !wormhole.morphed) {
      wormhole.morphed = true
      config.shape = wormhole.targetShape
      for (let i = 0; i < n; i++) {
        particles[i].morphTo(config.shape)
      }
    }

    if (elapsed >= duration) {
      wormhole.state = 'emergence'
      wormhole.startTime = now
      // Explosive relativistic ejection outward velocities:
      for (let i = 0; i < n; i++) {
        const p = particles[i]
        p.x = wormhole.collapseX + (Math.random() - 0.5) * 20
        p.y = wormhole.collapseY + (Math.random() - 0.5) * 20
        const ang = Math.random() * Math.PI * 2
        const spd = Math.random() * 24 + 10
        p.vx = Math.cos(ang) * spd
        p.vy = Math.sin(ang) * spd
      }
      self.postMessage({ type: 'wormholePhase', phase: 'emergence', shape: config.shape })
    }
  } else if (wormhole.state === 'emergence') {
    const elapsed = (now - wormhole.startTime) / 1000
    const duration = 2.0
    for (let i = 0; i < n; i++) {
      particles[i].update(curDisp, curDrift, pointer, curGrav, shockwave)
    }
    if (elapsed >= duration) {
      wormhole.state = 'idle'
      self.postMessage({ type: 'wormholeComplete', shape: config.shape })
    }
  } else {
    // Normal update loop
    for (let i = 0; i < n; i++) {
      particles[i].update(curDisp, curDrift, pointer, curGrav, shockwave)
    }
  }

  // ── 4. Additive Particle Blit Pass ──
  ctx.globalCompositeOperation = 'lighter'
  const densityComp = Math.min(1.2, Math.sqrt(2400 / Math.max(n, 800)))
  const timeSec = now * 0.001

  for (let i = 0; i < n; i++) {
    const p = particles[i]

    let twinkle = 0.75 + 0.25 * Math.sin(timeSec * 3 + p.twinklePhase)
    let alpha = Math.min(p.baseAlpha * densityComp * curExp * twinkle, 1.0)
    if (p.isAnomaly) {
      twinkle = 0.8 + 0.3 * Math.sin(timeSec * 8)
      alpha = Math.min(1.0, curExp * twinkle)
    }
    ctx.globalAlpha = alpha

    const ci = p.colorIdx % 4
    let sprite
    if (p.isAnomaly) {
      sprite = anomalySprite
    } else if (config.shape === 'solar' && p.solarType === 'planet') {
      sprite = planetSprites[p.planetIndex % 8] || sprites.body[ci]
    } else if (config.shape === 'solar' && p.solarType === 'sun') {
      sprite = solSprite
    } else {
      sprite = p.tier === 0
        ? sprites.nebula[ci]
        : p.tier === 2
          ? sprites.sparkle[ci]
          : sprites.body[ci]
    }

    if (sprite) {
      const sz = p.isAnomaly ? 24 : p.baseSize
      ctx.drawImage(sprite, cx + p.x - sz * 0.5, cy + p.y - sz * 0.5, sz, sz)
    }

    // Draw Quantum Anomaly targeting reticle
    if (p.isAnomaly && wormhole.state === 'idle') {
      const pulseR = 16 + Math.sin(timeSec * 5) * 3.5
      ctx.strokeStyle = isAnomalyHovered ? 'rgba(253, 224, 71, 0.95)' : 'rgba(56, 189, 248, 0.65)'
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.arc(cx + p.x, cy + p.y, pulseR, 0, Math.PI * 2)
      ctx.stroke()

      if (isAnomalyHovered) {
        // Rotating bracket lock
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.arc(cx + p.x, cy + p.y, pulseR + 6, timeSec * 3.5, timeSec * 3.5 + 1.2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx + p.x, cy + p.y, pulseR + 6, timeSec * 3.5 + Math.PI, timeSec * 3.5 + Math.PI + 1.2)
        ctx.stroke()
      }
    }
  }

  // ── 5. Wormhole Special Optical Passes ──
  if (wormhole.state === 'collapse') {
    const elapsed = (now - wormhole.startTime) / 1000
    const prog = Math.min(elapsed / 1.8, 1.0)
    // Draw event horizon black sphere at singularity
    const r = Math.max(6, 26 * (1 - prog * 0.4))
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(cx + wormhole.collapseX, cy + wormhole.collapseY, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + prog * 0.5})`
    ctx.lineWidth = 2.0
    ctx.stroke()
  } else if (wormhole.state === 'horizon') {
    const elapsed = (now - wormhole.startTime) / 1000
    const prog = Math.min(elapsed / 0.8, 1.0)
    const flash = Math.sin(prog * Math.PI)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.92})`
    ctx.fillRect(0, 0, w, h)
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  // ── 6. Cinematic Vignette ──
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
      shockwave.x      = data.x ?? 0
      shockwave.y      = data.y ?? 0
      shockwave.radius = 5
      shockwave.force  = 35
      shockwave.active = true
      break
    }

    case 'toggleNova': {
      autoNova = !!data.active
      if (autoNova) {
        shockwave.x      = 0
        shockwave.y      = 0
        shockwave.radius = 5
        shockwave.force  = 35
        shockwave.active = true
        lastNovaTime     = performance.now()
      }
      break
    }

    case 'wormhole': {
      triggerWormhole(data.targetShape)
      break
    }

    case 'pointerDown': {
      // Check if user clicked on or near the Quantum Anomaly beacon
      const a = particles[0]
      if (a && a.isAnomaly && wormhole.state === 'idle') {
        const dx = a.x - data.relX
        const dy = a.y - data.relY
        if (Math.sqrt(dx * dx + dy * dy) < 48) {
          triggerWormhole()
          break
        }
      }
      // Otherwise detonate standard supernova shockwave at click point
      shockwave.x      = data.relX
      shockwave.y      = data.relY
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
