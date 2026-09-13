// ─────────────────────────────────────────────────────────────────────────────
// proceduralTextures.js — Procedural High-Res Texture Synthesizers for Exoplanets
// Instant zero-network Canvas2D procedural equirectangular maps & exoring alpha textures
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'

/**
 * Procedural Red Dwarf Star (Astraeus / TRAPPIST-1)
 * Features convective granulation cells, dark magnetic sunspots, and radiant coronal flares.
 */
export function createRedDwarfTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base deep ruby-crimson gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0.0, '#7f1d1d')
  grad.addColorStop(0.3, '#991b1b')
  grad.addColorStop(0.5, '#dc2626')
  grad.addColorStop(0.7, '#991b1b')
  grad.addColorStop(1.0, '#7f1d1d')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)

  // Turbulent convective granulation cells
  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    const latFactor = Math.sin(ny * Math.PI) // Polar darkening
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Multi-scale cellular noise
      const n1 = Math.sin(nx * 42.0 + Math.cos(ny * 32.0) * 2.5) * Math.cos(ny * 36.0)
      const n2 = Math.sin(nx * 110.0 + ny * 90.0) * 0.5 + 0.5
      const n3 = Math.cos(nx * 220.0 - ny * 180.0) * 0.25 + 0.25

      const granule = (n1 * 0.5 + 0.5) * 0.6 + n2 * 0.3 + n3 * 0.1

      // Magnetic sunspot depressions (dark cooler zones)
      const spotSeed1 = Math.hypot(nx - 0.38, ny - 0.44)
      const spotSeed2 = Math.hypot(nx - 0.72, ny - 0.56)
      const spot = Math.min(spotSeed1 * 14.0, spotSeed2 * 16.0)
      const spotFactor = Math.min(1.0, spot * spot)

      // Mix photoluminescence
      const r = Math.min(255, (220 + granule * 35) * latFactor * spotFactor)
      const g = Math.min(255, (40 + granule * 110) * latFactor * spotFactor)
      const b = Math.min(255, (20 + granule * 40) * latFactor * spotFactor)

      data[idx]     = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Lava World (Pyroclast / Trappist-1b)
 * Obsidian basalt crust with glowing magma fissures and an active sub-stellar magma lake.
 */
export function createLavaWorldTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Charred basalt base
  ctx.fillStyle = '#1c1917'
  ctx.fillRect(0, 0, 1024, 512)

  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Voronoi-like tectonic fissure patterns
      const f1 = Math.abs(Math.sin(nx * 38.0 + Math.cos(ny * 24.0) * 3.0))
      const f2 = Math.abs(Math.cos(nx * 62.0 - Math.sin(ny * 48.0) * 2.2))
      const fissure = Math.pow(1.0 - Math.min(f1, f2), 7.0)

      // Sub-stellar thermal hotspot at nx = 0.5, ny = 0.5
      const distSubstellar = Math.hypot((nx - 0.5) * 2.0, (ny - 0.5) * 2.0)
      const lavaLake = Math.max(0.0, 1.0 - distSubstellar * 1.8)

      // Magma glow intensity
      const heat = Math.min(1.0, fissure * 1.4 + lavaLake * 0.8)

      // Basalt dark crust with slight mineral variation
      const basalt = 24 + Math.sin(nx * 50.0) * 8 + Math.cos(ny * 40.0) * 6

      data[idx]     = Math.min(255, basalt + heat * 230)
      data[idx + 1] = Math.min(255, basalt * 0.8 + heat * 130)
      data[idx + 2] = Math.min(255, basalt * 0.6 + heat * 30)
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Eyeball Ocean World (Aethelgard / Trappist-1d)
 * Tidally locked: sub-stellar hemisphere features a deep blue liquid ocean;
 * surrounding rim features emerald/saffron coastlines; outer nightside is locked in white/cyan glacier shield.
 */
