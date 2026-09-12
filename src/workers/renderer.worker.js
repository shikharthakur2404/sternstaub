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

// ── Real Astronomical Planet Sprites (Authentic Textures & Geometry) ─────────
function createMercurySprite() {
  const size = 32, half = size / 2, r = 7
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')
  const grad = ctx.createRadialGradient(half - 2, half - 2, 1, half, half, r)
  grad.addColorStop(0, '#d1d5db')
  grad.addColorStop(0.45, '#9ca3af')
  grad.addColorStop(0.85, '#4b5563')
  grad.addColorStop(1, '#1f2937')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(31, 41, 55, 0.7)'
  const craters = [[-2, -1, 1.2], [1, 2, 1.5], [-3, 2, 1.0], [2, -2, 1.1], [0, 3, 0.8]]
  craters.forEach(([cx, cy, cr]) => {
    ctx.beginPath(); ctx.arc(half + cx, half + cy, cr, 0, Math.PI * 2); ctx.fill()
  })
  return oc
}

function createVenusSprite() {
  const size = 40, half = size / 2, r = 10
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')
  const grad = ctx.createRadialGradient(half - 3, half - 3, 2, half, half, r)
  grad.addColorStop(0, '#fffbeb')
  grad.addColorStop(0.35, '#fef08a')
  grad.addColorStop(0.7, '#eab308')
  grad.addColorStop(1, '#854d0e')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)'
  ctx.lineWidth = 1.5; ctx.stroke()
  return oc
}

