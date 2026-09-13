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
/**
 * Procedural Lava World (TRAPPIST-1b)
 * Obsidian basalt crust with glowing magma fissures and an active sub-stellar magma lake.
 */
export function createTrappist1bTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#181412'
  ctx.fillRect(0, 0, 1024, 512)

  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Tectonic fissure network
      const f1 = Math.abs(Math.sin(nx * 36.0 + Math.cos(ny * 24.0) * 3.0))
      const f2 = Math.abs(Math.cos(nx * 58.0 - Math.sin(ny * 46.0) * 2.2))
      const fissure = Math.pow(1.0 - Math.min(f1, f2), 7.5)

      // Sub-stellar thermal hotspot at nx = 0.5, ny = 0.5
      const distSubstellar = Math.hypot((nx - 0.5) * 2.0, (ny - 0.5) * 2.0)
      const lavaLake = Math.max(0.0, 1.0 - distSubstellar * 1.9)

      const heat = Math.min(1.0, fissure * 1.5 + lavaLake * 1.1)
      const basalt = 20 + Math.sin(nx * 48.0) * 8 + Math.cos(ny * 38.0) * 6

      data[idx]     = Math.min(255, basalt + heat * 235)
      data[idx + 1] = Math.min(255, basalt * 0.7 + heat * 125)
      data[idx + 2] = Math.min(255, basalt * 0.5 + heat * 25)
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
 * Procedural Desert World (TRAPPIST-1c)
 * Desiccated ochre/terracotta crust with impact basins, rift valleys, and silicate dust dunes.
 */