export function createEyeballOceanTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Distance from sub-stellar point (nx = 0.5, ny = 0.5)
      const dx = (nx - 0.5) * 2.0
      const dy = (ny - 0.5) * 2.0
      const d = Math.sqrt(dx * dx + dy * dy)

      // Fractal coastline perturbation
      const coastNoise = Math.sin(nx * 28.0 + dy * 12.0) * 0.08 + Math.cos(ny * 36.0 - dx * 8.0) * 0.06
      const effDist = d + coastNoise

      let r, g, b
      if (effDist < 0.42) {
        // Deep Liquid Ocean (Sub-Stellar Eye)
        const depth = effDist / 0.42
        r = Math.floor(10 + depth * 25)
        g = Math.floor(70 + depth * 70)
        b = Math.floor(160 + depth * 60)
      } else if (effDist < 0.54) {
        // Coastlines & Temperate Vegetation Belt
        const t = (effDist - 0.42) / 0.12
        r = Math.floor(40 + t * 80)
        g = Math.floor(140 - t * 40)
        b = Math.floor(80 - t * 20)
      } else if (effDist < 0.70) {
        // Tundra & Pack Ice Edge
        const t = (effDist - 0.54) / 0.16
        r = Math.floor(140 + t * 90)
        g = Math.floor(170 + t * 75)
        b = Math.floor(200 + t * 55)
      } else {
        // Nightside Glacial Shield (Permanent Ice)
        const iceNoise = Math.sin(nx * 80.0) * 10 + Math.cos(ny * 60.0) * 10
        r = Math.min(255, 235 + iceNoise)
        g = Math.min(255, 245 + iceNoise)
        b = 255
      }

      // Swirling atmospheric cirrus cloud layers
      const cloud = Math.sin(nx * 40.0 + ny * 18.0) * Math.cos(nx * 14.0 - ny * 32.0)
      if (cloud > 0.45) {
        const cloudDensity = (cloud - 0.45) * 1.8
        r = Math.floor(r * (1 - cloudDensity) + 255 * cloudDensity)
        g = Math.floor(g * (1 - cloudDensity) + 255 * cloudDensity)
        b = Math.floor(b * (1 - cloudDensity) + 255 * cloudDensity)
      }

      data[idx]     = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Banded Methane Super-Earth (Zephyrus / Trappist-1e)
 * Cyan, turquoise, and azure cloud latitudes with swirling cyclonic storm systems.
 */
export function createMethaneAtmosphereTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Zonal atmospheric jet streams
      const jet = Math.sin(ny * 38.0 + Math.sin(nx * 18.0) * 1.8) * 0.5 + 0.5
      const wave = Math.cos(nx * 32.0 + ny * 50.0) * 0.25 + 0.25
      const band = jet * 0.7 + wave * 0.3

      // Great Emerald Vortex Storm at nx = 0.65, ny = 0.42
      const dStorm = Math.hypot((nx - 0.65) * 3.0, (ny - 0.42) * 4.0)
      const storm = Math.max(0.0, 1.0 - dStorm * 2.2)

      const r = Math.floor(12 + band * 35 + storm * 60)
      const g = Math.floor(130 + band * 75 + storm * 50)
      const b = Math.floor(180 + band * 65 + storm * 30)

      data[idx]     = Math.min(255, r)
      data[idx + 1] = Math.min(255, g)
      data[idx + 2] = Math.min(255, b)
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Ringed Gas Giant (Chronos / Trappist-1f)
 * Warm amber, copper, and mahogany Jovian belts with turbulent shear eddies.
 */
export function createRingedGasGiantTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Complex zonal shear bands
      const band1 = Math.sin(ny * 52.0 + Math.sin(nx * 14.0) * 1.2) * 0.5 + 0.5
      const band2 = Math.cos(ny * 18.0 + Math.sin(nx * 26.0) * 0.8) * 0.5 + 0.5
      const turbulence = Math.sin(nx * 60.0 + ny * 120.0) * 0.15

      const mixVal = Math.min(1.0, Math.max(0.0, band1 * 0.6 + band2 * 0.4 + turbulence))

      // Amber/copper palette
      const r = Math.floor(140 + mixVal * 105)
      const g = Math.floor(80 + mixVal * 70)
      const b = Math.floor(40 + mixVal * 45)

      data[idx]     = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Exoplanetary Ring Texture
 * Multi-ring division with icy-silica opacity gradients.
 */