function createEarthSprite() {
  const size = 48, half = size / 2, r = 11
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')
  // Deep oceanic blue
  const ocean = ctx.createRadialGradient(half - 3, half - 3, 2, half, half, r)
  ocean.addColorStop(0, '#38bdf8')
  ocean.addColorStop(0.4, '#1d4ed8')
  ocean.addColorStop(0.85, '#1e3a8a')
  ocean.addColorStop(1, '#0f172a')
  ctx.fillStyle = ocean
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.fill()

  // Continents
  ctx.save()
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = '#15803d'
  ctx.beginPath(); ctx.ellipse(half - 2, half - 3, 4, 3, 0.4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#16a34a'
  ctx.beginPath(); ctx.ellipse(half + 3, half - 2, 4.5, 3.5, -0.3, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#854d0e'
  ctx.beginPath(); ctx.ellipse(half + 1, half + 4, 3, 4.5, 0.2, 0, Math.PI * 2); ctx.fill()

  // White weather cloud swirls
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.lineWidth = 2.0
  ctx.beginPath(); ctx.arc(half - 1, half - 4, 5, 0.8, 2.6); ctx.stroke()
  ctx.beginPath(); ctx.arc(half + 2, half + 2, 6, 2.5, 4.2); ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.beginPath(); ctx.ellipse(half, half, 3, 1.5, 0.2, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Rayleigh scattering atmospheric limb
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)'
  ctx.lineWidth = 1.8
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.stroke()
  return oc
}

function createMarsSprite() {
  const size = 36, half = size / 2, r = 8.5
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')
  const grad = ctx.createRadialGradient(half - 2, half - 2, 1.5, half, half, r)
  grad.addColorStop(0, '#f97316')
  grad.addColorStop(0.45, '#c2410c')
  grad.addColorStop(0.85, '#9a3412')
  grad.addColorStop(1, '#431407')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.fill()

  ctx.save()
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = 'rgba(67, 20, 7, 0.75)'
  ctx.beginPath(); ctx.ellipse(half + 1, half + 1, 3.5, 2.2, 0.5, 0, Math.PI * 2); ctx.fill()
  // White polar ice cap
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.ellipse(half, half - r + 1.2, 3.2, 1.2, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  return oc
}

function createJupiterSprite() {
  const size = 72, half = size / 2, r = 20
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')

  ctx.save()
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.clip()
  const bands = [
    { y: -18, h: 4, c: '#fef3c7' },
    { y: -14, h: 5, c: '#d97706' },
    { y: -9,  h: 4, c: '#fef08a' },
    { y: -5,  h: 5, c: '#9a3412' },
    { y: 0,   h: 4, c: '#fed7aa' },
    { y: 4,   h: 6, c: '#b45309' },
    { y: 10,  h: 5, c: '#fde047' },
    { y: 15,  h: 6, c: '#78350f' },
  ]
  bands.forEach(b => {
    ctx.fillStyle = b.c
    ctx.fillRect(half - r, half + b.y, r * 2, b.h)
  })

  // Great Red Spot
  ctx.fillStyle = '#dc2626'
  ctx.beginPath(); ctx.ellipse(half + 5, half + 6, 4.5, 2.8, -0.1, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 0.9; ctx.stroke()
  ctx.fillStyle = '#fca5a5'
  ctx.beginPath(); ctx.ellipse(half + 5, half + 6, 2.0, 1.0, -0.1, 0, Math.PI * 2); ctx.fill()

  // 3D sphere spherical shadow overlay
  const sphereShade = ctx.createRadialGradient(half - 6, half - 6, 4, half, half, r)
  sphereShade.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
  sphereShade.addColorStop(0.65, 'rgba(0, 0, 0, 0)')
  sphereShade.addColorStop(0.92, 'rgba(0, 0, 0, 0.55)')
  sphereShade.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
  ctx.fillStyle = sphereShade
  ctx.fillRect(half - r, half - r, r * 2, r * 2)
  ctx.restore()
  return oc
}

function createSaturnSprite() {
  const size = 96, half = size / 2, r = 16
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')

  // Back rings (behind globe)
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(half, half, 38, 12, -0.22, Math.PI, Math.PI * 2)
  ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)'; ctx.stroke()
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)'; ctx.stroke()
  ctx.restore()

  // Planet globe
  ctx.save()
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.clip()
  const pGrad = ctx.createRadialGradient(half - 4, half - 4, 3, half, half, r)
  pGrad.addColorStop(0, '#fef9c3')
  pGrad.addColorStop(0.4, '#fde047')
  pGrad.addColorStop(0.75, '#ca8a04')
  pGrad.addColorStop(1, '#713f12')
  ctx.fillStyle = pGrad
  ctx.fillRect(half - r, half - r, r * 2, r * 2)
  ctx.fillStyle = 'rgba(161, 98, 7, 0.35)'
  ctx.fillRect(half - r, half - 4, r * 2, 3)
  ctx.fillRect(half - r, half + 3, r * 2, 4)
  ctx.restore()

  // Front rings (with Cassini division)
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(half, half, 38, 12, -0.22, 0, Math.PI)
  ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(254, 240, 138, 0.55)'; ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(half, half, 32, 10, -0.22, 0, Math.PI)
  ctx.lineWidth = 5.5; ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)'; ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(half, half, 24, 7.5, -0.22, 0, Math.PI)
  ctx.lineWidth = 2.0; ctx.strokeStyle = 'rgba(202, 138, 4, 0.4)'; ctx.stroke()
  ctx.restore()
  return oc
}

function createUranusSprite() {
  const size = 52, half = size / 2, r = 12
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')
  const grad = ctx.createRadialGradient(half - 3, half - 3, 2, half, half, r)
  grad.addColorStop(0, '#cffafe')
  grad.addColorStop(0.4, '#67e8f9')
  grad.addColorStop(0.8, '#0891b2')
  grad.addColorStop(1, '#164e63')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.fill()

  // Tilted ice ring arc
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)'
  ctx.lineWidth = 1.3
  ctx.beginPath(); ctx.ellipse(half, half, 7, 20, 0.35, 0, Math.PI * 2); ctx.stroke()
  return oc
}

function createNeptuneSprite() {
  const size = 52, half = size / 2, r = 12
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')
  const grad = ctx.createRadialGradient(half - 3, half - 3, 2, half, half, r)
  grad.addColorStop(0, '#93c5fd')
  grad.addColorStop(0.35, '#3b82f6')
  grad.addColorStop(0.75, '#1d4ed8')
  grad.addColorStop(1, '#0f172a')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.fill()

  ctx.save()
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = 'rgba(224, 242, 254, 0.9)'
  ctx.fillRect(half - 7, half - 3, 9, 1.3)
  ctx.fillRect(half + 1, half + 4, 8, 1.1)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
  ctx.beginPath(); ctx.ellipse(half + 2, half - 1, 3, 1.8, 0.2, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)'
  ctx.lineWidth = 1.3
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.stroke()
  return oc
}