export function createTrappist1cTexture() {
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

      // Multi-scale tectonic desert terrain
      const n1 = Math.sin(nx * 26.0 + Math.cos(ny * 22.0) * 2.0) * 0.5 + 0.5
      const n2 = Math.cos(nx * 64.0 - ny * 42.0) * 0.25 + 0.25
      const craterNoise = Math.sin(nx * 120.0) * Math.cos(ny * 90.0) * 0.15

      const terrain = n1 * 0.65 + n2 * 0.35 + craterNoise

      // Terracotta/ochre/amber palette
      const r = Math.floor(135 + terrain * 85)
      const g = Math.floor(65 + terrain * 55)
      const b = Math.floor(35 + terrain * 35)

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
 * Procedural Twilight Ocean Borderland (TRAPPIST-1d)
 * Sub-stellar terracotta desert, crescent twilight sea, and permanent glaciated nightside.
 */
export function createTrappist1dTexture() {
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

      const dx = (nx - 0.5) * 2.0
      const dy = (ny - 0.5) * 2.0
      const d = Math.sqrt(dx * dx + dy * dy)
      const noise = Math.sin(nx * 32.0 + dy * 14.0) * 0.07

      const eff = d + noise
      let r, g, b

      if (eff < 0.35) {
        // Sub-stellar arid desert
        r = 180 + Math.floor(noise * 80)
        g = 95 + Math.floor(noise * 40)
        b = 50 + Math.floor(noise * 20)
      } else if (eff < 0.52) {
        // Twilight Ring Ocean (Liquid Water)
        const t = (eff - 0.35) / 0.17
        r = Math.floor(15 + t * 25)
        g = Math.floor(75 + t * 45)
        b = Math.floor(145 + t * 50)
      } else {
        // Nightside Glacial Frost & Ice
        const ice = Math.sin(nx * 60.0) * 12
        r = Math.min(255, 220 + ice)
        g = Math.min(255, 235 + ice)
        b = 255
      }

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
 * Procedural Prime Habitable Eyeball World (TRAPPIST-1e)
 * Sub-stellar sapphire ocean, crimson/purple photosynthetic flora, cyclonic hurricane vortex,
 * white cloud filaments, and a permanent glaciated nightside shield.
 */
export function createTrappist1eTexture() {
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

      const dx = (nx - 0.5) * 2.0
      const dy = (ny - 0.5) * 2.0
      const d = Math.sqrt(dx * dx + dy * dy)
      const coastNoise = Math.sin(nx * 32.0 + dy * 14.0) * 0.08 + Math.cos(ny * 40.0 - dx * 10.0) * 0.06
      const effDist = d + coastNoise

      let r, g, b
      if (effDist < 0.42) {
        // Deep Liquid Ocean (Sub-Stellar Eye)
        const depth = effDist / 0.42
        r = Math.floor(12 + depth * 22)
        g = Math.floor(68 + depth * 60)
        b = Math.floor(155 + depth * 65)
      } else if (effDist < 0.58) {
        // Temperate Continents with Infrared Crimson-Purple Photosynthetic Flora
        const t = (effDist - 0.42) / 0.16
        r = Math.floor(95 + t * 65)
        g = Math.floor(25 + t * 35)
        b = Math.floor(65 + t * 35)
      } else if (effDist < 0.72) {
        // Coastal Tundra & Pack Ice Edge
        const t = (effDist - 0.58) / 0.14
        r = Math.floor(160 + t * 70)
        g = Math.floor(185 + t * 55)
        b = Math.floor(215 + t * 40)
      } else {
        // Nightside Glacial Shield (Permanent Ice)
        const iceNoise = Math.sin(nx * 80.0) * 10 + Math.cos(ny * 60.0) * 10
        r = Math.min(255, 235 + iceNoise)
        g = Math.min(255, 245 + iceNoise)
        b = 255
      }

      // Sub-stellar Cyclonic Storm Vortex (Centered at nx=0.5, ny=0.5)
      const stormDist = Math.hypot((nx - 0.5) * 4.0, (ny - 0.5) * 4.0)
      const spiral = Math.sin(stormDist * 8.0 - Math.atan2(dy, dx) * 3.0)
      if (stormDist < 1.0 && spiral > 0.15) {
        const stormAlpha = Math.min(1.0, (1.0 - stormDist) * 1.5)
        r = Math.floor(r * (1 - stormAlpha) + 255 * stormAlpha)
        g = Math.floor(g * (1 - stormAlpha) + 255 * stormAlpha)
        b = Math.floor(b * (1 - stormAlpha) + 255 * stormAlpha)
      }

      // Swirling cirrus clouds
      const cloud = Math.sin(nx * 38.0 + ny * 18.0) * Math.cos(nx * 16.0 - ny * 32.0)
      if (cloud > 0.46) {
        const cDensity = (cloud - 0.46) * 1.6
        r = Math.floor(r * (1 - cDensity) + 255 * cDensity)
        g = Math.floor(g * (1 - cDensity) + 255 * cDensity)
        b = Math.floor(b * (1 - cDensity) + 255 * cDensity)
      }

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
 * Procedural Model A: Desiccated Bare Rock (TRAPPIST-1e)
 * Airless cratered basalt, volcanic fissures, and extreme thermal day/night contrast.
 */
export function createTrappist1eModelATexture() {
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

      const dx = (nx - 0.5) * 2.0
      const dy = (ny - 0.5) * 2.0
      const d = Math.sqrt(dx * dx + dy * dy)

      // Regolith and crater noise
      const craterNoise = Math.sin(nx * 48.0 + ny * 24.0) * Math.cos(nx * 20.0 - ny * 36.0)
      const microCrater = Math.sin(nx * 120.0) * Math.cos(ny * 90.0) * 8.0

      // Sub-stellar scorched basalt vs cold nightside regolith
      const isDayside = d < 0.85
      let baseVal = isDayside ? (65 - d * 30 + craterNoise * 18 + microCrater) : (30 + craterNoise * 12 + microCrater)
      baseVal = Math.max(15, Math.min(130, baseVal))

      const r = Math.floor(baseVal * 1.15)
      const g = Math.floor(baseVal * 0.95)
      const b = Math.floor(baseVal * 0.85)

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
 * Procedural Model B: Dense CO2 / N2 Envelope (TRAPPIST-1e)
 * Thick amber/cyan haze decks, high atmospheric heat advection, and twilight cloud breaks.
 */
export function createTrappist1eModelBTexture() {
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

      // Zonal atmospheric jet stream bands
      const zonalWave = Math.sin(ny * 24.0 + Math.cos(nx * 8.0) * 2.0)
      const hazeNoise = Math.sin(nx * 32.0 + ny * 16.0) * 0.2 + Math.cos(nx * 14.0 - ny * 28.0) * 0.15

      // Amber/ochre sub-stellar cloud deck with cyan limb haze
      const r = Math.floor(180 + zonalWave * 25 + hazeNoise * 40)
      const g = Math.floor(135 + zonalWave * 20 + hazeNoise * 30)
      const b = Math.floor(85 + zonalWave * 15 + hazeNoise * 20)

      data[idx]     = Math.min(255, Math.max(0, r))
      data[idx + 1] = Math.min(255, Math.max(0, g))
      data[idx + 2] = Math.min(255, Math.max(0, b))
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
 * Procedural Volatile Ocean World (TRAPPIST-1f)
 * Global turquoise ocean, archipelago chains, humid atmosphere, and polar ice shelves.
 */
export function createTrappist1fTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const imgData = ctx.getImageData(0, 0, 1024, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    const ny = y / 512
    const lat = Math.abs(ny - 0.5) * 2.0 // 0 at equator, 1 at poles
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const idx = (y * 1024 + x) * 4

      // Global ocean with archipelago islands
      const landNoise = Math.sin(nx * 24.0 + ny * 16.0) * Math.cos(nx * 36.0 - ny * 20.0)
      let r, g, b

      if (lat > 0.75) {
        // Polar Ice Shelves
        const ice = Math.sin(nx * 60.0) * 12
        r = Math.min(255, 230 + ice)
        g = Math.min(255, 240 + ice)
        b = 255
      } else if (landNoise > 0.52) {
        // Volcanic Island Chains
        r = 65
        g = 95
        b = 60
      } else {
        // Deep Global Turquoise Ocean
        const wave = Math.sin(nx * 80.0 + ny * 60.0) * 0.1
        r = Math.floor(10 + wave * 15)
        g = Math.floor(95 + wave * 30)
        b = Math.floor(165 + wave * 40)
      }

      // Swirling tropical cloud bands
      const cloud = Math.sin(nx * 32.0 + Math.sin(ny * 22.0) * 2.0) * 0.5 + 0.5
      if (cloud > 0.62) {
        const cDensity = (cloud - 0.62) * 1.5
        r = Math.floor(r * (1 - cDensity) + 255 * cDensity)
        g = Math.floor(g * (1 - cDensity) + 255 * cDensity)
        b = Math.floor(b * (1 - cDensity) + 255 * cDensity)
      }

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
 * Procedural Glacial Ocean World (TRAPPIST-1g)
 * Pack-ice shelves, slush channels, cracked cryo-rifts, and pale cyan mist.
 */
export function createTrappist1gTexture() {
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

      const rift = Math.abs(Math.sin(nx * 38.0 + Math.cos(ny * 26.0) * 2.2))
      const isRift = rift < 0.12

      let r, g, b
      if (isRift) {
        // Deep turquoise slush ocean exposed through rifts
        r = 15
        g = 120
        b = 175
      } else {
        // Compacted glacial ice sheets
        const ice = Math.sin(nx * 40.0) * 15 + Math.cos(ny * 50.0) * 10
        r = Math.floor(180 + ice)
        g = Math.floor(215 + ice * 0.8)
        b = Math.floor(245)
      }

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
 * Procedural Snowball Cryo-Dwarf (TRAPPIST-1h)
 * Nitrogen/methane ice plains, glittering cryo-fractures, and frozen impact basins.
 */
export function createTrappist1hTexture() {
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

      // Multi-octave nitrogen/methane ice noise
      const n1 = Math.sin(nx * 44.0 + ny * 38.0) * 0.5 + 0.5
      const n2 = Math.cos(nx * 88.0 - ny * 72.0) * 0.25 + 0.25
      const frost = n1 * 0.7 + n2 * 0.3

      // Icy violet/blueish-white palette
      const r = Math.floor(190 + frost * 50)
      const g = Math.floor(205 + frost * 45)
      const b = Math.floor(240 + frost * 15)

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

// ── Backwards-Compatibility Aliases ──
export const createLavaWorldTexture = createTrappist1bTexture
export const createEyeballOceanTexture = createTrappist1eTexture

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
/**
 * Procedural Thermal Blanket Texture (Multi-Layer Insulation - MLI)
 * High-fidelity quilted metallic gold Kapton and silver beta-cloth with crinkled foil texture.
 */
export const createThermalBlanketTexture = createRealisticMLITexture

export function createRealisticMLITexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base metallic foil
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512)
  baseGrad.addColorStop(0.0, '#b45309')
  baseGrad.addColorStop(0.35, '#d97706')
  baseGrad.addColorStop(0.7, '#f59e0b')
  baseGrad.addColorStop(1.0, '#92400e')
  ctx.fillStyle = baseGrad
  ctx.fillRect(0, 0, 512, 512)

  // Diamond quilt pattern with embossed highlights and shadows
  const quiltSize = 32
  for (let y = 0; y < 512; y += quiltSize) {
    for (let x = 0; x < 512; x += quiltSize) {
      const cx = x + quiltSize / 2
      const cy = y + quiltSize / 2

      // Quilt pillow gradient
      const pillow = ctx.createRadialGradient(cx, cy, 2, cx, cy, quiltSize * 0.7)
      pillow.addColorStop(0.0, 'rgba(254, 243, 199, 0.45)')
      pillow.addColorStop(0.6, 'rgba(217, 119, 6, 0.2)')
      pillow.addColorStop(1.0, 'rgba(69, 26, 3, 0.75)')

      ctx.fillStyle = pillow
      ctx.beginPath()
      ctx.moveTo(cx, y)
      ctx.lineTo(x + quiltSize, cy)
      ctx.lineTo(cx, y + quiltSize)
      ctx.lineTo(x, cy)
      ctx.closePath()
      ctx.fill()

      // Central stitch button depression
      ctx.fillStyle = '#451a03'
      ctx.beginPath()
      ctx.arc(cx, cy, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Seam thermal tape grid (silver & gold foil tape lines)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)'
  ctx.lineWidth = 1.2
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 512)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(512, i)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

/**
 * Procedural Stanford Torus Exterior Armor & Hull Plating Texture
 * Dark titanium composite thermal tiles, micrometeoroid shields, rivet seams,
 * hazard chevron borders, and structural inspection markings.
 */
export function createTorusExteriorHullTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base titanium-ceramic composite dark hull (#1e293b with tonal variations)
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 1024, 512)

  // Modular armor tile grid (32x32 tiles)
  for (let y = 0; y < 512; y += 32) {
    for (let x = 0; x < 1024; x += 32) {
      // Subtle tonal variation across panels
      const tone = Math.random() * 20 - 10
      const r = Math.max(0, Math.min(255, 30 + tone))
      const g = Math.max(0, Math.min(255, 41 + tone))
      const b = Math.max(0, Math.min(255, 59 + tone))
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x + 1, y + 1, 30, 30)

      // Panel bevel highlight
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 2, y + 2, 28, 28)

      // Corner rivets
      ctx.fillStyle = 'rgba(203, 213, 225, 0.35)'
      ctx.fillRect(x + 3, y + 3, 1.5, 1.5)
      ctx.fillRect(x + 27, y + 3, 1.5, 1.5)
      ctx.fillRect(x + 3, y + 27, 1.5, 1.5)
      ctx.fillRect(x + 27, y + 27, 1.5, 1.5)
    }
  }

  // Deep structural panel expansion seams
  ctx.strokeStyle = '#090d16'
  ctx.lineWidth = 2.0
  for (let x = 0; x <= 1024; x += 128) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 512)
    ctx.stroke()
  }
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1024, y)
    ctx.stroke()
  }

  // Longitudinal cooling radiator strips along rim flanks (y = 40..60 and 452..472)
  for (const ry of [40, 452]) {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, ry, 1024, 20)
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1.0
    for (let fx = 0; fx < 1024; fx += 6) {
      ctx.beginPath()
      ctx.moveTo(fx, ry)
      ctx.lineTo(fx, ry + 20)
      ctx.stroke()
    }
  }

  // Yellow/black safety chevron stripes near transit airlock portals
  for (let x = 64; x < 1024; x += 256) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, 240, 64, 32)
    ctx.clip()
    ctx.fillStyle = '#eab308'
    ctx.fillRect(x, 240, 64, 32)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 6
    for (let sx = -32; sx < 96; sx += 16) {
      ctx.beginPath()
      ctx.moveTo(x + sx, 240)
      ctx.lineTo(x + sx + 32, 272)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Cyan telemetry status tracks
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(0, 110, 1024, 2.5)
  ctx.fillRect(0, 402, 1024, 2.5)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 2)
  return texture
}