export function createExoRingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 64
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 512, 0)
  grad.addColorStop(0.00, 'rgba(217, 119, 6, 0.0)')
  grad.addColorStop(0.08, 'rgba(245, 158, 11, 0.75)')
  grad.addColorStop(0.25, 'rgba(251, 191, 36, 0.92)')
  grad.addColorStop(0.38, 'rgba(217, 119, 6, 0.35)')
  grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.05)')
  grad.addColorStop(0.48, 'rgba(253, 230, 138, 0.88)')
  grad.addColorStop(0.72, 'rgba(245, 158, 11, 0.78)')
  grad.addColorStop(0.88, 'rgba(217, 119, 6, 0.45)')
  grad.addColorStop(1.00, 'rgba(180, 83, 9, 0.0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Procedural Cryo-Ice World (Nix / Trappist-1g)
 * Pale lavender nitrogen frost surface, impact basins, and deep tectonic cryo-faults.
 */
export function createCryoIceTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Tectonic fracture lines (sharp faults)
      const fault1 = Math.abs(Math.sin(nx * 45.0 + Math.cos(ny * 25.0) * 3.5))
      const fault2 = Math.abs(Math.cos(nx * 55.0 - Math.sin(ny * 35.0) * 2.8))
      const crack = Math.pow(1.0 - Math.min(fault1, fault2), 9.0)

      // Nitrogen frost base with delicate lavender hues
      const baseFrost = 210 + Math.sin(nx * 30.0) * 20 + Math.cos(ny * 20.0) * 15

      const r = Math.min(255, Math.floor(baseFrost * 0.92 - crack * 120))
      const g = Math.min(255, Math.floor(baseFrost * 0.88 - crack * 130))
      const b = Math.min(255, Math.floor(baseFrost * 1.00 - crack * 60))

      data[idx]     = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Photovoltaic Solar Array Texture (ISS & Satellite Wings)
 * Authentic dark blue/navy silicon wafer cells, golden-copper busbar traces,
 * anti-reflective coating specular sheen, and gold Kapton polyimide backing.
 */
export function createPhotovoltaicArrayTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Base deep navy/black silicon substrate
  ctx.fillStyle = '#0a0f1d'
  ctx.fillRect(0, 0, 512, 256)

  // Solar wafer grid: 8 columns x 16 rows of silicon cells
  const cols = 8
  const rows = 16
  const cellW = (512 - 20) / cols
  const cellH = (256 - 16) / rows

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = 10 + c * cellW
      const y = 8 + r * cellH

      const cellGrad = ctx.createLinearGradient(x, y, x + cellW, y + cellH)
      cellGrad.addColorStop(0.0, '#172554')
      cellGrad.addColorStop(0.5, '#1e3a8a')
      cellGrad.addColorStop(1.0, '#0f172a')

      ctx.fillStyle = cellGrad
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2)

      // Fine silver grid lines across wafer
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
      ctx.lineWidth = 0.5
      for (let g = 1; g < 4; g++) {
        ctx.beginPath()
        ctx.moveTo(x + (cellW * g) / 4, y + 1)
        ctx.lineTo(x + (cellW * g) / 4, y + cellH - 1)
        ctx.stroke()
      }
    }
  }

  // Dual major copper/gold conductor busbars
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2.5
  for (let c = 0; c < cols; c++) {
    const x = 10 + c * cellW + cellW * 0.5
    ctx.beginPath()
    ctx.moveTo(x, 4)
    ctx.lineTo(x, 252)
    ctx.stroke()
  }

  // Perimeter gold thermal foil edge
  ctx.strokeStyle = '#d97706'
  ctx.lineWidth = 3
  ctx.strokeRect(2, 2, 508, 252)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Thermal Blanket Texture (Multi-Layer Insulation - MLI)
 * Quilted metallic silver/gold thermal blankets used on spacecraft hulls.
 */
export function createThermalBlanketTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(0, 0, 256, 256)

  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1
  const step = 32
  for (let i = 0; i <= 256; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 256)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(256, i)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  for (let x = 0; x < 256; x += step) {
    for (let y = 0; y < 256; y += step) {
      ctx.fillRect(x + 4, y + 4, step - 8, step - 8)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}