function createSunSprite() {
  const size = 110, half = size / 2, r = 26
  const oc = new OffscreenCanvas(size, size)
  const ctx = oc.getContext('2d')
  const corona = ctx.createRadialGradient(half, half, r * 0.7, half, half, half)
  corona.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  corona.addColorStop(0.25, 'rgba(253, 224, 71, 0.8)')
  corona.addColorStop(0.55, 'rgba(249, 115, 22, 0.4)')
  corona.addColorStop(0.85, 'rgba(239, 68, 68, 0.15)')
  corona.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = corona
  ctx.fillRect(0, 0, size, size)

  const photo = ctx.createRadialGradient(half - 3, half - 3, 2, half, half, r)
  photo.addColorStop(0, '#ffffff')
  photo.addColorStop(0.4, '#fffbeb')
  photo.addColorStop(0.75, '#fde047')
  photo.addColorStop(0.95, '#f59e0b')
  photo.addColorStop(1, '#ea580c')
  ctx.fillStyle = photo
  ctx.beginPath(); ctx.arc(half, half, r, 0, Math.PI * 2); ctx.fill()
  return oc
}

const anomalySprite = createAnomalySprite()
const realPlanets = {
  mercury: createMercurySprite(),
  venus:   createVenusSprite(),
  earth:   createEarthSprite(),
  mars:    createMarsSprite(),
  jupiter: createJupiterSprite(),
  saturn:  createSaturnSprite(),
  uranus:  createUranusSprite(),
  neptune: createNeptuneSprite(),
  sun:     createSunSprite(),
}

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

// ── Solar System Orbital Configuration (Authentic Planets & Tracks) ──────────
const SOLAR_PLANETS = [
  { id: 'mercury', name: 'Mercury', r: 54,  omega: 0.038, size: 16, sprite: realPlanets.mercury, baseTheta: 0.2 },
  { id: 'venus',   name: 'Venus',   r: 80,  omega: 0.027, size: 22, sprite: realPlanets.venus,   baseTheta: 1.1 },
  { id: 'earth',   name: 'Earth',   r: 114, omega: 0.020, size: 24, sprite: realPlanets.earth,   baseTheta: 2.3, hasMoon: true },
  { id: 'mars',    name: 'Mars',    r: 152, omega: 0.015, size: 18, sprite: realPlanets.mars,    baseTheta: 3.8 },
  { id: 'jupiter', name: 'Jupiter', r: 232, omega: 0.008, size: 44, sprite: realPlanets.jupiter, baseTheta: 4.6 },
  { id: 'saturn',  name: 'Saturn',  r: 308, omega: 0.0055, size: 68, sprite: realPlanets.saturn, baseTheta: 5.4 },
  { id: 'uranus',  name: 'Uranus',  r: 372, omega: 0.0038, size: 26, sprite: realPlanets.uranus, baseTheta: 0.8 },
  { id: 'neptune', name: 'Neptune', r: 432, omega: 0.0026, size: 26, sprite: realPlanets.neptune, baseTheta: 2.9 },
]