/**
 * Procedural Stanford Torus Interior Habitation & Window Skylight Texture
 * Architectural glass mullions, multi-tier golden residential cityscapes,
 * lush terraced biospheres, illuminated avenues, and blue atmospheric haze.
 */
export function createTorusInteriorHabitatTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Atmospheric sky background (deep navy transitioning into soft cyanish breathable atmosphere)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 512)
  skyGrad.addColorStop(0.0, '#0c1222')
  skyGrad.addColorStop(0.2, '#0369a1')
  skyGrad.addColorStop(0.5, '#38bdf8')
  skyGrad.addColorStop(0.8, '#0284c7')
  skyGrad.addColorStop(1.0, '#0c1222')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, 2048, 512)

  // Structural compression borders (top and bottom rim headers)
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 2048, 48)
  ctx.fillRect(0, 464, 2048, 48)
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 2.0
  ctx.strokeRect(0, 46, 2048, 2)
  ctx.strokeRect(0, 464, 2048, 2)

  // Living landscape terrain along the floor (y = 120 to 392)
  // Divide into 8 distinct civic sectors: Residential, Agronomy/Parkland, Tech, Commerce
  const sectorW = 2048 / 8
  for (let s = 0; s < 8; s++) {
    const sx = s * sectorW
    const type = s % 4

    if (type === 0 || type === 2) {
      // ── Residential & Commercial Urban Sector ──
      // Base urban ground
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(sx, 120, sectorW, 272)

      // Roadways & transit boulevards
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(sx, 256)
      ctx.lineTo(sx + sectorW, 256)
      ctx.stroke()

      // Golden illuminated city buildings with dense window grids
      for (let bx = sx + 12; bx < sx + sectorW - 12; bx += 24) {
        const bHeight = 40 + Math.floor(Math.sin(bx * 0.05) * 25) + 30
        const bWidth = 18

        // North city block
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(bx, 240 - bHeight, bWidth, bHeight)
        // South city block
        ctx.fillRect(bx, 272, bWidth, bHeight)

        // Windows
        for (let wy = 240 - bHeight + 4; wy < 236; wy += 8) {
          ctx.fillStyle = Math.random() > 0.25 ? '#fef08a' : (Math.random() > 0.5 ? '#fed7aa' : '#38bdf8')
          ctx.fillRect(bx + 3, wy, 4, 4)
          ctx.fillRect(bx + 11, wy, 4, 4)
        }
        for (let wy = 276; wy < 272 + bHeight - 4; wy += 8) {
          ctx.fillStyle = Math.random() > 0.25 ? '#fef08a' : (Math.random() > 0.5 ? '#f59e0b' : '#38bdf8')
          ctx.fillRect(bx + 3, wy, 4, 4)
          ctx.fillRect(bx + 11, wy, 4, 4)
        }
      }

      // Moving transit vehicle light trails
      ctx.strokeStyle = '#fef08a'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(sx, 254)
      ctx.lineTo(sx + sectorW, 254)
      ctx.stroke()
      ctx.strokeStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(sx, 258)
      ctx.lineTo(sx + sectorW, 258)
      ctx.stroke()

    } else if (type === 1) {
      // ── Agronomy & Biosphere Park Reserves ──
      // Rolling green hills & forests
      ctx.fillStyle = '#14532d'
      ctx.fillRect(sx, 120, sectorW, 272)

      // Terraced farm fields
      for (let tx = sx + 8; tx < sx + sectorW - 8; tx += 32) {
        const farmColors = ['#16a34a', '#22c55e', '#4ade80', '#15803d', '#84cc16']
        ctx.fillStyle = farmColors[Math.floor(Math.random() * farmColors.length)]
        ctx.fillRect(tx, 130, 28, 110)
        ctx.fillStyle = farmColors[Math.floor(Math.random() * farmColors.length)]
        ctx.fillRect(tx, 272, 28, 110)
      }

      // Winding river channel through park
      ctx.strokeStyle = '#0284c7'
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.moveTo(sx, 256)
      ctx.bezierCurveTo(sx + 64, 230, sx + 192, 280, sx + sectorW, 256)
      ctx.stroke()

      // Glass bio-dome hubs
      for (let dx = sx + 48; dx < sx + sectorW; dx += 96) {
        ctx.fillStyle = 'rgba(224, 242, 254, 0.75)'
        ctx.beginPath()
        ctx.arc(dx, 200, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

    } else {
      // ── High-Tech Research & Power Concourse ──
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(sx, 120, sectorW, 272)

      // Hexagonal research complexes
      for (let hx = sx + 20; hx < sx + sectorW - 20; hx += 48) {
        ctx.fillStyle = '#1e3a8a'
        ctx.fillRect(hx, 160, 36, 192)
        ctx.strokeStyle = '#60a5fa'
        ctx.lineWidth = 1.5
        ctx.strokeRect(hx, 160, 36, 192)

        // Pulsing blue and cyan research windows
        for (let ry = 170; ry < 340; ry += 16) {
          ctx.fillStyle = Math.random() > 0.3 ? '#67e8f9' : '#38bdf8'
          ctx.fillRect(hx + 6, ry, 24, 8)
        }
      }
    }
  }

  // Continuous architectural glass window mullion framework (chevron skylights)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.lineWidth = 3.0
  for (let x = 0; x <= 2048; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 48)
    ctx.lineTo(x, 464)
    ctx.stroke()
  }
  for (let y = 48; y <= 464; y += 52) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(2048, y)
    ctx.stroke()
  }

  // Cross diagonal structural steel mullions
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)'
  ctx.lineWidth = 1.5
  for (let x = 0; x <= 2048; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 48)
    ctx.lineTo(x + 64, 464)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

/**
 * Legacy wrapper for backwards compatibility
 */
export function createTorusHabitatTexture() {
  return createTorusExteriorHullTexture()
}

