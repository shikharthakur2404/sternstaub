// ─────────────────────────────────────────────────────────────────────────────
// planetTextures.js — Procedural Astronomical Texture Synthesis
// Generates high-fidelity equirectangular textures for Three.js SphereGeometry
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function createSunTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#ea580c')
  grad.addColorStop(0.3, '#f59e0b')
  grad.addColorStop(0.5, '#fef08a')
  grad.addColorStop(0.7, '#f59e0b')
  grad.addColorStop(1, '#ea580c')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)

  // Solar plasma granulation
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 512
    const r = Math.random() * 12 + 4
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return new THREE.CanvasTexture(c)
}

export function createMercuryTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#6b7280'
  ctx.fillRect(0, 0, 1024, 512)

  // Basalt craters
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 512
    const r = Math.random() * 8 + 2
    ctx.fillStyle = 'rgba(31, 41, 55, 0.6)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(209, 213, 219, 0.4)'
    ctx.lineWidth = 1.0
    ctx.stroke()
  }
  return new THREE.CanvasTexture(c)
}

export function createVenusTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#78350f')
  grad.addColorStop(0.25, '#d97706')
  grad.addColorStop(0.5, '#fef08a')
  grad.addColorStop(0.75, '#b45309')
  grad.addColorStop(1, '#78350f')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)

  // Wavy sulfuric cloud bands
  ctx.fillStyle = 'rgba(254, 240, 138, 0.28)'
  for (let y = 40; y < 480; y += 24) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= 1024; x += 40) {
      ctx.lineTo(x, y + Math.sin(x * 0.02) * 12)
    }
    ctx.lineTo(1024, 512)
    ctx.lineTo(0, 512)
    ctx.fill()
  }
  return new THREE.CanvasTexture(c)
}

export function createEarthTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')

  // Deep Blue Oceans
  ctx.fillStyle = '#1e3a8a'
  ctx.fillRect(0, 0, 1024, 512)

  // Continental landmasses
  ctx.fillStyle = '#15803d'
  const continents = [
    // North America
    [220, 140, 90, 60],
    // South America
    [320, 320, 60, 90],
    // Eurasia
    [640, 150, 180, 80],
    // Africa
    [540, 260, 80, 100],
    // Australia
    [820, 360, 55, 45],
  ]
  continents.forEach(([cx, cy, rw, rh]) => {
    ctx.beginPath()
    ctx.ellipse(cx, cy, rw, rh, 0.2, 0, Math.PI * 2)
    ctx.fill()
  })

  // Forest and mountain gradients
  ctx.fillStyle = '#854d0e'
  continents.forEach(([cx, cy, rw, rh]) => {
    ctx.beginPath()
    ctx.ellipse(cx + 8, cy - 4, rw * 0.5, rh * 0.5, 0.1, 0, Math.PI * 2)
    ctx.fill()
  })

  // Polar ice caps
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1024, 30)
  ctx.fillRect(0, 482, 1024, 30)

  return new THREE.CanvasTexture(c)
}

export function createEarthCloudTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 1024, 512)

  // Swirling weather clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
  for (let i = 0; i < 280; i++) {
    const x = Math.random() * 1024
    const y = 60 + Math.random() * 380
    const rx = Math.random() * 45 + 15
    const ry = Math.random() * 16 + 6
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, Math.sin(x * 0.01) * 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  return new THREE.CanvasTexture(c)
}

export function createMarsTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#c2410c'
  ctx.fillRect(0, 0, 1024, 512)

  // Dark canyon and basalt patches (Syrtis Major, Valles Marineris)
  ctx.fillStyle = '#7c2d12'
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024
    const y = 140 + Math.random() * 240
    ctx.beginPath()
    ctx.ellipse(x, y, Math.random() * 50 + 20, Math.random() * 20 + 8, 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Polar ice caps
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1024, 24)
  ctx.fillRect(0, 490, 1024, 22)
  return new THREE.CanvasTexture(c)
}

export function createJupiterTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')

  // Horizontal cloud belts
  const bands = [
    { y: 0,   h: 40, c: '#fde047' },
    { y: 40,  h: 50, c: '#b45309' },
    { y: 90,  h: 45, c: '#fef3c7' },
    { y: 135, h: 55, c: '#9a3412' },
    { y: 190, h: 60, c: '#fde68a' },
    { y: 250, h: 65, c: '#78350f' },
    { y: 315, h: 50, c: '#fef3c7' },
    { y: 365, h: 55, c: '#c2410c' },
    { y: 420, h: 45, c: '#fde047' },
    { y: 465, h: 47, c: '#78350f' },
  ]
  bands.forEach(b => {
    ctx.fillStyle = b.c
    ctx.fillRect(0, b.y, 1024, b.h)
  })

  // Great Red Spot
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.ellipse(600, 310, 48, 28, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#7f1d1d'
  ctx.lineWidth = 4.0
  ctx.stroke()
  ctx.fillStyle = '#fca5a5'
  ctx.beginPath()
  ctx.ellipse(600, 310, 20, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(c)
}

export function createSaturnTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#713f12')
  grad.addColorStop(0.3, '#ca8a04')
  grad.addColorStop(0.5, '#fde047')
  grad.addColorStop(0.7, '#ca8a04')
  grad.addColorStop(1, '#713f12')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)

  // Delicate atmospheric banding
  ctx.fillStyle = 'rgba(113, 63, 18, 0.25)'
  for (let y = 50; y < 460; y += 30) {
    ctx.fillRect(0, y, 1024, 12)
  }
  return new THREE.CanvasTexture(c)
}

export function createSaturnRingTexture() {
  const c = makeCanvas(512, 1)
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 512, 0)
  // Inner ring C
  grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)')
  grad.addColorStop(0.1, 'rgba(202, 138, 4, 0.3)')
  grad.addColorStop(0.3, 'rgba(234, 179, 8, 0.65)')
  // Ring B (bright dense)
  grad.addColorStop(0.65, 'rgba(254, 240, 138, 0.95)')
  // Cassini Division gap
  grad.addColorStop(0.68, 'rgba(0, 0, 0, 0.05)')
  grad.addColorStop(0.72, 'rgba(0, 0, 0, 0.05)')
  // Ring A
  grad.addColorStop(0.75, 'rgba(234, 179, 8, 0.75)')
  grad.addColorStop(0.96, 'rgba(202, 138, 4, 0.4)')
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 1)
  return new THREE.CanvasTexture(c)
}

export function createUranusTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#164e63')
  grad.addColorStop(0.4, '#67e8f9')
  grad.addColorStop(0.6, '#a5f3fc')
  grad.addColorStop(1, '#164e63')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)
  return new THREE.CanvasTexture(c)
}

export function createNeptuneTexture() {
  const c = makeCanvas(1024, 512)
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#0f172a')
  grad.addColorStop(0.35, '#1d4ed8')
  grad.addColorStop(0.65, '#3b82f6')
  grad.addColorStop(1, '#0f172a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)

  // Supersonic white methane cloud streaks
  ctx.fillStyle = 'rgba(224, 242, 254, 0.75)'
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024
    const y = 100 + Math.random() * 300
    ctx.fillRect(x, y, Math.random() * 90 + 30, Math.random() * 4 + 2)
  }

  // Great Dark Spot
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.ellipse(480, 260, 36, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(c)
}