// ── Solar System Orbital Physics ─────────────────────────────────────────────
function initSolarParticle(p) {
  const u = Math.random()
  if (u < 0.16) {
    // Sol Corona & Plasma Prominences
    p.solarType = 'sun'
    p.orbitR = 8 + Math.sqrt(Math.random()) * 26
    p.orbitTheta = Math.random() * Math.PI * 2
    p.orbitOmega = 0.005 + Math.random() * 0.003
    p.orbitInc = 0.70
  } else if (u < 0.42) {
    // Main Asteroid Belt (dense Keplerian belt between Mars & Jupiter)
    p.solarType = 'asteroid'
    p.orbitR = 188 + (Math.random() - 0.5) * 36
    p.orbitTheta = Math.random() * Math.PI * 2
    p.orbitOmega = 0.010 + (Math.random() - 0.5) * 0.002
    p.orbitInc = 0.65 + (Math.random() - 0.5) * 0.07
  } else if (u < 0.62) {
    // Saturn Ring System Stardust
    p.solarType = 'saturn_ring'
    p.orbitR = 308
    p.orbitOmega = 0.0055
    p.ringR = 14 + Math.random() * 26
    p.ringAngle = Math.random() * Math.PI * 2
    p.orbitTheta = 5.4
    p.orbitInc = 0.65
  } else if (u < 0.82) {
    // Kuiper Belt & Outer Oort Dust (deep cold outskirts)
    p.solarType = 'kuiper'
    p.orbitR = 450 + Math.random() * 85
    p.orbitTheta = Math.random() * Math.PI * 2
    p.orbitOmega = 0.0018 + (Math.random() - 0.5) * 0.0006
    p.orbitInc = 0.62 + (Math.random() - 0.5) * 0.12
  } else if (u < 0.94) {
    // Planetary Condensations & Wakes
    p.solarType = 'planet_dust'
    const pIdx = Math.floor(Math.random() * 8)
    const pl = SOLAR_PLANETS[pIdx]
    p.orbitR = pl.r
    p.orbitOmega = pl.omega
    p.clusterR = Math.sqrt(Math.random()) * 14 + 4
    p.clusterAngle = Math.random() * Math.PI * 2
    p.orbitTheta = pl.baseTheta
    p.orbitInc = 0.65
  } else {
    // Eccentric Comet with Ion Dust Tail
    p.solarType = 'comet'
    p.cometProg = Math.random()
    p.tailOffset = Math.random() * 48
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
    case 'planet_dust': {
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
      const e = 0.84, a = 210
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
    this.x = this.prevX = t.x
    this.y = this.prevY = t.y
    this.wz = 0 // Virtual 3D depth for relativistic wormhole projection
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
    this.prevX = this.x
    this.prevY = this.y

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

  // ── 2. Authentic Keplerian Solar System (Real Planet Spheres & Moons) ──
  if (config.shape === 'solar' && wormhole.state === 'idle') {
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'

    // Keplerian Orbital Tracks
    ctx.lineWidth = 1.0
    for (let i = 0; i < SOLAR_PLANETS.length; i++) {
      const pl = SOLAR_PLANETS[i]
      ctx.strokeStyle = i === 2 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(147, 197, 253, 0.055)'
      ctx.beginPath()
      ctx.ellipse(cx, cy, pl.r, pl.r * 0.65, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Central Radiant Sol Core (The Sun)
    const solPulse = 1.0 + Math.sin(now * 0.0035) * 0.035
    ctx.drawImage(realPlanets.sun, cx - 55 * solPulse, cy - 55 * solPulse, 110 * solPulse, 110 * solPulse)

    // Real Astronomical Planets & Moon
    const timeSec = now * 0.001
    for (let i = 0; i < SOLAR_PLANETS.length; i++) {
      const pl = SOLAR_PLANETS[i]
      const theta = pl.baseTheta + pl.omega * timeSec * curDrift
      const px = cx + pl.r * Math.cos(theta)
      const py = cy + pl.r * Math.sin(theta) * 0.65

      ctx.drawImage(pl.sprite, px - pl.size * 0.5, py - pl.size * 0.5, pl.size, pl.size)

      // Earth's Orbiting Lunar Companion
      if (pl.hasMoon) {
        const mTheta = timeSec * 0.35 * curDrift
        const mx = px + 18 * Math.cos(mTheta)
        const my = py + 18 * Math.sin(mTheta) * 0.65
        ctx.fillStyle = '#cbd5e1'
        ctx.beginPath(); ctx.arc(mx, my, 2.2, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.15)'
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.ellipse(px, py, 18, 18 * 0.65, 0, 0, Math.PI * 2); ctx.stroke()
      }
    }
    ctx.restore()
  }

  // ── 3. 4D Relativistic Wormhole Spacetime Engine ──
  const n = particles.length

  if (wormhole.state === 'collapse') {
    const elapsed = (now - wormhole.startTime) / 1000
    const duration = 2.0
    const prog = Math.min(elapsed / duration, 1.0)

    // 4D Spacetime Curvature Metric Grid (Warping Geodesics)
    const gridAlpha = Math.sin(prog * Math.PI) * 0.42
    if (gridAlpha > 0.01) {
      ctx.save()
      ctx.strokeStyle = `rgba(56, 189, 248, ${gridAlpha})`
      ctx.lineWidth = 1.0
      // Warping metric ellipses
      for (let r = 35; r <= 420; r += 48) {
        const warpR = r * (1 - prog * 0.55)
        ctx.beginPath()
        ctx.ellipse(cx + wormhole.collapseX, cy + wormhole.collapseY, warpR, warpR * (0.65 - prog * 0.25), prog * 1.6, 0, Math.PI * 2)
        ctx.stroke()
      }
      // Frame-dragging inward spiraling geodesics
      for (let a = 0; a < 8; a++) {
        const startAngle = (a / 8) * Math.PI * 2 + prog * 4.2
        ctx.beginPath()
        for (let step = 0; step < 22; step++) {
          const rad = 380 * (1 - step / 22)
          const ang = startAngle + (step / 22) * 3.8 * prog
          const gx = cx + wormhole.collapseX + Math.cos(ang) * rad
          const gy = cy + wormhole.collapseY + Math.sin(ang) * rad * 0.65
          if (step === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    // 3D Vortex Suction + Virtual Depth (Z) Funnel
    for (let i = 0; i < n; i++) {
      const p = particles[i]
      p.prevX = p.x; p.prevY = p.y
      const dx = wormhole.collapseX - p.x
      const dy = wormhole.collapseY - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      // Plunge along 3rd dimension
      p.wz = (p.wz || 0) + (20 + prog * 40) * (180 / (dist + 35))
      const pull = Math.min(32, 750 / (dist + 8)) * (0.9 + prog * 1.5)
      p.vx += (dx / (dist || 1)) * pull
      p.vy += (dy / (dist || 1)) * pull
      // 4D frame-dragging spin
      p.vx += -(dy / (dist || 1)) * pull * 1.8
      p.vy +=  (dx / (dist || 1)) * pull * 1.8
      p.vx *= 0.88; p.vy *= 0.88
      p.x += p.vx; p.y += p.vy
    }

    // Accretion Disk 3D Gravitational Lensing (Interstellar Gargantua Light-Bend)
    ctx.save()
    const lensR = Math.max(10, 48 * (1 - prog * 0.4))
    // Upper lensed halo
    ctx.strokeStyle = `rgba(253, 224, 71, ${0.5 + prog * 0.45})`
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.ellipse(cx + wormhole.collapseX, cy + wormhole.collapseY - lensR * 0.35, lensR * 1.8, lensR * 0.9, 0, Math.PI, Math.PI * 2)
    ctx.stroke()
    // Lower lensed halo
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + prog * 0.45})`
    ctx.beginPath()
    ctx.ellipse(cx + wormhole.collapseX, cy + wormhole.collapseY + lensR * 0.35, lensR * 1.8, lensR * 0.9, 0, 0, Math.PI)
    ctx.stroke()
    // Event Horizon Black Hole Void
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(cx + wormhole.collapseX, cy + wormhole.collapseY, lensR, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 + prog * 0.3})`
    ctx.lineWidth = 2.0
    ctx.stroke()
    ctx.restore()

    if (elapsed >= duration) {
      wormhole.state = 'horizon'
      wormhole.startTime = now
      wormhole.morphed = false
      self.postMessage({ type: 'wormholePhase', phase: 'horizon' })
    }
  } else if (wormhole.state === 'horizon') {
    const elapsed = (now - wormhole.startTime) / 1000
    const duration = 1.4
    const prog = Math.min(elapsed / duration, 1.0)

    if (prog >= 0.4 && !wormhole.morphed) {
      wormhole.morphed = true
      config.shape = wormhole.targetShape
      for (let i = 0; i < n; i++) particles[i].morphTo(config.shape)
    }

    // 4D HYPERSPACE WARP TUNNEL PASS
    ctx.save()
    const speed = 750
    for (let ring = 0; ring < 12; ring++) {
      const ringZ = ((ring * 80 - elapsed * speed) % 900 + 900) % 900
      const scale = 260 / (ringZ + 15)
      const ringRadius = 130 * scale
      const ringAlpha = Math.min(1.0, scale * 0.85) * Math.sin(prog * Math.PI)
      if (ringRadius > 4 && ringRadius < Math.max(w, h)) {
        ctx.strokeStyle = ring % 2 === 0
          ? `rgba(56, 189, 248, ${ringAlpha})`
          : `rgba(168, 85, 247, ${ringAlpha})`
        ctx.lineWidth = Math.max(1, 3.2 * scale)
        ctx.beginPath()
        for (let pt = 0; pt <= 6; pt++) {
          const ang = (pt / 6) * Math.PI * 2 + elapsed * 2.2 + ring * 0.25
          const hx = cx + Math.cos(ang) * ringRadius
          const hy = cy + Math.sin(ang) * ringRadius * 0.75
          if (pt === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy)
        }
        ctx.stroke()
      }
    }

    // Relativistic Hyper-speed Warp Star Streaks (3D projection)
    for (let s = 0; s < 42; s++) {
      const sAng = (s / 42) * Math.PI * 2 + Math.sin(s * 17) * 0.4
      const inR = 12 + Math.sin(s * 7) * 20
      const outR = inR + 80 + Math.sin(prog * Math.PI) * 260
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 + Math.sin(prog * Math.PI) * 0.5})`
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(sAng) * inR, cy + Math.sin(sAng) * inR * 0.75)
      ctx.lineTo(cx + Math.cos(sAng) * outR, cy + Math.sin(sAng) * outR * 0.75)
      ctx.stroke()
    }

    // Superluminal Coronal Inversion Flash
    const flash = Math.sin(prog * Math.PI)
    if (flash > 0.08) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.pow(flash, 2) * 0.95})`
      ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()

    if (elapsed >= duration) {
      wormhole.state = 'emergence'
      wormhole.startTime = now
      for (let i = 0; i < n; i++) {
        const p = particles[i]
        p.x = (Math.random() - 0.5) * 30
        p.y = (Math.random() - 0.5) * 30
        p.wz = -180
        const ang = Math.random() * Math.PI * 2
        const spd = Math.random() * 26 + 14
        p.vx = Math.cos(ang) * spd
        p.vy = Math.sin(ang) * spd * 0.65
      }
      self.postMessage({ type: 'wormholePhase', phase: 'emergence', shape: config.shape })
    }
  } else if (wormhole.state === 'emergence') {
    const elapsed = (now - wormhole.startTime) / 1000
    const duration = 2.0
    const prog = Math.min(elapsed / duration, 1.0)
    for (let i = 0; i < n; i++) {
      const p = particles[i]
      if (p.wz) p.wz *= 0.92
      p.update(curDisp, curDrift, pointer, curGrav, shockwave)
    }
    // Relativistic Gravitational Wave Expansion Ripples
    ctx.save()
    for (let wave = 1; wave <= 3; wave++) {
      const waveR = (prog * 680 + wave * 95) % 780
      const waveAlpha = Math.max(0, (1 - waveR / 780) * 0.55 * (1 - prog))
      ctx.strokeStyle = `rgba(56, 189, 248, ${waveAlpha})`
      ctx.lineWidth = 2.0
      ctx.beginPath()
      ctx.ellipse(cx, cy, waveR, waveR * 0.65, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()

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

    // Relativistic Motion Blur Streaks (in collapse phase)
    if (wormhole.state === 'collapse' && p.prevX !== undefined) {
      const streakDist = Math.hypot(p.x - p.prevX, p.y - p.prevY)
      if (streakDist > 2.5) {
        ctx.strokeStyle = `rgba(147, 197, 253, ${Math.min(0.7, alpha)})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(cx + p.prevX, cy + p.prevY)
        ctx.lineTo(cx + p.x, cy + p.y)
        ctx.stroke()
      }
    }

    const ci = p.colorIdx % 4
    const sprite = p.isAnomaly
      ? anomalySprite
      : (p.tier === 0 ? sprites.nebula[ci] : (p.tier === 2 ? sprites.sparkle[ci] : sprites.body[ci]))

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
