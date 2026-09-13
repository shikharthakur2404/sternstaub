// ─────────────────────────────────────────────────────────────────────────────
// galaxyGenerator.js — Photorealistic 3D Spiral Galaxy (Andromeda M31)
// 18,000 volumetric density-wave stars, 5000K core bulge, hot OB blue spiral arms,
// H-alpha ionized hydrogen emission nebulae, and dark dust lane extinction
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import { createSupermassiveBlackHole } from './blackHoleGenerator.js'

/**
 * Creates a photorealistic 3D grand-design spiral galaxy (Andromeda M31).
 * Features 18,000 particles distributed via astrophysical logarithmic density wave theory.
 */
export function createAndromedaGalaxy() {
  const galaxyGroup = new THREE.Group()
  galaxyGroup.name = 'andromeda-galaxy'

  // Positioned in deep intergalactic space
  galaxyGroup.position.set(11000, 4200, -16000)

  // Authentic line-of-sight inclination of Andromeda (M31): ~77 degrees tilt
  galaxyGroup.rotation.x = THREE.MathUtils.degToRad(77)
  galaxyGroup.rotation.y = THREE.MathUtils.degToRad(32)
  galaxyGroup.rotation.z = THREE.MathUtils.degToRad(-18)

  const STAR_COUNT = 18000
  const starGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const sizes = new Float32Array(STAR_COUNT)

  const coreRadius = 550
  const diskRadius = 4600
  const numArms = 2
  const armCurl = 3.6 // Logarithmic spiral curvature b

  // Helper Gaussian random
  const randGaussian = () => {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3
    const pType = Math.random()

    let x, y, z
    let rColor, gColor, bColor
    let size = 1.6

    if (pType < 0.28) {
      // ── 1. Galactic Bulge & Core (Dense old stellar population) ────────────
      const r = coreRadius * Math.pow(Math.random(), 0.6)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)

      x = r * Math.sin(phi) * Math.cos(theta)
      // Flattened spheroidal bulge
      y = r * Math.cos(phi) * 0.48
      z = r * Math.sin(phi) * Math.sin(theta)

      // Warm 5000K-6000K golden-yellow / ivory stars
      const coreMix = Math.random()
      rColor = 1.0
      gColor = 0.88 - coreMix * 0.14
      bColor = 0.60 - coreMix * 0.25
      size = 2.4 - (r / coreRadius) * 0.9
    } else if (pType < 0.90) {
      // ── 2. Logarithmic Spiral Arms & Disk ──────────────────────────────────
      const armIndex = Math.floor(Math.random() * numArms)
      const baseArmAngle = (armIndex * (Math.PI * 2)) / numArms

      // Radial progression along arm (more stars closer to inner disk)
      const t = Math.pow(Math.random(), 0.75) // [0..1]
      const dist = coreRadius + t * (diskRadius - coreRadius)

      // Logarithmic spiral formula: theta = theta_0 + b * ln(r / r_0)
      const armAngle = baseArmAngle + armCurl * Math.log(dist / coreRadius)

      // Gaussian scatter across arm width and disk thickness
      const armWidth = 60 + dist * 0.08
      const angularScatter = (randGaussian() * armWidth) / dist
      const radialScatter = randGaussian() * (dist * 0.05)
      const effDist = dist + radialScatter
      const finalAngle = armAngle + angularScatter

      x = effDist * Math.cos(finalAngle)
      z = effDist * Math.sin(finalAngle)

      // Disk height scale: thicker toward core, thinner at edges
      const diskScaleHeight = 22 + 45 * (1.0 - t)
      y = randGaussian() * diskScaleHeight

      // Stellar Spectral Populations in Spiral Arms
      const popRoll = Math.random()
      if (popRoll < 0.60) {
        // Hot young OB associations (Brilliant Cyan-Blue / White, 15,000K-25,000K)
        rColor = 0.55 + Math.random() * 0.35
        gColor = 0.82 + Math.random() * 0.18
        bColor = 1.0
        size = 1.8 + Math.random() * 0.9
      } else if (popRoll < 0.78) {
        // Ionized Hydrogen (H-II) emission nebulae (Photoluminescent Magenta / Pink)
        rColor = 1.0
        gColor = 0.35 + Math.random() * 0.25
        bColor = 0.70 + Math.random() * 0.25
        size = 2.6 + Math.random() * 1.2
      } else if (popRoll < 0.90) {
        // Solar-type intermediate disk stars (Pale ivory / yellow)
        rColor = 0.98
        gColor = 0.95
        bColor = 0.82
        size = 1.4
      } else {
        // Dark dust lane silhouettes / cool red giants
        rColor = 0.85
        gColor = 0.45
        bColor = 0.30
        size = 1.1
      }
    } else {
      // ── 3. Galactic Halo & Globular Clusters ───────────────────────────────
      const r = coreRadius + Math.random() * diskRadius * 1.15
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)

      x = r * Math.sin(phi) * Math.cos(theta)
      y = r * Math.cos(phi) * 0.32
      z = r * Math.sin(phi) * Math.sin(theta)

      rColor = 0.75
      gColor = 0.82
      bColor = 0.92
      size = 1.2
    }

    positions[i3]     = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z

    colors[i3]     = rColor
    colors[i3 + 1] = gColor
    colors[i3 + 2] = bColor

    sizes[i] = size
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Soft spherical star particle texture for natural glow
  const particleCanvas = document.createElement('canvas')
  particleCanvas.width = 32
  particleCanvas.height = 32
  const pCtx = particleCanvas.getContext('2d')
  const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
  pGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
  pGrad.addColorStop(0.25, 'rgba(240, 248, 255, 0.85)')
  pGrad.addColorStop(0.65, 'rgba(180, 220, 255, 0.25)')
  pGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)')
  pCtx.fillStyle = pGrad
  pCtx.fillRect(0, 0, 32, 32)

  const particleTexture = new THREE.CanvasTexture(particleCanvas)
  particleTexture.colorSpace = THREE.SRGBColorSpace

  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    map: particleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const starPoints = new THREE.Points(starGeo, starMat)
  galaxyGroup.add(starPoints)

  // ── 4. Central Supermassive Black Hole & Doppler-Beamed Accretion Disk ────
  const blackHole = createSupermassiveBlackHole()
  galaxyGroup.add(blackHole.group)

  // Slow galactic differential rotation handler
  const updateGalaxy = (delta, simSpeed, cameraPos) => {
    galaxyGroup.rotation.z += 0.00015 * simSpeed
    blackHole.updateBlackHole(delta, simSpeed, cameraPos)
  }

  const dispose = () => {
    starGeo.dispose()
    starMat.dispose()
    particleTexture.dispose()
    blackHole.dispose()
  }

  return {
    group: galaxyGroup,
    coreMesh: blackHole.shadowMesh,
    blackHole,
    updateGalaxy,
    dispose,
  }
}
